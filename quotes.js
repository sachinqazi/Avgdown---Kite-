// /api/quotes.js
// Your frontend calls this endpoint (e.g. fetch('https://your-app.vercel.app/api/quotes'))
// to get live prices. This is the endpoint that replaces fetchTickerData() in ticker.js.

const DEFAULT_INSTRUMENTS = [
  'NSE:NIFTY 50', 'NSE:RELIANCE', 'NSE:TCS', 'NSE:HDFCBANK', 'NSE:INFY',
  'NSE:ICICIBANK', 'NSE:SBIN', 'NSE:TATAMOTORS', 'NSE:ADANIENT', 'NSE:ITC'
];

export default async function handler(req, res) {
  // Allow your frontend domain to call this (loosen/tighten as needed)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const apiKey = process.env.KITE_API_KEY;
  const accessToken = process.env.KITE_ACCESS_TOKEN;

  if (!apiKey || !accessToken) {
    return res.status(500).json({
      error: 'Server is not configured with KITE_API_KEY / KITE_ACCESS_TOKEN yet.'
    });
  }

  const symbols = req.query.symbols
    ? req.query.symbols.split(',')
    : DEFAULT_INSTRUMENTS;

  const params = symbols.map(s => `i=${encodeURIComponent(s)}`).join('&');

  try {
    const kiteRes = await fetch(`https://api.kite.trade/quote?${params}`, {
      headers: {
        'X-Kite-Version': '3',
        Authorization: `token ${apiKey}:${accessToken}`
      }
    });

    const data = await kiteRes.json();

    if (data.status !== 'success') {
      // Most common cause: access token expired (happens daily) — needs re-login via /api/login
      return res.status(401).json({
        error: 'Kite API call failed — your access token has likely expired. Visit /api/login to refresh it.',
        details: data
      });
    }

    // Reshape into a simpler array the frontend ticker can use directly
    const simplified = Object.entries(data.data).map(([key, val]) => ({
      symbol: key,
      price: val.last_price,
      change: val.net_change,
      pct: val.ohlc.close ? (val.net_change / val.ohlc.close) * 100 : 0
    }));

    res.status(200).json({ quotes: simplified, fetchedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch from Kite: ' + err.message });
  }
}
