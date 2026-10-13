/**
 * Proxies /api/* to the Laravel backend (BACKEND_URL on Vercel).
 */
export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    const backend = process.env.BACKEND_URL;

    if (!backend) {
        return Response.json(
            {
                message:
                    'Demo API is not configured. Set BACKEND_URL on Vercel to your Laravel host (e.g. Railway).',
            },
            { status: 503 },
        );
    }

    const incoming = new URL(request.url);
    const target = `${backend.replace(/\/$/, '')}${incoming.pathname}${incoming.search}`;

    const headers = new Headers(request.headers);
    headers.delete('host');

    const init = {
        method: request.method,
        headers,
        redirect: 'manual',
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
        init.body = request.body;
    }

    return fetch(target, init);
}
