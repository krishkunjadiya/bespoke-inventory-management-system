const mongoose = require("mongoose");
const env = require("../config/env");
const logger = require("../config/logger");
const User = require("../modules/users/user.model");
const Product = require("../modules/products/product.model");
const Sale = require("../modules/sales/sale.model");
const InventoryMovement = require("../modules/inventory/inventoryMovement.model");

const targetEmail = (process.env.PERM_USER_EMAIL || process.env.DEV_DEMO_ADMIN_EMAIL || "admin@inventory.local").toLowerCase();

async function assignDataToPermanentUser() {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 7000 });

  const user = await User.findOne({ email: targetEmail });
  if (!user) {
    throw new Error(`Permanent user not found: ${targetEmail}. Run npm run user:permanent first.`);
  }

  const targetStoreId = user.storeId;

  // Re-scope all users into the same store for a single-tenant demo environment.
  const usersResult = await User.updateMany({}, { $set: { storeId: targetStoreId } });

  const productsResult = await Product.updateMany(
    {},
    {
      $set: {
        storeId: targetStoreId,
        createdBy: user._id,
        updatedBy: user._id,
        isActive: true
      }
    }
  );

  const salesResult = await Sale.updateMany(
    {},
    {
      $set: {
        storeId: targetStoreId,
        soldBy: user._id
      }
    }
  );

  const movementsResult = await InventoryMovement.updateMany(
    {},
    {
      $set: {
        storeId: targetStoreId,
        createdBy: user._id
      }
    }
  );

  const db = mongoose.connection.db;
  const optionalCollections = [
    "categories",
    "suppliers",
    "customers",
    "purchases",
    "alerts",
    "auditlogs"
  ];

  const optionalResults = {};
  for (const name of optionalCollections) {
    const exists = await db.listCollections({ name }).hasNext();
    if (!exists) {
      optionalResults[name] = { matchedCount: 0, modifiedCount: 0, note: "collection_not_found" };
      continue;
    }

    const result = await db.collection(name).updateMany({}, { $set: { storeId: targetStoreId } });
    optionalResults[name] = {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    };
  }

  const summary = {
    targetEmail,
    targetUserId: String(user._id),
    targetStoreId,
    users: { matchedCount: usersResult.matchedCount, modifiedCount: usersResult.modifiedCount },
    products: { matchedCount: productsResult.matchedCount, modifiedCount: productsResult.modifiedCount },
    sales: { matchedCount: salesResult.matchedCount, modifiedCount: salesResult.modifiedCount },
    inventoryMovements: {
      matchedCount: movementsResult.matchedCount,
      modifiedCount: movementsResult.modifiedCount
    },
    optionalCollections: optionalResults
  };

  logger.info(summary, "Data reassigned to permanent user scope");
}

assignDataToPermanentUser()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error({ err: error, mongoUri: env.mongoUri }, "Failed to assign data to permanent user");
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
