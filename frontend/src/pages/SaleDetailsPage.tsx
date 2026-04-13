import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { fetchSaleById } from '../services/api'
import { Skeleton, TableLoadingRows } from '../components/common/Skeleton'
import { formatCurrency, formatDateTime, getPaymentStatusChip } from '../utils'

export default function SaleDetailsPage() {
  const { saleId } = useParams<{ saleId: string }>()

  const saleQuery = useQuery({
    queryKey: ['sale', saleId],
    queryFn: () => fetchSaleById(saleId || ''),
    enabled: Boolean(saleId)
  })

  if (saleQuery.isLoading) {
    return (
      <div className="space-y-5 max-w-[1100px]">
        <div className="card p-5 space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-52" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`sale-summary-skeleton-${index}`} className="card p-5 space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-28" />
            </div>
          ))}
        </div>
        <div className="table-wrapper">
          <div className="overflow-x-auto">
            <table className="table">
              <tbody>
                <TableLoadingRows rows={6} columns={7} />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  if (saleQuery.isError || !saleQuery.data) {
    return <div className="card p-6 text-sm text-danger">Unable to load this sale record.</div>
  }

  const sale = saleQuery.data

  return (
    <div className="space-y-5 max-w-[1100px]">
      <div className="page-header">
        <div>
          <Link to="/sales/history" className="text-xs text-text-secondary hover:text-text-primary inline-flex items-center gap-1 mb-2">
            <ArrowLeft size={12} /> Back to Sales History
          </Link>
          <h1 className="page-title">Invoice {sale.invoiceNo}</h1>
          <p className="page-subtitle">Sold on {formatDateTime(sale.soldAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={getPaymentStatusChip(sale.paymentStatus)}>{sale.paymentStatus}</span>
          <span className="chip-neutral capitalize">{sale.paymentMethod}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Subtotal</p>
          <p className="text-xl font-heading font-bold text-text-primary">{formatCurrency(sale.subtotal)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Discount</p>
          <p className="text-xl font-heading font-bold text-text-primary">{formatCurrency(sale.totalDiscount)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Tax</p>
          <p className="text-xl font-heading font-bold text-text-primary">{formatCurrency(sale.totalTax)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Grand Total</p>
          <p className="text-xl font-heading font-bold text-text-primary">{formatCurrency(sale.grandTotal)}</p>
        </div>
      </div>

      <div className="card p-5 space-y-2 text-sm">
        <h3 className="font-heading font-semibold text-text-primary">Sale Metadata</h3>
        <p><span className="text-text-secondary">Customer:</span> {sale.customerName || 'Walk-in'}</p>
        <p><span className="text-text-secondary">Sold By:</span> {sale.soldBy || 'Unknown'}</p>
        <p><span className="text-text-secondary">Store:</span> {sale.storeId}</p>
      </div>

      <div className="table-wrapper">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-heading font-semibold text-text-primary">Items</h3>
          <span className="text-xs text-text-secondary">{sale.items.length} line items</span>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Discount</th>
                <th>Tax</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
                <tr key={`${item.productId}-${item.skuSnapshot}`}>
                  <td>
                    <Link to={`/inventory/products/${item.productId}`} className="text-sm font-medium text-text-primary hover:underline">
                      {item.nameSnapshot}
                    </Link>
                  </td>
                  <td className="text-xs text-text-secondary font-mono">{item.skuSnapshot}</td>
                  <td className="text-sm">{item.quantity}</td>
                  <td className="text-sm">{formatCurrency(item.unitPrice)}</td>
                  <td className="text-sm">{formatCurrency(item.discount)}</td>
                  <td className="text-sm">{formatCurrency(item.taxAmount)}</td>
                  <td className="font-medium">{formatCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
