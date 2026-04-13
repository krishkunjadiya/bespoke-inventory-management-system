function attachTenant(req, _res, next) {
  req.tenant = { storeId: req.user.storeId };
  next();
}

module.exports = attachTenant;
