import https from 'node:https';
import { NextResponse } from 'next/server';

const API_SERVER_URL = process.env.API_SERVER_URL || 'https://localhost';

function proxyWithHttps(method, url, headers, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method,
      headers: Object.fromEntries(headers.entries()),
      rejectUnauthorized: false,
    };

    delete options.headers.host;
    delete options.headers['content-length'];
    // Prevent compressed responses so we can forward the body as plain text
    delete options.headers['accept-encoding'];

    // Recalculate content-length if there's a body
    if (body) {
      options.headers['content-length'] = Buffer.byteLength(body, 'utf-8');
    }

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          contentType: res.headers['content-type'] || 'application/json',
          body: Buffer.concat(chunks).toString('utf-8'),
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

async function proxyRequest(request, { params }) {
  const { path } = await params;
  const targetPath = `/api/${path.join('/')}`;
  const url = `${API_SERVER_URL}${targetPath}`;

  const body =
    request.method !== 'GET' && request.method !== 'HEAD'
      ? await request.text()
      : null;

  try {
    const res = await proxyWithHttps(request.method, url, request.headers, body);

    return new NextResponse(res.body, {
      status: res.status,
      headers: { 'content-type': res.contentType },
    });
  } catch (error) {
    console.error('[Proxy] Error:', error.message);
    return NextResponse.json({ error: 'Proxy error', message: error.message }, { status: 502 });
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
