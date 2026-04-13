const connectDb = require('../config/db');
const logger = require('../config/logger');
const User = require('../modules/users/user.model');
const Product = require('../modules/products/product.model');
const Sale = require('../modules/sales/sale.model');
const InventoryMovement = require('../modules/inventory/inventoryMovement.model');
const Counter = require('../modules/sales/counter.model');
const IdempotencyKey = require('../modules/sales/idempotencyKey.model');

const REQUIRED_COLLECTIONS = [
  'users',
  'stores',
  'products',
  'categories',
  'suppliers',
  'customers',
  'sales',
  'purchases',
  'inventorymovements',
  'alerts',
  'auditlogs',
  'counters',
  'idempotencykeys'
];

async function ensureCollection(db, name) {
  const exists = await db.listCollections({ name }).hasNext();
  if (!exists) {
    await db.createCollection(name);
    logger.info({ collection: name }, 'Collection created');
  }
}

async function ensureGuideIndexes(db) {
  await db.collection('stores').createIndex({ code: 1 }, { unique: true, sparse: true });

  await db.collection('categories').createIndex({ storeId: 1, name: 1 }, { unique: true });

  await db.collection('suppliers').createIndex({ storeId: 1, name: 1 }, { unique: true });
  await db.collection('suppliers').createIndex({ storeId: 1, phone: 1 }, { sparse: true });

  await db.collection('customers').createIndex({ storeId: 1, phone: 1 }, { unique: true, sparse: true });
  await db.collection('customers').createIndex({ storeId: 1, name: 1 });

  await db.collection('purchases').createIndex({ storeId: 1, poNumber: 1 }, { unique: true, sparse: true });
  await db.collection('purchases').createIndex({ storeId: 1, status: 1, createdAt: -1 });

  await db.collection('alerts').createIndex({ storeId: 1, status: 1, createdAt: -1 });
  await db.collection('alerts').createIndex({ storeId: 1, productId: 1, type: 1 }, { sparse: true });

  await db.collection('auditlogs').createIndex({ storeId: 1, createdAt: -1 });
  await db.collection('auditlogs').createIndex({ actorId: 1, createdAt: -1 }, { sparse: true });

  logger.info('Guide-level indexes ensured for non-modeled collections');
}

async function ensureStarterDocuments(db) {
  const defaultStoreId = process.env.SEED_STORE_ID || 'STORE_DEMO_001';

  await db.collection('stores').updateOne(
    { _id: defaultStoreId },
    {
      $setOnInsert: {
        _id: defaultStoreId,
        name: 'Demo Store',
        code: defaultStoreId,
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );

  logger.info({ storeId: defaultStoreId }, 'Starter store ensured');
}

async function initDatabase() {
  await connectDb();

  const db = User.db.db;

  for (const collection of REQUIRED_COLLECTIONS) {
    await ensureCollection(db, collection);
  }

  // Ensure indexes defined in existing Mongoose models.
  await Promise.all([
    User.init(),
    Product.init(),
    Sale.init(),
    InventoryMovement.init(),
    Counter.init(),
    IdempotencyKey.init()
  ]);

  await ensureGuideIndexes(db);
  await ensureStarterDocuments(db);

  logger.info('Database initialization completed successfully');
}

initDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error({ err: error }, 'Database initialization failed');
    process.exit(1);
  });
