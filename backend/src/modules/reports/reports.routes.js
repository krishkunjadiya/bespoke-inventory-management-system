const express = require("express");
const asyncHandler = require("../../common/middleware/asyncHandler");
const authenticate = require("../../common/middleware/auth.middleware");
const attachTenant = require("../../common/middleware/tenant.middleware");
const controller = require("./reports.controller");

const router = express.Router();

router.use(authenticate, attachTenant);

router.get("/dashboard", asyncHandler(controller.getDashboard));

module.exports = router;
