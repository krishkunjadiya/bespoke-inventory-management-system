import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MagnifyingGlass, Export, ArrowRight } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { fetchSales } from '../services/api'
import { FilterBarSkeleton, PageHeaderSkeleton, Skeleton, TableSectionSkeleton } from '../components/common/Skeleton'
import QueryErrorNotice from '../components/common/QueryErrorNotice'
import { downloadCsv, formatCurrency, formatDateTime, getPaymentStatusChip } from '../utils'

const STATUS_TABS = ['All', 'Paid', 'Pending', 'Refunded', 'Voided']
const PAYMENT_TABS = ['All', 'Cash', 'Card', 'UPI']

export default function SalesHistoryPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [paymentFilter, setPaymentFilter] = useState('All')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['sales-history'],
    queryFn: () => fetchSales(200)
  })

  const sales = useMemo(() => data ?? [], [data])

  const filtered = useMemo(() =>
    sales.filter(s => {
      const matchSearch = search === '' ||
        s.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
        (s.customerName ?? '').toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'All' || s.paymentStatus === statusFilter.toLowerCase()
      const matchPayment = paymentFilter === 'All' || s.paymentMethod === paymentFilter.toLowerCase()
      return matchSearch && matchStatus && matchPayment
    }), [sales, search, statusFilter, paymentFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, paymentFilter])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const totalRevenue = filtered.reduce((s, sale) => s + sale.grandTotal, 0)

  const exportRows = filtered.map((sale) => ({
    invoiceNo: sale.invoiceNo,
    customer: sale.customerName || '',
    soldAt: formatDateTime(sale.soldAt),
    subtotal: sale.subtotal,
    discount: sale.totalDiscount,
    tax: sale.totalTax,
    grandTotal: sale.grandTotal,
    paymentMethod: sale.paymentMethod,
    paymentStatus: sale.paymentStatus
  }))

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-[1400px]">
        <PageHeaderSkeleton titleWidth="w-48" subtitleWidth="w-64" actionWidths={["w-28", "w-28"]} />

        <div className="card px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Fragment key={`sales-summary-skeleton-${index}`}>
                <div className="flex-1 space-y-2 text-center">
                  <Skeleton className="h-3 w-24 mx-auto" />
                  <Skeleton className="h-8 w-32 mx-auto" />
                </div>
                {index < 2 && <div className="hidden md:block w-px h-10 bg-border" />}
              </Fragment>
            ))}
          </div>
        </div>

        <FilterBarSkeleton pillCount={5} pillWidth="w-16" trailingWidths={["w-14", "w-14", "w-14", "w-14"]} />
        <TableSectionSkeleton rows={8} columns={10} paginationLabelWidth="w-56" />
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales History</h1>
          <p className="page-subtitle">All completed transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary btn-sm" onClick={() => downloadCsv('sales-history.csv', exportRows)}><Export size={14} /> Export CSV</button>
          <Link to="/pos" className="btn-primary btn-sm">+ New Sale</Link>
        </div>
      </div>

      {isError && (
        <QueryErrorNotice
          title="Unable to load sales history"
          message={error instanceof Error ? error.message : 'Failed to fetch sales history from backend.'}
          onRetry={() => refetch()}
        />
      )}

      {/* Summary strip */}
      <div className="card px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          {[
            { label: 'Period Revenue', value: formatCurrency(totalRevenue) },
            { label: 'Transactions', value: filtered.length.toString() },
            { label: 'Avg. Order Value', value: formatCurrency(filtered.length ? totalRevenue / filtered.length : 0) },
          ].map((s, i) => (
            <Fragment key={s.label}>
              <div className="flex-1 text-center">
                <p className="text-xs text-text-secondary font-medium uppercase tracking-wide mb-1">{s.label}</p>
                <p className="text-2xl font-heading font-bold text-text-primary">{s.value}</p>
              </div>
              {i < 2 && <div className="hidden md:block w-px h-10 bg-border" />}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="search-shell flex-1">
          <MagnifyingGlass size={16} className="search-shell-icon" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice number or customer name" className="search-input" />
        </div>
        {/* Status tabs */}
        <div className="filter-pills">
          {STATUS_TABS.map(t => (
            <button key={t} onClick={() => setStatusFilter(t)}
              className={`filter-pill-btn ${statusFilter === t ? 'active' : ''}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="filter-pills">
          {PAYMENT_TABS.map(l => (
            <button
              key={l}
              onClick={() => setPaymentFilter(l)}
              className={`filter-pill-btn ${paymentFilter === l ? 'active' : ''}`}
            >
              {l}
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
                <th>Invoice</th>
                <th>Customer</th>
                <th>Date & Time</th>
                <th>Subtotal</th>
                <th>Discount</th>
                <th>Tax</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isError && (
                <tr>
                  <td colSpan={10} className="text-center text-sm text-danger py-8">Failed to load sales from backend.</td>
                </tr>
              )}
              {paginated.map(sale => (
                <tr key={sale.id}>
                  <td>
                    <span className="font-mono text-xs font-medium text-text-primary">{sale.invoiceNo}</span>
                  </td>
                  <td className="text-sm">{sale.customerName || '—'}</td>
                  <td className="text-xs text-text-secondary whitespace-nowrap">{formatDateTime(sale.soldAt)}</td>
                  <td className="text-sm">{formatCurrency(sale.subtotal)}</td>
                  <td className="text-sm text-danger">{sale.totalDiscount > 0 ? `−${formatCurrency(sale.totalDiscount)}` : '—'}</td>
                  <td className="text-sm">{formatCurrency(sale.totalTax)}</td>
                  <td className="font-medium">{formatCurrency(sale.grandTotal)}</td>
                  <td className="capitalize text-sm text-text-secondary">{sale.paymentMethod}</td>
                  <td><span className={getPaymentStatusChip(sale.paymentStatus)}>{sale.paymentStatus}</span></td>
                  <td>
                    <Link to={`/sales/${sale.id}`} className="text-xs text-text-secondary hover:text-primary flex items-center gap-1">
                      View <ArrowRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-sm text-text-secondary">Showing <strong>{filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)}</strong> of <strong>{filtered.length}</strong> transactions</p>
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
