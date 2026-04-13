import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, adjustInventoryStock, fetchProducts } from '../services/api'
import { PageHeaderSkeleton, Skeleton } from '../components/common/Skeleton'

const REASONS = [
  { value: 'audit_correction', label: 'Audit Correction' },
  { value: 'damage', label: 'Damage' },
  { value: 'lost', label: 'Lost / Shrinkage' },
  { value: 'manual_update', label: 'Manual Update' },
] as const

export default function StockAdjustmentsPage() {
  const queryClient = useQueryClient()
  const [productId, setProductId] = useState('')
  const [direction, setDirection] = useState<'IN' | 'OUT'>('IN')
  const [quantity, setQuantity] = useState('1')
  const [reason, setReason] = useState<(typeof REASONS)[number]['value']>('audit_correction')
  const [note, setNote] = useState('')
  const [feedback, setFeedback] = useState('')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['adjustments-products'],
    queryFn: fetchProducts
  })

  const products = useMemo(() => data ?? [], [data])

  const selectedProduct = useMemo(() => products.find((l) => l.id === productId), [products, productId])

  const mutation = useMutation({
    mutationFn: async () => {
      await adjustInventoryStock({
        productId,
        direction,
        quantity: Number(quantity),
        reason,
        note: note.trim() || undefined
      })
    },
    onSuccess: async () => {
      setFeedback('Stock adjustment recorded successfully.')
      setQuantity('1')
      setNote('')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['adjustments-products'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory-movements'] }),
        queryClient.invalidateQueries({ queryKey: ['low-stock'] }),
        queryClient.invalidateQueries({ queryKey: ['pos-products'] }),
      ])
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setFeedback(err.message)
        return
      }
      setFeedback('Failed to save adjustment')
    }
  })

  const canSubmit = Boolean(productId) && Number(quantity) > 0

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-[900px]">
        <PageHeaderSkeleton titleWidth="w-52" subtitleWidth="w-80" actionWidths={[]} />

        <div className="card p-6 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="card p-4 bg-surface-muted space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-4 w-60 max-w-full" />
            <Skeleton className="h-3 w-44" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
    )
  }

  if (isError) {
    const message = error instanceof Error ? error.message : 'Failed to load products for stock adjustments.'
    return (
      <div className="space-y-5 max-w-[900px]">
        <div className="card p-6">
          <p className="text-sm font-semibold text-danger mb-1">Unable to load stock adjustment data</p>
          <p className="text-sm text-text-secondary mb-4">{message}</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary btn-sm" onClick={() => refetch()}>Retry</button>
            <button className="btn-secondary btn-sm" onClick={() => window.location.replace('/login')}>Re-login</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-[900px]">
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Adjustments</h1>
          <p className="page-subtitle">Apply controlled stock corrections with audit reasons</p>
        </div>
      </div>

      <div className="card p-6 space-y-5">
        {feedback && (
          <div className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-text-primary">
            {feedback}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="label">Product</label>
            <select className="input select-input" value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">Select a product</option>
              {products.map((l) => (
                <option key={l.id} value={l.id}>{l.name} ({l.sku})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Direction</label>
            <div className="filter-pills">
              <button className={`filter-pill-btn ${direction === 'IN' ? 'active' : ''}`} onClick={() => setDirection('IN')}>Stock In</button>
              <button className={`filter-pill-btn ${direction === 'OUT' ? 'active' : ''}`} onClick={() => setDirection('OUT')}>Stock Out</button>
            </div>
          </div>

          <div>
            <label className="label">Quantity</label>
            <input type="number" min={1} className="input" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>

          <div>
            <label className="label">Reason</label>
            <select className="input select-input" value={reason} onChange={(e) => setReason(e.target.value as (typeof REASONS)[number]['value'])}>
              {REASONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Note</label>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add adjustment note (optional)" />
        </div>

        {selectedProduct ? (
          <div className="card p-4 bg-surface-muted">
            <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Selected Product</p>
            <p className="text-sm font-medium text-text-primary">{selectedProduct.name} ({selectedProduct.sku})</p>
            <p className="text-xs text-text-muted mt-1">Current Stock: {selectedProduct.currentStock} {selectedProduct.unit}</p>
          </div>
        ) : null}

        <button className="btn-primary btn-md" disabled={!canSubmit || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? 'Saving...' : 'Save Adjustment'}
        </button>
      </div>
    </div>
  )
}
