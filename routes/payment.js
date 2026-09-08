import express from "express";
const router = express.Router();

import { processPayment, sendStripApi } from "../controller/paymentController.js";
import { isAuthenticatedUser } from "../middleware/auth.js";

router.route("/payment/process").post(isAuthenticatedUser, processPayment);
router.route("/stripeapi").get(isAuthenticatedUser, sendStripApi);

export default router;
