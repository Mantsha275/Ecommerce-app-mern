import mongoose from "mongoose";

// STORAGE APPROACH (flagged per Reply 5 plan - "decide storage approach and
// flag it rather than silently picking one"):
//
// Chose a plain Mongo collection via a Mongoose model (same DB the app
// already uses), NOT a separate logging service/DB. Rationale:
//   - No new infrastructure - reuses the existing MongoDB connection, and
//     the project's governing rules explicitly forbid adding new
//     infra (Redis/Kafka/etc) for this kind of feature.
//   - Good enough for an admin-facing audit trail at this project's scale.
//     A high-volume production system would more likely want an
//     append-only/write-once store or a dedicated log pipeline, but that's
//     out of scope here.
// Trade-off being flagged: this collection has NO automatic expiry/rotation.
// It will grow unboundedly over time. A TTL index (e.g. auto-delete after
// N days) or a periodic archive job would be a reasonable follow-up but was
// NOT added here since retention policy is a product decision, not a
// technical default to pick silently.
const auditLogSchema = mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    // Denormalized at write time so the log entry still reads sensibly even
    // if the admin user is later deleted/renamed.
    adminEmail: {
        type: String,
        required: true,
    },
    // Short machine-readable action key, e.g. "product.update",
    // "order.updateStatus", "coupon.delete", "user.updateRole".
    action: {
        type: String,
        required: true,
    },
    targetType: {
        type: String,
        required: true,
    },
    // Stored as a String (not ObjectId) so it can hold a target id even for
    // an action where the target was just deleted.
    targetId: {
        type: String,
        default: null,
    },
    // Free-form JSON snapshot of what changed (e.g. { from: "Processing",
    // to: "Shipped" }). Kept as Mixed since the shape genuinely differs per
    // action type - flagging this as intentionally loose rather than
    // over-modeling every action's payload shape up front.
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ admin: 1 });

export default mongoose.model("AuditLog", auditLogSchema);
