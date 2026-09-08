import jwt from "jsonwebtoken";
import User from "../models/user.js";
import ErrorHandler from "../utils/errorHandler.js";
import catchAsyncErrors from "./catchAsyncErrors.js";

// Checks if user is authenticated or not.
// Hardened to explicitly handle every failure mode instead of letting
// req.user end up null/undefined and silently continuing:
//   - missing token
//   - malformed / invalid signature
//   - expired token
//   - token valid but the user was since deleted
export const isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return next(
            new ErrorHandler("Login first to access this resource.", 401)
        );
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        // jwt.verify throws TokenExpiredError / JsonWebTokenError - both are
        // handled centrally by the error middleware, but we normalize here
        // too since this is the auth gate for nearly every protected route.
        return next(err);
    }

    const user = await User.findById(decoded.id);

    if (!user) {
        return next(
            new ErrorHandler(
                "The user belonging to this token no longer exists.",
                401
            )
        );
    }

    req.user = user;
    next();
});

// Restricts a route to specific roles. Must run after isAuthenticatedUser.
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(
                new ErrorHandler(
                    `Role (${req.user?.role || "unknown"}) is not allowed to access this resource`,
                    403
                )
            );
        }
        next();
    };
};
