import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ApiError, createPurchaseOrder, fetchLowStockProducts } from '../services/api'
import { Skeleton, TableLoadingRows } from '../components/common/Skeleton'
import { formatCurrency } from '../utils'

export default function PurchaseOrderCreatePage() {
  const navigate = useNavigate()
  const [supplierName, setSupplierName] = useState('')
  const [expectedDelivery, setExpectedDelivery] = useState('')
  const [notes, setNotes] = useState('')
  const [selected, setSelected] = useState<Record<string, { qty: number; unitCost: number }>>({})
  const [message, setMessage] = useState('')

  const lowStockQuery = useQuery({
    queryKey: ['po-create-low-stock'],
    queryFn: fetchLowStockProducts
  })

  const lowStock = useMemo(() => lowStockQuery.data ?? [], [lowStockQuery.data])

  const rows = useMemo(() => {
    return lowStock.map((product) => {
      const suggestedQty = Math.max(product.reorderLevel - product.currentStock, 1)
      const current = selected[product.id]
      return {
        product,
        qty: current?.qty ?? suggestedQty,
        unitCost: current?.unitCost ?? product.costPrice,
        selected: Boolean(current)
      }
    })
  }, [lowStock, selected])

  const selectedRows = rows.filter((row) => row.selected)
  const total = selectedRows.reduce((sum, row) => sum + row.qty * row.unitCost, 0)

  const mutation = useMutation({
    mutationFn: async () => {
      await createPurchaseOrder({
        supplierName: supplierName.trim(),
        expectedDelivery,
        notes: notes.trim() || undefined,
        items: selectedRows.map((row) => ({
          productId: row.product.id,
          orderedQty: row.qty,
          unitCost: row.unitCost,
        }))
      })
    },
    onSuccess: () => {
      setMessage('Purchase order created successfully.')
      setTimeout(() => navigate('/purchases/orders'), 800)
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        if (err.status === 501) {
          setMessage('Backend purchase endpoint is not live yet. Your drafted PO data is valid and ready for backend activation.')
          return
        }
        setMessage(err.message)
        return
      }
      setMessage('Failed to create purchase order')
    }
  })

  const canSubmit = supplierName.trim().length > 1 && expectedDelivery && selectedRows.length > 0

  if (lowStockQuery.isLoading) {
    return (
      <div className="space-y-5 max-w-[1200px]">
        <div className="page-header">
          <div className="space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <tbody>
                <TableLoadingRows rows={6} columns={8} />
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-36" />
          </div>
          <Skeleton className="h-10 w-44" />
        </div>
      </div>
    )
  }

  if (lowStockQuery.isError) {
    const message = lowStockQuery.error instanceof Error
      ? lowStockQuery.error.message
      : 'Failed to load low stock suggestions.'

    return (
      <div className="space-y-5 max-w-[1200px]">
        <div className="card p-6">
          <p className="text-sm font-semibold text-danger mb-1">Unable to load purchase suggestions</p>
          <p className="text-sm text-text-secondary mb-4">{message}</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary btn-sm" onClick={() => lowStockQuery.refetch()}>Retry</button>
            <button className="btn-secondary btn-sm" onClick={() => window.location.replace('/login')}>Re-login</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-[1200px]">
      <div className="page-header">
        <div>
          <Link to="/purchases/orders" className="text-xs text-text-secondary hover:text-text-primary inline-flex items-center gap-1 mb-2">
            <ArrowLeft size={12} /> Back to Purchase Orders
          </Link>
          <h1 className="page-title">Create Purchase Order</h1>
          <p className="page-subtitle">Build a replenishment order from low-stock items</p>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        {message && (
          <div className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-text-primary">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <label className="label">Supplier Name</label>
            <input className="input" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Supplier name (e.g., Acme Distributors)" />
          </div>
          <div>
            <label className="label">Expected Delivery</label>
            <input type="date" className="input" value={expectedDelivery} onChange={(e) => setExpectedDelivery(e.target.value)} />
          </div>
          <div>
            <label className="label">Notes</label>
            <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Order notes (optional)" />
          </div>
        </div>
      </div>

      <div className="table-wrapper">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-heading font-semibold text-text-primary">Low Stock Suggestions</h3>
          <span className="text-xs text-text-secondary">{selectedRows.length} selected</span>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Select</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Current</th>
                <th>Reorder</th>
                <th>Order Qty</th>
                <th>Unit Cost</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.product.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={row.selected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelected((prev) => ({
                            ...prev,
                            [row.product.id]: { qty: row.qty, unitCost: row.unitCost }
                          }))
                        } else {
                          setSelected((prev) => {
                            const next = { ...prev }
                            delete next[row.product.id]
                            return next
                          })
                        }
                      }}
                    />
                  </td>
                  <td className="text-sm font-medium">{row.product.name}</td>
                  <td className="text-xs text-text-secondary font-mono">{row.product.sku}</td>
                  <td className="text-sm">{row.product.currentStock}</td>
                  <td className="text-sm">{row.product.reorderLevel}</td>
                  <td>
                    <input
                      type="number"
                      min={1}
                      className="input h-9"
                      value={row.qty}
                      onChange={(e) => {
                        const qty = Math.max(1, Number(e.target.value || 1))
                        setSelected((prev) => ({
                          ...prev,
                          [row.product.id]: { qty, unitCost: row.unitCost }
                        }))
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      className="input h-9"
                      value={row.unitCost}
                      onChange={(e) => {
                        const unitCost = Math.max(0, Number(e.target.value || 0))
                        setSelected((prev) => ({
                          ...prev,
                          [row.product.id]: { qty: row.qty, unitCost }
                        }))
                      }}
                    />
                  </td>
                  <td className="font-medium">{formatCurrency(row.qty * row.unitCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-text-secondary uppercase tracking-wide">Estimated Total</p>
          <p className="text-2xl font-heading font-bold text-text-primary">{formatCurrency(total)}</p>
        </div>
        <button className="btn-primary btn-md" disabled={!canSubmit || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? 'Submitting...' : 'Submit Purchase Order'}
        </button>
      </div>
    </div>
  )
}
