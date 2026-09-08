import ErrorHandler from "../utils/errorHandler.js";

const errorMiddleware = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;

    let error = Object.assign(Object.create(Object.getPrototypeOf(err)), err);
    error.message = err.message;

    // Wrong Mongoose Object ID Error
    if (err.name === "CastError") {
        const message = `Resource not found. Invalid: ${err.path}`;
        error = new ErrorHandler(message, 400);
    }

    // Handling Mongoose Validation Error
    if (err.name === "ValidationError") {
        const message = Object.values(err.errors)
            .map((value) => value.message)
            .join(", ");
        error = new ErrorHandler(message, 400);
    }

    // Handling Mongoose duplicate key errors
    if (err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
        error = new ErrorHandler(message, 400);
    }

    // Handling wrong JWT error
    if (err.name === "JsonWebTokenError") {
        const message = "JSON Web Token is invalid. Please log in again.";
        error = new ErrorHandler(message, 401);
    }

    // Handling Expired JWT error
    if (err.name === "TokenExpiredError") {
        const message = "Your session has expired. Please log in again.";
        error = new ErrorHandler(message, 401);
    }

    // In production, never leak stack traces or internal details
    const isDev = process.env.NODE_ENV === "development";

    if (isDev) {
        console.error(err);
    }

    res.status(error.statusCode).json({
        success: false,
        message: error.message || "Internal Server Error",
        ...(isDev ? { stack: err.stack } : {}),
    });
};

export default errorMiddleware;
