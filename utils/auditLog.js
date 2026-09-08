import AuditLog from "../models/auditLog.js";

// Writes one audit log entry. Deliberately swallows its own errors (logging
// to console only) rather than calling next(err) - a failure to WRITE the
// audit log must never fail or roll back the actual admin action it's
// describing (e.g. a product delete should still succeed even if the audit
// collection is temporarily unreachable). Callers should `await` this so
// the log entry is attempted before the response is sent, but its outcome
// deliberately cannot affect the response.
export const logAdminAction = async ({
    admin,
    action,
    targetType,
    targetId = null,
    details = {},
}) => {
    try {
        await AuditLog.create({
            admin: admin._id,
            adminEmail: admin.email,
            action,
            targetType,
            targetId: targetId !== null ? String(targetId) : null,
            details,
        });
    } catch (err) {
        console.error("Failed to write audit log entry:", action, err.message);
    }
};
