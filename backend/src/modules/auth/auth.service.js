const bcrypt = require("bcryptjs");
const AppError = require("../../common/errors/AppError");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../../common/utils/tokens");
const User = require("../users/user.model");

function buildAuthPayload(user) {
  return {
    sub: String(user._id),
    role: user.role,
    storeId: user.storeId
  };
}

async function issueTokens(user) {
  const payload = buildAuthPayload(user);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

  await User.updateOne({ _id: user._id }, { $set: { refreshTokenHash } });

  return { accessToken, refreshToken };
}

async function register(payload) {
  const existing = await User.findOne({ email: payload.email }).lean();
  if (existing) {
    throw new AppError(409, "Email already in use");
  }

  const passwordHash = await User.hashPassword(payload.password);
  const user = await User.create({
    name: payload.name,
    email: payload.email,
    passwordHash,
    role: payload.role || "OWNER",
    storeId: payload.storeId
  });

  const tokens = await issueTokens(user);
  return {
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      storeId: user.storeId
    },
    ...tokens
  };
}

async function login(payload) {
  const user = await User.findOne({ email: payload.email });
  if (!user || !user.isActive) {
    throw new AppError(401, "Invalid credentials");
  }

  const passwordOk = await user.comparePassword(payload.password);
  if (!passwordOk) {
    throw new AppError(401, "Invalid credentials");
  }

  const tokens = await issueTokens(user);

  return {
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      storeId: user.storeId
    },
    ...tokens
  };
}

async function refresh(refreshToken) {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (_e) {
    throw new AppError(401, "Invalid refresh token");
  }

  const user = await User.findById(decoded.sub);
  if (!user || !user.refreshTokenHash) {
    throw new AppError(401, "Refresh token revoked");
  }

  const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
  if (!matches) {
    throw new AppError(401, "Refresh token revoked");
  }

  return issueTokens(user);
}

async function logout(userId) {
  await User.updateOne({ _id: userId }, { $set: { refreshTokenHash: null } });
}

module.exports = {
  register,
  login,
  refresh,
  logout
};
