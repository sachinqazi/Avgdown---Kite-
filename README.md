# AvgDown Backend (Kite Connect)

Three serverless functions for Vercel:

- `/api/login` — redirects to Zerodha's login page
- `/api/callback` — receives the login redirect, exchanges it for an access token
- `/api/quotes` — your frontend calls this to get live prices

## Deploy steps

1. Push this folder to a new GitHub repo (or use `vercel` CLI directly from this folder)
2. Import the repo in Vercel → Deploy (no build settings needed, Vercel auto-detects `/api`)
3. In Vercel project → Settings → Environment Variables, add:
   - `KITE_API_KEY` = your API key from developers.kite.trade
   - `KITE_API_SECRET` = your API secret (never put this in frontend code)
   - `KITE_ACCESS_TOKEN` = leave blank for now, you'll add this after step 5
4. Redeploy after adding env vars (Vercel doesn't apply new env vars to old deployments automatically — trigger a redeploy)
5. On developers.kite.trade, set your app's **Redirect URL** to:
   `https://YOUR-PROJECT-NAME.vercel.app/api/callback`
6. Visit `https://YOUR-PROJECT-NAME.vercel.app/api/login` in your browser, log in with your Zerodha credentials, approve access
7. You'll land on a page showing your access token. Copy it.
8. Go back to Vercel env variables, set `KITE_ACCESS_TOKEN` to that value, redeploy
9. Visit `https://YOUR-PROJECT-NAME.vercel.app/api/quotes` — you should see real JSON price data

## Important: tokens expire daily

Kite access tokens expire every day (Zerodha's platform rule, not something we can change).
You'll need to repeat steps 6–8 once a day to keep live data flowing, until this is automated
with a scheduled job. This is normal for Kite Connect — every app built on it has this constraint.

## Connecting your frontend

In your site's ticker code, replace the simulated `fetchTickerData()` function with a call to:
```js
fetch('https://YOUR-PROJECT-NAME.vercel.app/api/quotes')
  .then(r => r.json())
  .then(data => { /* use data.quotes */ });
```
