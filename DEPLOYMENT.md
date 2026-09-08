# ShopX - Vercel Split Deployment (Reply 5)

This covers deploying the backend and frontend as two SEPARATE Vercel
projects. A fuller architecture doc + testing checklist is planned for the
final reply per the project plan - this is scoped to "does the deploy
actually work," not the complete writeup.

## 1. Backend project

1. Create a new Vercel project pointed at this repo, **root directory =
   repo root** (not `client`).
2. Vercel will detect `vercel.json` (added this reply) and use
   `@vercel/node` to run `index.js` as a serverless function; `.vercelignore`
   (added this reply) excludes `client/` from this project's bundle.
3. Set every variable in `.env.example` (added this reply) as an
   Environment Variable in Project Settings - do not commit a real `.env`.
   Critically:
   - `CLIENT_URL` = the exact origin of the frontend's Vercel deployment
     (e.g. `https://shopx.vercel.app`), no trailing slash. This is the CORS
     allow-list - it is NOT a wildcard, by design (see CORS section below).
   - `SERVE_CLIENT_BUILD=false` - this project never serves the React build.
   - `NODE_ENV=production`.
4. Deploy. `index.js`'s serverless fixes (this reply) mean cold starts no
   longer race the DB connection, and no bare `app.listen()` runs in this
   environment (see `VERCEL SERVERLESS FIX` comments in `index.js`).

## 2. Frontend project

1. Create a second Vercel project pointed at the same repo, **root
   directory = `client`**. Vercel auto-detects Create React App.
2. Set `REACT_APP_API_URL` (see `client/.env.example`, added Reply 3) to
   the backend project's deployed URL, e.g.
   `https://shopx-api.vercel.app`. No trailing slash.
3. Deploy.

## 3. CORS / cookie cross-origin review (flagged task from the Reply 5 plan)

Walked through the existing config rather than assuming it works:

- **CORS** (`index.js`): `origin` is built from `CLIENT_URL` (comma-split,
  supports multiple origins) and `credentials: true` is set. This is
  correct and *required* to be an explicit origin list rather than `"*"` -
  browsers reject `Access-Control-Allow-Origin: *` combined with
  credentialed requests, so the existing design (checkpoint2) already does
  the right thing here. Nothing to fix.
- **Cookies** (`utils/jwtToken.js`): `secure: isProduction` and
  `sameSite: isProduction ? "none" : "lax"`. A cross-site cookie requires
  `SameSite=None; Secure` - this is exactly what production mode sets, and
  `lax` is used for same-site local dev. Also already correct.
- **Frontend** (`client/src/config.js`): `withCredentials: true` on the
  shared axios instance, added in Reply 3. Required for the browser to
  attach the auth cookie cross-origin. Already correct.

**Conclusion: no code changes were needed for CORS/cookies themselves** -
checkpoint2 and Reply 3 already built this correctly for a split deploy.
The only two things that were NOT yet true before this reply were the
missing `SERVE_CLIENT_BUILD=false`/`vercel.json`/`.vercelignore` split-deploy
plumbing and the serverless cold-start race (both fixed this reply).

**Gap being flagged, not fixed:** `CLIENT_URL` is a static comma-separated
list. Vercel also generates a unique preview URL for every branch/PR
deployment of the frontend project - those preview URLs will NOT match
`CLIENT_URL` and will be blocked by CORS unless `CLIENT_URL` is updated (or
a preview URL pattern is explicitly added) each time. This only affects
preview deployments, not the production frontend URL - left as a known
limitation rather than silently working around it (e.g. by loosening CORS),
since loosening it would reintroduce the exact risk the explicit allow-list
exists to prevent.

## 4. Traditional (non-split) hosting still works unchanged

If deploying instead to a single traditional Node host (Render, Railway,
etc.), leave `SERVE_CLIENT_BUILD` unset/`true` and don't add `vercel.json`/
`.vercelignore` to that deploy - `index.js` still runs `npm run build` output
from `client/build` and serves it itself, exactly as before this reply.
