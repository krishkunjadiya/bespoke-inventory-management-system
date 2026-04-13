const mongoose = require("mongoose");

const inventoryMovementSchema = new mongoose.Schema(
  {
    storeId: { type: String, required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    type: {
      type: String,
      enum: ["SALE", "PURCHASE", "ADJUSTMENT", "RETURN", "TRANSFER"],
      required: true
    },
    direction: { type: String, enum: ["IN", "OUT"], required: true },
    quantity: { type: Number, required: true, min: 1 },
    quantityBefore: { type: Number, required: true, min: 0 },
    quantityAfter: { type: Number, required: true, min: 0 },
    referenceType: { type: String, default: null },
    referenceId: { type: String, default: null },
    note: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

inventoryMovementSchema.index({ storeId: 1, productId: 1, createdAt: -1 });
inventoryMovementSchema.index({ storeId: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model("InventoryMovement", inventoryMovementSchema);
