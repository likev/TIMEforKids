//https://www.perplexity.ai/search/is-cloudflare-pages-function-t-5LLHCW6CQe.IfZNJsBFtbA#7
//Example Request
//https://your-pages-domain.pages.dev/proxy?url=https://example.com
export async function onRequest(context) {
  const { request, params } = context;
  let targetUrl = params.proxy;

  if (!targetUrl) {
    return new Response('Missing target URL in the path', { status: 400 });
  }

  // Ensure the target URL includes the protocol
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = "https://" + targetUrl;
  }

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      return new Response(`Failed to fetch the target URL: ${response.statusText}`, { status: response.status });
    }

    const contentType = response.headers.get('Content-Type') || 'text/plain';
    let body;

    if (contentType.includes('application/json')) {
      body = JSON.stringify(await response.json());
    } else if (contentType.includes('text')) {
      body = await response.text();
    } else {
      body = await response.arrayBuffer();
    }

    return new Response(body, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    return new Response(`Error fetching the target URL: ${error.message}`, { status: 500 });
  }
}


