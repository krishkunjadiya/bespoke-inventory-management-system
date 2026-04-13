// Types for the entire Inventory Management SaaS

export interface User {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'manager' | 'staff' | 'accountant'
  avatar?: string
  storeId: string
}

export interface Category {
  id: string
  name: string
  color?: string
}

export interface Supplier {
  id: string
  name: string
  contactName: string
  email: string
  phone: string
  productsCount: number
  totalPurchases: number
  lastOrderDate: string
  status: 'active' | 'inactive'
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

export interface Product {
  id: string
  name: string
  sku: string
  barcode?: string
  categoryId: string
  categoryName: string
  supplierId?: string
  supplierName?: string
  costPrice: number
  sellingPrice: number
  taxRate: number
  currentStock: number
  reorderLevel: number
  unit: string
  status: 'active' | 'inactive'
  image?: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface CartItem {
  productId: string
  name: string
  sku: string
  sellingPrice: number
  taxRate: number
  currentStock: number
  quantity: number
}

export interface SaleItem {
  productId: string
  nameSnapshot: string
  skuSnapshot: string
  quantity: number
  unitPrice: number
  discount: number
  taxRate: number
  taxAmount: number
  costSnapshot: number
  lineTotal: number
}

export interface Sale {
  id: string
  invoiceNo: string
  customerId?: string
  customerName?: string
  items: SaleItem[]
  subtotal: number
  totalDiscount: number
  totalTax: number
  grandTotal: number
  profit: number
  paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer'
  paymentStatus: 'paid' | 'pending' | 'refunded' | 'voided'
  cashTendered?: number
  change?: number
  soldBy: string
  soldAt: string
  storeId: string
}

export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  totalOrders: number
  totalSpent: number
  lastPurchase?: string
  status: 'active' | 'inactive'
  notes?: string
}

export interface PurchaseOrderItem {
  productId: string
  productName: string
  sku: string
  orderedQty: number
  receivedQty: number
  unitCost: number
  total: number
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  supplierId: string
  supplierName: string
  items: PurchaseOrderItem[]
  totalValue: number
  status: 'draft' | 'sent' | 'received' | 'partial' | 'cancelled'
  createdAt: string
  expectedDelivery: string
  receivedAt?: string
}

export interface Alert {
  id: string
  type: 'out_of_stock' | 'low_stock' | 'expiring' | 'expired'
  severity: 'critical' | 'warning' | 'info'
  productId: string
  productName: string
  sku: string
  currentStock: number
  reorderLevel: number
  supplierName?: string
  expiryDate?: string
  status: 'open' | 'acknowledged' | 'resolved'
  createdAt: string
}

export interface DashboardStats {
  todaySales: number
  todaySalesDelta: number
  monthlyRevenue: number
  monthlyRevenueDelta: number
  grossProfit: number
  grossProfitDelta: number
  lowStockCount: number
  outOfStockCount: number
  pendingOrders: number
}

export interface InventoryMovement {
  id: string
  productId: string
  productName: string
  type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN' | 'TRANSFER'
  direction: 'IN' | 'OUT'
  quantity: number
  quantityBefore: number
  quantityAfter: number
  referenceNo: string
  createdBy: string
  createdAt: string
}

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank_transfer'
export type DateRange = '7d' | '30d' | '90d' | 'custom'
