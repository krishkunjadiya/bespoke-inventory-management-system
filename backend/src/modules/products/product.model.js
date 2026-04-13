const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    storeId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    barcode: { type: String, default: null },
    categoryId: { type: String, default: null },
    supplierId: { type: String, default: null },
    unit: { type: String, default: "pcs" },
    costPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 0, min: 0 },
    currentStock: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

productSchema.index({ storeId: 1, sku: 1 }, { unique: true });
productSchema.index({ storeId: 1, barcode: 1 }, { unique: true, sparse: true });
productSchema.index({ name: "text", sku: "text" });
productSchema.index({ storeId: 1, categoryId: 1 });
productSchema.index({ storeId: 1, currentStock: 1 });

module.exports = mongoose.model("Product", productSchema);
