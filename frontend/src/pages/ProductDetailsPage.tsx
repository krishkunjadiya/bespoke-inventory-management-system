import { Link, useParams } from 'react-router-dom'
import { PencilSimple, ArrowLeft } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { fetchProductById, fetchSales } from '../services/api'
import { Skeleton, TableLoadingRows } from '../components/common/Skeleton'
import { formatCurrency, formatDateTime, getStockChipClass, getStockLabel, getStockStatus } from '../utils'

export default function ProductDetailsPage() {
  const { productId } = useParams<{ productId: string }>()

  const productQuery = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProductById(productId || ''),
    enabled: Boolean(productId)
  })

  const salesQuery = useQuery({
    queryKey: ['product-sales', productId],
    queryFn: () => fetchSales(200),
    enabled: Boolean(productId)
  })

  const product = productQuery.data
  const allSales = salesQuery.data ?? []

  const relatedLines = allSales.flatMap((sale) =>
    sale.items
      .filter((item) => item.productId === productId)
      .map((item) => ({
        saleId: sale.id,
        invoiceNo: sale.invoiceNo,
        soldAt: sale.soldAt,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
  )

  const soldUnits = relatedLines.reduce((sum, line) => sum + line.quantity, 0)
  const soldRevenue = relatedLines.reduce((sum, line) => sum + line.lineTotal, 0)

  if (productQuery.isLoading) {
    return (
      <div className="space-y-5 max-w-[1100px]">
        <div className="card p-5 space-y-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`product-detail-card-skeleton-${index}`} className="card p-5 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-6 w-28" />
            </div>
          ))}
        </div>
        <div className="table-wrapper">
          <div className="overflow-x-auto">
            <table className="table">
              <tbody>
                <TableLoadingRows rows={6} columns={4} />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  if (productQuery.isError || !product) {
    return (
      <div className="card p-6 text-sm text-danger">
        Could not load this product. Please go back and try again.
      </div>
    )
  }

  const stockStatus = getStockStatus(product.currentStock, product.reorderLevel)

  return (
    <div className="space-y-5 max-w-[1100px]">
      <div className="page-header">
        <div>
          <Link to="/inventory/products" className="text-xs text-text-secondary hover:text-text-primary inline-flex items-center gap-1 mb-2">
            <ArrowLeft size={12} /> Back to Products
          </Link>
          <h1 className="page-title">{product.name}</h1>
          <p className="page-subtitle">SKU: {product.sku}</p>
        </div>
        <Link to={`/inventory/products/${product.id}/edit`} className="btn-primary btn-sm">
          <PencilSimple size={14} /> Edit Product
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Current Stock</p>
          <p className="text-2xl font-heading font-bold text-text-primary">{product.currentStock} {product.unit}</p>
          <span className={`${getStockChipClass(stockStatus)} mt-2`}>{getStockLabel(stockStatus)}</span>
        </div>
        <div className="card p-5">
          <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Sales Volume</p>
          <p className="text-2xl font-heading font-bold text-text-primary">{soldUnits}</p>
          <p className="text-xs text-text-muted mt-2">Units sold in recent transactions</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Sales Revenue</p>
          <p className="text-2xl font-heading font-bold text-text-primary">{formatCurrency(soldRevenue)}</p>
          <p className="text-xs text-text-muted mt-2">Recent recognized line-item revenue</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5 space-y-3">
          <h3 className="font-heading font-semibold text-text-primary">Product Information</h3>
          <div className="text-sm space-y-2">
            <p><span className="text-text-secondary">Category:</span> {product.categoryName || 'Uncategorized'}</p>
            <p><span className="text-text-secondary">Unit:</span> {product.unit}</p>
            <p><span className="text-text-secondary">Barcode:</span> {product.barcode || 'Not set'}</p>
            <p><span className="text-text-secondary">Supplier ID:</span> {product.supplierId || 'Not set'}</p>
            <p><span className="text-text-secondary">Status:</span> <span className={product.status === 'active' ? 'chip-success' : 'chip-neutral'}>{product.status}</span></p>
            <p><span className="text-text-secondary">Updated:</span> {formatDateTime(product.updatedAt)}</p>
          </div>
        </div>

        <div className="card p-5 space-y-3">
          <h3 className="font-heading font-semibold text-text-primary">Pricing</h3>
          <div className="text-sm space-y-2">
            <p><span className="text-text-secondary">Cost Price:</span> {formatCurrency(product.costPrice)}</p>
            <p><span className="text-text-secondary">Selling Price:</span> {formatCurrency(product.sellingPrice)}</p>
            <p><span className="text-text-secondary">Tax Rate:</span> {product.taxRate}%</p>
            <p><span className="text-text-secondary">Reorder Level:</span> {product.reorderLevel} {product.unit}</p>
            <p><span className="text-text-secondary">Estimated Margin:</span> {formatCurrency(product.sellingPrice - product.costPrice)} per unit</p>
          </div>
        </div>
      </div>

      <div className="table-wrapper">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-heading font-semibold text-text-primary">Recent Sales Lines</h3>
          <span className="text-xs text-text-secondary">{relatedLines.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Sold At</th>
                <th>Quantity</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {salesQuery.isLoading && <TableLoadingRows rows={5} columns={4} />}
              {salesQuery.isError && !salesQuery.isLoading && (
                <tr>
                  <td colSpan={4} className="text-center text-sm text-danger py-8">Failed to load recent sales for this product.</td>
                </tr>
              )}
              {!salesQuery.isLoading && !salesQuery.isError && relatedLines.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-sm text-text-secondary py-8">No sales lines found for this product yet.</td>
                </tr>
              )}
              {!salesQuery.isLoading && !salesQuery.isError && relatedLines.map((line) => (
                <tr key={`${line.saleId}-${line.invoiceNo}`}>
                  <td>
                    <Link to={`/sales/${line.saleId}`} className="font-mono text-xs font-medium text-text-primary hover:underline">
                      {line.invoiceNo}
                    </Link>
                  </td>
                  <td className="text-xs text-text-secondary">{formatDateTime(line.soldAt)}</td>
                  <td className="text-sm">{line.quantity}</td>
                  <td className="font-medium">{formatCurrency(line.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
