const env = require("../../config/env");
const logger = require("../../config/logger");
const User = require("../../modules/users/user.model");

async function ensureDemoAdmin() {
  if (env.nodeEnv !== "development" || !env.devBootstrapDemoAdmin) {
    return;
  }

  const email = env.devDemoAdminEmail.toLowerCase();
  const passwordHash = await User.hashPassword(env.devDemoAdminPassword);

  const existing = await User.findOne({ email });

  if (!existing) {
    await User.create({
      name: env.devDemoAdminName,
      email,
      passwordHash,
      role: "OWNER",
      storeId: env.devDemoStoreId,
      isActive: true,
      refreshTokenHash: null
    });

    logger.info({ email }, "Development demo admin created");
    return;
  }

  await User.updateOne(
    { _id: existing._id },
    {
      $set: {
        name: env.devDemoAdminName,
        passwordHash,
        role: "OWNER",
        storeId: env.devDemoStoreId,
        isActive: true,
        refreshTokenHash: null
      }
    }
  );

  logger.info({ email }, "Development demo admin credentials synced");
}

module.exports = {
  ensureDemoAdmin
};
