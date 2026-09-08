import mongoose from "mongoose";

const orderSchema = mongoose.Schema({
    shippingInfo: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        phoneNo: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true },
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    orderItems: [
        {
            name: { type: String, required: true },
            quantity: { type: Number, required: true, min: 1 },
            image: { type: String, required: true },
            price: { type: Number, required: true, min: 0 },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: "Product",
            },
        },
    ],
    paymentInfo: {
        id: { type: String },
        status: { type: String },
    },
    paidAt: {
        type: Date,
    },
    itemsPrice: {
        type: Number,
        required: true,
        default: 0.0,
    },
    taxPrice: {
        type: Number,
        required: true,
        default: 0.0,
    },
    shippingPrice: {
        type: Number,
        required: true,
        default: 0.0,
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0.0,
    },
    orderStatus: {
        type: String,
        required: true,
        default: "Processing",
        enum: {
            values: ["Processing", "Shipped", "Delivered"],
            message: "Please select a valid order status",
        },
    },
    deliveredAt: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

orderSchema.index({ user: 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model("Order", orderSchema);
