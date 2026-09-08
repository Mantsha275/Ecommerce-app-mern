import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import cloudinary from "cloudinary";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";

import connectDatabase from "./config/database.js";
import errorMiddleware from "./middleware/error.js";

// ESM has no __dirname/__filename by default - recreate them safely.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// VERCEL SERVERLESS FIX (Reply 5): cloudinary.config() is a synchronous
// assignment (no network call, no await needed) - moved here from inside
// the old async startServer() so it's guaranteed to run before ANY request
// is handled, including a cold-start invocation on Vercel where
// startServer()'s promise was never awaited by the platform (see below).
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();

// Trust the first hop proxy (Vercel/Railway/etc sit in front of the app).
// Needed so express-rate-limit and req.ip see the real client IP from
// X-Forwarded-For instead of the proxy's own address, without blindly
// trusting an arbitrary number of hops.
app.set("trust proxy", 1);

// ---- Security middleware ----
app.use(helmet());

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim());

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// Reasonable body size limit - generous enough for base64 product/avatar
// images via the existing Cloudinary flow, but not unbounded.
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true, limit: "12mb" }));
app.use(cookieParser());
app.use(fileUpload());

// Strips any request body/query keys starting with "$" or containing ".",
// which blocks MongoDB operator-injection payloads (in addition to the
// apiFeatures whitelist already in place for query filtering).
app.use(mongoSanitize());

// VERCEL SERVERLESS FIX (Reply 5): previously connectDatabase() was only
// awaited inside the old startServer() at local boot time. When this
// index.js is deployed as a Vercel serverless function, Vercel imports the
// module and invokes the exported `app` directly per-request - it does NOT
// await whatever startServer() kicked off at import time. On a cold start,
// that created a real race: the first request(s) could reach a route
// handler before the Mongo connection existed. connectDatabase() already
// caches its connection promise across invocations (see the comment in
// config/database.js), so awaiting it here on every request is a no-op
// after the first on a warm container - this closes the race without
// changing behavior for the already-working local/traditional-hosting case.
app.use(async (req, res, next) => {
    try {
        await connectDatabase();
        next();
    } catch (err) {
        next(err);
    }
});

// ---- Routes ----
import auth from "./routes/auth.js";
import products from "./routes/product.js";
import payment from "./routes/payment.js";
import order from "./routes/order.js";
import wishlist from "./routes/wishlist.js";
import coupon from "./routes/coupon.js";
import admin from "./routes/admin.js";

app.use("/api/v1", auth);
app.use("/api/v1", products);
app.use("/api/v1", payment);
app.use("/api/v1", order);
app.use("/api/v1", wishlist);
app.use("/api/v1", coupon);
app.use("/api/v1", admin);

// Serves the React build for local/traditional hosting (e.g. `npm start`
// after `npm run build`). NOTE: when deployed to Vercel with the frontend
// as its own separate deployment (see Phase 25/E in the project plan),
// this block is skipped in production so Express doesn't try to serve a
// build folder that won't exist in that setup.
if (process.env.SERVE_CLIENT_BUILD !== "false") {
    app.use(express.static(path.join(__dirname, "client", "build")));

    app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api")) return next();
        res.sendFile(path.join(__dirname, "client", "build", "index.html"));
    });
}

app.get("/", (req, res) => {
    res.send("App is running.");
});

// Centralized error handler - must be registered last.
app.use(errorMiddleware);

// VERCEL SERVERLESS FIX (Reply 5): only bind a port for local/traditional
// hosting (`node index.js` / `npm start`). On Vercel the platform itself
// invokes this module's default export per-request as a serverless
// function - it never calls .listen() itself, and this app doesn't need it
// to. Previously .listen() was called unconditionally inside startServer(),
// which is harmless on Vercel in practice (the platform ignores it) but is
// dead weight in every cold start and was worth being explicit about rather
// than leaving unexamined, since the project's own plan (Reply 5) flagged
// "no bare app.listen() in the serverless path" as something to verify.
// Vercel sets the VERCEL env var automatically in its build/runtime
// environment - no manual configuration needed for this check to work.
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    connectDatabase().then(() => {
        app.listen(PORT, () => {
            console.log("Server is running on port", PORT);
        });
    });
}

export default app;
