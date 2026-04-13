const express = require("express");
const asyncHandler = require("../../common/middleware/asyncHandler");
const authenticate = require("../../common/middleware/auth.middleware");
const attachTenant = require("../../common/middleware/tenant.middleware");
const authorize = require("../../common/middleware/role.middleware");
const validate = require("../../common/middleware/validate.middleware");
const controller = require("./product.controller");
const { createProductSchema, updateProductSchema } = require("./product.validation");

const router = express.Router();

router.use(authenticate, attachTenant);

router.get("/", asyncHandler(controller.list));
router.get("/:id", asyncHandler(controller.getById));
router.post("/", authorize("OWNER", "MANAGER"), validate(createProductSchema), asyncHandler(controller.create));
router.patch("/:id", authorize("OWNER", "MANAGER"), validate(updateProductSchema), asyncHandler(controller.update));
router.delete("/:id", authorize("OWNER"), asyncHandler(controller.remove));

module.exports = router;
