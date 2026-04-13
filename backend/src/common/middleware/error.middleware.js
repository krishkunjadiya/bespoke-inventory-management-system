const env = require("../../config/env");
const logger = require("../../config/logger");

function notFound(_req, _res, next) {
  const err = new Error("Route not found");
  err.statusCode = 404;
  next(err);
}

function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    logger.error({ err }, "Unhandled server error");
  }

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    details: err.details || null,
    stack: env.nodeEnv === "development" ? err.stack : undefined
  });
}

module.exports = { notFound, errorHandler };
