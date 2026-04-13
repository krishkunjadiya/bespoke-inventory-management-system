const mongoose = require("mongoose");

const saleItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    nameSnapshot: { type: String, required: true },
    skuSnapshot: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    taxRate: { type: Number, required: true, min: 0, default: 0 },
    taxAmount: { type: Number, required: true, min: 0, default: 0 },
    costSnapshot: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    storeId: { type: String, required: true, index: true },
    invoiceNo: { type: String, required: true },
    customerId: { type: String, default: null },
    items: { type: [saleItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    totalDiscount: { type: Number, required: true, min: 0 },
    totalTax: { type: Number, required: true, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    profit: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["CASH", "CARD", "UPI", "BANK_TRANSFER"], required: true },
    paymentStatus: { type: String, enum: ["PAID", "PENDING"], default: "PAID" },
    soldBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    soldAt: { type: Date, default: Date.now },
    idempotencyKey: { type: String, default: null }
  },
  { timestamps: true }
);

saleSchema.index({ storeId: 1, invoiceNo: 1 }, { unique: true });
saleSchema.index({ storeId: 1, soldAt: -1 });
saleSchema.index({ storeId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Sale", saleSchema);
