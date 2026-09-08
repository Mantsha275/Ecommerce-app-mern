import { createSlice } from "@reduxjs/toolkit";
import {
    ALL_USERS_FAIL,
    ALL_USERS_REQUEST,
    ALL_USERS_SUCCESS,
    CLEAR_ERRORS,
    DELETE_USER_FAIL,
    DELETE_USER_REQUEST,
    DELETE_USER_RESET,
    DELETE_USER_SUCCESS,
    FORGOT_PASSWORD_FAIL,
    FORGOT_PASSWORD_REQUEST,
    FORGOT_PASSWORD_SUCCESS,
    LOAD_USER_FAIL,
    LOAD_USER_REQUEST,
    LOAD_USER_SUCCESS,
    LOGIN_FAIL,
    LOGIN_REQUEST,
    LOGIN_SUCCESS,
    LOGOUT_FAIL,
    LOGOUT_SUCCESS,
    NEW_PASSWORD_FAIL,
    NEW_PASSWORD_REQUEST,
    NEW_PASSWORD_SUCCESS,
    REGISTER_USER_FAIL,
    REGISTER_USER_REQUEST,
    REGISTER_USER_SUCCESS,
    UPDATE_PASSWORD_FAIL,
    UPDATE_PASSWORD_REQUEST,
    UPDATE_PASSWORD_RESET,
    UPDATE_PASSWORD_SUCCESS,
    UPDATE_PROFILE_FAIL,
    UPDATE_PROFILE_REQUEST,
    UPDATE_PROFILE_RESET,
    UPDATE_PROFILE_SUCCESS,
    UPDATE_USER_FAIL,
    UPDATE_USER_REQUEST,
    UPDATE_USER_RESET,
    UPDATE_USER_SUCCESS,
    USER_DETAILS_FAIL,
    USER_DETAILS_REQUEST,
    USER_DETAILS_SUCCESS,
} from "../constants/userConstants";

// Converted to Redux Toolkit createSlice from the original switch-based
// reducers. Action type strings, state field names, and defaults preserved
// exactly - see productReducers.js header comment for the general approach.

const authSlice = createSlice({
    name: "auth",
    initialState: { user: {} },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(LOGIN_REQUEST, () => ({ loading: true, isAuthenticated: false }))
            .addCase(REGISTER_USER_REQUEST, () => ({ loading: true, isAuthenticated: false }))
            .addCase(LOAD_USER_REQUEST, () => ({ loading: true, isAuthenticated: false }))
            .addCase(LOGIN_SUCCESS, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload;
            })
            .addCase(REGISTER_USER_SUCCESS, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload;
            })
            .addCase(LOAD_USER_SUCCESS, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload;
            })
            .addCase(LOGOUT_SUCCESS, () => ({
                loading: false,
                isAuthenticated: false,
                user: null,
            }))
            .addCase(LOAD_USER_FAIL, (state, action) => ({
                loading: false,
                isAuthenticated: false,
                user: null,
                error: action.payload,
            }))
            .addCase(LOGOUT_FAIL, (state, action) => {
                state.error = action.payload;
            })
            .addCase(LOGIN_FAIL, (state, action) => {
                state.loading = false;
                state.isAuthenticated = false;
                state.user = null;
                state.error = action.payload;
            })
            .addCase(REGISTER_USER_FAIL, (state, action) => {
                state.loading = false;
                state.isAuthenticated = false;
                state.user = null;
                state.error = action.payload;
            })
            .addCase(CLEAR_ERRORS, (state) => {
                state.error = null;
            });
    },
});

const forgotPasswordSlice = createSlice({
    name: "forgotPassword",
    initialState: {},
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(FORGOT_PASSWORD_REQUEST, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(NEW_PASSWORD_REQUEST, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(FORGOT_PASSWORD_SUCCESS, (state, action) => {
                state.loading = false;
                state.message = action.payload;
            })
            .addCase(NEW_PASSWORD_SUCCESS, (state, action) => {
                state.success = action.payload;
            })
            .addCase(FORGOT_PASSWORD_FAIL, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(NEW_PASSWORD_FAIL, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(CLEAR_ERRORS, (state) => {
                state.error = null;
            });
    },
});

const userSlice = createSlice({
    name: "user",
    initialState: {},
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(UPDATE_PROFILE_REQUEST, (state) => {
                state.loading = true;
            })
            .addCase(UPDATE_PASSWORD_REQUEST, (state) => {
                state.loading = true;
            })
            .addCase(UPDATE_USER_REQUEST, (state) => {
                state.loading = true;
            })
            .addCase(DELETE_USER_REQUEST, (state) => {
                state.loading = true;
            })
            .addCase(UPDATE_PROFILE_SUCCESS, (state, action) => {
                state.loading = false;
                state.isUpdated = action.payload;
            })
            .addCase(UPDATE_PASSWORD_SUCCESS, (state, action) => {
                state.loading = false;
                state.isUpdated = action.payload;
            })
            .addCase(UPDATE_USER_SUCCESS, (state, action) => {
                state.loading = false;
                state.isUpdated = action.payload;
            })
            .addCase(DELETE_USER_SUCCESS, (state, action) => {
                state.loading = false;
                state.isDeleted = action.payload;
            })
            .addCase(UPDATE_PROFILE_RESET, (state) => {
                state.isUpdated = false;
            })
            .addCase(UPDATE_PASSWORD_RESET, (state) => {
                state.isUpdated = false;
            })
            .addCase(UPDATE_USER_RESET, (state) => {
                state.isUpdated = false;
            })
            .addCase(DELETE_USER_RESET, (state) => {
                state.isDeleted = false;
            })
            .addCase(UPDATE_PROFILE_FAIL, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(UPDATE_PASSWORD_FAIL, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(UPDATE_USER_FAIL, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(DELETE_USER_FAIL, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(CLEAR_ERRORS, (state) => {
                state.error = null;
            });
    },
});

const allUsersSlice = createSlice({
    name: "allUsers",
    initialState: { users: [] },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(ALL_USERS_REQUEST, (state) => {
                state.loading = true;
            })
            .addCase(ALL_USERS_SUCCESS, (state, action) => {
                state.loading = false;
                state.users = action.payload;
            })
            .addCase(ALL_USERS_FAIL, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(CLEAR_ERRORS, (state) => {
                state.error = null;
            });
    },
});

const userDetailsSlice = createSlice({
    name: "userDetails",
    initialState: { user: {} },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(USER_DETAILS_REQUEST, (state) => {
                state.loading = true;
            })
            .addCase(USER_DETAILS_SUCCESS, (state, action) => {
                state.loading = false;
                state.user = action.payload;
            })
            .addCase(USER_DETAILS_FAIL, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(CLEAR_ERRORS, (state) => {
                state.error = null;
            });
    },
});

export const authReducer = authSlice.reducer;
export const forgotPasswordReducer = forgotPasswordSlice.reducer;
export const userReducer = userSlice.reducer;
export const allUsersReducer = allUsersSlice.reducer;
export const userDetailsReducer = userDetailsSlice.reducer;
