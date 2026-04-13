import { useEffect, useState } from 'react'
import { Plus, Export, MagnifyingGlass, ListBullets, ClockCounterClockwise, CurrencyInr } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { fetchLowStockProducts } from '../services/api'
import { FilterBarSkeleton, PageHeaderSkeleton, StatCardsSkeleton, TableSectionSkeleton } from '../components/common/Skeleton'
import QueryErrorNotice from '../components/common/QueryErrorNotice'
import { downloadCsv, formatCurrency, formatDate, getPOStatusChip } from '../utils'
import { useNavigate } from 'react-router-dom'

const STATUS_TABS = ['All', 'Draft', 'Sent', 'Received', 'Partial', 'Cancelled']

export default function PurchaseOrdersPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['purchase-replenishment'],
    queryFn: fetchLowStockProducts
  })

  const purchaseOrders = (data ?? []).map((product, index) => ({
    id: product.id,
    poNumber: `AUTO-PO-${String(index + 1).padStart(4, '0')}`,
    supplierName: product.supplierName || 'Unassigned Supplier',
    createdAt: product.updatedAt,
    expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    totalValue: Math.max(product.reorderLevel - product.currentStock, 1) * product.costPrice,
    status: product.currentStock === 0 ? 'sent' : 'draft'
  }))

  const filtered = purchaseOrders.filter(lo => {
    const matchSearch = search === '' ||
      lo.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      lo.supplierName.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || lo.status === statusFilter.toLowerCase()
    return matchSearch && matchStatus
  })

  const totalValue = filtered.reduce((s, lo) => s + lo.totalValue, 0)
  const lendingCount = purchaseOrders.filter(lo => lo.status === 'sent' || lo.status === 'partial').length
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const exportRows = filtered.map((lo) => ({
    poNumber: lo.poNumber,
    supplierName: lo.supplierName,
    createdAt: formatDate(lo.createdAt),
    expectedDelivery: formatDate(lo.expectedDelivery),
    totalValue: lo.totalValue,
    status: lo.status
  }))

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-[1400px]">
        <PageHeaderSkeleton titleWidth="w-56" subtitleWidth="w-72" actionWidths={["w-24", "w-40"]} />
        <StatCardsSkeleton cards={3} gridClassName="grid-cols-1 md:grid-cols-3" />
        <FilterBarSkeleton pillCount={4} pillWidth="w-16" />
        <TableSectionSkeleton rows={8} columns={7} paginationLabelWidth="w-60" />
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-subtitle">Track all stock replenishments</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary btn-sm" onClick={() => downloadCsv('purchase-orders.csv', exportRows)}><Export size={14} /> Export</button>
          <button className="btn-primary btn-sm" onClick={() => navigate('/purchases/orders/new')}><Plus size={14} /> New Purchase Order</button>
        </div>
      </div>

      {isError && (
        <QueryErrorNotice
          title="Unable to load purchase orders"
          message={error instanceof Error ? error.message : 'Failed to fetch purchase order data from backend.'}
          onRetry={() => refetch()}
        />
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Orders', value: purchaseOrders.length.toString(), icon: <ListBullets size={18} /> },
          { label: 'Pending', value: lendingCount.toString(), icon: <ClockCounterClockwise size={18} /> },
          { label: 'Total Value', value: formatCurrency(totalValue), icon: <CurrencyInr size={18} /> },
        ].map(s => (
          <div key={s.label} className="card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-text-secondary font-medium uppercase tracking-wide mb-1">{s.label}</p>
              <p className="text-xl font-heading font-bold text-text-primary">{s.value}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-muted text-text-secondary flex items-center justify-center">
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
          <div className="search-shell flex-1">
            <MagnifyingGlass className="search-shell-icon" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search purchase order number or supplier"
              className="search-input"
            />
        </div>
        <div className="filter-pills">
          {STATUS_TABS.map(t => (
            <button key={t} onClick={() => setStatusFilter(t)}
              className={`filter-pill-btn ${statusFilter === t ? 'active' : ''}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Created</th>
                <th>Expected Delivery</th>
                <th>Total Value</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isError && (
                <tr>
                  <td colSpan={7} className="text-center text-sm text-danger py-8">Failed to load purchase orders.</td>
                </tr>
              )}
              {paginated.map(lo => (
                <tr key={lo.id}>
                  <td>
                    <span className="font-mono text-xs font-medium text-text-primary">{lo.poNumber}</span>
                  </td>
                  <td className="text-sm font-medium">{lo.supplierName}</td>
                  <td className="text-xs text-text-secondary">{formatDate(lo.createdAt)}</td>
                  <td className="text-xs text-text-secondary">{formatDate(lo.expectedDelivery)}</td>
                  <td className="font-medium">{formatCurrency(lo.totalValue)}</td>
                  <td><span className={getPOStatusChip(lo.status) + ' capitalize'}>{lo.status}</span></td>
                  <td>
                    <button className="btn-secondary btn-sm" onClick={() => navigate('/purchases/orders/new')}>View</button>
                  </td>
                </tr>
              ))}
              {!isLoading && !isError && paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-sm text-text-secondary py-8">No purchase orders found for selected filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-sm text-text-secondary">Showing <strong>{filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)}</strong> of <strong>{filtered.length}</strong> replenishment orders</p>
          <div className="flex gap-1">
            <button className="btn-secondary btn-sm" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>← Prev</button>
            <button className="btn-primary btn-sm px-3" disabled>{page}</button>
            <button className="btn-secondary btn-sm" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
