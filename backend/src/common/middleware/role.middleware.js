const AppError = require("../errors/AppError");

function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError(401, "Unauthorized"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "Forbidden"));
    }

    return next();
  };
}

module.exports = authorize;
