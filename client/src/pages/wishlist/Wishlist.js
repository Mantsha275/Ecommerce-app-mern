import React, { Fragment, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAlert } from "react-alert";
import { Link } from "react-router-dom";
import { AiOutlineDelete } from "react-icons/ai";
import {
    fetchWishlist,
    removeFromWishlist,
    clearWishlistErrors,
} from "../../features/wishlist/wishlistSlice";
import { addItemToCart } from "../../actions/cartActions";
import Loader from "../../components/loader/Loader";
import Navbar from "../../components/header/Navbar";
import Footer from "../../components/footer/Footer";
import MetaData from "../../components/MetaData";
import styles from "./Wishlist.module.scss";

const Wishlist = () => {
    const dispatch = useDispatch();
    const alert = useAlert();

    const { products, loading, error } = useSelector((state) => state.wishlist);

    useEffect(() => {
        dispatch(fetchWishlist());

        if (error) {
            alert.error(error);
            dispatch(clearWishlistErrors());
        }
    }, [dispatch, alert, error]);

    const removeHandler = (productId) => {
        dispatch(removeFromWishlist(productId));
        alert.success("Removed from wishlist");
    };

    const addToCartHandler = (productId) => {
        dispatch(addItemToCart(productId, 1));
        alert.success("Item Added to Cart");
    };

    return (
        <Fragment>
            <MetaData title={"My Wishlist"} />
            <Navbar />
            <div className={styles.wishlist}>
                <div className="container mt-5 mb-5">
                    <h4 className="mb-4">My Wishlist</h4>
                    {loading ? (
                        <Loader />
                    ) : products.length === 0 ? (
                        <p>Your wishlist is empty.</p>
                    ) : (
                        <div className="row g-3">
                            {products.map(({ product }) => (
                                <div className="col-md-3" key={product._id}>
                                    <div className={styles.card}>
                                        <Link to={`/product/${product._id}`}>
                                            <img
                                                src={product.images?.[0]?.url}
                                                alt={product.name}
                                            />
                                        </Link>
                                        <Link to={`/product/${product._id}`}>
                                            <p className={styles.name}>
                                                {product.name}
                                            </p>
                                        </Link>
                                        <div className="d-flex align-items-center justify-content-between">
                                            <span className="fw-bold">
                                                $ {product.price}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    removeHandler(product._id)
                                                }
                                                className={styles.removeBtn}
                                                title="Remove from wishlist"
                                            >
                                                <AiOutlineDelete size={20} />
                                            </button>
                                        </div>
                                        <button
                                            className={styles.addToCartBtn}
                                            disabled={product.stock === 0}
                                            onClick={() =>
                                                addToCartHandler(product._id)
                                            }
                                        >
                                            {product.stock === 0
                                                ? "Out of Stock"
                                                : "Add to Cart"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </Fragment>
    );
};

export default Wishlist;
