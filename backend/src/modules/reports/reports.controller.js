const { successResponse } = require("../../common/utils/response");
const service = require("./reports.service");

async function getDashboard(req, res) {
  const data = await service.dashboard(req.tenant.storeId);
  return successResponse(res, {
    message: "Dashboard report fetched",
    data
  });
}

module.exports = {
  getDashboard
};
