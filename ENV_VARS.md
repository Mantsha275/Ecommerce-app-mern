# ShopX - Complete Environment Variable Reference

Two `.env.example` files already exist with inline comments -
`client/.env.example` (Reply 3) and `.env.example` at the repo root
(backend, Reply 5). This file is a consolidated index, not a replacement
for either.

## Backend (`.env.example` at repo root)

| Variable | Required | Notes |
|---|---|---|
| `PORT` | No (default 5000) | Ignored on Vercel |
| `NODE_ENV` | Yes | `development` or `production` - affects error verbosity |
| `CLIENT_URL` | Yes | Comma-separated CORS allow-list. Never `"*"` (required by `credentials: true`) |
| `SERVE_CLIENT_BUILD` | No (default true) | Set `"false"` only for a Vercel split deploy |
| `DB_URI` or `MONGODB_URI` | Yes (one of the two) | MongoDB connection string |
| `JWT_SECRET` | Yes | Long random string |
| `JWT_EXPIRES_TIME` | Yes | e.g. `7d` |
| `COOKIE_EXPIRES_TIME` | Yes | Number of **days** |
| `CLOUDINARY_CLOUD_NAME` | Yes | |
| `CLOUDINARY_API_KEY` | Yes | |
| `CLOUDINARY_API_SECRET` | Yes | |
| `STRIPE_SECRET_KEY` | Yes | Server-side only |
| `STRIPE_API_KEY` | Yes | Publishable key, handed to frontend via `GET /api/v1/stripeapikey` |
| `SMTP_HOST` | Yes | Password-reset email |
| `SMTP_PORT` | Yes | |
| `SMTP_EMAIL` | Yes | |
| `SMTP_PASSWORD` | Yes | |
| `SMTP_FROM_EMAIL` | Yes | |
| `SMTP_FROM_NAME` | No | Defaults to "ShopX" in `.env.example` |

`VERCEL` is also read (`index.js`) but is set automatically by the Vercel
platform - never set it manually.

## Frontend (`client/.env.example`)

| Variable | Required | Notes |
|---|---|---|
| `REACT_APP_API_URL` | No (defaults to same-origin) | Set for a split deploy - no trailing slash |

CRA only bakes `REACT_APP_*`-prefixed vars into the build at build time -
changing this after `npm run build` requires a rebuild, not just a restart.

## Where each is actually used (so a future change doesn't miss a call site)

Every variable above was found by grepping `process.env.` across the
backend source, not assembled from memory - see `TESTING.md`'s build
verification section for the exact method. If a variable stops appearing
in a `grep -r "process.env." .` pass after a future change, remove it from
here and from `.env.example` too, rather than leaving a stale entry.
