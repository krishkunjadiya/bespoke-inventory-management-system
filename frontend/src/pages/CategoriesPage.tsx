import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchProducts } from '../services/api'
import { PageHeaderSkeleton, StatCardsSkeleton, TableSectionSkeleton } from '../components/common/Skeleton'
import QueryErrorNotice from '../components/common/QueryErrorNotice'
import { formatCurrency } from '../utils'

export default function CategoriesPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['categories-products'],
    queryFn: fetchProducts
  })

  const products = useMemo(() => data ?? [], [data])

  const categories = useMemo(() => {
    const grouped = new Map<string, { name: string; count: number; stockUnits: number; stockValue: number }>()

    products.forEach((p) => {
      const key = p.categoryName || 'Uncategorized'
      const existing = grouped.get(key)
      const stockValue = p.currentStock * p.costPrice

      if (!existing) {
        grouped.set(key, {
          name: key,
          count: 1,
          stockUnits: p.currentStock,
          stockValue,
        })
      } else {
        existing.count += 1
        existing.stockUnits += p.currentStock
        existing.stockValue += stockValue
      }
    })

    return Array.from(grouped.values()).sort((a, b) => b.count - a.count)
  }, [products])

  const totalValue = categories.reduce((sum, c) => sum + c.stockValue, 0)

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-[1200px]">
        <PageHeaderSkeleton titleWidth="w-36" subtitleWidth="w-72" actionWidths={["w-28"]} />
        <StatCardsSkeleton cards={3} gridClassName="grid-cols-1 lg:grid-cols-3" iconShape="rounded" />
        <TableSectionSkeleton rows={6} columns={4} showPagination={false} />
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-[1200px]">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Track category-level inventory distribution</p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => navigate('/inventory/products/new')}>+ Add Category</button>
      </div>

      {isError && (
        <QueryErrorNotice
          title="Unable to load categories"
          message={error instanceof Error ? error.message : 'Failed to fetch category data from backend.'}
          onRetry={() => refetch()}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Total Categories</p>
          <p className="text-2xl font-heading font-bold text-text-primary">{categories.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Products Mapped</p>
          <p className="text-2xl font-heading font-bold text-text-primary">{products.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Inventory Value</p>
          <p className="text-2xl font-heading font-bold text-text-primary">{formatCurrency(totalValue)}</p>
        </div>
      </div>

      <div className="table-wrapper">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Products</th>
                <th>Units in Stock</th>
                <th>Inventory Value</th>
              </tr>
            </thead>
            <tbody>
              {isError && (
                <tr>
                  <td colSpan={4} className="text-center text-sm text-danger py-8">Failed to load categories.</td>
                </tr>
              )}
              {categories.map((category) => (
                <tr key={category.name}>
                  <td className="text-sm font-medium text-text-primary">{category.name}</td>
                  <td className="text-sm">{category.count}</td>
                  <td className="text-sm">{category.stockUnits}</td>
                  <td className="font-medium">{formatCurrency(category.stockValue)}</td>
                </tr>
              ))}
              {!isLoading && !isError && categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-sm text-text-secondary py-8">No categories available yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
