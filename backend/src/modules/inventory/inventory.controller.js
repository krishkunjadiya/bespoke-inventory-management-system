const { successResponse } = require("../../common/utils/response");
const service = require("./inventory.service");

async function adjustStock(req, res) {
  const data = await service.adjustStock({
    storeId: req.tenant.storeId,
    userId: req.user.id,
    payload: req.body
  });

  return successResponse(res, {
    statusCode: 201,
    message: "Inventory adjusted",
    data
  });
}

async function getMovements(req, res) {
  const result = await service.listMovements(req.tenant.storeId, req.query);
  return successResponse(res, {
    message: "Inventory movements fetched",
    data: result.data,
    meta: { page: result.page, limit: result.limit, total: result.total }
  });
}

async function getLowStock(req, res) {
  const data = await service.lowStock(req.tenant.storeId);
  return successResponse(res, {
    message: "Low stock items fetched",
    data
  });
}

module.exports = {
  adjustStock,
  getMovements,
  getLowStock
};
