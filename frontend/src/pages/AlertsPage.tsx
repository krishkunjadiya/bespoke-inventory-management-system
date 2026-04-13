import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Warning, Package, Fire } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { fetchLowStockProducts } from '../services/api'
import { Skeleton } from '../components/common/Skeleton'
import QueryErrorNotice from '../components/common/QueryErrorNotice'
import { timeAgo } from '../utils'
import type { Alert } from '../types'

const BASE_TABS = ['All', 'Critical', 'Low Stock']

function AlertRow({
  alert,
  onDismiss,
  onMarkReviewed,
  onRemoveStock
}: {
  alert: Alert
  onDismiss: (id: string) => void
  onMarkReviewed: (id: string) => void
  onRemoveStock: (id: string) => void
}) {
  const isCritical = alert.severity === 'critical'
  const isExpired = alert.type === 'expired' || alert.type === 'expiring'

  return (
    <div className={`flex items-start gap-4 p-4 rounded-card border-l-4 bg-surface ${
      isCritical ? 'border-l-danger' : isExpired ? 'border-l-warning' : 'border-l-warning'
    }`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
        isCritical ? 'bg-danger-bg text-danger' : 'bg-warning-bg text-warning'
      }`}>
        {alert.type === 'out_of_stock' ? <Package size={18} weight="fill" /> :
         alert.type === 'expired' || alert.type === 'expiring' ? <Fire size={18} weight="fill" /> :
         <Warning size={18} weight="fill" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={`chip text-[11px] font-bold ${isCritical ? 'chip-danger' : 'chip-warning'}`}>
            {alert.type === 'out_of_stock' ? 'OUT OF STOCK' :
             alert.type === 'low_stock' ? 'LOW STOCK' :
             alert.type === 'expired' ? 'EXPIRED' : 'EXPIRING SOON'}
          </span>
          <span className="text-xs text-text-muted">{timeAgo(alert.createdAt)}</span>
        </div>
        <p className="font-semibold text-text-primary text-sm">{alert.productName}</p>
        <p className="font-mono text-xs text-text-muted mb-1">{alert.sku}</p>
        <div className="flex items-center gap-4 text-xs text-text-secondary">
          {alert.type !== 'expired' && alert.type !== 'expiring' && (
            <>
              <span>Current: <strong className="text-text-primary">{alert.currentStock}</strong></span>
              <span>Reorder Level: <strong className="text-text-primary">{alert.reorderLevel}</strong></span>
            </>
          )}
          {alert.supplierName && <span>Supplier: {alert.supplierName}</span>}
          {alert.expiryDate && <span>Expiry: <strong className="text-danger">{alert.expiryDate}</strong></span>}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {(alert.type === 'out_of_stock' || alert.type === 'low_stock') && (
          <>
            <Link to="/purchases/orders/new" className="btn-primary btn-sm">
              {alert.type === 'out_of_stock' ? 'Create PO' : 'Reorder'}
            </Link>
            <button className="btn-secondary btn-sm" onClick={() => onDismiss(alert.id)}>Dismiss</button>
          </>
        )}
        {alert.type === 'expiring' && (
          <button className="btn-secondary btn-sm" onClick={() => onMarkReviewed(alert.id)}>Mark Reviewed</button>
        )}
        {alert.type === 'expired' && (
          <button className="btn-danger btn-sm" onClick={() => onRemoveStock(alert.id)}>Remove Stock</button>
        )}
      </div>
    </div>
  )
}

export default function AlertsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('All')
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['alerts-low-stock'],
    queryFn: fetchLowStockProducts
  })

  const openAlerts: Alert[] = (data ?? []).map((product) => ({
    id: `low-stock-${product.id}`,
    type: product.currentStock === 0 ? 'out_of_stock' : 'low_stock',
    severity: product.currentStock === 0 ? 'critical' : 'warning',
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    currentStock: product.currentStock,
    reorderLevel: product.reorderLevel,
    status: 'open',
    createdAt: product.updatedAt
  }))

  const visibleAlerts = openAlerts.filter((a) => !dismissedIds.includes(a.id))

  const critical = visibleAlerts.filter(a => a.severity === 'critical')
  const lowStock = visibleAlerts.filter(a => a.type === 'low_stock' && a.severity === 'warning')
  const expiry = visibleAlerts.filter(a => a.type === 'expiring' || a.type === 'expired')

  const tabs = expiry.length > 0 ? [...BASE_TABS, 'Expired'] : BASE_TABS

  const filtered = activeTab === 'All' ? visibleAlerts
    : activeTab === 'Critical' ? critical
    : activeTab === 'Low Stock' ? lowStock
    : activeTab === 'Expired' ? expiry
    : openAlerts

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-4xl">
        <div className="page-header">
          <div>
            <h1 className="page-title">Alerts Center</h1>
            <p className="page-subtitle">Loading active alerts...</p>
          </div>
          <button className="btn-secondary btn-sm" disabled>Configure Alerts</button>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`alert-skeleton-${index}`} className="card p-4 flex items-start gap-4">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-4 w-56 max-w-full" />
                <Skeleton className="h-3 w-40 max-w-full" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Alerts Center</h1>
          <p className="page-subtitle">{visibleAlerts.length} active alerts requiring attention</p>
        </div>
        <button className="btn-secondary btn-sm" onClick={() => navigate('/settings')}>Configure Alerts</button>
      </div>

      {isError && (
        <QueryErrorNotice
          title="Unable to load alerts"
          message={error instanceof Error ? error.message : 'Failed to fetch alerts from backend.'}
          onRetry={() => refetch()}
        />
      )}

      {/* Tabs */}
      <div className="filter-pills w-fit">
        {tabs.map(tab => {
          const count = tab === 'All' ? visibleAlerts.length
            : tab === 'Critical' ? critical.length
            : tab === 'Low Stock' ? lowStock.length
            : expiry.length
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`filter-pill-btn text-sm flex items-center gap-1.5 ${activeTab === tab ? 'active' : ''}`}>
              {tab}
              {count > 0 && (
                <span className={`text-[10px] font-bold rounded-pill px-1.5 py-0.5 ${activeTab === tab ? 'bg-white/20' : 'bg-surface-muted'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Alert groups */}
      {(activeTab === 'All' || activeTab === 'Critical') && critical.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-danger uppercase tracking-wider flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-danger" />Critical</h3>
          {critical.map(a => <AlertRow key={a.id} alert={a} onDismiss={(id) => setDismissedIds((p) => [...p, id])} onMarkReviewed={(id) => setDismissedIds((p) => [...p, id])} onRemoveStock={(id) => setDismissedIds((p) => [...p, id])} />)}
        </div>
      )}

      {(activeTab === 'All' || activeTab === 'Low Stock') && lowStock.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-warning uppercase tracking-wider flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-warning" />Low Stock</h3>
          {lowStock.map(a => <AlertRow key={a.id} alert={a} onDismiss={(id) => setDismissedIds((p) => [...p, id])} onMarkReviewed={(id) => setDismissedIds((p) => [...p, id])} onRemoveStock={(id) => setDismissedIds((p) => [...p, id])} />)}
        </div>
      )}

      {(activeTab === 'All' || activeTab === 'Expired') && expiry.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-warning uppercase tracking-wider flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-warning" />Expiring / Expired</h3>
          {expiry.map(a => <AlertRow key={a.id} alert={a} onDismiss={(id) => setDismissedIds((p) => [...p, id])} onMarkReviewed={(id) => setDismissedIds((p) => [...p, id])} onRemoveStock={(id) => setDismissedIds((p) => [...p, id])} />)}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="card p-12 text-center text-text-muted">
          <Warning size={34} className="mx-auto mb-3 text-text-muted" />
          <p className="font-medium text-text-primary">
            {isError ? 'Could not load alerts' : 'All clear!'}
          </p>
          <p className="text-sm mt-1">
            {isError ? 'Please retry after backend check' : 'No alerts in this category'}
          </p>
        </div>
      )}
    </div>
  )
}
