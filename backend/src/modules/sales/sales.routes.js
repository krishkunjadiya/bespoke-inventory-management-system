const express = require("express");
const asyncHandler = require("../../common/middleware/asyncHandler");
const authenticate = require("../../common/middleware/auth.middleware");
const attachTenant = require("../../common/middleware/tenant.middleware");
const validate = require("../../common/middleware/validate.middleware");
const controller = require("./sales.controller");
const { createSaleSchema } = require("./sales.validation");

const router = express.Router();

router.use(authenticate, attachTenant);

router.post("/", validate(createSaleSchema), asyncHandler(controller.createSale));
router.get("/", asyncHandler(controller.listSales));
router.get("/:id", asyncHandler(controller.getSaleById));

module.exports = router;
