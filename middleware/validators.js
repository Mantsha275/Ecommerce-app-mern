import { body, validationResult } from "express-validator";
import ErrorHandler from "../utils/errorHandler.js";

// Turns express-validator's collected errors into our existing ErrorHandler
// flow, so validation failures come back through the same centralized error
// middleware/response shape as everything else.
export const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors
            .array()
            .map((e) => e.msg)
            .join(", ");
        return next(new ErrorHandler(message, 400));
    }
    next();
};

export const registerValidationRules = [
    body("name").trim().notEmpty().withMessage("Please enter your name")
        .isLength({ max: 30 }).withMessage("Name cannot exceed 30 characters"),
    body("email").trim().isEmail().withMessage("Please enter a valid email address"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

export const loginValidationRules = [
    body("email").trim().isEmail().withMessage("Please enter a valid email address"),
    body("password").notEmpty().withMessage("Please enter your password"),
];

export const passwordUpdateValidationRules = [
    body("oldPassword").notEmpty().withMessage("Please enter your old password"),
    body("password").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
];

export const reviewValidationRules = [
    body("productId").notEmpty().withMessage("productId is required"),
    body("rating").isFloat({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
    body("comment").trim().notEmpty().withMessage("Comment cannot be empty"),
];

// Coupon validation - shared by create (all fields required) and update
// (fields optional, but validated if present) via .optional({checkFalsy:true})
// on the update variant.
export const couponCreateValidationRules = [
    body("code").trim().notEmpty().withMessage("Coupon code is required")
        .isLength({ max: 30 }).withMessage("Coupon code cannot exceed 30 characters"),
    body("discountType").isIn(["percentage", "flat"])
        .withMessage("discountType must be 'percentage' or 'flat'"),
    body("discountValue").isFloat({ min: 0 })
        .withMessage("discountValue must be a non-negative number"),
    body("minOrderAmount").optional().isFloat({ min: 0 })
        .withMessage("minOrderAmount must be a non-negative number"),
    body("maxDiscountAmount").optional({ nullable: true }).isFloat({ min: 0 })
        .withMessage("maxDiscountAmount must be a non-negative number"),
    body("expiresAt").notEmpty().withMessage("expiresAt is required")
        .isISO8601().withMessage("expiresAt must be a valid date"),
    body("usageLimit").optional({ nullable: true }).isInt({ min: 0 })
        .withMessage("usageLimit must be a non-negative integer"),
    body("isActive").optional().isBoolean().withMessage("isActive must be true or false"),
];

export const couponUpdateValidationRules = [
    body("code").optional().trim().isLength({ min: 1, max: 30 })
        .withMessage("Coupon code must be 1-30 characters"),
    body("discountType").optional().isIn(["percentage", "flat"])
        .withMessage("discountType must be 'percentage' or 'flat'"),
    body("discountValue").optional().isFloat({ min: 0 })
        .withMessage("discountValue must be a non-negative number"),
    body("minOrderAmount").optional().isFloat({ min: 0 })
        .withMessage("minOrderAmount must be a non-negative number"),
    body("maxDiscountAmount").optional({ nullable: true }).isFloat({ min: 0 })
        .withMessage("maxDiscountAmount must be a non-negative number"),
    body("expiresAt").optional().isISO8601().withMessage("expiresAt must be a valid date"),
    body("usageLimit").optional({ nullable: true }).isInt({ min: 0 })
        .withMessage("usageLimit must be a non-negative integer"),
    body("isActive").optional().isBoolean().withMessage("isActive must be true or false"),
];

export const applyCouponValidationRules = [
    body("code").trim().notEmpty().withMessage("Coupon code is required"),
    body("cartTotal").isFloat({ min: 0 })
        .withMessage("cartTotal must be a non-negative number"),
];
