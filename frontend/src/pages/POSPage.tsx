import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlass, Trash, Plus, Minus, User, CreditCard, CurrencyCircleDollar, DeviceMobile, ShoppingCartSimple } from '@phosphor-icons/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, createSale, fetchProducts } from '../services/api'
import { getSession } from '../services/session'
import { Skeleton } from '../components/common/Skeleton'
import { formatCurrency, getStockStatus } from '../utils'
import type { CartItem, PaymentMethod } from '../types'

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { id: 'cash', label: 'Cash', icon: <CurrencyCircleDollar size={18} /> },
  { id: 'card', label: 'Card', icon: <CreditCard size={18} /> },
  { id: 'upi', label: 'UPI', icon: <DeviceMobile size={18} /> },
]

export default function POSPage() {
  const navigate = useNavigate()
  const session = getSession()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [discount, setDiscount] = useState(0)
  const [cashTendered, setCashTendered] = useState('')
  const [charged, setCharged] = useState(false)
  const [error, setError] = useState('')

  const queryClient = useQueryClient()

  const { data, isLoading, isError, error: productsError, refetch } = useQuery({
    queryKey: ['pos-products', session?.user?.id ?? 'anonymous', session?.user?.storeId ?? 'no-store'],
    queryFn: fetchProducts,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 1,
    enabled: Boolean(session?.accessToken)
  })

  const products = useMemo(() => data ?? [], [data])

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(products.map((p) => p.categoryName).filter(Boolean)))]
  }, [products])

  const chargeMutation = useMutation({
    mutationFn: async () => {
      await createSale({
        paymentMethod,
        paymentStatus: 'paid',
        items: cart.map((item) => ({
          productId: item.productId,
          qty: item.quantity,
          unitPrice: item.sellingPrice,
          discount: 0
        }))
      })
    },
    onSuccess: async () => {
      setCharged(true)
      setTimeout(() => {
        setCharged(false)
        setCart([])
        setDiscount(0)
        setCashTendered('')
      }, 2500)

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['pos-products'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-sales'] }),
        queryClient.invalidateQueries({ queryKey: ['sales-history'] }),
        queryClient.invalidateQueries({ queryKey: ['low-stock'] }),
        queryClient.invalidateQueries({ queryKey: ['topbar-low-stock'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      ])
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to create sale')
      }
    }
  })

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search))
      const matchCat = categoryFilter === 'All' || p.categoryName === categoryFilter
      return matchSearch && matchCat
    })
  }, [products, search, categoryFilter])

  const productsErrorMessage = productsError instanceof Error
    ? productsError.message
    : 'Unable to load products for POS.'

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_24rem] h-[calc(100vh-4rem)] w-full overflow-hidden">
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden border-b xl:border-b-0 xl:border-r border-border bg-bg">
          <div className="p-4 bg-surface border-b border-border space-y-3">
            <Skeleton className="h-10 w-full" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={`pos-pill-skeleton-${index}`} className="h-9 w-20" />
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={`pos-skeleton-card-${index}`} className="card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-14" />
                  </div>
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="pt-2 space-y-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full xl:w-96 xl:justify-self-end flex-shrink-0 flex flex-col bg-surface max-h-[46vh] xl:max-h-none xl:border-l xl:border-border">
          <div className="px-4 py-3 border-b border-border space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`pos-cart-skeleton-${index}`} className="flex items-center gap-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-14" />
              </div>
            ))}
          </div>
          <div className="border-t border-border px-4 py-4 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-5 w-full" />
            <div className="grid grid-cols-3 gap-1.5">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  const addToCart = (product: (typeof products)[0]) => {
    if (getStockStatus(product.currentStock, product.reorderLevel) === 'out_of_stock') return
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id)
      if (existing) {
        return prev.map(i =>
          i.productId === product.id
            ? { ...i, quantity: Math.min(i.currentStock, i.quantity + 1) }
            : i
        )
      }
      return [...prev, { productId: product.id, name: product.name, sku: product.sku, sellingPrice: product.sellingPrice, taxRate: product.taxRate, currentStock: product.currentStock, quantity: 1 }]
    })
  }

  const updateQty = (id: string, delta: number) =>
    setCart(prev => prev.map(i => {
      if (i.productId !== id) return i
      const next = Math.max(1, i.quantity + delta)
      return { ...i, quantity: Math.min(i.currentStock, next) }
    }))
  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.productId !== id))

  const subtotal = cart.reduce((s, i) => s + i.sellingPrice * i.quantity, 0)
  const totalTax = cart.reduce((s, i) => s + (i.sellingPrice * i.quantity * i.taxRate) / 100, 0)
  const grandTotal = subtotal - discount + totalTax
  const change = cashTendered ? parseFloat(cashTendered) - grandTotal : 0

  const handleCharge = async () => {
    setError('')
    await chargeMutation.mutateAsync()
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_24rem] h-[calc(100vh-4rem)] w-full overflow-hidden">
      {/* Left: Product Selection */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden border-b xl:border-b-0 xl:border-r border-border bg-bg">
        {/* Search bar */}
        <div className="p-4 bg-surface border-b border-border space-y-3">
          <div className="search-shell">
            <MagnifyingGlass size={16} className="search-shell-icon" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Scan barcode or search products..."
              className="search-input"
              autoFocus
            />
          </div>
          {/* Category pills */}
          <div className="filter-pills">
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)}
                className={`filter-pill-btn ${categoryFilter === cat ? 'active' : ''}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isError ? (
            <div className="card p-6 max-w-lg">
              <p className="text-sm font-semibold text-danger mb-1">Unable to load POS items</p>
              <p className="text-sm text-text-secondary mb-4">{productsErrorMessage}</p>
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary btn-sm" onClick={() => refetch()}>Retry</button>
                <button className="btn-secondary btn-sm" onClick={() => navigate('/login')}>Re-login</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map(p => {
                const status = getStockStatus(p.currentStock, p.reorderLevel)
                const isOOS = status === 'out_of_stock'
                const inCart = cart.find(i => i.productId === p.id)
                return (
                  <button key={p.id} onClick={() => addToCart(p)} disabled={isOOS}
                    className={`relative card p-4 text-left transition-all duration-150 group ${isOOS ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-surface-muted active:scale-[0.98]'} ${inCart ? 'border-primary ring-1 ring-primary/20' : ''}`}>
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-[10px] font-bold tracking-widest uppercase text-text-muted">{p.sku}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          status === 'low_stock'
                            ? 'bg-warning-bg text-warning'
                            : status === 'out_of_stock'
                              ? 'bg-danger-bg text-danger'
                              : 'bg-surface-muted text-text-secondary'
                        }`}
                      >
                        {status === 'low_stock'
                          ? `Low: ${p.currentStock}`
                          : status === 'out_of_stock'
                            ? 'Out'
                            : `${p.currentStock} In Stock`}
                      </span>
                    </div>
                    <p className="text-base font-heading font-extrabold text-text-primary leading-snug mb-1">{p.name}</p>
                    <p className="text-xs text-text-secondary font-medium mb-5">{p.categoryName}</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xl font-heading font-extrabold tracking-tight text-text-primary">{formatCurrency(p.sellingPrice)}</p>
                        <p className="text-[11px] text-text-muted mt-0.5">{p.currentStock} {p.unit} available</p>
                      </div>
                      {!isOOS && (
                        <span className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center scale-0 group-hover:scale-100 transition-transform duration-150">
                          <Plus size={14} weight="bold" />
                        </span>
                      )}
                    </div>

                    {isOOS && (
                      <div className="absolute inset-0 bg-surface/80 flex items-center justify-center rounded-card">
                        <span className="chip-danger text-[10px] tracking-wide uppercase">Out of Stock</span>
                      </div>
                    )}
                    {inCart && !isOOS && (
                      <span className="absolute top-2 right-2 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {inCart.quantity}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
          {!isError && filteredProducts.length === 0 && (
            <div className="text-center py-20 text-text-muted">
              <MagnifyingGlass size={32} className="mx-auto mb-3 text-text-muted" />
              <p className="font-medium">No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-full xl:w-96 xl:justify-self-end flex-shrink-0 flex flex-col bg-surface max-h-[46vh] xl:max-h-none xl:border-l xl:border-border">
        {/* Cart header */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-heading font-bold text-text-primary">Current Sale</h2>
            <span className="chip-info">{cart.length} item{cart.length !== 1 ? 's' : ''}</span>
          </div>
          <button
            className="h-10 w-full rounded-pill border border-border bg-surface text-sm font-medium text-text-secondary flex items-center justify-center gap-2 hover:bg-surface-muted transition-colors"
            onClick={() => navigate('/sales/customers')}
          >
            <User size={14} /> Add Customer (optional)
          </button>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <ShoppingCartSimple size={34} className="mx-auto mb-3 text-text-muted" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs mt-1">Click products to add them</p>
            </div>
          ) : cart.map(item => (
            <div key={item.productId} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{item.name}</p>
                <p className="text-xs text-text-muted">{formatCurrency(item.sellingPrice)} each</p>
              </div>
              {/* Qty stepper */}
              <div className="flex items-center bg-surface-muted rounded-DEFAULT border border-border overflow-hidden">
                <button onClick={() => updateQty(item.productId, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-border rounded-l-DEFAULT">
                  <Minus size={12} />
                </button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <button onClick={() => updateQty(item.productId, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-border border-l border-border rounded-r-DEFAULT">
                  <Plus size={12} />
                </button>
              </div>
              <span className="text-sm font-semibold w-16 text-right">{formatCurrency(item.sellingPrice * item.quantity)}</span>
              <button onClick={() => removeItem(item.productId)} className="text-text-muted hover:text-danger">
                <Trash size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Totals & Payment */}
        <div className="border-t border-border px-4 py-4 space-y-3">
          {error && (
            <div className="rounded-lg border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-text-secondary items-center">
              <span>Discount</span>
              <div className="flex items-center gap-1">
                <span>−₹</span>
                <input type="number" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))}
                  className="w-16 text-right border border-border rounded px-1.5 py-0.5 text-xs text-text-primary focus:outline-none focus:border-primary"
                  placeholder="0.00" min="0" />
              </div>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>Tax (GST)</span><span>+{formatCurrency(totalTax)}</span>
            </div>
            <div className="flex justify-between text-text-primary font-bold text-base pt-2 border-t border-border">
              <span>Total</span><span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div className="grid grid-cols-3 gap-1.5">
            {PAYMENT_METHODS.map(pm => (
              <button key={pm.id} onClick={() => setPaymentMethod(pm.id)}
                className={`flex flex-col items-center gap-1 py-2 rounded-DEFAULT text-xs font-medium border transition-all ${paymentMethod === pm.id ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-text-secondary hover:border-primary hover:text-primary'}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center ${paymentMethod === pm.id ? 'bg-white/15' : 'bg-surface-muted'}`}>{pm.icon}</span>
                {pm.label}
              </button>
            ))}
          </div>

          {/* Enter cash received (INR) */}
          {paymentMethod === 'cash' && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <input type="number" value={cashTendered} onChange={e => setCashTendered(e.target.value)}
                  placeholder="Cash tendered ₹" className="input text-sm h-9 flex-1" />
              </div>
              {cashTendered && change >= 0 && (
                <p className="text-sm text-success font-medium">Change: {formatCurrency(change)}</p>
              )}
            </div>
          )}

          {/* Charge button */}
          {charged ? (
            <div className="btn-primary btn-lg w-full justify-center bg-success border-success">
              ✓ Payment Successful!
            </div>
          ) : (
            <button
              onClick={handleCharge}
              disabled={cart.length === 0 || chargeMutation.isPending}
              className="btn-primary btn-lg w-full"
            >
              {chargeMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing…
                </span>
              ) : `Charge ${formatCurrency(grandTotal)}`}
            </button>
          )}
          <button
            className="text-xs text-text-muted hover:text-text-secondary w-full text-center underline underline-offset-2"
            onClick={() => {
              localStorage.setItem('pos_draft_v1', JSON.stringify({
                cart,
                discount,
                paymentMethod,
                cashTendered,
                savedAt: new Date().toISOString()
              }))
            }}
          >
            Save as Draft
          </button>
        </div>
      </div>
    </div>
  )
}
