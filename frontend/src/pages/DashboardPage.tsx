import { Link } from 'react-router-dom'
import {
  TrendUp, TrendDown, ArrowRight, Warning,
  Package, CurrencyInr, X
} from '@phosphor-icons/react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchDashboardStats, fetchLowStockProducts, fetchSales } from '../services/api'
import { Skeleton, TableLoadingRows } from '../components/common/Skeleton'
import { formatCurrency, formatDateTime, getStockStatus, getStockChipClass, getStockLabel, getPaymentStatusChip, formatDelta } from '../utils'

const DATE_RANGES = ['Today', 'This Week', 'This Month']

function KPICard({ label, value, delta, note, to, icon, variant = 'default' }: {
  label: string; value: string; delta?: number; note?: string;
  to: string; icon: React.ReactNode; variant?: 'default' | 'danger'
}) {
  return (
    <Link to={to} className="kpi-card block">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${variant === 'danger' ? 'bg-danger-bg text-danger' : 'bg-surface-muted text-text-secondary'}`}>
          {icon}
        </div>
        {delta !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-medium ${delta >= 0 ? 'text-success' : 'text-danger'}`}>
            {delta >= 0 ? <TrendUp size={14} /> : <TrendDown size={14} />}
            {formatDelta(Math.abs(delta))}
          </span>
        )}
      </div>
      <p className="text-xs text-text-secondary font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-heading font-bold ${variant === 'danger' ? 'text-danger' : 'text-text-primary'}`}>{value}</p>
      {note && <p className="text-xs text-text-muted mt-1">{note}</p>}
    </Link>
  )
}

export default function DashboardPage() {
  const [range, setRange] = useState('This Month')
  const [dismissBanner, setDismissBanner] = useState(false)

  const statsQuery = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats
  })

  const lowStockQuery = useQuery({
    queryKey: ['low-stock'],
    queryFn: fetchLowStockProducts
  })

  const salesQuery = useQuery({
    queryKey: ['dashboard-sales'],
    queryFn: () => fetchSales(6)
  })

  const isDashboardLoading = statsQuery.isLoading || lowStockQuery.isLoading || salesQuery.isLoading
  const hasDashboardError = statsQuery.isError || lowStockQuery.isError || salesQuery.isError

  if (isDashboardLoading) {
    return (
      <div className="space-y-6 max-w-[1400px]">
        <div className="card p-5 space-y-3">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`dashboard-kpi-skeleton-${index}`} className="card p-5 space-y-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="card p-5 lg:col-span-3 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-52 w-full" />
          </div>
          <div className="card p-5 lg:col-span-2 space-y-3">
            <Skeleton className="h-4 w-24" />
            {Array.from({ length: 4 }).map((__, rowIndex) => (
              <div key={`dashboard-low-stock-skeleton-${rowIndex}`} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="table-wrapper">
          <div className="overflow-x-auto">
            <table className="table">
              <tbody>
                <TableLoadingRows rows={6} columns={6} />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  if (hasDashboardError) {
    return (
      <div className="space-y-5 max-w-[1400px]">
        <div className="card p-6">
          <p className="text-sm font-semibold text-danger mb-1">Unable to load dashboard data</p>
          <p className="text-sm text-text-secondary mb-4">Your session may have expired or the backend is temporarily unavailable.</p>
          <div className="flex flex-wrap gap-2">
            <button
              className="btn-primary btn-sm"
              onClick={() => {
                statsQuery.refetch()
                lowStockQuery.refetch()
                salesQuery.refetch()
              }}
            >
              Retry
            </button>
            <Link to="/login" className="btn-secondary btn-sm">Re-login</Link>
          </div>
        </div>
      </div>
    )
  }

  const s = statsQuery.data ?? {
    todaySales: 0,
    todaySalesDelta: 0,
    monthlyRevenue: 0,
    monthlyRevenueDelta: 0,
    grossProfit: 0,
    grossProfitDelta: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    pendingOrders: 0
  }

  const lowStockProducts = (lowStockQuery.data ?? []).slice(0, 5)
  const recentSales = salesQuery.data ?? []
  const hasTodaySales = s.todaySales > 0
  const primarySalesValue = hasTodaySales ? s.todaySales : s.monthlyRevenue
  const primarySalesLabel = hasTodaySales ? "Today's Sales" : 'Month-to-Date Sales'
  const primarySalesNote = hasTodaySales ? 'vs yesterday' : 'No sales logged today'
  const salesTrendData = recentSales
    .slice()
    .sort((a, b) => new Date(a.soldAt).getTime() - new Date(b.soldAt).getTime())
    .slice(-7)
    .map((sale) => ({
      date: new Date(sale.soldAt).toLocaleDateString('en-IN', { month: 'short', day: '2-digit' }),
      revenue: sale.grandTotal
    }))

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your business health at a glance</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Range pills */}
          <div className="filter-pills">
            {DATE_RANGES.map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`filter-pill-btn ${range === r ? 'active' : ''}`}
              >
                {r}
              </button>
            ))}
          </div>
          <Link to="/pos" className="btn-primary btn-sm">+ New Sale</Link>
          <Link to="/inventory/products/new" className="btn-secondary btn-sm hidden sm:flex">Add Product</Link>
        </div>
      </div>

      {/* Low stock banner */}
      {!dismissBanner && s.lowStockCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-warning-bg border border-warning-border rounded-card text-sm">
          <Warning size={18} className="text-warning flex-shrink-0" />
          <span className="text-warning font-medium flex-1">
            <strong>{s.lowStockCount}</strong> items are running low on stock.{' '}
            <Link to="/alerts" className="underline underline-offset-2">View all alerts</Link>
          </span>
          <button onClick={() => setDismissBanner(true)} className="text-warning/60 hover:text-warning">
            <X size={16} />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label={primarySalesLabel} value={formatCurrency(primarySalesValue)}
          delta={s.todaySalesDelta} note={primarySalesNote}
          to="/sales/history" icon={<CurrencyInr size={20} />}
        />
        <KPICard
          label="Monthly Revenue" value={formatCurrency(s.monthlyRevenue)}
          delta={s.monthlyRevenueDelta} note="vs last month"
          to="/reports" icon={<TrendUp size={20} />}
        />
        <KPICard
          label="Gross Profit" value={formatCurrency(s.grossProfit)}
          delta={s.grossProfitDelta} note="this month"
          to="/reports" icon={<TrendUp size={20} />}
        />
        <KPICard
          label="Low Stock Items" value={`${s.lowStockCount} items`}
          note={`${s.outOfStockCount} out of stock`}
          to="/alerts" icon={<Warning size={20} />} variant="danger"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Sales trend */}
        <div className="card p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-text-primary">Sales Trend</h3>
            <span className="text-xs text-text-secondary">Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={salesTrendData}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#111827" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} width={45} />
              <Tooltip
                formatter={(v) => [formatCurrency(Number(v)), 'Revenue']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#111827" strokeWidth={2}
                fill="url(#salesGradient)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Low stock panel */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-text-primary">Low Stock</h3>
            <Link to="/alerts" className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {lowStockProducts.map(p => {
              const status = getStockStatus(p.currentStock, p.reorderLevel)
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-surface-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package size={14} className="text-text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{p.name}</p>
                    <p className="text-xs text-text-muted">Stock: {p.currentStock} / RL: {p.reorderLevel}</p>
                  </div>
                  <span className={getStockChipClass(status)}>{getStockLabel(status)}</span>
                </div>
              )
            })}
          </div>
          <Link to="/purchases/orders/new" className="btn-secondary btn-sm w-full mt-4">
            Create Purchase Order
          </Link>
        </div>
      </div>

      {/* Recent sales */}
      <div className="table-wrapper">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-heading font-semibold text-text-primary">Recent Sales</h3>
          <Link to="/sales/history" className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map(sale => (
                <tr key={sale.id}>
                  <td>
                    <Link to={`/sales/${sale.id}`} className="font-mono text-xs font-medium text-text-primary hover:underline">
                      {sale.invoiceNo}
                    </Link>
                  </td>
                  <td className="text-sm">{sale.customerName || '—'}</td>
                  <td className="font-medium">{formatCurrency(sale.grandTotal)}</td>
                  <td className="capitalize text-sm text-text-secondary">{sale.paymentMethod}</td>
                  <td>
                    <span className={getPaymentStatusChip(sale.paymentStatus)}>
                      {sale.paymentStatus}
                    </span>
                  </td>
                  <td className="text-xs text-text-secondary">{formatDateTime(sale.soldAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
