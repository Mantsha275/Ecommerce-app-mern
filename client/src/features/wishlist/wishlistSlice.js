import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../config";

// New-code slice pattern: full createSlice + createAsyncThunk, per the
// project's Reply 2 note that brand-new code (no legacy dispatch call
// sites to preserve) should use this instead of the addCase-of-plain-
// constants pattern used for the pre-existing reducers.

export const fetchWishlist = createAsyncThunk(
    "wishlist/fetchWishlist",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get("/api/v1/wishlist");
            return data.wishlist;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Could not load wishlist"
            );
        }
    }
);

export const addToWishlist = createAsyncThunk(
    "wishlist/addToWishlist",
    async (productId, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post(
                `/api/v1/wishlist/${productId}`
            );
            return data.wishlist;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Could not add to wishlist"
            );
        }
    }
);

export const removeFromWishlist = createAsyncThunk(
    "wishlist/removeFromWishlist",
    async (productId, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.delete(
                `/api/v1/wishlist/${productId}`
            );
            return data.wishlist;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Could not remove from wishlist"
            );
        }
    }
);

const initialState = {
    products: [], // [{ product: {...populated product}, addedAt }]
    loading: false,
    error: null,
};

const wishlistSlice = createSlice({
    name: "wishlist",
    initialState,
    reducers: {
        clearWishlistErrors: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWishlist.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchWishlist.fulfilled, (state, action) => {
                state.loading = false;
                state.products = action.payload.products || [];
            })
            .addCase(fetchWishlist.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(addToWishlist.fulfilled, (state, action) => {
                state.products = action.payload.products || [];
            })
            .addCase(addToWishlist.rejected, (state, action) => {
                state.error = action.payload;
            })
            .addCase(removeFromWishlist.fulfilled, (state, action) => {
                state.products = action.payload.products || [];
            })
            .addCase(removeFromWishlist.rejected, (state, action) => {
                state.error = action.payload;
            });
    },
});

export const { clearWishlistErrors } = wishlistSlice.actions;
export const wishlistReducer = wishlistSlice.reducer;
