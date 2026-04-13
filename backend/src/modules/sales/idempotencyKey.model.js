const mongoose = require("mongoose");

const idempotencyKeySchema = new mongoose.Schema(
  {
    storeId: { type: String, required: true, index: true },
    key: { type: String, required: true },
    endpoint: { type: String, required: true },
    responseData: { type: mongoose.Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

idempotencyKeySchema.index({ storeId: 1, key: 1, endpoint: 1 }, { unique: true });
idempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("IdempotencyKey", idempotencyKeySchema);
