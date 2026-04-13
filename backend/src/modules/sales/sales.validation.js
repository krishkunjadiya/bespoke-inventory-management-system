const { z } = require("zod");

const saleItemSchema = z.object({
  productId: z.string().min(24).max(24),
  qty: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0)
});

const createSaleSchema = z.object({
  customerId: z.string().optional().nullable(),
  paymentMethod: z.enum(["CASH", "CARD", "UPI", "BANK_TRANSFER"]),
  paymentStatus: z.enum(["PAID", "PENDING"]).default("PAID"),
  items: z.array(saleItemSchema).min(1)
});

module.exports = {
  createSaleSchema
};
