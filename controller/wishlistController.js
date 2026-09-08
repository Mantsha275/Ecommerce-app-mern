import Wishlist from "../models/wishlist.js";
import Product from "../models/product.js";
import ErrorHandler from "../utils/errorHandler.js";
import catchAsyncErrors from "../middleware/catchAsyncErrors.js";

// Get logged-in user's wishlist   =>   GET /api/v1/wishlist
export const getMyWishlist = catchAsyncErrors(async (req, res, next) => {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
        path: "products.product",
        select: "name price images stock ratings",
    });

    if (!wishlist) {
        // No wishlist yet is not an error - just return an empty one.
        return res.status(200).json({
            success: true,
            wishlist: { user: req.user._id, products: [] },
        });
    }

    res.status(200).json({ success: true, wishlist });
});

// Add a product to the wishlist   =>   POST /api/v1/wishlist/:productId
// Idempotent: adding a product already on the wishlist is a no-op success,
// not an error (matches typical "heart/save" UI expectations).
export const addToWishlist = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
        wishlist = await Wishlist.create({
            user: req.user._id,
            products: [{ product: productId }],
        });
    } else {
        const alreadyExists = wishlist.products.some(
            (item) => item.product.toString() === productId
        );

        if (!alreadyExists) {
            wishlist.products.push({ product: productId });
            await wishlist.save();
        }
    }

    wishlist = await wishlist.populate({
        path: "products.product",
        select: "name price images stock ratings",
    });

    res.status(200).json({ success: true, wishlist });
});

// Remove a product from the wishlist   =>   DELETE /api/v1/wishlist/:productId
export const removeFromWishlist = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
        return next(new ErrorHandler("Wishlist not found", 404));
    }

    wishlist.products = wishlist.products.filter(
        (item) => item.product.toString() !== productId
    );

    await wishlist.save();

    const populated = await wishlist.populate({
        path: "products.product",
        select: "name price images stock ratings",
    });

    res.status(200).json({ success: true, wishlist: populated });
});
