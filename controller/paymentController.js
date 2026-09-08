import Stripe from "stripe";
import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Process stripe payments   =>   /api/v1/payment/process
export const processPayment = catchAsyncErrors(async (req, res, next) => {
    const amount = Number(req.body.amount);

    // Basic sanity check on the amount. NOTE (known limitation, tracked for
    // the checkout redesign): this amount still originates from the cart
    // total computed on the frontend before /order/new is called, so it is
    // not yet cross-verified against the server-calculated order total from
    // newOrder(). A fully hardened checkout would create the PaymentIntent
    // only after (or alongside) the authoritative price calculation and
    // verify paymentInfo against it before marking the order paid.
    if (!Number.isFinite(amount) || amount <= 0) {
        return next(new ErrorHandler("Invalid payment amount", 400));
    }

    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount),
        currency: "usd",
        metadata: { integration_check: "accept_a_payment" },
    });

    res.status(200).json({
        success: true,
        client_secret: paymentIntent.client_secret,
    });
});

// Send stripe publishable key   =>   /api/v1/stripeapi
export const sendStripApi = catchAsyncErrors(async (req, res, next) => {
    // Only the PUBLISHABLE key may ever reach the client - never the secret key.
    res.status(200).json({
        stripeApiKey: process.env.STRIPE_API_KEY,
    });
});
