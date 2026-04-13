import { useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { fetchProducts } from '../services/api'
import { PageHeaderSkeleton, Skeleton } from '../components/common/Skeleton'
import QueryErrorNotice from '../components/common/QueryErrorNotice'
import { downloadCsv, formatCurrency, formatDate } from '../utils'
import { Link, useNavigate } from 'react-router-dom'
import type { Supplier } from '../types'

const INITIALS_COLORS = [
  'bg-surface-muted text-text-primary', 'bg-primary text-white',
  'bg-surface-muted text-text-primary', 'bg-primary text-white',
  'bg-surface-muted text-text-primary', 'bg-primary text-white',
]

const STATUS_TABS = ['All', 'Active', 'Inactive']

export default function SuppliersPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('All')
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['suppliers-products'],
    queryFn: fetchProducts
  })

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-[1400px]">
        <PageHeaderSkeleton titleWidth="w-40" subtitleWidth="w-72" actionWidths={["w-20", "w-32"]} />

        <div className="rounded-card px-6 py-5 bg-primary/90">
          <div className="flex items-center gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`supplier-summary-skeleton-${index}`} className="space-y-2">
                <Skeleton className="h-3 w-24 bg-white/25" />
                <Skeleton className="h-5 w-36 bg-white/30" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex bg-surface rounded-full p-1 border border-border w-fit gap-1">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={`supplier-tab-skeleton-${index}`} className="h-8 w-20 rounded-full" />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`supplier-card-skeleton-${index}`} className="card p-5 space-y-4">
              <div className="flex items-start gap-3">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-48 max-w-full" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const suppliers: Supplier[] = (() => {
    const products = data ?? []
    const grouped = new Map<string, Supplier>()

    products.forEach((product) => {
      const supplierId = product.supplierId || 'UNASSIGNED'
      const supplierName = product.supplierName || 'Unassigned Supplier'
      const current = grouped.get(supplierId)

      if (!current) {
        grouped.set(supplierId, {
          id: supplierId,
          name: supplierName,
          contactName: 'Not set',
          email: 'Not set',
          phone: 'Not set',
          productsCount: 1,
          totalPurchases: product.costPrice * product.currentStock,
          lastOrderDate: product.updatedAt,
          status: 'active'
        })
        return
      }

      current.productsCount += 1
      current.totalPurchases += product.costPrice * product.currentStock
      if (new Date(current.lastOrderDate) < new Date(product.updatedAt)) {
        current.lastOrderDate = product.updatedAt
      }
    })

    return Array.from(grouped.values())
  })()

  const totalPurchases = suppliers.reduce((s, sup) => s + sup.totalPurchases, 0)
  const activeCount = suppliers.filter(s => s.status === 'active').length
  const filteredSuppliers = suppliers.filter(
    s => statusFilter === 'All' || s.status === statusFilter.toLowerCase(),
  )

  const exportRows = filteredSuppliers.map((supplier) => ({
    name: supplier.name,
    contactName: supplier.contactName,
    email: supplier.email,
    phone: supplier.phone,
    productsCount: supplier.productsCount,
    totalPurchases: supplier.totalPurchases,
    lastOrderDate: formatDate(supplier.lastOrderDate),
    status: supplier.status
  }))

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="page-header">
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="page-subtitle">Manage your vendor relationships</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary btn-sm" onClick={() => downloadCsv('suppliers.csv', exportRows)}>Export</button>
          <button className="btn-primary btn-sm" onClick={() => navigate('/purchases/orders/new')}><Plus size={14} /> Add Supplier</button>
        </div>
      </div>

      {isError && (
        <QueryErrorNotice
          title="Unable to load suppliers"
          message={error instanceof Error ? error.message : 'Failed to fetch supplier data from backend.'}
          onRetry={() => refetch()}
        />
      )}

      {/* Summary */}
      <div className="bg-primary text-white rounded-card px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/70 font-bold mb-1">Status</p>
            <p className="font-heading font-bold">{activeCount} active suppliers</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/70 font-bold mb-1">Investment</p>
            <p className="font-heading font-bold">{formatCurrency(totalPurchases)} total purchases</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/70 font-bold mb-1">Pipeline</p>
            <p className="font-heading font-bold">3 pending orders</p>
          </div>
        </div>
      </div>

      <div className="flex bg-surface rounded-full p-1 border border-border w-fit">
        {STATUS_TABS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${statusFilter === s ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Supplier cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredSuppliers.map((supplier, i) => (
          <div key={supplier.id} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${INITIALS_COLORS[i % INITIALS_COLORS.length]}`}>
                {supplier.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-semibold text-text-primary text-sm leading-snug truncate">{supplier.name}</h3>
                  <span className={supplier.status === 'active' ? 'chip-success' : 'chip-neutral'}>{supplier.status}</span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">{supplier.contactName}</p>
              </div>
            </div>

            <div className="space-y-1.5 mb-4">
              <p className="text-xs text-text-muted">{supplier.email}</p>
              <p className="text-xs text-text-muted">{supplier.phone}</p>
            </div>

            <div className="border-t border-border pt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-center mb-4">
              <div>
                <p className="text-[11px] text-text-muted">Products</p>
                <p className="text-sm font-bold text-text-primary">{supplier.productsCount}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-muted">Total</p>
                <p className="text-sm font-bold text-text-primary">{formatCurrency(supplier.totalPurchases)}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-muted">Last Order</p>
                <p className="text-sm font-bold text-text-primary">{formatDate(supplier.lastOrderDate)}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="text-xs text-text-secondary hover:text-primary underline underline-offset-2 flex-1" onClick={() => setStatusFilter('All')}>View Details</button>
              <Link to="/purchases/orders/new" className="btn-secondary btn-sm flex-1 text-center">
                New PO
              </Link>
            </div>
          </div>
        ))}
        {isError && (
          <div className="card p-5 text-sm text-danger sm:col-span-2 xl:col-span-3">
            Failed to load suppliers.
          </div>
        )}
        {!isError && filteredSuppliers.length === 0 && (
          <div className="card p-5 text-sm text-text-secondary sm:col-span-2 xl:col-span-3">
            No suppliers found for selected status.
          </div>
        )}
      </div>
    </div>
  )
}
