const AppError = require("../../common/errors/AppError");
const mongoose = require("mongoose");
const Product = require("./product.model");
const Sale = require("../sales/sale.model");
const repository = require("./product.repository");

async function list(storeId, query) {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));

  return repository.findPaginated({
    storeId,
    page,
    limit,
    q: query.q,
    category: query.category,
    status: query.status
  });
}

async function getById(storeId, id) {
  const product = await repository.findById(storeId, id);
  if (!product) throw new AppError(404, "Product not found");
  return product;
}

async function create(storeId, userId, payload) {
  if (payload.sellingPrice < payload.costPrice) {
    throw new AppError(422, "Selling price cannot be below cost price");
  }

  try {
    return await repository.create({
      ...payload,
      storeId,
      createdBy: userId,
      updatedBy: userId
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError(409, "SKU or barcode already exists in this store");
    }
    throw error;
  }
}

async function update(storeId, userId, id, payload) {
  if (
    payload.sellingPrice !== undefined &&
    payload.costPrice !== undefined &&
    payload.sellingPrice < payload.costPrice
  ) {
    throw new AppError(422, "Selling price cannot be below cost price");
  }

  try {
    const product = await repository.updateById(storeId, id, { ...payload, updatedBy: userId });
    if (!product) throw new AppError(404, "Product not found");
    return product;
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError(409, "SKU or barcode already exists in this store");
    }
    throw error;
  }
}

async function remove(storeId, userId, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, "Invalid product id");
  }

  const hasSales = await Sale.findOne({
    storeId,
    "items.productId": new mongoose.Types.ObjectId(id)
  }).lean();

  if (hasSales) {
    throw new AppError(422, "Cannot delete product with sales history");
  }

  const product = await repository.softDelete(storeId, id, userId);
  if (!product) throw new AppError(404, "Product not found or already inactive");

  return product;
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove
};
