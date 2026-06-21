// /api/login.js
// Visiting this endpoint sends you to Zerodha's login page.
// After you log in and approve, Zerodha redirects you to /api/callback.

export default function handler(req, res) {
  const apiKey = process.env.KITE_API_KEY;
  if (!apiKey) {
    return res.status(500).send('KITE_API_KEY environment variable is not set on the server.');
  }
  const loginUrl = `https://kite.zerodha.com/connect/login?v=3&api_key=${apiKey}`;
  res.redirect(302, loginUrl);
}
