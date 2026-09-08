import cloudinary from "cloudinary";
import Product from "../models/product.js";
import ErrorHandler from "../utils/errorHandler.js";
import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import APIFeatures from "../utils/apiFeatures.js";
import { logAdminAction } from "../utils/auditLog.js";

const MAX_PRODUCT_IMAGES = 10;

// Create new product   =>   /api/v1/admin/product/new
export const newProduct = catchAsyncErrors(async (req, res, next) => {
    let images = [];
    if (typeof req.body.images === "string") {
        images.push(req.body.images);
    } else {
        images = req.body.images || [];
    }

    if (images.length === 0) {
        return next(new ErrorHandler("Please upload at least one image", 400));
    }

    if (images.length > MAX_PRODUCT_IMAGES) {
        return next(
            new ErrorHandler(
                `A product can have at most ${MAX_PRODUCT_IMAGES} images`,
                400
            )
        );
    }

    let imagesLinks = [];

    for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.v2.uploader.upload(images[i], {
            folder: "shopx/products",
        });

        imagesLinks.push({
            public_id: result.public_id,
            url: result.secure_url,
        });
    }

    req.body.images = imagesLinks;
    req.body.user = req.user.id;
    const product = await Product.create(req.body);

    await logAdminAction({
        admin: req.user,
        action: "product.create",
        targetType: "Product",
        targetId: product._id,
        details: { name: product.name },
    });

    res.status(201).json({
        success: true,
        product,
    });
});

// get all products => /api/v1/products?keyword=apple
export const getProducts = catchAsyncErrors(async (req, res, next) => {
    const resPerPage = 12;
    const productsCount = await Product.countDocuments();
    const apiFeatures = new APIFeatures(Product.find(), req.query)
        .search()
        .filter()
        .sort()
        .pagination(resPerPage);

    let products = await apiFeatures.query;
    let filteredProductsCount = products.length;

    res.status(200).json({
        success: true,
        productsCount,
        resPerPage,
        filteredProductsCount,
        products,
    });
});

// get single product => api/v1/product/:id
export const getSingleProducts = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    res.status(200).json({
        success: true,
        product,
    });
});

// ---- Admin ----

// Get all products (Admin)  =>   /api/v1/admin/products
// SECURITY FIX (Phase 12): this route previously had NO auth/role middleware
// at all in routes/product.js - any unauthenticated caller could hit it. The
// route now requires isAuthenticatedUser + authorizeRoles("admin").
export const getAdminProducts = catchAsyncErrors(async (req, res, next) => {
    const products = await Product.find();

    res.status(200).json({
        success: true,
        products,
    });
});

// Update Product   =>   /api/v1/admin/product/:id
export const updateProduct = catchAsyncErrors(async (req, res, next) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    if (req.body.images !== undefined) {
        let images = [];
        if (typeof req.body.images === "string") {
            images.push(req.body.images);
        } else {
            images = req.body.images;
        }

        if (images.length > MAX_PRODUCT_IMAGES) {
            return next(
                new ErrorHandler(
                    `A product can have at most ${MAX_PRODUCT_IMAGES} images`,
                    400
                )
            );
        }

        for (let i = 0; i < product.images.length; i++) {
            await cloudinary.v2.uploader.destroy(product.images[i].public_id);
        }

        let imagesLinks = [];

        for (let i = 0; i < images.length; i++) {
            const result = await cloudinary.v2.uploader.upload(images[i], {
                folder: "shopx/products",
            });

            imagesLinks.push({
                public_id: result.public_id,
                url: result.secure_url,
            });
        }

        req.body.images = imagesLinks;
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    await logAdminAction({
        admin: req.user,
        action: "product.update",
        targetType: "Product",
        targetId: product._id,
        // Logs which top-level fields were touched, not full before/after
        // values (images can be large base64/URLs - keeping this compact).
        details: { updatedFields: Object.keys(req.body) },
    });

    res.status(200).json({
        success: true,
        product,
    });
});

// delete product => /api/v1/admin/product/:id
export const deleteProduct = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    for (let i = 0; i < product.images.length; i++) {
        await cloudinary.v2.uploader.destroy(product.images[i].public_id);
    }

    // BUG FIX: `.remove()` was deprecated/removed in Mongoose 6+.
    await product.deleteOne();

    await logAdminAction({
        admin: req.user,
        action: "product.delete",
        targetType: "Product",
        targetId: req.params.id,
        details: { name: product.name },
    });

    res.status(200).json({
        success: true,
        message: "Product is deleted.",
    });
});

// Create new review   =>   /api/v1/review
export const createProductReview = catchAsyncErrors(async (req, res, next) => {
    const { rating, comment, productId } = req.body;

    const numericRating = Number(rating);
    if (!productId || Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        return next(
            new ErrorHandler("Please provide a valid productId and a rating between 1 and 5", 400)
        );
    }

    if (!comment || !String(comment).trim()) {
        return next(new ErrorHandler("Please provide a review comment", 400));
    }

    const product = await Product.findById(productId);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: numericRating,
        comment,
    };

    const isReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
    );

    if (isReviewed) {
        product.reviews.forEach((r) => {
            if (r.user.toString() === req.user._id.toString()) {
                r.comment = comment;
                r.rating = numericRating;
            }
        });
    } else {
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length;
    }

    product.ratings =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;

    await product.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
    });
});

// Get Product Reviews   =>   /api/v1/reviews
export const getProductReviews = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.query.id);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    res.status(200).json({
        success: true,
        reviews: product.reviews,
    });
});

// Delete Product Review   =>   /api/v1/reviews
// SECURITY FIX (Phase 13): the original endpoint let ANY authenticated user
// delete ANY review just by knowing its ID and productId - no ownership
// check at all. Now only the review's author or an admin may delete it.
// Also fixed a division-by-zero: if the last review on a product is removed,
// `ratings` is now reset to 0 instead of computing sum / 0 = NaN.
export const deleteReview = catchAsyncErrors(async (req, res, next) => {
    const { productId, id: reviewId } = req.query;

    if (!productId || !reviewId) {
        return next(
            new ErrorHandler("productId and review id are required", 400)
        );
    }

    const product = await Product.findById(productId);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    const targetReview = product.reviews.find(
        (review) => review._id.toString() === reviewId.toString()
    );

    if (!targetReview) {
        return next(new ErrorHandler("Review not found", 404));
    }

    const isOwner = targetReview.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
        return next(
            new ErrorHandler("You are not authorized to delete this review", 403)
        );
    }

    const reviews = product.reviews.filter(
        (review) => review._id.toString() !== reviewId.toString()
    );

    const numOfReviews = reviews.length;

    const ratings = numOfReviews
        ? reviews.reduce((acc, item) => item.rating + acc, 0) / numOfReviews
        : 0;

    await Product.findByIdAndUpdate(
        productId,
        { reviews, ratings, numOfReviews },
        { new: true, runValidators: true, useFindAndModify: false }
    );

    res.status(200).json({
        success: true,
    });
});
