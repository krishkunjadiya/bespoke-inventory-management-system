import { useMemo, useState } from 'react'
import { Export, ChartBar } from '@phosphor-icons/react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { fetchDashboardStats, fetchProducts, fetchSales } from '../services/api'
import { Skeleton } from '../components/common/Skeleton'
import { downloadCsv, formatCurrency } from '../utils'

const TABS = ['Sales', 'Inventory', 'Profit & Margin']
const RANGES = ['Daily', 'Weekly', 'Monthly']

function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('Sales')
  const [range, setRange] = useState('Daily')
  const [dateFrom, setDateFrom] = useState(() => {
    const now = new Date()
    const from = new Date(now)
    from.setDate(now.getDate() - 30)
    return toDateInputValue(from)
  })
  const [dateTo, setDateTo] = useState(() => toDateInputValue(new Date()))

  const salesQuery = useQuery({
    queryKey: ['reports-sales'],
    queryFn: () => fetchSales(200)
  })

  const productsQuery = useQuery({
    queryKey: ['reports-products'],
    queryFn: fetchProducts
  })

  const dashboardStatsQuery = useQuery({
    queryKey: ['reports-dashboard-stats'],
    queryFn: fetchDashboardStats
  })

  const isReportsLoading = salesQuery.isLoading || productsQuery.isLoading || dashboardStatsQuery.isLoading
  const hasReportsError = salesQuery.isError || productsQuery.isError || dashboardStatsQuery.isError

  const sales = useMemo(() => salesQuery.data ?? [], [salesQuery.data])
  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data])

  const filteredSales = useMemo(() => {
    const from = new Date(`${dateFrom}T00:00:00`)
    const to = new Date(`${dateTo}T23:59:59.999`)

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
      return sales
    }

    return sales.filter((sale) => {
      const soldAt = new Date(sale.soldAt)
      return soldAt >= from && soldAt <= to
    })
  }, [sales, dateFrom, dateTo])

  const salesChartData = useMemo(() => {
    const buckets = new Map<string, { date: Date; revenue: number; orders: number }>()

    const startOfWeek = (d: Date) => {
      const date = new Date(d)
      const day = date.getDay() || 7
      if (day !== 1) date.setDate(date.getDate() - (day - 1))
      date.setHours(0, 0, 0, 0)
      return date
    }

    filteredSales.forEach((sale) => {
      const soldAt = new Date(sale.soldAt)
      let key = ''
      let bucketDate = new Date(soldAt)

      if (range === 'Weekly') {
        bucketDate = startOfWeek(soldAt)
        key = bucketDate.toISOString().slice(0, 10)
      } else if (range === 'Monthly') {
        bucketDate = new Date(soldAt.getFullYear(), soldAt.getMonth(), 1)
        key = `${bucketDate.getFullYear()}-${String(bucketDate.getMonth() + 1).padStart(2, '0')}`
      } else {
        bucketDate = new Date(soldAt.getFullYear(), soldAt.getMonth(), soldAt.getDate())
        key = bucketDate.toISOString().slice(0, 10)
      }

      const existing = buckets.get(key)
      if (!existing) {
        buckets.set(key, { date: bucketDate, revenue: sale.grandTotal, orders: 1 })
      } else {
        existing.revenue += sale.grandTotal
        existing.orders += 1
      }
    })

    const sorted = Array.from(buckets.values()).sort((a, b) => a.date.getTime() - b.date.getTime())

    return sorted.slice(-12).map((bucket) => ({
      date: range === 'Monthly'
        ? bucket.date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
        : bucket.date.toLocaleDateString('en-IN', { month: 'short', day: '2-digit' }),
      revenue: bucket.revenue,
      orders: bucket.orders,
    }))
  }, [filteredSales, range])

  const paymentBuckets = filteredSales.reduce<Record<string, number>>((acc, sale) => {
    const key = sale.paymentMethod.toUpperCase()
    acc[key] = (acc[key] ?? 0) + sale.grandTotal
    return acc
  }, {})

  const categoryChartData = Object.entries(paymentBuckets).map(([name, value]) => ({
    name,
    value
  }))

  const totalRevenue = filteredSales.reduce((s, sale) => s + sale.grandTotal, 0)
  const avgOrder = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0

  const exportRows = filteredSales.map((sale) => ({
    invoiceNo: sale.invoiceNo,
    soldAt: sale.soldAt,
    customer: sale.customerName || '',
    grandTotal: sale.grandTotal,
    paymentMethod: sale.paymentMethod,
    paymentStatus: sale.paymentStatus,
    profit: sale.profit
  }))

  const topProducts = [...products]
    .sort((a, b) => b.sellingPrice * b.currentStock - a.sellingPrice * a.currentStock)
    .slice(0, 5)
    .map((product, index) => ({
      rank: index + 1,
      name: product.name,
      revenue: product.sellingPrice * product.currentStock,
      units: product.currentStock
    }))

  if (isReportsLoading) {
    return (
      <div className="space-y-5 max-w-[1400px]">
        <div className="card p-5 space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`reports-kpi-skeleton-${index}`} className="card p-5 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-28" />
            </div>
          ))}
        </div>
        <div className="card p-5 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (hasReportsError) {
    return (
      <div className="space-y-5 max-w-[1400px]">
        <div className="card p-6">
          <p className="text-sm font-semibold text-danger mb-1">Unable to load reports</p>
          <p className="text-sm text-text-secondary mb-4">Please retry after confirming your session and backend status.</p>
          <div className="flex flex-wrap gap-2">
            <button
              className="btn-primary btn-sm"
              onClick={() => {
                salesQuery.refetch()
                productsQuery.refetch()
                dashboardStatsQuery.refetch()
              }}
            >
              Retry
            </button>
            <button className="btn-secondary btn-sm" onClick={() => window.location.replace('/login')}>Re-login</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Business analytics and insights</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date range */}
          <div className="flex items-center gap-2 text-sm">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input h-9 w-auto text-xs" />
            <span className="text-text-muted">to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input h-9 w-auto text-xs" />
          </div>
          <button className="btn-secondary btn-sm" onClick={() => downloadCsv('reports-sales.csv', exportRows)}><Export size={14} /> Export</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="filter-pills w-fit">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`filter-pill-btn text-sm ${activeTab === tab ? 'active' : ''}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Revenue', value: formatCurrency(totalRevenue), delta: dashboardStatsQuery.data?.monthlyRevenueDelta ?? 0 },
          { label: 'Transactions', value: filteredSales.length.toString(), delta: 0 },
          { label: 'Avg. Order Value', value: formatCurrency(avgOrder), delta: 2.5 },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <p className="text-xs text-text-secondary font-medium uppercase tracking-wide mb-1">{s.label}</p>
            <p className="text-2xl font-heading font-bold text-text-primary">{s.value}</p>
            <p className="text-xs text-success mt-1 font-medium">+{s.delta}% vs prev period</p>
          </div>
        ))}
      </div>

      {/* Main chart */}
      {activeTab === 'Sales' && (
        <>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-text-primary">Revenue Trend</h3>
              <div className="filter-pills">
                {RANGES.map(r => (
                  <button key={r} onClick={() => setRange(r)}
                    className={`filter-pill-btn ${range === r ? 'active' : ''}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={salesChartData}>
                <defs>
                  <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#111827" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} width={45} />
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Revenue']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }} />
                <Area type="monotone" dataKey="revenue" stroke="#111827" strokeWidth={2}
                  fill="url(#rg)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Category chart */}
            <div className="card p-5 lg:col-span-3">
              <h3 className="font-heading font-semibold text-text-primary mb-4">Sales by Payment Method</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }} />
                  <Bar dataKey="value" fill="#374151" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top products */}
            <div className="card p-5 lg:col-span-2">
              <h3 className="font-heading font-semibold text-text-primary mb-4">Top Selling Products</h3>
              <div className="space-y-3">
                {topProducts.map(p => (
                  <div key={p.rank} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold bg-surface-muted text-text-muted flex-shrink-0">{p.rank}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{p.name}</p>
                      <p className="text-xs text-text-muted">{p.units} units</p>
                    </div>
                    <span className="text-sm font-semibold text-text-primary">{formatCurrency(p.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab !== 'Sales' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card p-5 lg:col-span-2">
            <h3 className="font-heading font-semibold text-text-primary mb-4">{activeTab} Overview</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between"><span className="text-text-secondary">Active Products</span><span className="font-semibold">{products.length}</span></div>
              <div className="flex items-center justify-between"><span className="text-text-secondary">Low Stock Products</span><span className="font-semibold">{products.filter(p => p.currentStock <= p.reorderLevel).length}</span></div>
              <div className="flex items-center justify-between"><span className="text-text-secondary">Filtered Sales Count</span><span className="font-semibold">{filteredSales.length}</span></div>
              <div className="flex items-center justify-between"><span className="text-text-secondary">Filtered Revenue</span><span className="font-semibold">{formatCurrency(totalRevenue)}</span></div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-heading font-semibold text-text-primary mb-4">Quick Notes</h3>
            <div className="space-y-2 text-sm text-text-secondary">
              <p>Use date filters to inspect specific windows.</p>
              <p>Compare low stock count before and after purchases.</p>
              <p>Track average order value trend from Sales tab.</p>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 text-xs text-text-muted">
              <ChartBar size={14} /> Live values sourced from current API responses
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
