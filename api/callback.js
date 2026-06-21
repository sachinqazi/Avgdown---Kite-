// /api/callback.js
// This is the page Zerodha redirects you to after you log in and approve access.
// Set this exact URL (https://your-vercel-app.vercel.app/api/callback) as the
// "Redirect URL" in your Kite Connect app settings on developers.kite.trade.

import crypto from 'crypto';

export default async function handler(req, res) {
  const { request_token } = req.query;
  const apiKey = process.env.KITE_API_KEY;
  const apiSecret = process.env.KITE_API_SECRET;

  if (!request_token) {
    return res.status(400).send('Missing request_token in the URL. Did you arrive here via /api/login?');
  }
  if (!apiKey || !apiSecret) {
    return res.status(500).send('KITE_API_KEY or KITE_API_SECRET is not set on the server.');
  }

  // Kite requires a checksum: SHA-256 of (api_key + request_token + api_secret)
  const checksum = crypto
    .createHash('sha256')
    .update(apiKey + request_token + apiSecret)
    .digest('hex');

  try {
    const tokenRes = await fetch('https://api.kite.trade/session/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        api_key: apiKey,
        request_token,
        checksum
      })
    });

    const tokenData = await tokenRes.json();

    if (tokenData.status !== 'success') {
      return res.status(400).send(
        `<pre>Login exchange failed:\n${JSON.stringify(tokenData, null, 2)}</pre>`
      );
    }

    const accessToken = tokenData.data.access_token;

    // Kite access tokens expire daily (around 6 AM IST) — this is a Zerodha
    // platform limitation, not something we can configure around. You'll need
    // to repeat this login step once a day to keep live data flowing, OR
    // automate it later with a scheduled job that does this exchange for you.
    res.status(200).send(`
      <html>
        <body style="font-family:monospace; background:#05080A; color:#E8F0EA; padding:40px;">
          <h2 style="color:#3DDC84;">✅ Login successful</h2>
          <p>Copy the access token below and set it as an environment variable named
          <b>KITE_ACCESS_TOKEN</b> in your Vercel project settings, then redeploy.</p>
          <p style="background:#0F1813; padding:16px; border-radius:8px; word-break:break-all;">
            ${accessToken}
          </p>
          <p style="color:#8FA398;">⚠ This token expires daily. You'll need to repeat this login
          (visit /api/login) once a day, or set up an automated refresh later.</p>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send('Error exchanging token: ' + err.message);
  }
}
