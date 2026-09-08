import axios from "axios";

// Centralized Axios API layer.
//
// baseURL is now driven by REACT_APP_API_URL (a standard CRA build-time env
// var) instead of being hardcoded to a single Render deployment URL. This is
// required so the frontend can be deployed separately from the backend (see
// Vercel split-deployment work planned for a later reply) and pointed at
// whichever backend URL is appropriate for that environment (local dev,
// staging, production) without a code change.
//
// If REACT_APP_API_URL is unset, baseURL falls back to "" (relative/
// same-origin requests), which matches how a same-origin dev setup or a
// combined deployment would already behave.
//
// withCredentials:true is required and was MISSING before this change: the
// backend (checkpoint2) authenticates via an httpOnly cookie (sendToken() -
// no JWT in the JSON body), so the browser must be told to send/receive
// cookies on cross-origin requests, or every authenticated request would
// silently fail to carry the auth cookie once frontend and backend are on
// different domains (exactly the Vercel split-deployment scenario this is
// being prepared for).
export const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "",
    withCredentials: true,
});
