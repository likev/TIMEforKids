//https://www.perplexity.ai/search/is-cloudflare-pages-function-t-5LLHCW6CQe.IfZNJsBFtbA#1
//Example Request
//https://your-pages-domain.pages.dev/proxy?url=https://example.com
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response('Missing "url" query parameter', { status: 400 });
  }

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      return new Response('Failed to fetch the target URL', { status: response.status });
    }

    const html = await response.text();

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    return new Response('Error fetching the target URL', { status: 500 });
  }
}
