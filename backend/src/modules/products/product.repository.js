const Product = require("./product.model");

async function findPaginated({ storeId, page, limit, q, category, status }) {
  const filter = { storeId };

  if (status === "active") filter.isActive = true;
  if (status === "inactive") filter.isActive = false;
  if (category) filter.categoryId = category;
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { sku: { $regex: q, $options: "i" } },
      { barcode: { $regex: q, $options: "i" } }
    ];
  }

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter)
  ]);

  return { data, total };
}

async function findById(storeId, id) {
  return Product.findOne({ _id: id, storeId }).lean();
}

async function create(payload) {
  return Product.create(payload);
}

async function updateById(storeId, id, payload) {
  return Product.findOneAndUpdate({ _id: id, storeId }, payload, { new: true, runValidators: true }).lean();
}

async function softDelete(storeId, id, userId) {
  return Product.findOneAndUpdate(
    { _id: id, storeId, isActive: true },
    { isActive: false, updatedBy: userId },
    { new: true }
  ).lean();
}

module.exports = {
  findPaginated,
  findById,
  create,
  updateById,
  softDelete
};
