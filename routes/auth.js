import express from "express";
const router = express.Router();

import {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    getUserProfile,
    updatePassword,
    updateProfile,
    logout,
    allUsers,
    getUserDetails,
    updateUser,
    deleteUser,
} from "../controller/authController.js";
import { isAuthenticatedUser, authorizeRoles } from "../middleware/auth.js";
import {
    loginLimiter,
    forgotPasswordLimiter,
    registerLimiter,
} from "../utils/rateLimiters.js";
import {
    registerValidationRules,
    loginValidationRules,
    passwordUpdateValidationRules,
    handleValidation,
} from "../middleware/validators.js";

router
    .route("/register")
    .post(registerLimiter, registerValidationRules, handleValidation, registerUser);
router
    .route("/login")
    .post(loginLimiter, loginValidationRules, handleValidation, loginUser);
router
    .route("/password/forgot")
    .post(forgotPasswordLimiter, forgotPassword);
router.route("/password/reset/:token").put(resetPassword);
router.route("/logout").get(logout);

router
    .route("/password/update")
    .put(isAuthenticatedUser, passwordUpdateValidationRules, handleValidation, updatePassword);
router.route("/me").get(isAuthenticatedUser, getUserProfile);
router.route("/me/update").put(isAuthenticatedUser, updateProfile);

// admin
router
    .route("/admin/users")
    .get(isAuthenticatedUser, authorizeRoles("admin"), allUsers);
router
    .route("/admin/user/:id")
    .get(isAuthenticatedUser, authorizeRoles("admin"), getUserDetails)
    .put(isAuthenticatedUser, authorizeRoles("admin"), updateUser)
    .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteUser);

export default router;
