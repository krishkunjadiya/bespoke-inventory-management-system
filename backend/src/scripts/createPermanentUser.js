const mongoose = require("mongoose");
const env = require("../config/env");
const logger = require("../config/logger");
const User = require("../modules/users/user.model");

const DEFAULTS = {
  name: process.env.PERM_USER_NAME || "Demo Admin",
  email: (process.env.PERM_USER_EMAIL || "admin@inventory.local").toLowerCase(),
  password: process.env.PERM_USER_PASSWORD || "Admin@123",
  role: process.env.PERM_USER_ROLE || "OWNER",
  storeId: process.env.PERM_USER_STORE_ID || "STORE_DEMO_001"
};

async function createPermanentUser() {
  // Direct DB connect ensures we only write to your actual configured Mongo URI.
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 7000 });

  const passwordHash = await User.hashPassword(DEFAULTS.password);

  const result = await User.findOneAndUpdate(
    { email: DEFAULTS.email },
    {
      $set: {
        name: DEFAULTS.name,
        passwordHash,
        role: DEFAULTS.role,
        storeId: DEFAULTS.storeId,
        isActive: true,
        refreshTokenHash: null
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  logger.info(
    {
      email: DEFAULTS.email,
      role: result.role,
      storeId: result.storeId
    },
    "Permanent user is ready"
  );
}

createPermanentUser()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error(
      {
        err: error,
        mongoUri: env.mongoUri
      },
      "Failed to create permanent user. Ensure MongoDB is running on configured MONGO_URI"
    );
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
