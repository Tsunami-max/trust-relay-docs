/**
 * HTTP Basic Auth middleware for Cloudflare Pages.
 *
 * Uses browser-native login dialog — password managers auto-detect
 * and offer to save/fill credentials.
 *
 * Env vars:
 *   AUTH_USERNAME (default: "trustrelay")
 *   AUTH_PASSWORD (required)
 */

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // Allow static assets through without auth (logo, favicon, etc.)
  if (
    url.pathname === '/img/trustrelay-logo-white.png' ||
    url.pathname === '/favicon.ico'
  ) {
    return next();
  }

  const expectedUser = env.AUTH_USERNAME || 'trustrelay';
  const expectedPass = env.AUTH_PASSWORD;

  if (!expectedPass) {
    // No password configured — allow access (dev mode)
    return next();
  }

  // Check Authorization header
  const auth = request.headers.get('Authorization');
  if (auth) {
    const [scheme, encoded] = auth.split(' ');
    if (scheme === 'Basic' && encoded) {
      const decoded = atob(encoded);
      const [username, ...passwordParts] = decoded.split(':');
      const password = passwordParts.join(':'); // Handle passwords with colons

      if (username === expectedUser && password === expectedPass) {
        return next();
      }
    }
  }

  // Not authenticated — prompt for credentials
  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="TrustRelay Documentation", charset="UTF-8"',
      'Content-Type': 'text/plain',
    },
  });
}
