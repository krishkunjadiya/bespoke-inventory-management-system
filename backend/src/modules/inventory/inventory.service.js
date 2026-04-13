const mongoose = require("mongoose");
const AppError = require("../../common/errors/AppError");
const Product = require("../products/product.model");
const InventoryMovement = require("./inventoryMovement.model");

async function adjustStock({ storeId, userId, payload }) {
  const session = await mongoose.startSession();

  try {
    let movement;
    await session.withTransaction(async () => {
      const product = await Product.findOne({ _id: payload.productId, storeId, isActive: true }).session(session);
      if (!product) throw new AppError(404, "Product not found");

      const before = product.currentStock;
      const delta = payload.direction === "IN" ? payload.quantity : -payload.quantity;
      const after = before + delta;

      if (after < 0) {
        throw new AppError(409, "Insufficient stock for adjustment");
      }

      product.currentStock = after;
      product.updatedBy = userId;
      await product.save({ session });

      [movement] = await InventoryMovement.create(
        [
          {
            storeId,
            productId: product._id,
            type: "ADJUSTMENT",
            direction: payload.direction,
            quantity: payload.quantity,
            quantityBefore: before,
            quantityAfter: after,
            referenceType: "ADJUSTMENT",
            referenceId: String(product._id),
            note: payload.note || payload.reason,
            createdBy: userId
          }
        ],
        { session }
      );
    });

    return movement;
  } finally {
    await session.endSession();
  }
}

async function listMovements(storeId, query) {
  const filter = { storeId };

  if (query.productId) filter.productId = query.productId;
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }

  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    InventoryMovement.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    InventoryMovement.countDocuments(filter)
  ]);

  return { data, total, page, limit };
}

async function lowStock(storeId) {
  return Product.find({
    storeId,
    isActive: true,
    $expr: { $lte: ["$currentStock", "$reorderLevel"] }
  })
    .sort({ currentStock: 1 })
    .lean();
}

module.exports = {
  adjustStock,
  listMovements,
  lowStock
};
