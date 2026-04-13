import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchInventoryMovements, fetchProducts } from '../services/api'
import { PageHeaderSkeleton, Skeleton, TableSectionSkeleton } from '../components/common/Skeleton'
import { formatDateTime } from '../utils'

export default function InventoryMovementsPage() {
  const [productId, setProductId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  const productsQuery = useQuery({
    queryKey: ['movement-products'],
    queryFn: fetchProducts
  })

  const movementsQuery = useQuery({
    queryKey: ['inventory-movements', page, productId, from, to],
    queryFn: () => fetchInventoryMovements({
      page,
      limit: PAGE_SIZE,
      productId: productId || undefined,
      from: from || undefined,
      to: to || undefined,
    })
  })

  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data])
  const movementPayload = movementsQuery.data

  const movements = movementPayload?.data ?? []
  const total = movementPayload?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const productNameById = useMemo(() => {
    const map = new Map<string, string>()
    products.forEach((p) => map.set(p.id, p.name))
    return map
  }, [products])

  if (productsQuery.isLoading || movementsQuery.isLoading) {
    return (
      <div className="space-y-5 max-w-[1300px]">
        <PageHeaderSkeleton titleWidth="w-60" subtitleWidth="w-72" actionWidths={[]} />

        <div className="card p-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <div className="flex items-end">
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
        </div>
        <TableSectionSkeleton rows={8} columns={8} paginationLabelWidth="w-52" />
      </div>
    )
  }

  if (productsQuery.isError) {
    const message = productsQuery.error instanceof Error
      ? productsQuery.error.message
      : 'Failed to load products for movement filters.'

    return (
      <div className="space-y-5 max-w-[1300px]">
        <div className="card p-6">
          <p className="text-sm font-semibold text-danger mb-1">Unable to load inventory movement filters</p>
          <p className="text-sm text-text-secondary mb-4">{message}</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary btn-sm" onClick={() => productsQuery.refetch()}>Retry</button>
            <button className="btn-secondary btn-sm" onClick={() => window.location.replace('/login')}>Re-login</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-[1300px]">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Movements</h1>
          <p className="page-subtitle">Full stock movement trail for auditing</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div>
            <label className="label">Product</label>
            <select
              className="input select-input"
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value)
                setPage(1)
              }}
            >
              <option value="">All products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">From</label>
            <input type="date" className="input" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" className="input" value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} />
          </div>
          <div className="flex items-end">
            <button
              className="btn-secondary btn-sm"
              onClick={() => {
                setProductId('')
                setFrom('')
                setTo('')
                setPage(1)
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="table-wrapper">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Type</th>
                <th>Direction</th>
                <th>Qty</th>
                <th>Before</th>
                <th>After</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {movementsQuery.isError && (
                <tr>
                  <td colSpan={8} className="text-center text-sm text-danger py-8">Failed to load movement history.</td>
                </tr>
              )}
              {movements.map((movement) => (
                <tr key={movement.id}>
                  <td className="text-xs text-text-secondary whitespace-nowrap">{formatDateTime(movement.createdAt)}</td>
                  <td className="text-sm">{productNameById.get(movement.productId) ?? movement.productId}</td>
                  <td><span className="chip-neutral">{movement.type}</span></td>
                  <td>
                    <span className={movement.direction === 'IN' ? 'chip-success' : 'chip-warning'}>
                      {movement.direction}
                    </span>
                  </td>
                  <td className="text-sm font-medium">{movement.quantity}</td>
                  <td className="text-sm">{movement.quantityBefore}</td>
                  <td className="text-sm">{movement.quantityAfter}</td>
                  <td className="text-xs text-text-secondary font-mono">{movement.referenceNo || '—'}</td>
                </tr>
              ))}
              {!movementsQuery.isError && movements.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-sm text-text-secondary py-8">No movements found for selected filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-sm text-text-secondary">Showing <strong>{movements.length}</strong> of <strong>{total}</strong> records</p>
          <div className="flex items-center gap-1">
            <button className="btn-secondary btn-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
            <button className="btn-primary btn-sm px-3" disabled>{page}</button>
            <button className="btn-secondary btn-sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
