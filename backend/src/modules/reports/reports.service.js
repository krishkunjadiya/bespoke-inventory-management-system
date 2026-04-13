const Sale = require("../sales/sale.model");
const Product = require("../products/product.model");

async function dashboard(storeId) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const monthStart = new Date(todayStart);
  monthStart.setDate(1);

  const [todaySalesAgg, monthlySalesAgg, lifetimeSalesAgg, lowStockCount, outOfStockCount, activeProducts] = await Promise.all([
    Sale.aggregate([
      { $match: { storeId, soldAt: { $gte: todayStart } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$grandTotal" },
          totalProfit: { $sum: "$profit" },
          totalOrders: { $sum: 1 }
        }
      }
    ]),
    Sale.aggregate([
      { $match: { storeId, soldAt: { $gte: monthStart } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$grandTotal" },
          totalProfit: { $sum: "$profit" },
          totalOrders: { $sum: 1 }
        }
      }
    ]),
    Sale.aggregate([
      { $match: { storeId } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$grandTotal" },
          totalProfit: { $sum: "$profit" },
          totalOrders: { $sum: 1 }
        }
      }
    ]),
    Product.countDocuments({
      storeId,
      isActive: true,
      $expr: { $lte: ["$currentStock", "$reorderLevel"] }
    }),
    Product.countDocuments({
      storeId,
      isActive: true,
      currentStock: { $lte: 0 }
    }),
    Product.countDocuments({ storeId, isActive: true })
  ]);

  const todayMetrics = todaySalesAgg[0] || {
    totalRevenue: 0,
    totalProfit: 0,
    totalOrders: 0
  };

  const monthlyMetrics = monthlySalesAgg[0] || {
    totalRevenue: 0,
    totalProfit: 0,
    totalOrders: 0
  };

  const lifetimeMetrics = lifetimeSalesAgg[0] || {
    totalRevenue: 0,
    totalProfit: 0,
    totalOrders: 0
  };

  const monthlyRevenue = monthlyMetrics.totalRevenue || lifetimeMetrics.totalRevenue;
  const monthlyProfit = monthlyMetrics.totalProfit || lifetimeMetrics.totalProfit;
  const monthlyOrders = monthlyMetrics.totalOrders || lifetimeMetrics.totalOrders;

  return {
    // Kept for backward compatibility with clients expecting total* fields.
    totalRevenue: todayMetrics.totalRevenue,
    totalProfit: todayMetrics.totalProfit,
    totalOrders: todayMetrics.totalOrders,
    todayRevenue: todayMetrics.totalRevenue,
    todayProfit: todayMetrics.totalProfit,
    todayOrders: todayMetrics.totalOrders,
    monthlyRevenue,
    monthlyProfit,
    monthlyOrders,
    lifetimeRevenue: lifetimeMetrics.totalRevenue,
    lifetimeProfit: lifetimeMetrics.totalProfit,
    lifetimeOrders: lifetimeMetrics.totalOrders,
    lowStockCount,
    outOfStockCount,
    pendingOrders: 0,
    activeProducts
  };
}

module.exports = {
  dashboard
};
