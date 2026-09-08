# ShopX - Testing Checklist

**Read this section first.** Two different kinds of "verified" appear below
and they are not the same thing:

- ✅ **STATICALLY VERIFIED** - actually checked in this sandbox, by running a
  tool against the real code (not by reading the code and asserting it looks
  right). Reproducible - the command is given so you can re-run it.
- ☐ **NEEDS A LIVE RUN** - requires `npm install`, a running MongoDB, and/or
  a browser. No sandbox across Replies 4B/4C, 5, or 6 has had network access
  to do this (confirmed each time via a 403 from the npm registry). These
  are real checklist items to execute, not claims that they passed.

Nothing in this document should be read as "the app was tested end-to-end
and works." It was NOT run. What follows is (a) what static analysis could
confirm, and (b) exactly what a human/CI with a live environment should run
next.

## Build verification

- ✅ `node --check` on all 30 backend `.js` files - 0 syntax errors.
  Command: `find . -name "*.js" -not -path "./client/*" -exec node --check {} \;`
- ✅ TypeScript compiler used as a pure JSX/syntax parser (no type-checking,
  no module resolution) across all 70 frontend `.js` files - 0 errors.
  Command (from `client/`):
  `node <path-to-typescript>/bin/tsc --allowJs --checkJs false --jsx react --noEmit --target es2020 --module esnext --skipLibCheck --noResolve --ignoreDeprecations 6.0 $(find src -name "*.js")`
- ✅ All 269 relative imports in the frontend, and all relative ESM imports
  in the backend, resolve to real files on disk (checked via a script that
  parses every `import`/`require` and stats the resolved path with common
  extensions - not manual eyeballing).
- ✅ Every non-relative import in both frontend and backend cross-checked
  against its respective `package.json` `dependencies`/`devDependencies` -
  no undeclared packages found in either.
- ☐ **Run for real:** `npm install` (repo root), then
  `cd client && npm install && CI=true npx react-scripts build`. Report the
  actual exit code and any warnings CRA/webpack/ESLint surface - these
  cannot be caught by the static checks above.
- ☐ `node index.js` against a real `DB_URI` - confirms Mongoose actually
  connects and the app boots (static checks only confirm the code parses
  and imports resolve, not that it runs).

## Functional testing

### Wishlist
- ☐ Add a product to wishlist while logged out -> expect 401 (route is
  `isAuthenticatedUser`-gated - ✅ statically confirmed in `routes/wishlist.js`).
- ☐ Add the same product twice -> second call should be a no-op success,
  not a duplicate entry or an error (idempotent-add is implemented in
  `wishlistController.js` - ✅ statically confirmed the `alreadyExists` check
  exists; not run).
- ☐ Remove a product not on the wishlist -> should not throw.
- ☐ Wishlist page renders name/price/image via the backend's `populate`.
- ☐ Add-to-cart button on the wishlist page still works.

### Coupon
- ☐ Apply a valid, active coupon at/above `minOrderAmount` -> correct
  `discountAmount`/`newTotal` returned and displayed.
- ☐ Apply an expired or inactive coupon -> rejected with a clear message
  (✅ statically confirmed `isCurrentlyValid()` gate exists in
  `couponController.js`; not run).
- ☐ Apply a coupon below `minOrderAmount` -> rejected.
- ☐ Apply an invalid code -> 404, and the UI does not show a stale discount
  next to the failed attempt (✅ statically confirmed the slice clears any
  previously-applied coupon on a rejected thunk; not run).
- ☐ **Confirm the known gap is still a gap, don't silently close it**: place
  an order with a coupon "applied" in the UI and verify the order total is
  NOT discounted server-side, and `coupon.timesUsed` does NOT increment
  (`newOrder` doesn't read a coupon code at all - this should still be true).
- ☐ Percentage coupon respects `maxDiscountAmount` cap.

### Sort/filter
- ☐ Each of the 5 sort options returns products in the expected order.
- ☐ Sort persists correctly alongside category filtering.

### Low-stock badges
- ☐ Product with `stock` between 1 and 5 shows "low stock" on grid card,
  single-product page, and admin product list.
- ☐ Product with `stock = 0` shows "out of stock", not "low stock", in all
  three places.
- ☐ Dashboard stats' `lowStockCount`/`outOfStockCount` (Reply 5) agree with
  what the product list pages show for the same data (same threshold value,
  ✅ statically confirmed as `5` in all 4 locations; correctness of the
  actual counts needs live data).

### Order-status timeline
- ☐ A `"Processing"` order shows only the first stage as complete.
- ☐ A `"Shipped"` order shows the first two stages complete, NOT all three
  (this was the exact bug fixed in Reply 4B/4C - confirm it doesn't regress).
- ☐ A `"Delivered"` order shows all three stages complete, column labeled
  "Delivered" (not the old "Delivery").

### Admin dashboard stats (Reply 5, backend only - no frontend UI yet)
- ☐ `GET /api/v1/admin/dashboard/stats` as admin -> returns
  totalOrders/totalUsers/totalProducts/totalRevenue/lowStockCount/
  outOfStockCount/lowStockThreshold + 5 most recent orders, and the numbers
  match a manual count against the DB.
- ☐ `totalRevenue` sums correctly across multiple orders (✅ statically
  confirmed the aggregation pipeline groups on `null` and sums `totalPrice`
  with no status filter, matching the fact that no cancelled/refunded status
  exists in the order schema; not run against real data).

### Audit log (Reply 5)
- ☐ Update an order's status as admin -> a matching `AuditLog` entry appears
  with `action: "order.updateStatus"` and the correct `from`/`to` in
  `details`.
- ☐ Repeat for: `order.delete`, `product.create`, `product.update`,
  `product.delete`, `user.update` (specifically test a ROLE change to
  confirm `roleChangedFrom`/`roleChangedTo` appears, and a non-role update
  to confirm it falls back to `updatedFields`), `user.delete`,
  `coupon.create`, `coupon.update`, `coupon.delete`.
- ☐ `GET /api/v1/admin/audit-logs?page=1&limit=20` returns entries newest
  first, respects `limit` (capped at 100 - ✅ statically confirmed the
  `MAX_LIMIT` clamp in `adminController.js`), and `totalCount` matches.
- ☐ **Force a DB write failure** during an admin action (e.g. temporarily
  point `AuditLog.create` at a bad connection) and confirm the *real* admin
  action (e.g. the product delete) still succeeds and returns 200 - this is
  the specific guarantee `utils/auditLog.js`'s try/catch is supposed to
  provide. Not verifiable statically; needs an actual forced failure.

### Vercel serverless behavior
- ☐ Deploy the backend to Vercel per `DEPLOYMENT.md` and hit an endpoint
  immediately after a cold start (e.g. right after a deploy, before any
  warm traffic) - confirm no "buffering timed out"/connection-not-ready
  error (this is the exact race the Reply 5 middleware fix targets).
- ☐ Confirm product image upload works on the first request after a cold
  start (tests that `cloudinary.config()` running at module load, not
  inside the old async `startServer()`, actually closes that gap).
- ☐ Confirm the deployed function does NOT bind/attempt to bind a port
  (check Vercel function logs for the absence of "Server is running on
  port" - that log line should only appear in local/traditional hosting).

## Security testing

### Checkpoint2 fixes (regression-test these, don't assume they still hold)
- ☐ `GET /api/v1/order/:id` for an order you don't own, as a non-admin ->
  expect 403 (IDOR fix - ✅ statically confirmed the ownership check exists
  and runs before the response; not run against a live server).
- ☐ `DELETE /api/v1/reviews` for a review you don't own, as a non-admin ->
  expect 403/appropriate denial.
- ☐ `GET /api/v1/admin/products` without a token -> expect 401. With a
  non-admin token -> expect 403. (This route had NO middleware at all
  before checkpoint2 - regression-test it specifically, not just the new
  routes.)
- ☐ 11 failed logins in 15 minutes from one IP -> the 11th is rate-limited
  (✅ statically confirmed `max: 10` in `rateLimiters.js`; the serverless
  in-memory-store caveat above means this may behave differently across
  multiple warm Vercel instances - worth testing specifically in the
  deployed environment, not just locally).
- ☐ Attempt a Mongo-operator-injection payload in a product filter query
  param (e.g. `price[$ne]=0`) -> confirm `apiFeatures.js`'s whitelist drops
  it rather than passing it through.
- ☐ Register/login/reset-password with malformed input (bad email format,
  short password) -> expect 400 with the validator's message, not a 500.

### New endpoints (Reply 4A/4B/4C/5) - not covered by any prior security pass
- ☐ `GET /api/v1/admin/dashboard/stats` without a token -> 401. With a
  non-admin token -> 403.
- ☐ `GET /api/v1/admin/audit-logs` without a token -> 401. With a non-admin
  token -> 403.
- ☐ Attempt to read another user's wishlist - confirm there is no
  parameter/endpoint that accepts a target user ID at all (✅ statically
  confirmed: `getMyWishlist`/`addToWishlist`/`removeFromWishlist` only ever
  query by `req.user._id`, never a request parameter - structurally not
  possible to IDOR, not just guarded by a check).
- ☐ `POST /api/v1/coupon/apply` - confirm the response never leaks whether
  a coupon code exists vs. is merely expired/inactive in a way that would
  let someone enumerate valid-looking codes faster than brute force alone
  (current messages: "Invalid coupon code" (404) vs. "expired or no longer
  active" (400) ARE distinguishable - flagging this as worth a decision,
  not silently changed, since merging them would also make legitimate
  troubleshooting harder for support).
- ☐ Admin coupon endpoints (`/api/v1/admin/coupon*`) without a token -> 401;
  with a non-admin token -> 403 (✅ statically confirmed both middlewares
  present on every route in `routes/coupon.js`).
- ☐ Attempt to create/update a coupon with an out-of-range `discountValue`
  (e.g. percentage > 100) -> expect 400 (✅ statically confirmed both the
  validator layer AND a second manual check inside the controller itself
  enforce this - defense in depth, not just one layer).

## Known-gap regression checks (confirm these are STILL true, not fixed)
- ☐ `newOrder` still does not accept a coupon code param.
- ☐ `coupon.timesUsed` still never increments anywhere.
- ☐ `processPayment()`'s amount still comes from the frontend, unverified
  against the server order total.
