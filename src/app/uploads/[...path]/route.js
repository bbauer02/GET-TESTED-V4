// eslint-disable-next-line import/no-unresolved
import https from 'node:https';
import { NextResponse } from 'next/server';

const API_SERVER_URL = process.env.API_SERVER_URL || 'https://localhost';

export async function GET(request, { params }) {
  const { path } = await params;

  // Uniquement des fichiers sous /uploads : aucun segment de remontée (« .. », y compris encodé)
  const segments = path.map((segment) => decodeURIComponent(segment));
  if (segments.some((segment) => segment === '..' || segment === '.' || /[\\/]/.test(segment))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const targetPath = `/uploads/${segments.map(encodeURIComponent).join('/')}`;
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
        // Seuls les fichiers trouvés sont mis en cache (jamais une erreur)
        'cache-control': status === 200 ? 'public, max-age=31536000, immutable' : 'no-store',
      },
    });
  } catch (error) {
    console.error('[Uploads Proxy] Error:', error.message);
    return NextResponse.json({ error: 'Proxy error', message: error.message }, { status: 502 });
  }
}
