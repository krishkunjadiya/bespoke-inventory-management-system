const authService = require("./auth.service");
const { successResponse } = require("../../common/utils/response");

async function register(req, res) {
  const result = await authService.register(req.body);
  return successResponse(res, {
    statusCode: 201,
    message: "User registered",
    data: result
  });
}

async function login(req, res) {
  const result = await authService.login(req.body);
  return successResponse(res, {
    statusCode: 200,
    message: "Login successful",
    data: result
  });
}

async function refreshToken(req, res) {
  const result = await authService.refresh(req.body.refreshToken);
  return successResponse(res, {
    statusCode: 200,
    message: "Token refreshed",
    data: result
  });
}

async function logout(req, res) {
  await authService.logout(req.user.id);
  return successResponse(res, {
    statusCode: 200,
    message: "Logged out"
  });
}

module.exports = {
  register,
  login,
  refreshToken,
  logout
};
