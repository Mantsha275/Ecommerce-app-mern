import express from "express";
import {
    getDashboardStats,
    getAuditLogs,
} from "../controller/adminController.js";
import { isAuthenticatedUser, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router
    .route("/admin/dashboard/stats")
    .get(isAuthenticatedUser, authorizeRoles("admin"), getDashboardStats);

router
    .route("/admin/audit-logs")
    .get(isAuthenticatedUser, authorizeRoles("admin"), getAuditLogs);

export default router;
