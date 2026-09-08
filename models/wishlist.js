import mongoose from "mongoose";

// One Wishlist document per user (not one row per item) - this is the
// simplest data model that still lets us enforce "no duplicate product in a
// user's wishlist" cleanly via a compound unique index, and matches the
// project's existing pattern of embedding small sub-arrays on a parent
// document (see order.js's orderItems) rather than introducing a join table.
const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
        unique: true, // one wishlist per user
    },
    products: [
        {
            product: {
                type: mongoose.Schema.ObjectId,
                ref: "Product",
                required: true,
            },
            addedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
});

// FLAGGED BUSINESS-LOGIC DECISION: uniqueness is enforced at the
// application layer (controller checks before pushing) rather than a
// Mongo-level unique index on the subdocument array, because Mongo does not
// support unique indexes on fields inside an array the way it does on
// top-level fields. The controller's addToWishlist is written to be
// race-safe-enough for this use case (idempotent: adding an already-present
// product is a no-op, not an error) but is not wrapped in a transaction.

export default mongoose.model("Wishlist", wishlistSchema);
