# ShopX - Final Architecture

## Stack

- **Frontend**: React 17 (React 18 evaluated and explicitly skipped - see
  CHANGELOG.md), Redux Toolkit, SCSS modules, CRA (`react-scripts`).
- **Backend**: Node.js (ESM, `"type": "module"`), Express, Mongoose/MongoDB.
- **Auth**: JWT in an httpOnly cookie (never in the JSON response body).
- **Payments**: Stripe (amount currently sourced from frontend cart total -
  see the flagged limitation in CHANGELOG.md).
- **Images**: Cloudinary (product images + user avatars).
- **Email**: SMTP via `utils/sendEmail.js` (password reset only).

## High-level request flow

```
Browser (React SPA)
   |  axios (withCredentials: true, baseURL = REACT_APP_API_URL)
   v
Express app (index.js)
   |
   |-- helmet, CORS (explicit origin allow-list), body parsers,
   |   cookie-parser, express-fileupload, express-mongo-sanitize
   |-- DB-connect gate middleware (awaits cached connectDatabase())
   |
   |-- /api/v1/auth/*      -> controller/authController.js
   |-- /api/v1/products*   -> controller/productController.js
   |-- /api/v1/order*      -> controller/orderController.js
   |-- /api/v1/payment*    -> controller/paymentController.js
   |-- /api/v1/wishlist*   -> controller/wishlistController.js
   |-- /api/v1/coupon*     -> controller/couponController.js
   |-- /api/v1/admin/*     -> controller/adminController.js (NEW, Reply 5)
   |
   |-- (traditional hosting only) serves client/build/* as static files
   v
MongoDB (Mongoose models: User, Product, Order, Wishlist, Coupon, AuditLog)
```

## Data models

| Model | Purpose | Key design notes |
|---|---|---|
| `User` | Auth + profile | Password hashed (bcrypt), `role: "user" \| "admin"` |
| `Product` | Catalog | `stock`, `ratings`, embedded `reviews[]`, `images[]` (Cloudinary) |
| `Order` | Purchases | `orderStatus` enum is exactly `["Processing", "Shipped", "Delivered"]` - no "Cancelled"/"Refunded" state exists anywhere in this schema, which is why revenue aggregation (dashboard stats) doesn't filter by status |
| `Wishlist` | Saved products | **One document per user** (not one row per item) - embeds a `products[]` sub-array. Uniqueness enforced at the controller layer, not a Mongo unique index (Mongo can't uniquely-index inside an array the way it can a top-level field) |
| `Coupon` | Discount codes | `discountType: "percentage" \| "flat"`, optional `minOrderAmount`/`maxDiscountAmount`/`usageLimit`. **No per-user redemption tracking** - `usageLimit`/`timesUsed` is a global cap only, and `timesUsed` doesn't actually increment yet since coupons aren't wired into `newOrder` |
| `AuditLog` | Admin action history | Plain Mongoose model in the same DB - no new infra. No TTL/retention (flagged, not fixed) |

## Auth & authorization

- Every protected route: `isAuthenticatedUser` (verifies the JWT cookie,
  loads `req.user`, explicitly rejects missing/expired/invalid tokens and
  tokens for since-deleted users).
- Every admin route additionally requires `authorizeRoles("admin")`.
  Verified in Reply 5 that all 15 `/admin/*` routes across every route file
  have both middlewares, checked programmatically (see TESTING.md).
- Ownership checks (not just role checks) exist wherever a resource belongs
  to a specific user but isn't admin-only: `getSingleOrder`, `deleteReview`.
  Wishlist has no ownership check because it structurally doesn't need
  one - every wishlist query is scoped to `req.user._id` server-side with no
  user-suppliable "whose wishlist" parameter at all.

## The coupon/order integration gap (read this before touching coupons again)

`POST /api/v1/coupon/apply` is a **preview-only, dry-run** endpoint. It:
- validates a code against a client-supplied cart subtotal
- returns a server-computed `discountAmount`/`newTotal`
- does **not** touch `coupon.timesUsed`
- is **not** called anywhere in `newOrder`

This means a coupon can be "applied" in the cart UI and shown to the user,
but placing the order does not actually apply any discount to what's
charged or stored. This is intentional and flagged repeatedly (Reply 4A
through this reply) rather than silently half-wired. Closing this gap
requires:
1. `newOrder` accepting a `couponCode`, re-validating it server-side
   (mirroring the same logic `applyCoupon` already has - don't trust a
   client-supplied discount amount, exactly like the existing
   never-trust-frontend-totals rule for prices),
2. incrementing `coupon.timesUsed` at that point (not at preview time, so
   abandoned previews don't consume usage),
3. re-deriving Stripe's `processPayment()` amount from the POST-discount
   server total, not the pre-discount frontend total.

None of this was done in any reply so far - it remains the single largest
open feature gap in the project.

## Serverless (Vercel) considerations

`index.js` exports the Express `app` and is deployed as a single
`@vercel/node` function (see `vercel.json`). Three things had to be true
for this to work safely, and Reply 5 is where all three were made true
(previously only the first existed):

1. **Connection caching** (checkpoint2): `config/database.js` caches the
   Mongoose connection promise on `global`, so repeat invocations against a
   warm container reuse it instead of opening a new connection per request.
2. **No race on cold start** (Reply 5): a new per-request middleware awaits
   that cached connection before any route handler runs. Previously the
   connection was only awaited inside a `startServer()` function that
   Vercel never calls/awaits when it imports the module as a serverless
   function - a cold-start request could theoretically race ahead of the DB
   being ready.
3. **No stray `app.listen()`** (Reply 5): gated behind `!process.env.VERCEL`
   so the serverless path never tries to bind a port.

Two deployment shapes are supported, controlled by `SERVE_CLIENT_BUILD`:

- **Traditional/combined** (`SERVE_CLIENT_BUILD` unset or `"true"`): this
  same Express app serves the React build from `client/build/` and calls
  `app.listen()`. Works on Render/Railway/a VPS/etc., unchanged from before
  Reply 5.
- **Vercel split deploy** (`SERVE_CLIENT_BUILD=false`): backend and frontend
  are two separate Vercel projects. See `DEPLOYMENT.md` for exact steps and
  the CORS/cookie walkthrough (conclusion: no code changes were needed
  there beyond what checkpoint2 and Reply 3 already had).

## What a fresh engineer should read, in order

1. This file, for the shape of the system.
2. `DEPLOYMENT.md`, if deploying.
3. `CHANGELOG.md`, for what changed and why, especially the "Known
   limitations" section - several of these are load-bearing context for
   any future work (the coupon gap above, the Stripe amount issue, the
   in-memory rate limiter on serverless).
4. `TESTING.md`, before assuming any of this has been runtime-verified.
5. `INTERVIEW_QA.md`, for talking through design decisions out loud.
