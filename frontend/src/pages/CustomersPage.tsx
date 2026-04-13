import { useEffect, useMemo, useState } from 'react'
import { Plus, MagnifyingGlass, Export, EnvelopeSimple } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchSales } from '../services/api'
import { FilterBarSkeleton, PageHeaderSkeleton, TableSectionSkeleton } from '../components/common/Skeleton'
import QueryErrorNotice from '../components/common/QueryErrorNotice'
import { downloadCsv, formatCurrency, formatDate } from '../utils'
import type { Customer } from '../types'

export default function CustomersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Customers')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['customers-sales'],
    queryFn: () => fetchSales(400)
  })

  const customers = useMemo(() => {
    const sales = data ?? []
    const grouped = new Map<string, Customer>()

    sales.forEach((sale) => {
      const key = sale.customerId || sale.customerName || 'WALK_IN'
      const existing = grouped.get(key)
      if (!existing) {
        grouped.set(key, {
          id: key,
          name: sale.customerName || 'Walk-in Customer',
          totalOrders: 1,
          totalSpent: sale.grandTotal,
          lastPurchase: sale.soldAt,
          status: 'active'
        })
        return
      }

      existing.totalOrders += 1
      existing.totalSpent += sale.grandTotal
      if (!existing.lastPurchase || new Date(existing.lastPurchase) < new Date(sale.soldAt)) {
        existing.lastPurchase = sale.soldAt
      }
    })

    return Array.from(grouped.values())
  }, [data])

  const filtered = useMemo(() => customers.filter(c => {
    const matchSearch = search === '' ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? '').includes(search)
    const matchStatus = statusFilter === 'All Customers' || c.status === statusFilter.toLowerCase()
    return matchSearch && matchStatus
  }), [customers, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const statusTabs = useMemo(() => {
    const hasInactive = customers.some((c) => c.status === 'inactive')
    return hasInactive ? ['All Customers', 'Active', 'Inactive'] : ['All Customers', 'Active']
  }, [customers])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const exportRows = filtered.map((c) => ({
    name: c.name,
    phone: c.phone ?? '',
    email: c.email ?? '',
    totalOrders: c.totalOrders,
    totalSpent: c.totalSpent,
    lastPurchase: c.lastPurchase ? formatDate(c.lastPurchase) : '',
    status: c.status
  }))

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-[1400px]">
        <PageHeaderSkeleton titleWidth="w-44" subtitleWidth="w-72" actionWidths={["w-24", "w-32"]} />
        <FilterBarSkeleton pillCount={2} pillWidth="w-28" />
        <TableSectionSkeleton rows={8} columns={7} paginationLabelWidth="w-52" />
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage your customer database</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary btn-sm" onClick={() => downloadCsv('customers.csv', exportRows)}><Export size={14} /> Export</button>
          <button className="btn-primary btn-sm" onClick={() => navigate('/pos')}><Plus size={14} /> Add Customer</button>
        </div>
      </div>

      {isError && (
        <QueryErrorNotice
          title="Unable to load customers"
          message={error instanceof Error ? error.message : 'Failed to fetch customer data from backend.'}
          onRetry={() => refetch()}
        />
      )}

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="search-shell flex-1">
          <MagnifyingGlass size={16} className="search-shell-icon" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search customer name, phone, or email" className="search-input" />
        </div>
        <div className="filter-pills">
          {statusTabs.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`filter-pill-btn ${statusFilter === s ? 'active' : ''}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrapper">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Total Orders</th>
                <th>Total Spent</th>
                <th>Last Purchase</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isError && (
                <tr>
                  <td colSpan={7} className="text-center text-sm text-danger py-8">Failed to load customers.</td>
                </tr>
              )}
              {paginated.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-text-primary">{c.name}</p>
                        {c.email && <p className="text-xs text-text-muted flex items-center gap-1"><EnvelopeSimple size={10} />{c.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="text-sm text-text-secondary">{c.phone ?? '—'}</td>
                  <td className="text-sm font-medium">{c.totalOrders}</td>
                  <td className="font-medium">{formatCurrency(c.totalSpent)}</td>
                  <td className="text-xs text-text-secondary">{c.lastPurchase ? formatDate(c.lastPurchase) : '—'}</td>
                  <td><span className={c.status === 'active' ? 'pill-success' : 'pill-neutral'}>{c.status}</span></td>
                  <td>
                    <button className="text-xs text-text-secondary hover:text-primary underline underline-offset-2" onClick={() => setSearch(c.name)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && !isError && paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-sm text-text-secondary py-8">No customers found for selected filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-sm text-text-secondary">Showing <strong>{filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)}</strong> of <strong>{filtered.length}</strong> customers</p>
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
