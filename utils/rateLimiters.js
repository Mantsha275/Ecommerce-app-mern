import rateLimit from "express-rate-limit";

// LIMITATION: express-rate-limit's default store is in-memory, so on
// serverless platforms (e.g. Vercel) each cold-started instance has its own
// counter - it's a best-effort deterrent against casual brute-forcing, not a
// guarantee. A shared store (e.g. Redis) would make it authoritative across
// instances, but that's deliberately out of scope here (see project brief:
// no Redis unless absolutely necessary).
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login attempts. Please try again in a few minutes.",
    },
});

export const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many password reset requests. Please try again later.",
    },
});

export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many accounts created from this IP. Please try again later.",
    },
});
