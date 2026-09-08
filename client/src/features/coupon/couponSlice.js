import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../config";

// IMPORTANT: this slice only stores what the SERVER returned from
// POST /api/v1/coupon/apply (code, discountAmount, newTotal). It never
// computes a discount itself. This is a preview only - actual order
// creation (controller/orderController.js's newOrder) does not currently
// accept/re-validate a coupon code, so applying a coupon here does not yet
// affect what gets submitted at checkout. Flagged in the continue-prompt.
export const applyCoupon = createAsyncThunk(
    "coupon/applyCoupon",
    async ({ code, cartTotal }, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post("/api/v1/coupon/apply", {
                code,
                cartTotal,
            });
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Could not apply coupon"
            );
        }
    }
);

const initialState = {
    code: null,
    discountType: null,
    discountValue: null,
    discountAmount: 0,
    newTotal: null,
    loading: false,
    error: null,
};

const couponSlice = createSlice({
    name: "coupon",
    initialState,
    reducers: {
        clearCoupon: () => initialState,
        clearCouponErrors: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(applyCoupon.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(applyCoupon.fulfilled, (state, action) => {
                state.loading = false;
                state.code = action.payload.code;
                state.discountType = action.payload.discountType;
                state.discountValue = action.payload.discountValue;
                state.discountAmount = action.payload.discountAmount;
                state.newTotal = action.payload.newTotal;
            })
            .addCase(applyCoupon.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                // A failed apply clears any previously-applied coupon so the
                // UI never shows a stale discount next to a rejected code.
                state.code = null;
                state.discountAmount = 0;
                state.newTotal = null;
            });
    },
});

export const { clearCoupon, clearCouponErrors } = couponSlice.actions;
export const couponReducer = couponSlice.reducer;
