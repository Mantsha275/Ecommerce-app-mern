# ShopX - Full Changelog (Replies 1-5)

Consolidated across every reply. Nothing here is re-derived from guesswork -
each entry traces back to a specific reply's actual changes as carried
forward in the continue-prompts and verified against the current codebase
this reply.

## Security

- **Auth hardening** (checkpoint2): `sendToken()` moved to httpOnly-cookie-only
  auth (JWT no longer returned in the JSON body). `isAuthenticatedUser`
  explicitly handles missing/malformed/expired tokens and a token whose user
  was since deleted, instead of silently continuing with a bad `req.user`.
- **Rate limiting** (checkpoint2): `loginLimiter` (10/15min), `forgotPasswordLimiter`
  (5/15min), `registerLimiter` (20/hour) via `express-rate-limit`. In-memory
  store - see "Known limitations" below, now more relevant given the Vercel
  serverless deployment added in Reply 5.
- **Injection defense** (checkpoint2): Helmet, `express-mongo-sanitize`
  (strips `$`/`.` keys from body/query), and `apiFeatures.js`'s explicit
  field/operator whitelist for product filtering/sorting (prevents arbitrary
  Mongo operator injection through query params) plus a regex-escaped
  keyword search (prevents ReDoS via crafted search terms).
- **CORS** (checkpoint2, reused as-is in Reply 5): explicit `CLIENT_URL`
  origin allow-list (never `"*"`, required because `credentials: true` is
  set) + `secure`/`sameSite` cookie flags in `utils/jwtToken.js` that already
  correctly handle cross-origin (`sameSite: "none"` + `secure: true` in
  production). Verified in Reply 5 to be sufficient for a Vercel split
  deploy with no further code changes needed.
- **IDOR fixes** (checkpoint2): `getSingleOrder` now checks
  `order.user._id === req.user.id || isAdmin` before returning an order
  (previously any logged-in user could view any order by ID).
  `deleteReview` has the equivalent owner-or-admin check.
- **Admin route protection** (checkpoint2 + verified again in Reply 5): every
  `/api/v1/admin/*` route requires both `isAuthenticatedUser` AND
  `authorizeRoles("admin")`. `getAdminProducts` specifically had NO
  middleware at all before checkpoint2's fix. Reply 5 re-verified all 15
  admin routes (across auth.js, product.js, order.js, coupon.js, and the
  new admin.js) programmatically, not by inspection alone.
- **Input validation** (checkpoint2 + Reply 4A): `express-validator` rules
  for register/login/password-update/review (checkpoint2) and coupon
  create/update (Reply 4A) - centralized through `handleValidation`.
- **Double-hash bug fix** (checkpoint2): the User model was hashing the
  password twice under a certain save path - fixed.
- **`forgotPassword` account enumeration fix** (checkpoint2): no longer
  reveals whether an email exists in the system.
- **Stock decrement race** (checkpoint2): order stock decrement made atomic;
  `updateOrder`'s original `orderItems.forEach(async ...)` bug (didn't await
  the async callbacks, `order.save()` could run before stock updated, errors
  silently swallowed) fixed with a proper sequential/awaited loop.
- **Wishlist ownership** (Reply 4A): every wishlist query is scoped to
  `req.user._id` server-side - there is no user-suppliable "whose wishlist"
  parameter, so IDOR isn't structurally possible on these three endpoints
  (verified by re-reading `wishlistController.js` in Reply 5, not just
  trusting the original description).
- **Coupon endpoint auth correction** (doc fix, Reply 5): the Reply 4A
  continue-prompt described `POST /api/v1/coupon/apply` as "public." The
  actual route code requires `isAuthenticatedUser` (checkout already
  requires login in this app). This changelog reflects the real code; no
  behavior was changed to match the old description.

## Known limitations (still open, not fixed - flagged again rather than dropped)

- **Stripe amount vs. server total**: `processPayment()`'s charge amount
  still originates from the frontend cart total (sanity-checked, not
  cross-verified against the server-computed order total). Will also need
  to account for a coupon discount once coupons are wired into `newOrder`
  (they are not yet - see below).
- **Coupon redemption not wired into orders**: `applyCoupon` is a
  preview/dry-run only. It does not increment `coupon.timesUsed` and
  `newOrder` does not accept or apply a coupon code. This was flagged in
  Reply 4A and intentionally left open in Reply 5 - not silently fixed as a
  "final cleanup," since wiring it in touches the never-trust-frontend-
  totals rule and Stripe's amount and deserves its own reviewed change.
- **In-memory rate limiting on serverless**: `express-rate-limit`'s default
  store is per-instance. On Vercel (the deployment target formalized in
  Reply 5), each cold-started function instance has its own counter, so the
  limiter is a best-effort deterrent, not an authoritative cross-instance
  limit. This was already documented as a limitation in the rate limiter
  code; Reply 5's Vercel work is the first point where it actually applies
  to the real deployment target, not just a hypothetical one.
- **`LOW_STOCK_THRESHOLD` duplicated**: hardcoded to `5` independently in
  `client/src/pages/products/Product.js`, `SingleProduct.js`,
  `pages/admin/productsList/ProductsList.js` (Reply 4B/4C), and now
  `controller/adminController.js` (Reply 5, kept numerically identical on
  purpose). Not centralized - would need a shared constant or a
  product-model field to be admin-configurable.
- **Audit log has no retention policy**: the `AuditLog` collection grows
  unboundedly - no TTL index or archival job. Flagged as a product decision
  in Reply 5, not decided silently.
- **CORS allow-list vs. Vercel preview URLs**: `CLIENT_URL` is a static
  list; Vercel's per-branch preview deployments get unique URLs that will
  be blocked by CORS unless `CLIENT_URL` is updated per preview. Flagged in
  `DEPLOYMENT.md` (Reply 5), not worked around by loosening CORS.
- **Build verification gap**: see the front-and-center note in this reply's
  summary - no sandbox across Replies 4B/4C, 5, or 6 has had network access
  to run a real `npm install`/`react-scripts build`. Static verification
  (syntax parsing + import/dependency resolution) was substituted and is
  described precisely, not oversold, in TESTING.md.

## Modernization

- **Redux Toolkit migration** (Reply 2): `createSlice` + `createAsyncThunk`
  throughout; no legacy action-creator call sites remain for new code.
- **Centralized Axios layer** (Reply 3): `client/src/config.js`, env-driven
  `baseURL` via `REACT_APP_API_URL`, `withCredentials: true` fix (was
  missing - broke cross-origin auth cookie).
- **React 18 evaluated, explicitly skipped** (Reply 3): blocked by
  `react-alert@7`'s peer-dependency ceiling (`react ^16.8.1||^17`). Documented
  upgrade path: swap `react-alert` for `react-hot-toast`/`react-toastify`, or
  verify `react-alert` actually works under React 18 first (untested claim
  either way).
- **`connectDatabase()` made serverless-ready** (checkpoint2, load-bearing
  for Reply 5's Vercel work): caches the connection promise on `global` so
  repeat invocations against a warm container reuse it.
- **`.remove()` -> `.deleteOne()`** (checkpoint2): Mongoose 6+ removed
  `.remove()`; replaced everywhere it was used.
- **`getProducts` query-string cleanup** (Reply 4B/4C, non-behavioral): removed
  a duplicated ternary for the category branch when adding the new `sort`
  param; same resulting query params either way.

## Frontend features

- **Wishlist** (Reply 4B/4C): `wishlistSlice.js` (createAsyncThunk fetch/add/
  remove), `Wishlist.js` page at `/wishlist` (ProtectedRoute, login
  required), a separate wishlist-toggle heart button on both the product
  grid card and the single-product page (kept fully separate from the
  pre-existing add-to-cart heart-outline icon, which was NOT a wishlist
  feature and was left untouched).
- **Coupon UI** (Reply 4B/4C): `couponSlice.js` (server-response-only state -
  never a client-computed discount; a rejected apply clears any previously
  applied coupon), coupon input + Apply/Remove flow on `Cart.js`'s Order
  Summary panel. Explicitly does NOT feed into checkout/order submission
  (see the open coupon/order gap above).
- **Sort/filter UI** (Reply 4B/4C): `<select>` dropdown on `Products.js`
  (Relevance/Price Low-High/Price High-Low/Highest Rated/Newest First),
  wired through `getProducts`'s `sort` param to the existing checkpoint2
  backend whitelist (no backend change needed - only a UI was missing).
- **Low-stock badges** (Reply 4B/4C): `Product.js` (image badge),
  `SingleProduct.js` (inline note), admin `ProductsList.js` (Low/Out badges
  in the stock column). See "Known limitations" for the threshold-duplication
  flag.
- **Order-status-timeline bug fix** (Reply 4B/4C): `OrderDetails.js`
  previously mapped 4 UI stages against a 3-value backend enum
  (Processing/Shipped/Delivered - "On The Way" never existed server-side),
  causing Shipped and Delivered icons to both light up the moment an order
  was merely shipped. Remapped to the real 3 values; removed the now-unused
  `FcInTransit` icon import; relabeled the column to "Delivered."
- **Admin dashboard stats UI**: NOT built this reply (Reply 5 built the
  backend endpoint only - `GET /api/v1/admin/dashboard/stats`). No frontend
  consumer of this endpoint exists yet. Flagged here explicitly so it isn't
  mistaken for a finished end-to-end feature.

## Backend features

- **Wishlist** (Reply 4A): `models/wishlist.js` (one doc per user,
  idempotent add enforced at controller level, not a DB unique constraint),
  `controller/wishlistController.js`, `routes/wishlist.js`.
- **Coupon** (Reply 4A): `models/coupon.js`, `controller/couponController.js`
  (admin CRUD + `POST /api/v1/coupon/apply` preview/dry-run, login required),
  `routes/coupon.js`, coupon validation rules in `middleware/validators.js`.
- **Admin dashboard stats** (Reply 5): `controller/adminController.js::getDashboardStats`,
  `GET /api/v1/admin/dashboard/stats` - new endpoint (not a reuse of
  existing paginated admin list endpoints), returns counts/revenue/
  low-stock/out-of-stock + 5 most recent orders.
- **Audit log** (Reply 5): `models/auditLog.js`, `utils/auditLog.js::logAdminAction()`
  (never blocks/fails the real action on a logging error),
  `controller/adminController.js::getAuditLogs`,
  `GET /api/v1/admin/audit-logs` (bespoke pagination). Wired into every
  admin write action across orders/products/users/coupons - see the Reply 5
  continue-prompt for the exact list. Storage: same MongoDB, plain
  Mongoose model, no new infra, no retention policy (flagged, not fixed).
- **Vercel serverless fixes** (Reply 5, `index.js`): `cloudinary.config()`
  moved to synchronous module-load time; new per-request middleware awaits
  the cached DB connection (closes a real cold-start race where a
  serverless invocation could race ahead of `connectDatabase()`);
  `app.listen()` gated behind `!process.env.VERCEL`. The old `startServer()`
  async function was removed and its pieces redistributed.

## Database

- `models/wishlist.js`, `models/coupon.js` (Reply 4A), `models/auditLog.js`
  (Reply 5) added. No existing model's schema was changed by Reply 5 (order/
  product/user schemas are untouched).

## Deployment

- **`.env.example` (backend, Reply 5)**: every `process.env.*` referenced in
  the backend, found by grep, not guessed.
- **`vercel.json` (Reply 5)**: `@vercel/node` builder pointed at `index.js`,
  catch-all route.
- **`.vercelignore` (Reply 5)**: excludes `client/` from the backend's own
  deployment bundle (frontend is a separate Vercel project rooted at
  `client/`).
- **`DEPLOYMENT.md` (Reply 5)**: full split-deploy steps + the CORS/cookie
  cross-origin walkthrough (conclusion: no code changes were needed there -
  checkpoint2 and Reply 3 already got it right).

## Dependencies

- No new npm packages were added in Reply 4B/4C or Reply 5. The wishlist
  heart-toggle deliberately reused unicode characters instead of a new icon
  package; the audit log and dashboard stats use only packages already in
  `package.json` (`express`, `mongoose`, and existing internal utilities).
  Verified in Reply 5 by cross-checking every import in both `package.json`
  files - see TESTING.md.

## Files created / modified across Replies 4A-5

**Created:**
`models/wishlist.js`, `models/coupon.js`, `models/auditLog.js`,
`controller/wishlistController.js`, `controller/couponController.js`,
`controller/adminController.js`, `routes/wishlist.js`, `routes/coupon.js`,
`routes/admin.js`, `utils/auditLog.js`,
`client/src/features/wishlist/wishlistSlice.js`,
`client/src/features/coupon/couponSlice.js`,
`client/src/pages/wishlist/Wishlist.js` (+ `.module.scss`),
`.env.example` (backend), `vercel.json`, `.vercelignore`, `DEPLOYMENT.md`.

**Modified:**
`middleware/validators.js`, `index.js`, `controller/orderController.js`,
`controller/productController.js`, `controller/authController.js`,
`client/src/store.js`, `client/src/pages/products/Product.js`,
`client/src/pages/singleProduct/SingleProduct.js`,
`client/src/actions/productAction.js`, `client/src/pages/products/Products.js`,
`client/src/pages/cart/Cart.js`,
`client/src/pages/user/orderDetails/OrderDetails.js`,
`client/src/pages/admin/productsList/ProductsList.js`, `client/src/App.js`.

**Deleted:** none.
