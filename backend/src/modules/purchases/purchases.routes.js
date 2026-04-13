const express = require("express");
const asyncHandler = require("../../common/middleware/asyncHandler");
const authenticate = require("../../common/middleware/auth.middleware");
const attachTenant = require("../../common/middleware/tenant.middleware");
const { successResponse } = require("../../common/utils/response");

const router = express.Router();

router.use(authenticate, attachTenant);

router.post(
  "/",
  asyncHandler(async (_req, res) => {
    return successResponse(res, {
      statusCode: 501,
      message: "Purchase creation is queued for next implementation pass"
    });
  })
);

router.patch(
  "/:id/receive",
  asyncHandler(async (_req, res) => {
    return successResponse(res, {
      statusCode: 501,
      message: "Purchase receiving is queued for next implementation pass"
    });
  })
);

module.exports = router;
