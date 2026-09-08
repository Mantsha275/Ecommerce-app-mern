import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
    newProductReducer,
    newReviewReducer,
    productDetailsReducer,
    productReducer,
    productReviewsReducer,
    productsReducer,
    reviewReducer,
} from "./reducers/productReducers";
import {
    allUsersReducer,
    authReducer,
    forgotPasswordReducer,
    userDetailsReducer,
    userReducer,
} from "./reducers/userReducers";
import { cartReducer } from "./reducers/cartReducers";
import {
    allOrdersReducer,
    myOrdersReducer,
    newOrderReducer,
    orderDetailsReducer,
    orderReducer,
} from "./reducers/orderReducers";
import { wishlistReducer } from "./features/wishlist/wishlistSlice";
import { couponReducer } from "./features/coupon/couponSlice";

const reducer = combineReducers({
    auth: authReducer,
    forgotPassword: forgotPasswordReducer,
    products: productsReducer,
    newProduct: newProductReducer,
    productDetails: productDetailsReducer,
    product: productReducer,
    cart: cartReducer,
    newOrder: newOrderReducer,
    allUsers: allUsersReducer,
    user: userReducer,
    userDetails: userDetailsReducer,
    allOrders: allOrdersReducer,
    order: orderReducer,
    orderDetails: orderDetailsReducer,
    myOrders: myOrdersReducer,
    productReviews: productReviewsReducer,
    review: reviewReducer,
    newReview: newReviewReducer,
    wishlist: wishlistReducer,
    coupon: couponReducer,
});

// Cart localStorage persistence contract preserved exactly: same two keys
// ("cartItems", "shippingInfo"), same JSON.parse-on-read shape, read once at
// app init. Writes still happen in actions/cartActions.js, unchanged.
let preloadedState = {
    cart: {
        cartItems: localStorage.getItem("cartItems")
            ? JSON.parse(localStorage.getItem("cartItems"))
            : [],
        shippingInfo: localStorage.getItem("shippingInfo")
            ? JSON.parse(localStorage.getItem("shippingInfo"))
            : {},
    },
};

// configureStore already wires up redux-thunk by default (via
// getDefaultMiddleware) and Redux DevTools support out of the box, so the
// separate redux-thunk / redux-devtools-extension packages are no longer
// needed as direct imports here (they can be removed from package.json).
const store = configureStore({
    reducer,
    preloadedState,
});

export default store;
