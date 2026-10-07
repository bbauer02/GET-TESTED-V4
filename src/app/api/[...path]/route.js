// eslint-disable-next-line import/no-unresolved
import https from 'node:https';
import { NextResponse } from 'next/server';

const API_SERVER_URL = process.env.API_SERVER_URL || 'https://localhost';

// Certificat de l'API vérifié en production ; en dev l'API locale a un certificat auto-signé.
// API_TLS_INSECURE=true permet de le désactiver explicitement (API interne sans CA reconnue).
const REJECT_UNAUTHORIZED = process.env.NODE_ENV === 'production' && process.env.API_TLS_INSECURE !== 'true';

// Headers that must not be forwarded to the upstream server
const HOP_BY_HOP = new Set([
  'host',
  'connection',
  'keep-alive',
  'transfer-encoding',
  'accept-encoding',
  'upgrade',
]);

async function proxyRequest(request, { params }) {
  const { path } = await params;
  const targetPath = `/api/${path.join('/')}`;
  const { search } = new URL(request.url);
  const url = `${API_SERVER_URL}${targetPath}${search}`;

  // Read the full body as a buffer (reliable for multipart/form-data)
  let bodyBuffer = null;
  if (request.method !== 'GET' && request.method !== 'HEAD' && request.body) {
    bodyBuffer = Buffer.from(await request.arrayBuffer());
  }

  // Forward headers, stripping hop-by-hop ones
  const fwdHeaders = {};
  for (const [key, value] of request.headers.entries()) {
    if (!HOP_BY_HOP.has(key)) {
      fwdHeaders[key] = value;
    }
  }

  // Ensure content-length matches actual body size (critical for multipart uploads)
  if (bodyBuffer) {
    fwdHeaders['content-length'] = String(bodyBuffer.length);
  } else {
    delete fwdHeaders['content-length'];
  }

  const parsed = new URL(url);

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: parsed.pathname + parsed.search,
        method: request.method,
        headers: fwdHeaders,
        rejectUnauthorized: REJECT_UNAUTHORIZED,
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          // Statuts sans corps (204 après un DELETE…) : un corps, même vide, fait planter Response
          const hasBody = ![101, 204, 205, 304].includes(res.statusCode);

          const headers = { 'content-type': res.headers['content-type'] || 'application/json' };
          ['content-disposition', 'cache-control', 'location'].forEach((name) => {
            if (res.headers[name]) headers[name] = res.headers[name];
          });

          resolve(
            new NextResponse(hasBody ? Buffer.concat(chunks) : null, {
              status: res.statusCode,
              headers,
            })
          );
        });
      }
    );

    req.on('error', (error) => {
      console.error('[Proxy] Error:', error.message);
      resolve(
        NextResponse.json({ error: 'Proxy error', message: error.message }, { status: 502 })
      );
    });

    if (bodyBuffer) {
      req.end(bodyBuffer);
    } else {
      req.end();
    }
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
