const AUTH_COOKIE = 'tr_docs_auth';
const LOGIN_PATH = '/__login';
const COOKIE_MAX_AGE = 86400; // 24 hours

async function hmacSign(secret, message) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacVerify(secret, message, signature) {
  const expected = await hmacSign(secret, message);
  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}

async function makeToken(password) {
  // Token = timestamp:hmac(password, timestamp)
  const ts = Math.floor(Date.now() / 1000).toString();
  const sig = await hmacSign(password, ts);
  return `${ts}:${sig}`;
}

async function verifyToken(password, token) {
  const parts = token.split(':');
  if (parts.length !== 2) return false;
  const [ts, sig] = parts;
  const age = Math.floor(Date.now() / 1000) - parseInt(ts, 10);
  if (isNaN(age) || age < 0 || age > COOKIE_MAX_AGE) return false;
  return hmacVerify(password, ts, sig);
}

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // Handle login POST
  if (url.pathname === LOGIN_PATH && request.method === 'POST') {
    const formData = await request.formData();
    const password = formData.get('password');
    if (password === env.AUTH_PASSWORD) {
      const token = await makeToken(env.AUTH_PASSWORD);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': url.searchParams.get('next') || '/',
          'Set-Cookie': `${AUTH_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}`,
        },
      });
    }
    return new Response(loginPage(url.searchParams.get('next') || '/', 'Wrong password.'), {
      status: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Check auth cookie
  const cookies = request.headers.get('Cookie') || '';
  const match = cookies.split(';').map(c => c.trim()).find(c => c.startsWith(`${AUTH_COOKIE}=`));
  if (match) {
    const token = match.split('=').slice(1).join('=');
    if (await verifyToken(env.AUTH_PASSWORD, token)) {
      return next();
    }
  }

  // Not authenticated — show login
  return new Response(loginPage(url.pathname), {
    status: 401,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function loginPage(redirectTo = '/', error = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>TrustRelay Docs</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#030B15;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
    .card{background:rgba(11,37,69,.6);border:1px solid rgba(45,212,191,.12);border-radius:16px;padding:48px 40px;width:100%;max-width:400px;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:0 8px 32px rgba(0,0,0,.3)}
    .logo{text-align:center;margin-bottom:36px}
    .logo img{height:32px;margin-bottom:12px}
    .logo p{color:rgba(255,255,255,.45);font-size:12px;text-transform:uppercase;letter-spacing:.1em;font-weight:500}
    label{display:block;color:rgba(255,255,255,.65);font-size:13px;font-weight:500;margin-bottom:8px}
    input{width:100%;background:rgba(3,11,21,.8);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#f1f5f9;font-size:15px;padding:12px 16px;outline:none;transition:border-color .2s}
    input:focus{border-color:#2dd4bf;box-shadow:0 0 0 3px rgba(45,212,191,.1)}
    button{width:100%;background:linear-gradient(135deg,#1B998B,#0d9488);border:1px solid rgba(27,153,139,.4);border-radius:10px;color:#fff;cursor:pointer;font-size:15px;font-weight:600;margin-top:24px;padding:12px;transition:all .2s;box-shadow:0 4px 16px rgba(27,153,139,.2)}
    button:hover{background:linear-gradient(135deg,#20C997,#1B998B);box-shadow:0 6px 24px rgba(27,153,139,.3);transform:translateY(-1px)}
    .err{background:rgba(220,38,38,.08);border:1px solid rgba(220,38,38,.25);border-radius:8px;color:#fca5a5;font-size:13px;margin-bottom:16px;padding:10px 14px}
    .glow-teal{position:fixed;top:-200px;right:-150px;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(27,153,139,.08) 0%,transparent 70%);pointer-events:none}
    .glow-mint{position:fixed;bottom:-250px;left:-150px;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(32,201,151,.06) 0%,transparent 70%);pointer-events:none}
  </style>
</head>
<body>
  <div class="glow-teal"></div>
  <div class="glow-mint"></div>
  <div class="card">
    <div class="logo">
      <img src="/img/trustrelay-logo-white.png" alt="TrustRelay">
      <p>Technical Documentation</p>
    </div>
    ${error ? `<div class="err">${error}</div>` : ''}
    <form method="POST" action="${LOGIN_PATH}?next=${encodeURIComponent(redirectTo)}">
      <label for="p">Access password</label>
      <input type="password" id="p" name="password" autofocus placeholder="Enter access code" required>
      <button type="submit">Enter</button>
    </form>
  </div>
</body>
</html>`;
}
