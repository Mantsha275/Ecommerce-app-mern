import express from "express";
const router = express.Router();

import {
    createCoupon,
    getAllCoupons,
    getSingleCoupon,
    updateCoupon,
    deleteCoupon,
    applyCoupon,
} from "../controller/couponController.js";
import { isAuthenticatedUser, authorizeRoles } from "../middleware/auth.js";
import {
    couponCreateValidationRules,
    couponUpdateValidationRules,
    applyCouponValidationRules,
    handleValidation,
} from "../middleware/validators.js";

// Public: any logged-in user can attempt to apply a coupon at checkout.
// (Kept behind isAuthenticatedUser since checkout itself already requires
// login in this app - not because the validation logic needs a user.)
router
    .route("/coupon/apply")
    .post(
        isAuthenticatedUser,
        applyCouponValidationRules,
        handleValidation,
        applyCoupon
    );

// Admin CRUD
router
    .route("/admin/coupons")
    .get(isAuthenticatedUser, authorizeRoles("admin"), getAllCoupons);

router
    .route("/admin/coupon/new")
    .post(
        isAuthenticatedUser,
        authorizeRoles("admin"),
        couponCreateValidationRules,
        handleValidation,
        createCoupon
    );

router
    .route("/admin/coupon/:id")
    .get(isAuthenticatedUser, authorizeRoles("admin"), getSingleCoupon)
    .put(
        isAuthenticatedUser,
        authorizeRoles("admin"),
        couponUpdateValidationRules,
        handleValidation,
        updateCoupon
    )
    .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteCoupon);

export default router;
