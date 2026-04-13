const express = require("express");
const asyncHandler = require("../../common/middleware/asyncHandler");
const validate = require("../../common/middleware/validate.middleware");
const authenticate = require("../../common/middleware/auth.middleware");
const controller = require("./auth.controller");
const { registerSchema, loginSchema, refreshSchema } = require("./auth.validation");

const router = express.Router();

router.post("/register", validate(registerSchema), asyncHandler(controller.register));
router.post("/login", validate(loginSchema), asyncHandler(controller.login));
router.post("/refresh-token", validate(refreshSchema), asyncHandler(controller.refreshToken));
router.post("/logout", authenticate, asyncHandler(controller.logout));

module.exports = router;
