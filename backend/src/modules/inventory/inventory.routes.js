const express = require("express");
const asyncHandler = require("../../common/middleware/asyncHandler");
const authenticate = require("../../common/middleware/auth.middleware");
const attachTenant = require("../../common/middleware/tenant.middleware");
const authorize = require("../../common/middleware/role.middleware");
const validate = require("../../common/middleware/validate.middleware");
const controller = require("./inventory.controller");
const { adjustmentSchema } = require("./inventory.validation");

const router = express.Router();

router.use(authenticate, attachTenant);

router.get("/movements", asyncHandler(controller.getMovements));
router.get("/low-stock", asyncHandler(controller.getLowStock));
router.post(
  "/adjustments",
  authorize("OWNER", "MANAGER"),
  validate(adjustmentSchema),
  asyncHandler(controller.adjustStock)
);

module.exports = router;
