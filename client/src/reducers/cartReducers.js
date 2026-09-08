import { createSlice } from "@reduxjs/toolkit";
import {
    ADD_TO_CART,
    REMOVE_ITEM_CART,
    SAVE_SHIPPING_INFO,
} from "../constants/cartConstants";

// Converted to Redux Toolkit (createSlice) from the original switch-based
// reducer. Behavior, action type strings (imported from cartConstants, kept
// unchanged), and state shape are all identical to before - this is purely
// an implementation swap, not a behavior change. See cartActions.js for the
// localStorage read/write contract (keys: "cartItems", "shippingInfo"),
// which is untouched by this migration.
const initialState = { cartItems: [], shippingInfo: {} };

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(ADD_TO_CART, (state, action) => {
                const item = action.payload;
                const isItemExist = state.cartItems.find(
                    (i) => i.product === item.product
                );

                if (isItemExist) {
                    state.cartItems = state.cartItems.map((i) =>
                        i.product === isItemExist.product ? item : i
                    );
                } else {
                    state.cartItems.push(item);
                }
            })
            .addCase(REMOVE_ITEM_CART, (state, action) => {
                state.cartItems = state.cartItems.filter(
                    (i) => i.product !== action.payload
                );
            })
            .addCase(SAVE_SHIPPING_INFO, (state, action) => {
                state.shippingInfo = action.payload;
            });
    },
});

export const cartReducer = cartSlice.reducer;
