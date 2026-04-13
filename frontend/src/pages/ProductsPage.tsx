import { useState, useMemo, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MagnifyingGlass, Plus, DotsThreeVertical, Export, PencilSimple, CaretDown } from '@phosphor-icons/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteProductById, fetchProducts } from '../services/api'
import { FilterBarSkeleton, PageHeaderSkeleton, TableSectionSkeleton } from '../components/common/Skeleton'
import QueryErrorNotice from '../components/common/QueryErrorNotice'
import { downloadCsv, formatCurrency, getStockStatus, getStockChipClass, getStockLabel } from '../utils'

const STOCK_FILTERS = ['All', 'In Stock', 'Low Stock', 'Out of Stock']
const PAGE_SIZE = 10

export default function ProductsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [stockFilter, setStockFilter] = useState('All')
  const [selected, setSelected] = useState<string[]>([])
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false)
  const [page, setPage] = useState(1)
  const categoryMenuRef = useRef<HTMLDivElement>(null)

  const reloadProducts = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['products'] }),
      queryClient.invalidateQueries({ queryKey: ['pos-products'] }),
      queryClient.invalidateQueries({ queryKey: ['sidebar-low-stock'] }),
      queryClient.invalidateQueries({ queryKey: ['topbar-low-stock'] }),
      queryClient.invalidateQueries({ queryKey: ['low-stock'] }),
    ])
  }

  const archiveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => deleteProductById(id)))
    },
    onSuccess: async () => {
      setSelected([])
      await reloadProducts()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => deleteProductById(id)))
    },
    onSuccess: async () => {
      setSelected([])
      await reloadProducts()
    }
  })

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  })

  const products = useMemo(() => data ?? [], [data])

  useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setCategoryMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [])

  const categoryOptions = useMemo(() => {
    const unique = new Set(products.map(l => l.categoryName).filter(Boolean))
    return ['All', ...Array.from(unique)]
  }, [products])

  const filtered = useMemo(() => {
    return products.filter(l => {
      const matchSearch = search === '' ||
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.sku.toLowerCase().includes(search.toLowerCase())
      const matchCategory = categoryFilter === 'All' || l.categoryName === categoryFilter
      const status = getStockStatus(l.currentStock, l.reorderLevel)
      const matchStock = stockFilter === 'All' ||
        (stockFilter === 'In Stock' && status === 'in_stock') ||
        (stockFilter === 'Low Stock' && status === 'low_stock') ||
        (stockFilter === 'Out of Stock' && status === 'out_of_stock')
      return matchSearch && matchCategory && matchStock
    })
  }, [products, search, categoryFilter, stockFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  useEffect(() => {
    setPage(1)
  }, [search, categoryFilter, stockFilter])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const toggleSelect = (id: string) => setSelected(l => l.includes(id) ? l.filter(x => x !== id) : [...l, id])
  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(l => l.id))

  const exportRows = filtered.map((l) => ({
    name: l.name,
    sku: l.sku,
    category: l.categoryName,
    costPrice: l.costPrice,
    sellingPrice: l.sellingPrice,
    stock: l.currentStock,
    reorderLevel: l.reorderLevel,
    status: l.status
  }))

  const selectedIds = selected.length > 0 ? selected : filtered.map((l) => l.id)

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-[1400px]">
        <PageHeaderSkeleton titleWidth="w-40" subtitleWidth="w-72" actionWidths={["w-24", "w-32"]} />
        <FilterBarSkeleton pillCount={4} trailingWidths={["w-full sm:w-44"]} />
        <TableSectionSkeleton rows={8} columns={9} paginationLabelWidth="w-52" />
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your inventory catalog ({products.length} items)</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary btn-sm" onClick={() => downloadCsv('products.csv', exportRows)}>
            <Export size={14} /> Export
          </button>
          <Link to="/inventory/products/new" className="btn-primary btn-sm">
            <Plus size={14} /> Add Product
          </Link>
        </div>
      </div>

      {isError && (
        <QueryErrorNotice
          title="Unable to load products"
          message={error instanceof Error ? error.message : 'Failed to fetch products from backend.'}
          onRetry={() => refetch()}
        />
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="search-shell flex-1">
            <MagnifyingGlass size={16} className="search-shell-icon" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search product name, SKU, or barcode"
              className="search-input"
            />
          </div>
          {/* Category */}
          <div className="relative w-full sm:w-auto" ref={categoryMenuRef}>
            <button
              type="button"
              onClick={() => setCategoryMenuOpen(o => !o)}
              className="select-shell"
              aria-haspopup="listbox"
              aria-expanded={categoryMenuOpen}
              data-open={categoryMenuOpen ? 'true' : 'false'}
            >
              <span className="truncate">{categoryFilter}</span>
              <CaretDown size={14} className="select-shell-icon" />
            </button>

            {categoryMenuOpen && (
              <div className="absolute top-[calc(100%+6px)] left-0 z-20 w-full bg-surface border border-border rounded-card shadow-md p-1 max-h-64 overflow-y-auto">
                {categoryOptions.map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setCategoryFilter(option)
                      setCategoryMenuOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      categoryFilter === option
                        ? 'bg-primary text-white'
                        : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                    }`}
                    role="option"
                    aria-selected={categoryFilter === option}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Stock status */}
          <div className="filter-pills">
            {STOCK_FILTERS.map(f => (
              <button key={f} onClick={() => setStockFilter(f)}
                className={`filter-pill-btn ${stockFilter === f ? 'active' : ''}`}>
                {f}
              </button>
            ))}
          </div>
          {(search || categoryFilter !== 'All' || stockFilter !== 'All') && (
            <button onClick={() => { setSearch(''); setCategoryFilter('All'); setStockFilter('All') }}
              className="text-xs text-text-secondary hover:text-danger underline whitespace-nowrap">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-surface-muted border border-border rounded-card text-sm">
          <span className="font-semibold text-text-primary">{selected.length} item{selected.length > 1 ? 's' : ''} selected</span>
          <div className="flex items-center gap-2 ml-4">
            <button
              className="text-text-secondary hover:text-text-primary"
              onClick={() => archiveMutation.mutate(selectedIds)}
              disabled={archiveMutation.isPending || deleteMutation.isPending}
            >
              {archiveMutation.isPending ? 'Archiving…' : 'Archive'}
            </button>
            <span className="text-text-muted">|</span>
            <button className="text-text-secondary hover:text-text-primary" onClick={() => navigate('/inventory/adjustments')}>Adjust Stock</button>
            <span className="text-text-muted">|</span>
            <button
              className="text-danger hover:opacity-80"
              onClick={() => deleteMutation.mutate(selectedIds)}
              disabled={archiveMutation.isPending || deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
          <button onClick={() => setSelected([])} className="ml-auto text-text-muted hover:text-text-primary">✕</button>
        </div>
      )}

      {/* Table */}
      <div className="table-wrapper">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="w-10">
                  <input type="checkbox"
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="rounded border-border"
                  />
                </th>
                <th>Product</th>
                <th>Category</th>
                <th>Cost</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Reorder</th>
                <th>Status</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {isError && (
                <tr>
                  <td colSpan={9} className="text-center text-sm text-danger py-8">Failed to load products from backend.</td>
                </tr>
              )}
              {paginated.map(l => {
                const stockStatus = getStockStatus(l.currentStock, l.reorderLevel)
                return (
                  <tr key={l.id}>
                    <td>
                      <input type="checkbox" checked={selected.includes(l.id)}
                        onChange={() => toggleSelect(l.id)} className="rounded border-border" />
                    </td>
                    <td>
                      <div>
                        <Link to={`/inventory/products/${l.id}`} className="font-medium text-text-primary hover:underline text-sm">
                          {l.name}
                        </Link>
                        <p className="font-mono text-[11px] text-text-muted">{l.sku}</p>
                      </div>
                    </td>
                    <td><span className="pill-neutral">{l.categoryName}</span></td>
                    <td className="text-sm">{formatCurrency(l.costPrice)}</td>
                    <td className="text-sm font-medium">{formatCurrency(l.sellingPrice)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{l.currentStock}</span>
                        <span className={getStockChipClass(stockStatus)}>{getStockLabel(stockStatus)}</span>
                      </div>
                    </td>
                    <td className="text-sm text-text-secondary">{l.reorderLevel}</td>
                    <td>
                      <span className={l.status === 'active' ? 'pill-success' : 'pill-neutral'}>
                        {l.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Link to={`/inventory/products/${l.id}/edit`} className="btn-ghost p-1.5 rounded">
                          <PencilSimple size={14} />
                        </Link>
                        <button className="btn-ghost p-1.5 rounded text-text-muted" onClick={() => toggleSelect(l.id)}>
                          <DotsThreeVertical size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-sm text-text-secondary">
            Showing <strong>{filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)}</strong> of <strong>{filtered.length}</strong> products
          </p>
          <div className="flex items-center gap-1">
            <button className="btn-secondary btn-sm" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>← Prev</button>
            <button className="btn-primary btn-sm px-3" disabled>{page}</button>
            <button className="btn-secondary btn-sm" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
