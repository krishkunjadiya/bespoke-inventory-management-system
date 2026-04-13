const mongoose = require("mongoose");
const env = require("../config/env");
const logger = require("../config/logger");
const User = require("../modules/users/user.model");
const Product = require("../modules/products/product.model");
const Sale = require("../modules/sales/sale.model");
const InventoryMovement = require("../modules/inventory/inventoryMovement.model");

const NEW_USER = {
  name: process.env.PERM_USER_NAME || process.env.DEV_DEMO_ADMIN_NAME || "Demo Admin",
  email: (process.env.PERM_USER_EMAIL || process.env.DEV_DEMO_ADMIN_EMAIL || "admin@inventory.local").toLowerCase(),
  password: process.env.PERM_USER_PASSWORD || process.env.DEV_DEMO_ADMIN_PASSWORD || "Admin@123",
  role: process.env.PERM_USER_ROLE || "OWNER"
};

async function chooseTargetStoreId() {
  if (process.env.PERM_USER_STORE_ID || process.env.DEV_DEMO_STORE_ID) {
    return process.env.PERM_USER_STORE_ID || process.env.DEV_DEMO_STORE_ID;
  }

  const [productsTop] = await Product.aggregate([
    { $group: { _id: "$storeId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 }
  ]);

  if (productsTop?._id) return productsTop._id;

  const [salesTop] = await Sale.aggregate([
    { $group: { _id: "$storeId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 }
  ]);

  if (salesTop?._id) return salesTop._id;

  const [movementsTop] = await InventoryMovement.aggregate([
    { $group: { _id: "$storeId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 }
  ]);

  if (movementsTop?._id) return movementsTop._id;

  return "STORE_DEMO_001";
}

async function reassignOptionalCollections(targetStoreId) {
  const db = mongoose.connection.db;
  const collections = ["categories", "suppliers", "customers", "purchases", "alerts", "auditlogs"];
  const out = {};

  for (const name of collections) {
    const exists = await db.listCollections({ name }).hasNext();
    if (!exists) {
      out[name] = { matchedCount: 0, modifiedCount: 0, note: "collection_not_found" };
      continue;
    }

    const result = await db.collection(name).updateMany({}, { $set: { storeId: targetStoreId } });
    out[name] = { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount };
  }

  return out;
}

async function run() {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 7000 });

  const targetStoreId = await chooseTargetStoreId();
  const passwordHash = await User.hashPassword(NEW_USER.password);

  const deleteUsers = await User.deleteMany({});

  const newUser = await User.create({
    name: NEW_USER.name,
    email: NEW_USER.email,
    passwordHash,
    role: NEW_USER.role,
    storeId: targetStoreId,
    isActive: true,
    refreshTokenHash: null
  });

  const productsResult = await Product.updateMany(
    {},
    {
      $set: {
        storeId: targetStoreId,
        createdBy: newUser._id,
        updatedBy: newUser._id,
        isActive: true
      }
    }
  );

  const salesResult = await Sale.updateMany(
    {},
    {
      $set: {
        storeId: targetStoreId,
        soldBy: newUser._id
      }
    }
  );

  const movementsResult = await InventoryMovement.updateMany(
    {},
    {
      $set: {
        storeId: targetStoreId,
        createdBy: newUser._id
      }
    }
  );

  const optionalResults = await reassignOptionalCollections(targetStoreId);

  logger.info(
    {
      deletedUsers: deleteUsers.deletedCount,
      createdUser: {
        id: String(newUser._id),
        email: newUser.email,
        role: newUser.role,
        storeId: newUser.storeId
      },
      products: { matchedCount: productsResult.matchedCount, modifiedCount: productsResult.modifiedCount },
      sales: { matchedCount: salesResult.matchedCount, modifiedCount: salesResult.modifiedCount },
      inventoryMovements: {
        matchedCount: movementsResult.matchedCount,
        modifiedCount: movementsResult.modifiedCount
      },
      optionalCollections: optionalResults
    },
    "All users reset and all data adopted by new permanent user"
  );
}

run()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error({ err: error, mongoUri: env.mongoUri }, "User reset/adopt failed");
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
