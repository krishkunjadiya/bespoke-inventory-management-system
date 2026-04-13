const { successResponse } = require("../../common/utils/response");
const service = require("./product.service");

async function list(req, res) {
  const result = await service.list(req.tenant.storeId, req.query);
  return successResponse(res, {
    message: "Products fetched",
    data: result.data,
    meta: {
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 20),
      total: result.total
    }
  });
}

async function getById(req, res) {
  const data = await service.getById(req.tenant.storeId, req.params.id);
  return successResponse(res, { message: "Product fetched", data });
}

async function create(req, res) {
  const data = await service.create(req.tenant.storeId, req.user.id, req.body);
  return successResponse(res, { statusCode: 201, message: "Product created", data });
}

async function update(req, res) {
  const data = await service.update(req.tenant.storeId, req.user.id, req.params.id, req.body);
  return successResponse(res, { message: "Product updated", data });
}

async function remove(req, res) {
  const data = await service.remove(req.tenant.storeId, req.user.id, req.params.id);
  return successResponse(res, { message: "Product deactivated", data });
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove
};
