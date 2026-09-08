import React from "react";
import { useAlert } from "react-alert";
import { AiFillStar, AiOutlineEye } from "react-icons/ai";
import { MdOutlineFavoriteBorder } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { addItemToCart } from "../../actions/cartActions";
import {
    addToWishlist,
    removeFromWishlist,
} from "../../features/wishlist/wishlistSlice";

import styles from "./Products.module.scss";

// FLAGGED CONFIGURABLE THRESHOLD: low-stock badge uses a fixed threshold
// (5 units), matching what's used on the admin products list. No backend
// change was made to make this configurable per-product/category - if that
// is wanted later, it would be a product-model addition, not a silent one.
const LOW_STOCK_THRESHOLD = 5;

// NOTE: the pre-existing "addToCart" button here already used the
// MdOutlineFavoriteBorder (heart-outline) icon for add-to-cart, not for a
// wishlist - that's how this file looked before this reply. Left it exactly
// as-is (not a wishlist feature, just an odd icon choice in the original
// code) and added a SEPARATE, clearly-labeled wishlist toggle button next
// to it rather than repurposing the existing one, to avoid silently
// changing what the existing button does.
const Product = ({ product }) => {
    const dispatch = useDispatch();
    const alert = useAlert();

    const { user } = useSelector((state) => state.auth);
    const { products: wishlistProducts } = useSelector(
        (state) => state.wishlist
    );

    const isWishlisted = wishlistProducts.some(
        (item) => item.product?._id === product?._id
    );

    const addToCart = () => {
        dispatch(addItemToCart(product._id, 1));
        alert.success("Item Added to Cart");
    };

    const toggleWishlist = (e) => {
        e.preventDefault();

        if (!user) {
            alert.error("Please login to use your wishlist");
            return;
        }

        if (isWishlisted) {
            dispatch(removeFromWishlist(product._id));
            alert.success("Removed from Wishlist");
        } else {
            dispatch(addToWishlist(product._id));
            alert.success("Added to Wishlist");
        }
    };

    const isLowStock =
        product?.stock > 0 && product?.stock <= LOW_STOCK_THRESHOLD;

    return (
        <div className="col-md-4">
            <div className={styles.product}>
                <div className={styles.product_image}>
                    {isLowStock && (
                        <span className={styles.lowStockBadge}>
                            Only {product.stock} left
                        </span>
                    )}
                    <img src={product?.images[0].url} alt={product?.name} />
                </div>
                <Link to={`/product/${product?._id}`}>
                    <p className={styles.product_name}>{product?.name}</p>
                </Link>
                <div className="d-flex align-items-center justify-content-between mt-5">
                    <div className={styles.product_rating}>
                        <AiFillStar size={20} color={"gold"} />
                        <span className="ms-2">{product?.numOfReviews}</span>
                    </div>
                    <div>
                        <span className="fw-bold">$ {product?.price}</span>
                    </div>
                </div>
                <div className={styles.link_container}>
                    <button onClick={addToCart}>
                        <MdOutlineFavoriteBorder
                            className={styles.icon}
                            size={25}
                        />
                    </button>
                    <button
                        onClick={toggleWishlist}
                        title={
                            isWishlisted
                                ? "Remove from wishlist"
                                : "Add to wishlist"
                        }
                    >
                        <span
                            className={
                                isWishlisted ? styles.heartActive : styles.icon
                            }
                        >
                            {isWishlisted ? "\u2665" : "\u2661"}
                        </span>
                    </button>
                    <Link to={`/product/${product?._id}`}>
                        <AiOutlineEye size={25} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Product;
