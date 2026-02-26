const AUTH_COOKIE = 'tr_docs_auth';
const LOGIN_PATH = '/__login';

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  if (url.pathname === LOGIN_PATH && request.method === 'POST') {
    const formData = await request.formData();
    const password = formData.get('password');
    if (password === env.AUTH_PASSWORD) {
      return new Response(null, {
        status: 302,
        headers: {
          'Location': url.searchParams.get('next') || '/',
          'Set-Cookie': `${AUTH_COOKIE}=${env.AUTH_PASSWORD}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
        },
      });
    }
    return new Response(loginPage(url.searchParams.get('next') || '/', 'Wrong password.'), {
      status: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const cookies = request.headers.get('Cookie') || '';
  const match = cookies.split(';').map(c => c.trim()).find(c => c.startsWith(`${AUTH_COOKIE}=`));
  if (match && match.split('=').slice(1).join('=') === env.AUTH_PASSWORD) {
    return next();
  }

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
    body{background:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
    .card{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:40px;width:100%;max-width:380px}
    .logo{text-align:center;margin-bottom:32px}
    .logo h1{color:#f59e0b;font-size:22px;font-weight:700;letter-spacing:-.5px}
    .logo p{color:#94a3b8;font-size:13px;margin-top:4px}
    label{display:block;color:#cbd5e1;font-size:13px;font-weight:500;margin-bottom:6px}
    input{width:100%;background:#0f172a;border:1px solid #475569;border-radius:8px;color:#f1f5f9;font-size:15px;padding:10px 14px;outline:none;transition:border-color .15s}
    input:focus{border-color:#f59e0b}
    button{width:100%;background:#f59e0b;border:none;border-radius:8px;color:#0f172a;cursor:pointer;font-size:15px;font-weight:600;margin-top:20px;padding:11px;transition:background .15s}
    button:hover{background:#d97706}
    .err{background:rgba(220,38,38,.1);border:1px solid rgba(220,38,38,.3);border-radius:6px;color:#fca5a5;font-size:13px;margin-bottom:16px;padding:10px 12px}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <h1>TrustRelay</h1>
      <p>Technical Documentation</p>
    </div>
    ${error ? `<div class="err">${error}</div>` : ''}
    <form method="POST" action="${LOGIN_PATH}?next=${encodeURIComponent(redirectTo)}">
      <label for="p">Access password</label>
      <input type="password" id="p" name="password" autofocus placeholder="••••••••••••" required>
      <button type="submit">Enter</button>
    </form>
  </div>
</body>
</html>`;
}
