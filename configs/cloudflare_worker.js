addEventListener('fetch', event => {
  event.respondWith(handle(event.request))
})

async function handle(request) {
  const url = new URL(request.url)
  if (url.pathname.startsWith('/vless')) {
    // Read backend origin from environment (`wrangler.toml` vars) if provided.
    // In Wrangler/Workers this is usually available as a global variable.
    const DEFAULT_BACKEND = 'https://YOUR_VPS_DOMAIN_OR_ORIGIN:10000'
    const backendOrigin = (typeof globalThis.BACKEND_ORIGIN !== 'undefined' && globalThis.BACKEND_ORIGIN)
      ? globalThis.BACKEND_ORIGIN
      : DEFAULT_BACKEND
    const backend = backendOrigin + url.pathname + url.search
    const res = await fetch(backend, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'manual'
    })
    return res
  }
  return new Response('OK', { status: 200 })
}
