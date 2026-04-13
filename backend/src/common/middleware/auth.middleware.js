const AppError = require("../errors/AppError");
const { verifyAccessToken } = require("../utils/tokens");
const User = require("../../modules/users/user.model");

async function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError(401, "Unauthorized"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).lean();

    if (!user || !user.isActive) {
      return next(new AppError(401, "Invalid user session"));
    }

    req.user = {
      id: String(user._id),
      role: user.role,
      storeId: user.storeId,
      email: user.email
    };

    return next();
  } catch (_err) {
    return next(new AppError(401, "Invalid or expired access token"));
  }
}

module.exports = authenticate;
