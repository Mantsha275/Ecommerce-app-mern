import express from "express";
import {
    newProduct,
    getProducts,
    getSingleProducts,
    getAdminProducts,
    updateProduct,
    deleteProduct,
    createProductReview,
    getProductReviews,
    deleteReview,
} from "../controller/productController.js";
import { isAuthenticatedUser, authorizeRoles } from "../middleware/auth.js";
import { reviewValidationRules, handleValidation } from "../middleware/validators.js";

const router = express.Router();

router.route("/products").get(getProducts);
router.route("/product/:id").get(getSingleProducts);

router
    .route("/admin/products/new")
    .post(isAuthenticatedUser, authorizeRoles("admin"), newProduct);

// SECURITY FIX (Phase 12): this route had no middleware at all before -
// any unauthenticated request could list every product's admin-facing data.
router
    .route("/admin/products")
    .get(isAuthenticatedUser, authorizeRoles("admin"), getAdminProducts);

router
    .route("/admin/product/:id")
    .put(isAuthenticatedUser, authorizeRoles("admin"), updateProduct)
    .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteProduct);

// product reviews
router
    .route("/review")
    .put(isAuthenticatedUser, reviewValidationRules, handleValidation, createProductReview);
router.route("/reviews").get(isAuthenticatedUser, getProductReviews);
router.route("/reviews").delete(isAuthenticatedUser, deleteReview);

export default router;
