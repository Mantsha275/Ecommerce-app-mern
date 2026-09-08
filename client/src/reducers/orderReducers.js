import { createSlice } from "@reduxjs/toolkit";
import {
    CREATE_ORDER_REQUEST,
    CREATE_ORDER_SUCCESS,
    CREATE_ORDER_FAIL,
    CLEAR_ERRORS,
    ALL_ORDERS_REQUEST,
    ALL_ORDERS_SUCCESS,
    ALL_ORDERS_FAIL,
    UPDATE_ORDER_REQUEST,
    DELETE_ORDER_REQUEST,
    UPDATE_ORDER_SUCCESS,
    DELETE_ORDER_SUCCESS,
    UPDATE_ORDER_FAIL,
    DELETE_ORDER_FAIL,
    UPDATE_ORDER_RESET,
    DELETE_ORDER_RESET,
    ORDER_DETAILS_REQUEST,
    ORDER_DETAILS_SUCCESS,
    ORDER_DETAILS_FAIL,
    MY_ORDERS_REQUEST,
    MY_ORDERS_SUCCESS,
    MY_ORDERS_FAIL,
} from "../constants/orderConstants";

// Converted to Redux Toolkit createSlice from the original switch-based
// reducers. Action type strings, state field names, and defaults preserved
// exactly - see productReducers.js header comment for the general approach.

const newOrderSlice = createSlice({
    name: "newOrder",
    initialState: {},
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(CREATE_ORDER_REQUEST, (state) => {
                state.loading = true;
            })
            .addCase(CREATE_ORDER_SUCCESS, (state, action) => ({
                loading: false,
                order: action.payload,
            }))
            .addCase(CREATE_ORDER_FAIL, (state, action) => ({
                loading: false,
                error: action.payload,
            }))
            .addCase(CLEAR_ERRORS, (state) => {
                state.error = null;
            });
    },
});

const myOrdersSlice = createSlice({
    name: "myOrders",
    initialState: { orders: [] },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(MY_ORDERS_REQUEST, () => ({ loading: true }))
            .addCase(MY_ORDERS_SUCCESS, (state, action) => ({
                loading: false,
                orders: action.payload,
            }))
            .addCase(MY_ORDERS_FAIL, (state, action) => ({
                loading: false,
                error: action.payload,
            }))
            .addCase(CLEAR_ERRORS, (state) => {
                state.error = null;
            });
    },
});

const orderDetailsSlice = createSlice({
    name: "orderDetails",
    initialState: { order: {} },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(ORDER_DETAILS_REQUEST, () => ({ loading: true }))
            .addCase(ORDER_DETAILS_SUCCESS, (state, action) => ({
                loading: false,
                order: action.payload,
            }))
            .addCase(ORDER_DETAILS_FAIL, (state, action) => ({
                loading: false,
                error: action.payload,
            }))
            .addCase(CLEAR_ERRORS, (state) => {
                state.error = null;
            });
    },
});

const allOrdersSlice = createSlice({
    name: "allOrders",
    initialState: { orders: [] },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(ALL_ORDERS_REQUEST, () => ({ loading: true }))
            .addCase(ALL_ORDERS_SUCCESS, (state, action) => ({
                loading: false,
                orders: action.payload.orders,
                totalAmount: action.payload.totalAmount,
            }))
            .addCase(ALL_ORDERS_FAIL, (state, action) => ({
                loading: false,
                error: action.payload,
            }))
            .addCase(CLEAR_ERRORS, (state) => {
                state.error = null;
            });
    },
});

const orderSlice = createSlice({
    name: "order",
    initialState: {},
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(UPDATE_ORDER_REQUEST, (state) => {
                state.loading = true;
            })
            .addCase(DELETE_ORDER_REQUEST, (state) => {
                state.loading = true;
            })
            .addCase(UPDATE_ORDER_SUCCESS, (state, action) => {
                state.loading = false;
                state.isUpdated = action.payload;
            })
            .addCase(DELETE_ORDER_SUCCESS, (state, action) => {
                state.loading = false;
                state.isDeleted = action.payload;
            })
            .addCase(UPDATE_ORDER_FAIL, (state, action) => {
                state.error = action.payload;
            })
            .addCase(DELETE_ORDER_FAIL, (state, action) => {
                state.error = action.payload;
            })
            .addCase(UPDATE_ORDER_RESET, (state) => {
                state.isUpdated = false;
            })
            .addCase(DELETE_ORDER_RESET, (state) => {
                state.isDeleted = false;
            })
            .addCase(CLEAR_ERRORS, (state) => {
                state.error = null;
            });
    },
});

export const newOrderReducer = newOrderSlice.reducer;
export const myOrdersReducer = myOrdersSlice.reducer;
export const orderDetailsReducer = orderDetailsSlice.reducer;
export const allOrdersReducer = allOrdersSlice.reducer;
export const orderReducer = orderSlice.reducer;
