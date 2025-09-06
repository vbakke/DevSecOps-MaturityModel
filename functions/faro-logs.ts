// Cloudflare Functions: Proxy for Grafana Faro log messages
// Place this file in your /functions directory as 'faro-logs.ts'

interface CloudflareContext {
  request: Request;
  env: {
    GRAFANA_FARO_KEY: string; 
  };
}

export async function onRequest(context: CloudflareContext): Promise<Response> {
  const { request, env } = context;

  if (request.method === 'GET') {
    return new Response('GET method is not allowed. Please use POST to send logs.', { status: 405 });
  }
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Replace with your actual Grafana Faro endpoint
  const GRAFANA_FARO_URL = 'https://faro-collector-prod-eu-north-0.grafana.net/collect/' + env.GRAFANA_FARO_KEY;

  // Forward headers except host/origin
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('origin');

  // Get client IP from Cloudflare headers
  const clientIp = request.headers.get('cf-connecting-ip') || '';
  headers.set('x-forwarded-for', clientIp);

  // Optionally, add your Grafana API key if required
  // headers.set('Authorization', 'Bearer <YOUR_GRAFANA_API_KEY>');

  // Forward the request to Grafana Faro
  const response = await fetch(GRAFANA_FARO_URL, {
    method: 'POST',
    headers,
    body: await request.arrayBuffer(),
  });

  // Return the response from Grafana
  return new Response(await response.text(), {
    status: response.status,
    headers: response.headers,
  });
}
