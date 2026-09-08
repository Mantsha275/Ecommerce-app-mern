import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter product name"],
        trim: true,
        maxLength: [100, "Product name cannot exceed 100 characters"],
    },
    price: {
        type: Number,
        required: [true, "Please enter product price"],
        // BUG FIX: this was `maxLength` (a string-length validator, which is
        // silently ignored on a Number field) instead of a numeric bound.
        min: [0, "Product price cannot be negative"],
        max: [99999, "Product price cannot exceed 99999"],
        default: 0.0,
    },
    description: {
        type: String,
        required: [true, "Please enter product description"],
    },
    ratings: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    images: [
        {
            public_id: {
                type: String,
                required: true,
            },
            url: {
                type: String,
                required: true,
            },
        },
    ],
    category: {
        type: String,
        required: [true, "Please select category for this product"],
        enum: {
            values: [
                "Eid Collection",
                "New Collection",
                "Featured",
                "Footwear",
                "Accessories",
                "Clothing",
                "Beauty/Health",
                "Sports",
                "Outdoor",
                "Other",
            ],
            message: "Please select correct category for product",
        },
    },
    type: {
        type: String,
        required: false,
    },
    seller: {
        type: String,
        required: [true, "Please enter product seller"],
    },
    stock: {
        type: Number,
        required: [true, "Please enter product stock"],
        // BUG FIX: same maxLength-on-a-Number mistake as `price` above.
        min: [0, "Product stock cannot be negative"],
        max: [99999, "Product stock cannot exceed 99999"],
        default: 0,
    },
    numOfReviews: {
        type: Number,
        default: 0,
    },
    reviews: [
        {
            user: {
                type: mongoose.Schema.ObjectId,
                ref: "User",
                required: true,
            },
            name: {
                type: String,
                required: true,
            },
            rating: {
                type: Number,
                required: true,
                min: 1,
                max: 5,
            },
            comment: {
                type: String,
                required: true,
            },
        },
    ],
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

productSchema.index({ category: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ name: "text" });

export default mongoose.model("Product", productSchema);
