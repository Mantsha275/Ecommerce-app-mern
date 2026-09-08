import express from "express";
const router = express.Router();

import {
    getMyWishlist,
    addToWishlist,
    removeFromWishlist,
} from "../controller/wishlistController.js";
import { isAuthenticatedUser } from "../middleware/auth.js";

// All wishlist routes require login - a wishlist is always tied to a user,
// there is no anonymous/guest wishlist (unlike the cart, which is
// localStorage-based per the existing checkpoint2 contract).
router.route("/wishlist").get(isAuthenticatedUser, getMyWishlist);
router.route("/wishlist/:productId").post(isAuthenticatedUser, addToWishlist);
router
    .route("/wishlist/:productId")
    .delete(isAuthenticatedUser, removeFromWishlist);

export default router;
