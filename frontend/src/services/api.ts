import type { DashboardStats, InventoryMovement, Product, Sale, User } from '../types'
import { clearSession, getAccessToken, getSession, setSession, type AuthSession } from './session'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5001/api/v1'

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
  meta?: {
    page?: number
    limit?: number
    total?: number
  }
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

let refreshRequest: Promise<string | null> | null = null

function handleUnauthorizedSession(): void {
  clearSession()
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.replace('/login')
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshRequest) {
    return refreshRequest
  }

  refreshRequest = (async () => {
    const currentSession = getSession()
    if (!currentSession?.refreshToken) {
      handleUnauthorizedSession()
      return null
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken: currentSession.refreshToken })
    })

    const payload = (await response.json().catch(() => null)) as
      | ApiEnvelope<{ accessToken: string; refreshToken: string }>
      | null

    if (!response.ok || !payload?.data?.accessToken || !payload?.data?.refreshToken) {
      handleUnauthorizedSession()
      return null
    }

    setSession({
      ...currentSession,
      accessToken: payload.data.accessToken,
      refreshToken: payload.data.refreshToken
    })

    return payload.data.accessToken
  })()

  try {
    return await refreshRequest
  } finally {
    refreshRequest = null
  }
}

async function request<T>(path: string, init?: RequestInit, canRetry = true): Promise<ApiEnvelope<T>> {
  const token = getAccessToken()
  const headers = new Headers(init?.headers)

  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers
  })

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null

  if (!response.ok) {
    if (response.status === 401 && canRetry && path !== '/auth/refresh-token') {
      const refreshedAccessToken = await refreshAccessToken()
      if (refreshedAccessToken) {
        return request<T>(path, init, false)
      }
    }

    const message = payload?.message || `Request failed (${response.status})`
    if (response.status === 401) handleUnauthorizedSession()
    throw new ApiError(response.status, message)
  }

  if (!payload) {
    throw new ApiError(response.status, 'Invalid API response')
  }

  return payload
}

function toPaymentMethod(value: string): Sale['paymentMethod'] {
  const normalized = value.toLowerCase()
  if (normalized === 'cash' || normalized === 'card' || normalized === 'upi' || normalized === 'bank_transfer') {
    return normalized
  }
  return 'cash'
}

function toPaymentStatus(value: string): Sale['paymentStatus'] {
  const normalized = value.toLowerCase()
  if (normalized === 'paid' || normalized === 'pending' || normalized === 'refunded' || normalized === 'voided') {
    return normalized
  }
  return 'pending'
}

function mapProduct(raw: Record<string, unknown>): Product {
  const categoryId = String(raw.categoryId ?? '')

  return {
    id: String(raw._id ?? raw.id),
    name: String(raw.name ?? ''),
    sku: String(raw.sku ?? ''),
    barcode: raw.barcode ? String(raw.barcode) : undefined,
    categoryId,
    categoryName: categoryId || 'Uncategorized',
    supplierId: raw.supplierId ? String(raw.supplierId) : undefined,
    supplierName: raw.supplierName
      ? String(raw.supplierName)
      : raw.supplierId
        ? String(raw.supplierId)
        : undefined,
    costPrice: Number(raw.costPrice ?? 0),
    sellingPrice: Number(raw.sellingPrice ?? 0),
    taxRate: Number(raw.taxRate ?? 0),
    currentStock: Number(raw.currentStock ?? 0),
    reorderLevel: Number(raw.reorderLevel ?? 0),
    unit: String(raw.unit ?? 'pcs'),
    status: raw.isActive === false ? 'inactive' : 'active',
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString())
  }
}

function mapSale(raw: Record<string, unknown>): Sale {
  const rawItems = Array.isArray(raw.items) ? raw.items : []

  return {
    id: String(raw._id ?? raw.id),
    invoiceNo: String(raw.invoiceNo ?? ''),
    customerId: raw.customerId ? String(raw.customerId) : undefined,
    customerName: raw.customerId ? String(raw.customerId) : 'Walk-in',
    items: rawItems.map((item) => {
      const line = item as Record<string, unknown>
      return {
        productId: String(line.productId ?? ''),
        nameSnapshot: String(line.nameSnapshot ?? ''),
        skuSnapshot: String(line.skuSnapshot ?? ''),
        quantity: Number(line.qty ?? 0),
        unitPrice: Number(line.unitPrice ?? 0),
        discount: Number(line.discount ?? 0),
        taxRate: Number(line.taxRate ?? 0),
        taxAmount: Number(line.taxAmount ?? 0),
        costSnapshot: Number(line.costSnapshot ?? 0),
        lineTotal: Number(line.lineTotal ?? 0)
      }
    }),
    subtotal: Number(raw.subtotal ?? 0),
    totalDiscount: Number(raw.totalDiscount ?? 0),
    totalTax: Number(raw.totalTax ?? 0),
    grandTotal: Number(raw.grandTotal ?? 0),
    profit: Number(raw.profit ?? 0),
    paymentMethod: toPaymentMethod(String(raw.paymentMethod ?? 'CASH')),
    paymentStatus: toPaymentStatus(String(raw.paymentStatus ?? 'PENDING')),
    soldBy: String(raw.soldBy ?? ''),
    soldAt: String(raw.soldAt ?? new Date().toISOString()),
    storeId: String(raw.storeId ?? '')
  }
}

function mapInventoryMovement(raw: Record<string, unknown>): InventoryMovement {
  return {
    id: String(raw._id ?? raw.id),
    productId: String(raw.productId ?? ''),
    productName: String(raw.productName ?? raw.productId ?? ''),
    type: String(raw.type ?? 'ADJUSTMENT') as InventoryMovement['type'],
    direction: String(raw.direction ?? 'IN') as InventoryMovement['direction'],
    quantity: Number(raw.quantity ?? 0),
    quantityBefore: Number(raw.quantityBefore ?? 0),
    quantityAfter: Number(raw.quantityAfter ?? 0),
    referenceNo: String(raw.referenceId ?? ''),
    createdBy: String(raw.createdBy ?? ''),
    createdAt: String(raw.createdAt ?? new Date().toISOString())
  }
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const response = await request<{
    user: {
      id: string
      name: string
      email: string
      role: 'OWNER' | 'MANAGER' | 'STAFF'
      storeId: string
    }
    accessToken: string
    refreshToken: string
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })

  const session: AuthSession = {
    accessToken: response.data.accessToken,
    refreshToken: response.data.refreshToken,
    user: {
      id: response.data.user.id,
      name: response.data.user.name,
      email: response.data.user.email,
      role: response.data.user.role.toLowerCase() as User['role'],
      storeId: response.data.user.storeId
    }
  }

  setSession(session)
  return session
}

export async function register(name: string, email: string, password: string, storeId: string): Promise<void> {
  await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, storeId, role: 'OWNER' })
  })
}

export async function logout(): Promise<void> {
  try {
    await request('/auth/logout', {
      method: 'POST'
    })
  } finally {
    clearSession()
  }
}

export async function fetchProducts(): Promise<Product[]> {
  const response = await request<Array<Record<string, unknown>>>('/products?limit=200')
  return response.data.map(mapProduct)
}

export async function fetchProductById(id: string): Promise<Product> {
  const response = await request<Record<string, unknown>>(`/products/${id}`)
  return mapProduct(response.data)
}

export async function createProduct(payload: {
  name: string
  sku: string
  barcode: string | null
  categoryId: string | null
  supplierId: string | null
  unit: string
  costPrice: number
  sellingPrice: number
  taxRate: number
  currentStock: number
  reorderLevel: number
}): Promise<Product> {
  const response = await request<Record<string, unknown>>('/products', {
    method: 'POST',
    body: JSON.stringify(payload)
  })

  return mapProduct(response.data)
}

export async function updateProductById(id: string, payload: Partial<{
  name: string
  sku: string
  barcode: string | null
  categoryId: string | null
  supplierId: string | null
  unit: string
  costPrice: number
  sellingPrice: number
  taxRate: number
  currentStock: number
  reorderLevel: number
}>): Promise<Product> {
  const response = await request<Record<string, unknown>>(`/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  })

  return mapProduct(response.data)
}

export async function deleteProductById(id: string): Promise<Product> {
  const response = await request<Record<string, unknown>>(`/products/${id}`, {
    method: 'DELETE'
  })

  return mapProduct(response.data)
}

export async function fetchSales(limit = 50): Promise<Sale[]> {
  const response = await request<Array<Record<string, unknown>>>(`/sales?limit=${limit}`)
  return response.data.map(mapSale)
}

export async function fetchSaleById(id: string): Promise<Sale> {
  const response = await request<Record<string, unknown>>(`/sales/${id}`)
  return mapSale(response.data)
}

export async function fetchLowStockProducts(): Promise<Product[]> {
  const response = await request<Array<Record<string, unknown>>>('/inventory/low-stock')
  return response.data.map(mapProduct)
}

export async function createPurchaseOrder(input: {
  supplierName: string
  expectedDelivery: string
  notes?: string
  items: Array<{
    productId: string
    orderedQty: number
    unitCost: number
  }>
}): Promise<void> {
  await request('/purchases', {
    method: 'POST',
    body: JSON.stringify(input)
  })
}

export async function fetchInventoryMovements(params?: {
  page?: number
  limit?: number
  productId?: string
  from?: string
  to?: string
}): Promise<{ data: InventoryMovement[]; page: number; limit: number; total: number }> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.productId) query.set('productId', params.productId)
  if (params?.from) query.set('from', params.from)
  if (params?.to) query.set('to', params.to)

  const suffix = query.toString() ? `?${query.toString()}` : ''
  const response = await request<Array<Record<string, unknown>>>(`/inventory/movements${suffix}`)

  return {
    data: response.data.map(mapInventoryMovement),
    page: Number(response.meta?.page ?? params?.page ?? 1),
    limit: Number(response.meta?.limit ?? params?.limit ?? 20),
    total: Number(response.meta?.total ?? response.data.length)
  }
}

export async function adjustInventoryStock(input: {
  productId: string
  direction: 'IN' | 'OUT'
  quantity: number
  reason: 'damage' | 'audit_correction' | 'lost' | 'manual_update'
  note?: string
}): Promise<void> {
  await request('/inventory/adjustments', {
    method: 'POST',
    body: JSON.stringify(input)
  })
}

export async function createSale(input: {
  customerId?: string
  paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer'
  paymentStatus?: 'paid' | 'pending'
  items: Array<{
    productId: string
    qty: number
    unitPrice: number
    discount?: number
  }>
}): Promise<{ saleId: string; invoiceNo: string; grandTotal: number; soldAt: string }> {
  const idempotencyKey =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`

  const response = await request<{ saleId: string; invoiceNo: string; grandTotal: number; soldAt: string }>('/sales', {
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey
    },
    body: JSON.stringify({
      customerId: input.customerId ?? null,
      paymentMethod: input.paymentMethod.toUpperCase(),
      paymentStatus: (input.paymentStatus ?? 'paid').toUpperCase(),
      items: input.items
    })
  })

  return response.data
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await request<{
    totalRevenue?: number
    totalProfit?: number
    totalOrders?: number
    todayRevenue?: number
    todayProfit?: number
    todayOrders?: number
    monthlyRevenue?: number
    monthlyProfit?: number
    monthlyOrders?: number
    lifetimeRevenue?: number
    lifetimeProfit?: number
    lifetimeOrders?: number
    lowStockCount: number
    outOfStockCount?: number
    pendingOrders?: number
    activeProducts: number
  }>('/reports/dashboard')

  const todaySales = Number(response.data.todayRevenue ?? response.data.totalRevenue ?? 0)
  const monthlyRevenue = Number(
    response.data.monthlyRevenue ?? response.data.totalRevenue ?? response.data.lifetimeRevenue ?? 0
  )
  const grossProfit = Number(
    response.data.monthlyProfit ?? response.data.totalProfit ?? response.data.lifetimeProfit ?? 0
  )

  return {
    todaySales,
    todaySalesDelta: 0,
    monthlyRevenue,
    monthlyRevenueDelta: 0,
    grossProfit,
    grossProfitDelta: 0,
    lowStockCount: response.data.lowStockCount,
    outOfStockCount: Number(response.data.outOfStockCount ?? 0),
    pendingOrders: Number(response.data.pendingOrders ?? 0)
  }
}
