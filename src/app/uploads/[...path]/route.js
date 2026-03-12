import https from 'node:https';
import { NextResponse } from 'next/server';

const API_SERVER_URL = process.env.API_SERVER_URL || 'https://localhost';

export async function GET(request, { params }) {
  const { path } = await params;
  const targetPath = `/uploads/${path.join('/')}`;
  const url = `${API_SERVER_URL}${targetPath}`;

  try {
    const { status, contentType, body } = await new Promise((resolve, reject) => {
      const parsed = new URL(url);

      const req = https.request(
        {
          hostname: parsed.hostname,
          port: parsed.port || 443,
          path: parsed.pathname + parsed.search,
          method: 'GET',
          rejectUnauthorized: false,
        },
        (res) => {
          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            resolve({
              status: res.statusCode,
              contentType: res.headers['content-type'] || 'application/octet-stream',
              body: Buffer.concat(chunks),
            });
          });
        }
      );

      req.on('error', reject);
      req.end();
    });

    return new NextResponse(body, {
      status,
      headers: {
        'content-type': contentType,
        'cache-control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('[Uploads Proxy] Error:', error.message);
    return NextResponse.json({ error: 'Proxy error', message: error.message }, { status: 502 });
  }
}
