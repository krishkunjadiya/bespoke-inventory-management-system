const { z } = require("zod");

const adjustmentSchema = z.object({
  productId: z.string().min(24).max(24),
  direction: z.enum(["IN", "OUT"]),
  quantity: z.number().int().positive(),
  reason: z.enum(["damage", "audit_correction", "lost", "manual_update"]),
  note: z.string().max(300).optional().nullable()
});

module.exports = { adjustmentSchema };
