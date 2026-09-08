import { createSlice } from "@reduxjs/toolkit";
import {
    ADMIN_PRODUCTS_FAIL,
    ADMIN_PRODUCTS_REQUEST,
    ADMIN_PRODUCTS_SUCCESS,
    ALL_PRODUCTS_FAIL,
    ALL_PRODUCTS_REQUEST,
    ALL_PRODUCTS_SUCCESS,
    CLEAR_ERRORS,
    DELETE_PRODUCT_FAIL,
    DELETE_PRODUCT_REQUEST,
    DELETE_PRODUCT_RESET,
    DELETE_PRODUCT_SUCCESS,
    DELETE_REVIEW_FAIL,
    DELETE_REVIEW_REQUEST,
    DELETE_REVIEW_RESET,
    DELETE_REVIEW_SUCCESS,
    GET_REVIEWS_FAIL,
    GET_REVIEWS_REQUEST,
    GET_REVIEWS_SUCCESS,
    NEW_PRODUCT_FAIL,
    NEW_PRODUCT_REQUEST,
    NEW_PRODUCT_RESET,
    NEW_PRODUCT_SUCCESS,
    NEW_REVIEW_FAIL,
    NEW_REVIEW_REQUEST,
    NEW_REVIEW_RESET,
    NEW_REVIEW_SUCCESS,
    PRODUCT_DETAILS_FAIL,
    PRODUCT_DETAILS_REQUEST,
    PRODUCT_DETAILS_SUCCESS,
    UPDATE_PRODUCT_FAIL,
    UPDATE_PRODUCT_REQUEST,
    UPDATE_PRODUCT_RESET,
    UPDATE_PRODUCT_SUCCESS,
} from "../constants/productsConstants";

// All reducers below converted to Redux Toolkit createSlice from the
// original switch-based reducers. Every action type string, state field
// name, and default value is preserved exactly (verified against the
// pre-migration file) - components using useSelector are unaffected, and
// components that dispatch({ type: SOME_CONST }) directly (e.g. *_RESET,
// CLEAR_ERRORS) continue to work unchanged since RTK's addCase matches on
// the action type string itself, not on how the action was created.

// all product for admin & user
const productsSlice = createSlice({
    name: "products",
    initialState: { products: [] },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(ALL_PRODUCTS_REQUEST, () => ({
                loading: true,
                products: [],
            }))
            .addCase(ADMIN_PRODUCTS_REQUEST, () => ({
                loading: true,
                products: [],
            }))
            .addCase(ALL_PRODUCTS_SUCCESS, (state, action) => ({
                loading: false,
                products: action.payload.products,
                productsCount: action.payload.productsCount,
                resPerPage: action.payload.resPerPage,
                filteredProductsCount: action.payload.filteredProductsCount,
            }))
            .addCase(ADMIN_PRODUCTS_SUCCESS, (state, action) => ({
                loading: false,
                products: action.payload,
            }))
            .addCase(ALL_PRODUCTS_FAIL, (state, action) => ({
                loading: false,
                error: action.payload,
            }))
            .addCase(ADMIN_PRODUCTS_FAIL, (state, action) => ({
                loading: false,
                error: action.payload,
            }))
            .addCase(CLEAR_ERRORS, (state) => {
                state.error = null;
            });
    },
});

const newProductSlice = createSlice({
    name: "newProduct",
    initialState: { product: {} },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(NEW_PRODUCT_REQUEST, (state) => {
                state.loading = true;
            })
            .addCase(NEW_PRODUCT_SUCCESS, (state, action) => ({
                loading: false,
                success: action.payload.success,
                product: action.payload.product,
            }))
            .addCase(NEW_PRODUCT_FAIL, (state, action) => {
                state.error = action.payload;
            })
            .addCase(NEW_PRODUCT_RESET, (state) => {
                state.success = false;
            })
            .addCase(CLEAR_ERRORS, (state) => {
                state.error = null;
            });
    },
});

const productDetailsSlice = createSlice({
    name: "productDetails",
    initialState: { product: {} },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(PRODUCT_DETAILS_REQUEST, (state) => {
                state.detailsLoading = true;
            })
            .addCase(PRODUCT_DETAILS_SUCCESS, (state, action) => ({
                detailsLoading: false,
                product: action.payload,
            }))
            .addCase(PRODUCT_DETAILS_FAIL, (state, action) => {
                state.error = action.payload;
            })
            .addCase(CLEAR_ERRORS, (state) => {
                state.error = null;
            });
    },
});

// product update & delete reducers by admin
const productSlice = createSlice({
    name: "product",
    initialState: {},
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(DELETE_PRODUCT_REQUEST, (state) => {
                state.loading = true;
            })
            .addCase(UPDATE_PRODUCT_REQUEST, (state) => {
                state.loading = true;
            })
            .addCase(DELETE_PRODUCT_SUCCESS, (state, action) => {
                state.loading = false;
                state.isDeleted = action.payload;
            })
            .addCase(UPDATE_PRODUCT_SUCCESS, (state, action) => {
                state.loading = false;
                state.isUpdated = action.payload;
            })
            .addCase(DELETE_PRODUCT_FAIL, (state, action) => {
                state.error = action.payload;
            })
            .addCase(UPDATE_PRODUCT_FAIL, (state, action) => {
                state.error = action.payload;
            })
            .addCase(DELETE_PRODUCT_RESET, (state) => {
                state.isDeleted = false;
            })
            .addCase(UPDATE_PRODUCT_RESET, (state) => {
                state.isUpdated = false;
            })
            .addCase(CLEAR_ERRORS, (state) => {
                state.error = null;
            });
    },
});

const newReviewSlice = createSlice({
    name: "newReview",
    initialState: {},
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(NEW_REVIEW_REQUEST, (state) => {
                state.loading = true;
            })
            .addCase(NEW_REVIEW_SUCCESS, (state, action) => ({
                loading: false,
                success: action.payload,
            }))
            .addCase(NEW_REVIEW_FAIL, (state, action) => {
                state.error = action.payload;
            })
            .addCase(NEW_REVIEW_RESET, (state) => {
                state.success = false;
            })
            .addCase(CLEAR_ERRORS, (state) => {
                state.error = null;
            });
    },
});

const productReviewsSlice = createSlice({
    name: "productReviews",
    initialState: { review: [] },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(GET_REVIEWS_REQUEST, (state) => {
                state.loading = true;
            })
            .addCase(GET_REVIEWS_SUCCESS, (state, action) => ({
                loading: false,
                reviews: action.payload,
            }))
            .addCase(GET_REVIEWS_FAIL, (state, action) => {
                state.error = action.payload;
            })
            .addCase(CLEAR_ERRORS, (state) => {
                state.error = null;
            });
    },
});

const reviewSlice = createSlice({
    name: "review",
    initialState: {},
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(DELETE_REVIEW_REQUEST, (state) => {
                state.loading = true;
            })
            .addCase(DELETE_REVIEW_SUCCESS, (state, action) => {
                state.loading = false;
                state.isDeleted = action.payload;
            })
            .addCase(DELETE_REVIEW_FAIL, (state, action) => {
                state.error = action.payload;
            })
            .addCase(DELETE_REVIEW_RESET, (state) => {
                state.isDeleted = false;
            })
            .addCase(CLEAR_ERRORS, (state) => {
                state.error = null;
            });
    },
});

export const productsReducer = productsSlice.reducer;
export const newProductReducer = newProductSlice.reducer;
export const productDetailsReducer = productDetailsSlice.reducer;
export const productReducer = productSlice.reducer;
export const newReviewReducer = newReviewSlice.reducer;
export const productReviewsReducer = productReviewsSlice.reducer;
export const reviewReducer = reviewSlice.reducer;
