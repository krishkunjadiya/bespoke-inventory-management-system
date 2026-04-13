const mongoose = require('mongoose');
const connectDb = require('../config/db');
const logger = require('../config/logger');
const User = require('../modules/users/user.model');
const Product = require('../modules/products/product.model');
const Sale = require('../modules/sales/sale.model');
const Counter = require('../modules/sales/counter.model');
const IdempotencyKey = require('../modules/sales/idempotencyKey.model');
const InventoryMovement = require('../modules/inventory/inventoryMovement.model');
const { getInvoiceCounterId } = require('../common/utils/invoice');

const DEFAULTS = {
  name: process.env.SEED_ADMIN_NAME || 'Krish',
  email: process.env.SEED_ADMIN_EMAIL || 'krish@gmail.com',
  password: process.env.SEED_ADMIN_PASSWORD || 'krish@123',
  storeId: process.env.SEED_STORE_ID || 'STORE_DEMO_001'
};

const CATEGORY_ROWS = [
  { id: 'CAT-GRAINS', name: 'Grains' },
  { id: 'CAT-OILS', name: 'Oils' },
  { id: 'CAT-DAIRY', name: 'Dairy' },
  { id: 'CAT-SNACKS', name: 'Snacks' },
  { id: 'CAT-CLEAN', name: 'Cleaning' },
  { id: 'CAT-PCARE', name: 'Personal Care' },
  { id: 'CAT-BEV', name: 'Beverages' },
  { id: 'CAT-INSTANT', name: 'Instant' }
];

const SUPPLIER_ROWS = [
  { id: 'SUP-TATA', name: 'Tata Consumer Products', contactName: 'Rajesh Tata', phone: '+91-9876500001' },
  { id: 'SUP-FORTUNE', name: 'Fortune Foods', contactName: 'Amit Verma', phone: '+91-9876500002' },
  { id: 'SUP-NESTLE', name: 'Nestle India', contactName: 'Pooja Sharma', phone: '+91-9876500003' },
  { id: 'SUP-AMUL', name: 'Amul Distribution', contactName: 'Rakesh Patel', phone: '+91-9876500004' },
  { id: 'SUP-HUL', name: 'HUL Wholesale', contactName: 'Neha Joshi', phone: '+91-9876500005' },
  { id: 'SUP-LOCAL', name: 'Local Essentials Supplier', contactName: 'Sunil Kumar', phone: '+91-9876500006' }
];

const CUSTOMER_ROWS = [
  { id: 'CUST-001', name: 'Ravi Patel', phone: '+91-9000000001' },
  { id: 'CUST-002', name: 'Sneha Mehta', phone: '+91-9000000002' },
  { id: 'CUST-003', name: 'Arjun Verma', phone: '+91-9000000003' },
  { id: 'CUST-004', name: 'Anita Shah', phone: '+91-9000000004' },
  { id: 'CUST-005', name: 'Karan Singh', phone: '+91-9000000005' },
  { id: 'CUST-006', name: 'Priya Nair', phone: '+91-9000000006' },
  { id: 'CUST-007', name: 'Deepak Gupta', phone: '+91-9000000007' },
  { id: 'CUST-008', name: 'Meera Reddy', phone: '+91-9000000008' }
];

const SAMPLE_PRODUCTS = [
  { name: 'Premium Basmati Rice 10kg', sku: 'RICE-10KG', barcode: '8901001000001', categoryId: 'CAT-GRAINS', supplierId: 'SUP-TATA', unit: 'kg', costPrice: 620, sellingPrice: 710, taxRate: 5, currentStock: 46, reorderLevel: 14 },
  { name: 'Wheat Flour 5kg', sku: 'ATTA-5KG', barcode: '8901001000002', categoryId: 'CAT-GRAINS', supplierId: 'SUP-TATA', unit: 'kg', costPrice: 190, sellingPrice: 235, taxRate: 5, currentStock: 22, reorderLevel: 10 },
  { name: 'Sunflower Oil 1L', sku: 'OIL-1L', barcode: '8901001000003', categoryId: 'CAT-OILS', supplierId: 'SUP-FORTUNE', unit: 'ltr', costPrice: 118, sellingPrice: 145, taxRate: 5, currentStock: 7, reorderLevel: 18 },
  { name: 'Mustard Oil 1L', sku: 'OIL-MUSTARD-1L', barcode: '8901001000004', categoryId: 'CAT-OILS', supplierId: 'SUP-FORTUNE', unit: 'ltr', costPrice: 138, sellingPrice: 168, taxRate: 5, currentStock: 0, reorderLevel: 12 },
  { name: 'Amul Butter 500g', sku: 'DAIRY-BUTTER-500', barcode: '8901001000005', categoryId: 'CAT-DAIRY', supplierId: 'SUP-AMUL', unit: 'pcs', costPrice: 228, sellingPrice: 276, taxRate: 12, currentStock: 14, reorderLevel: 8 },
  { name: 'Cheddar Cheese 200g', sku: 'DAIRY-CHEESE-200', barcode: '8901001000006', categoryId: 'CAT-DAIRY', supplierId: 'SUP-AMUL', unit: 'pcs', costPrice: 92, sellingPrice: 118, taxRate: 12, currentStock: 6, reorderLevel: 8 },
  { name: 'Parle G Biscuit', sku: 'SNACK-PARLEG', barcode: '8901001000007', categoryId: 'CAT-SNACKS', supplierId: 'SUP-NESTLE', unit: 'pcs', costPrice: 8, sellingPrice: 12, taxRate: 18, currentStock: 140, reorderLevel: 40 },
  { name: 'Masala Chips 100g', sku: 'SNACK-CHIPS-100', barcode: '8901001000008', categoryId: 'CAT-SNACKS', supplierId: 'SUP-NESTLE', unit: 'pcs', costPrice: 18, sellingPrice: 25, taxRate: 18, currentStock: 95, reorderLevel: 30 },
  { name: 'Laundry Detergent 1kg', sku: 'CLEAN-DETERGENT-1KG', barcode: '8901001000009', categoryId: 'CAT-CLEAN', supplierId: 'SUP-HUL', unit: 'kg', costPrice: 210, sellingPrice: 265, taxRate: 18, currentStock: 5, reorderLevel: 12 },
  { name: 'Dishwash Liquid 500ml', sku: 'CLEAN-DISH-500', barcode: '8901001000010', categoryId: 'CAT-CLEAN', supplierId: 'SUP-HUL', unit: 'pcs', costPrice: 56, sellingPrice: 79, taxRate: 18, currentStock: 16, reorderLevel: 10 },
  { name: 'Toothpaste 200g', sku: 'PCARE-TOOTH-200', barcode: '8901001000011', categoryId: 'CAT-PCARE', supplierId: 'SUP-HUL', unit: 'pcs', costPrice: 72, sellingPrice: 95, taxRate: 18, currentStock: 32, reorderLevel: 12 },
  { name: 'Handwash 250ml', sku: 'PCARE-HANDWASH-250', barcode: '8901001000012', categoryId: 'CAT-PCARE', supplierId: 'SUP-HUL', unit: 'pcs', costPrice: 45, sellingPrice: 63, taxRate: 18, currentStock: 11, reorderLevel: 10 },
  { name: 'Tea 500g', sku: 'BEV-TEA-500', barcode: '8901001000013', categoryId: 'CAT-BEV', supplierId: 'SUP-TATA', unit: 'pcs', costPrice: 175, sellingPrice: 225, taxRate: 5, currentStock: 38, reorderLevel: 14 },
  { name: 'Instant Coffee 100g', sku: 'BEV-COFFEE-100', barcode: '8901001000014', categoryId: 'CAT-BEV', supplierId: 'SUP-NESTLE', unit: 'pcs', costPrice: 112, sellingPrice: 149, taxRate: 18, currentStock: 18, reorderLevel: 10 },
  { name: 'Instant Noodles 70g', sku: 'INS-NOODLES-70', barcode: '8901001000015', categoryId: 'CAT-INSTANT', supplierId: 'SUP-NESTLE', unit: 'pcs', costPrice: 10, sellingPrice: 16, taxRate: 18, currentStock: 180, reorderLevel: 60 },
  { name: 'Tomato Ketchup 500g', sku: 'INS-KETCHUP-500', barcode: '8901001000016', categoryId: 'CAT-INSTANT', supplierId: 'SUP-LOCAL', unit: 'pcs', costPrice: 64, sellingPrice: 89, taxRate: 12, currentStock: 13, reorderLevel: 10 },
  { name: 'Mineral Water 1L', sku: 'BEV-WATER-1L', barcode: '8901001000017', categoryId: 'CAT-BEV', supplierId: 'SUP-LOCAL', unit: 'pcs', costPrice: 12, sellingPrice: 20, taxRate: 5, currentStock: 120, reorderLevel: 30 },
  { name: 'Multi Surface Cleaner 1L', sku: 'CLEAN-SURFACE-1L', barcode: '8901001000018', categoryId: 'CAT-CLEAN', supplierId: 'SUP-LOCAL', unit: 'pcs', costPrice: 98, sellingPrice: 132, taxRate: 18, currentStock: 4, reorderLevel: 8 }
];

function buildSalesSeed(products, users) {
  const productBySku = new Map(products.map((p) => [p.sku, p]));
  const customerCycle = [...CUSTOMER_ROWS.map((c) => c.name), 'Walk-in'];
  const methods = ['CASH', 'CARD', 'UPI'];
  const sales = [];
  let invoice = 1;

  const template = [
    ['RICE-10KG', 'OIL-1L'],
    ['INS-NOODLES-70', 'SNACK-PARLEG', 'BEV-WATER-1L'],
    ['PCARE-TOOTH-200', 'CLEAN-DISH-500'],
    ['BEV-TEA-500', 'BEV-COFFEE-100'],
    ['DAIRY-BUTTER-500', 'INS-KETCHUP-500']
  ];

  for (let dayOffset = 20; dayOffset >= 0; dayOffset -= 1) {
    const loops = dayOffset % 3 === 0 ? 3 : 2;
    for (let i = 0; i < loops; i += 1) {
      const skuList = template[(dayOffset + i) % template.length];
      const soldAt = new Date();
      soldAt.setHours(9 + i * 3, 20, 0, 0);
      soldAt.setDate(soldAt.getDate() - dayOffset);

      let subtotal = 0;
      let totalDiscount = 0;
      let totalTax = 0;
      let grandTotal = 0;
      let profit = 0;

      const items = skuList.map((sku, idx) => {
        const product = productBySku.get(sku);
        const qty = (idx % 2) + 1;
        const discount = idx === 0 && dayOffset % 2 === 0 ? 8 : 0;
        const gross = product.sellingPrice * qty;
        const taxable = Math.max(gross - discount, 0);
        const taxAmount = (taxable * product.taxRate) / 100;
        const lineTotal = taxable + taxAmount;

        subtotal += gross;
        totalDiscount += discount;
        totalTax += taxAmount;
        grandTotal += lineTotal;
        profit += lineTotal - product.costPrice * qty;

        return {
          productId: product._id,
          nameSnapshot: product.name,
          skuSnapshot: product.sku,
          qty,
          unitPrice: product.sellingPrice,
          discount,
          taxRate: product.taxRate,
          taxAmount,
          costSnapshot: product.costPrice,
          lineTotal
        };
      });

      sales.push({
        storeId: DEFAULTS.storeId,
        invoiceNo: `SD-${String(invoice).padStart(5, '0')}`,
        customerId: null,
        items,
        subtotal,
        totalDiscount,
        totalTax,
        grandTotal,
        profit,
        paymentMethod: methods[(dayOffset + i) % methods.length],
        paymentStatus: dayOffset % 5 === 0 ? 'PENDING' : 'PAID',
        soldBy: users[(dayOffset + i) % users.length]._id,
        soldAt,
        idempotencyKey: `seed-sale-${invoice}`
      });

      invoice += 1;
    }
  }

  const salesWithCustomer = sales.map((sale, idx) => ({
    ...sale,
    customerId: customerCycle[idx % customerCycle.length]
  }));

  return salesWithCustomer;
}

async function upsertUsers() {
  await User.deleteMany({});
  
  const users = [
    {
      name: DEFAULTS.name,
      email: DEFAULTS.email,
      password: DEFAULTS.password,
      role: 'OWNER'
    }
  ];

  for (const row of users) {
    const passwordHash = await User.hashPassword(row.password);
    await User.create({
      name: row.name,
      email: row.email,
      passwordHash,
      role: row.role,
      storeId: DEFAULTS.storeId,
      isActive: true
    });
  }

  return User.find({ email: { $in: users.map((u) => u.email) } }).sort({ role: 1 }).lean();
}

async function seedReferenceCollections(db) {
  const now = new Date();

  await db.collection('stores').updateOne(
    { _id: DEFAULTS.storeId },
    {
      $set: {
        name: 'Bespoke Retail Demo Store',
        code: DEFAULTS.storeId,
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        isActive: true,
        updatedAt: now
      },
      $setOnInsert: { createdAt: now }
    },
    { upsert: true }
  );

  await db.collection('categories').deleteMany({ storeId: DEFAULTS.storeId });
  await db.collection('categories').insertMany(
    CATEGORY_ROWS.map((row) => ({
      _id: `${DEFAULTS.storeId}:${row.id}`,
      storeId: DEFAULTS.storeId,
      categoryId: row.id,
      name: row.name,
      isActive: true,
      createdAt: now,
      updatedAt: now
    }))
  );

  await db.collection('suppliers').deleteMany({ storeId: DEFAULTS.storeId });
  await db.collection('suppliers').insertMany(
    SUPPLIER_ROWS.map((row) => ({
      _id: `${DEFAULTS.storeId}:${row.id}`,
      storeId: DEFAULTS.storeId,
      supplierId: row.id,
      name: row.name,
      contactName: row.contactName,
      email: `${row.id.toLowerCase()}@supplier.local`,
      phone: row.phone,
      status: 'active',
      createdAt: now,
      updatedAt: now
    }))
  );

  await db.collection('customers').deleteMany({ storeId: DEFAULTS.storeId });
  await db.collection('customers').insertMany(
    CUSTOMER_ROWS.map((row) => ({
      _id: `${DEFAULTS.storeId}:${row.id}`,
      storeId: DEFAULTS.storeId,
      customerId: row.id,
      name: row.name,
      phone: row.phone,
      status: 'active',
      createdAt: now,
      updatedAt: now
    }))
  );
}

async function seedProducts(adminId) {
  await Product.deleteMany({ storeId: DEFAULTS.storeId });

  const now = new Date();
  const docs = SAMPLE_PRODUCTS.map((row) => ({
    ...row,
    storeId: DEFAULTS.storeId,
    isActive: true,
    createdBy: adminId,
    updatedBy: adminId,
    createdAt: now,
    updatedAt: now
  }));

  await Product.insertMany(docs);
  return Product.find({ storeId: DEFAULTS.storeId }).lean();
}

async function seedTransactions(db, users, products) {
  await Sale.deleteMany({ storeId: DEFAULTS.storeId });
  await InventoryMovement.deleteMany({ storeId: DEFAULTS.storeId });
  await db.collection('purchases').deleteMany({ storeId: DEFAULTS.storeId });
  await db.collection('alerts').deleteMany({ storeId: DEFAULTS.storeId });
  await db.collection('auditlogs').deleteMany({ storeId: DEFAULTS.storeId });
  await Counter.deleteMany({ _id: new RegExp(`^invoice:${DEFAULTS.storeId}:`) });
  await IdempotencyKey.deleteMany({ storeId: DEFAULTS.storeId });

  const sales = buildSalesSeed(products, users);
  const insertedSales = await Sale.insertMany(sales);

  const stockMap = new Map(products.map((p) => [String(p._id), p.currentStock + 120]));
  const movements = [];
  insertedSales.forEach((sale) => {
    sale.items.forEach((item) => {
      const key = String(item.productId);
      const before = stockMap.get(key) || 50;
      const after = Math.max(0, before - item.qty);
      stockMap.set(key, after);

      movements.push({
        storeId: DEFAULTS.storeId,
        productId: item.productId,
        type: 'SALE',
        direction: 'OUT',
        quantity: item.qty,
        quantityBefore: before,
        quantityAfter: after,
        referenceType: 'SALE',
        referenceId: String(sale._id),
        note: `Seed sale ${sale.invoiceNo}`,
        createdBy: sale.soldBy,
        createdAt: sale.soldAt
      });
    });
  });

  await InventoryMovement.insertMany(movements);

  const lowStockProducts = products.filter((p) => p.currentStock <= p.reorderLevel);
  const purchases = lowStockProducts.map((product, idx) => ({
    _id: `${DEFAULTS.storeId}:PO:${idx + 1}`,
    storeId: DEFAULTS.storeId,
    poNumber: `SD-PO-${String(idx + 1).padStart(4, '0')}`,
    supplierId: product.supplierId,
    supplierName: SUPPLIER_ROWS.find((s) => s.id === product.supplierId)?.name || 'Unassigned Supplier',
    status: product.currentStock === 0 ? 'sent' : 'draft',
    items: [
      {
        productId: String(product._id),
        productName: product.name,
        sku: product.sku,
        orderedQty: Math.max(product.reorderLevel - product.currentStock, 1),
        receivedQty: 0,
        unitCost: product.costPrice
      }
    ],
    totalValue: Math.max(product.reorderLevel - product.currentStock, 1) * product.costPrice,
    expectedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  if (purchases.length > 0) {
    await db.collection('purchases').insertMany(purchases);
  }

  const alerts = lowStockProducts.map((product, idx) => ({
    _id: `${DEFAULTS.storeId}:ALERT:${idx + 1}`,
    storeId: DEFAULTS.storeId,
    source: 'seed',
    type: product.currentStock === 0 ? 'out_of_stock' : 'low_stock',
    severity: product.currentStock === 0 ? 'critical' : 'warning',
    status: 'open',
    productId: String(product._id),
    productName: product.name,
    sku: product.sku,
    currentStock: product.currentStock,
    reorderLevel: product.reorderLevel,
    createdAt: new Date(Date.now() - idx * 60 * 60 * 1000),
    updatedAt: new Date()
  }));

  if (alerts.length > 0) {
    await db.collection('alerts').insertMany(alerts);
  }

  await db.collection('auditlogs').insertMany([
    {
      _id: `${DEFAULTS.storeId}:AUDIT:1`,
      storeId: DEFAULTS.storeId,
      source: 'seed',
      actorId: String(users[0]._id),
      actorEmail: users[0].email,
      action: 'SEED_DATABASE',
      entity: 'system',
      entityId: DEFAULTS.storeId,
      meta: { note: 'Full demo dataset created' },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: `${DEFAULTS.storeId}:AUDIT:2`,
      storeId: DEFAULTS.storeId,
      source: 'seed',
      actorId: String((users[1] || users[0])._id),
      actorEmail: (users[1] || users[0]).email,
      action: 'SEED_SALES',
      entity: 'sale',
      entityId: insertedSales[0] ? String(insertedSales[0]._id) : 'none',
      meta: { count: insertedSales.length },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  const invoiceCounterId = getInvoiceCounterId(DEFAULTS.storeId, new Date());
  await Counter.updateOne({ _id: invoiceCounterId }, { $set: { seq: 350 } }, { upsert: true });

  await IdempotencyKey.updateOne(
    { storeId: DEFAULTS.storeId, key: 'seed-demo-key', endpoint: 'POST:/sales' },
    {
      $set: {
        responseData: {
          saleId: insertedSales[0] ? String(insertedSales[0]._id) : null,
          invoiceNo: insertedSales[0] ? insertedSales[0].invoiceNo : null,
          grandTotal: insertedSales[0] ? insertedSales[0].grandTotal : 0
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    },
    { upsert: true }
  );

  return {
    salesCount: insertedSales.length,
    movementCount: movements.length,
    purchasesCount: purchases.length,
    alertsCount: alerts.length
  };
}

async function seed() {
  await connectDb();
  const db = mongoose.connection.db;

  const users = await upsertUsers();
  const admin = users.find((u) => u.email === DEFAULTS.email) || users[0];

  await seedReferenceCollections(db);
  const products = await seedProducts(admin._id);
  const tx = await seedTransactions(db, users, products);

  logger.info(
    {
      users: users.length,
      categories: CATEGORY_ROWS.length,
      suppliers: SUPPLIER_ROWS.length,
      customers: CUSTOMER_ROWS.length,
      products: products.length,
      sales: tx.salesCount,
      movements: tx.movementCount,
      purchases: tx.purchasesCount,
      alerts: tx.alertsCount,
      email: DEFAULTS.email,
      password: DEFAULTS.password,
      storeId: DEFAULTS.storeId
    },
    'Full seed complete. Use these credentials to log in from frontend'
  );
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error({ err: error }, 'Seed failed');
    process.exit(1);
  });
