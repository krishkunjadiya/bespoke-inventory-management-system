const mongoose = require("mongoose");
const AppError = require("../../common/errors/AppError");
const { getInvoiceCounterId, formatInvoiceNumber } = require("../../common/utils/invoice");
const Product = require("../products/product.model");
const Sale = require("./sale.model");
const Counter = require("./counter.model");
const IdempotencyKey = require("./idempotencyKey.model");
const InventoryMovement = require("../inventory/inventoryMovement.model");

const IDEMPOTENCY_ENDPOINT = "POST:/sales";
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

function toKeyedMap(items) {
  const map = new Map();
  items.forEach((item) => {
    map.set(String(item._id), item);
  });
  return map;
}

async function createSale({ storeId, userId, payload, idempotencyKey }) {
  if (!idempotencyKey) {
    throw new AppError(400, "Idempotency-Key header is required");
  }

  const existing = await IdempotencyKey.findOne({
    storeId,
    key: idempotencyKey,
    endpoint: IDEMPOTENCY_ENDPOINT
  }).lean();

  if (existing) {
    return existing.responseData;
  }

  const session = await mongoose.startSession();

  try {
    let responseData;

    await session.withTransaction(async () => {
      const productIds = [...new Set(payload.items.map((item) => item.productId))];
      const products = await Product.find({
        _id: { $in: productIds },
        storeId,
        isActive: true
      }).session(session);

      if (products.length !== productIds.length) {
        throw new AppError(404, "One or more products not found");
      }

      const productMap = toKeyedMap(products);
      const workingStock = new Map();

      const now = new Date();
      const counter = await Counter.findOneAndUpdate(
        { _id: getInvoiceCounterId(storeId, now) },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, session }
      );

      const invoiceNo = formatInvoiceNumber(counter.seq, now);

      let subtotal = 0;
      let totalDiscount = 0;
      let totalTax = 0;
      let grandTotal = 0;
      let profit = 0;

      const saleItems = payload.items.map((line) => {
        const product = productMap.get(line.productId);
        const currentAvailable = workingStock.has(line.productId)
          ? workingStock.get(line.productId)
          : product.currentStock;

        if (currentAvailable < line.qty) {
          throw new AppError(409, `Insufficient stock for ${product.name}`);
        }

        workingStock.set(line.productId, currentAvailable - line.qty);

        const taxRate = product.taxRate || 0;
        const gross = line.qty * line.unitPrice;
        const discount = line.discount || 0;
        const taxable = Math.max(gross - discount, 0);
        const taxAmount = (taxable * taxRate) / 100;
        const lineTotal = taxable + taxAmount;

        subtotal += gross;
        totalDiscount += discount;
        totalTax += taxAmount;
        grandTotal += lineTotal;

        const lineCost = line.qty * product.costPrice;
        profit += lineTotal - lineCost;

        return {
          productId: product._id,
          nameSnapshot: product.name,
          skuSnapshot: product.sku,
          qty: line.qty,
          unitPrice: line.unitPrice,
          discount,
          taxRate,
          taxAmount,
          costSnapshot: product.costPrice,
          lineTotal
        };
      });

      const [saleDoc] = await Sale.create(
        [
          {
            storeId,
            invoiceNo,
            customerId: payload.customerId || null,
            items: saleItems,
            subtotal,
            totalDiscount,
            totalTax,
            grandTotal,
            profit,
            paymentMethod: payload.paymentMethod,
            paymentStatus: payload.paymentStatus || "PAID",
            soldBy: userId,
            soldAt: now,
            idempotencyKey
          }
        ],
        { session }
      );

      const movements = [];
      for (const line of saleItems) {
        const originalProduct = productMap.get(String(line.productId));
        const before = originalProduct.currentStock;
        const after = before - line.qty;

        const updateResult = await Product.updateOne(
          { _id: line.productId, storeId, currentStock: { $gte: line.qty } },
          { $inc: { currentStock: -line.qty } },
          { session }
        );

        if (updateResult.matchedCount === 0) {
          throw new AppError(409, "Stock conflict, please retry");
        }

        originalProduct.currentStock = after;

        movements.push({
          storeId,
          productId: line.productId,
          type: "SALE",
          direction: "OUT",
          quantity: line.qty,
          quantityBefore: before,
          quantityAfter: after,
          referenceType: "SALE",
          referenceId: String(saleDoc._id),
          note: `Invoice ${invoiceNo}`,
          createdBy: userId
        });
      }

      await InventoryMovement.insertMany(movements, { session });

      responseData = {
        saleId: String(saleDoc._id),
        invoiceNo,
        grandTotal,
        soldAt: saleDoc.soldAt
      };

      await IdempotencyKey.create(
        [
          {
            storeId,
            key: idempotencyKey,
            endpoint: IDEMPOTENCY_ENDPOINT,
            responseData,
            expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS)
          }
        ],
        { session }
      );
    });

    return responseData;
  } catch (error) {
    if (error.code === 11000) {
      const duplicate = await IdempotencyKey.findOne({
        storeId,
        key: idempotencyKey,
        endpoint: IDEMPOTENCY_ENDPOINT
      }).lean();
      if (duplicate) return duplicate.responseData;
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

async function listSales(storeId, query) {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Sale.find({ storeId }).sort({ soldAt: -1 }).skip(skip).limit(limit).lean(),
    Sale.countDocuments({ storeId })
  ]);

  return { data, total, page, limit };
}

async function getSaleById(storeId, id) {
  const sale = await Sale.findOne({ _id: id, storeId }).lean();
  if (!sale) throw new AppError(404, "Sale not found");
  return sale;
}

module.exports = {
  createSale,
  listSales,
  getSaleById
};
