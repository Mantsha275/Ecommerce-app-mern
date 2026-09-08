import express from "express";
const router = express.Router();

import {
    newOrder,
    allOrders,
    updateOrder,
    deleteOrder,
    getSingleOrder,
    myOrders,
} from "../controller/orderController.js";
import { isAuthenticatedUser, authorizeRoles } from "../middleware/auth.js";

router.route("/order/new").post(isAuthenticatedUser, newOrder);
router.route("/order/:id").get(isAuthenticatedUser, getSingleOrder);
router.route("/orders/me").get(isAuthenticatedUser, myOrders);

// admin
router
    .route("/admin/orders/")
    .get(isAuthenticatedUser, authorizeRoles("admin"), allOrders);
router
    .route("/admin/order/:id")
    .put(isAuthenticatedUser, authorizeRoles("admin"), updateOrder)
    .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteOrder);

export default router;
