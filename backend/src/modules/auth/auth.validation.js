const { z } = require("zod");

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(64),
  role: z.enum(["OWNER", "MANAGER", "STAFF"]).optional(),
  storeId: z.string().min(2).max(64)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(64)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10)
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema
};
