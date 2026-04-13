const { successResponse } = require("../../common/utils/response");
const service = require("./sales.service");

async function createSale(req, res) {
  const result = await service.createSale({
    storeId: req.tenant.storeId,
    userId: req.user.id,
    payload: req.body,
    idempotencyKey: req.headers["idempotency-key"]
  });

  return successResponse(res, {
    statusCode: 201,
    message: "Sale created",
    data: result
  });
}

async function listSales(req, res) {
  const result = await service.listSales(req.tenant.storeId, req.query);
  return successResponse(res, {
    message: "Sales fetched",
    data: result.data,
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total
    }
  });
}

async function getSaleById(req, res) {
  const data = await service.getSaleById(req.tenant.storeId, req.params.id);
  return successResponse(res, {
    message: "Sale fetched",
    data
  });
}

module.exports = {
  createSale,
  listSales,
  getSaleById
};
