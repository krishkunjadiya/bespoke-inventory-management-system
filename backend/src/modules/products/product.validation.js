const { z } = require("zod");

const createProductSchema = z.object({
  name: z.string().min(2).max(120),
  sku: z.string().min(2).max(40),
  barcode: z.string().min(4).max(64).optional().nullable(),
  categoryId: z.string().min(1).max(64).optional().nullable(),
  supplierId: z.string().min(1).max(64).optional().nullable(),
  unit: z.string().min(1).max(12).default("pcs"),
  costPrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  taxRate: z.number().nonnegative().default(0),
  currentStock: z.number().int().nonnegative().default(0),
  reorderLevel: z.number().int().nonnegative().default(0)
});

const updateProductSchema = createProductSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  "At least one field is required"
);

module.exports = {
  createProductSchema,
  updateProductSchema
};
