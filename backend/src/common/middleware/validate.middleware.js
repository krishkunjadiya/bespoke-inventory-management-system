const AppError = require("../errors/AppError");

function validate(schema, source = "body") {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      return next(new AppError(400, "Validation failed", parsed.error.flatten()));
    }

    req[source] = parsed.data;
    return next();
  };
}

module.exports = validate;
