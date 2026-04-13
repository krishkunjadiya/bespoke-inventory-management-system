import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, fetchProductById, updateProductById } from '../services/api'
import { Skeleton } from '../components/common/Skeleton'

export default function ProductEditPage() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    supplierId: '',
    unit: 'pcs',
    costPrice: '0',
    sellingPrice: '0',
    taxRate: '0',
    currentStock: '0',
    reorderLevel: '0',
  })
  const [error, setError] = useState('')

  const productQuery = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProductById(productId || ''),
    enabled: Boolean(productId)
  })

  useEffect(() => {
    if (!productQuery.data) return

    const p = productQuery.data
    setForm({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode || '',
      categoryId: p.categoryId || '',
      supplierId: p.supplierId || '',
      unit: p.unit,
      costPrice: String(p.costPrice),
      sellingPrice: String(p.sellingPrice),
      taxRate: String(p.taxRate),
      currentStock: String(p.currentStock),
      reorderLevel: String(p.reorderLevel),
    })
  }, [productQuery.data])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!productId) return

      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        barcode: form.barcode.trim() || null,
        categoryId: form.categoryId.trim() || null,
        supplierId: form.supplierId.trim() || null,
        unit: form.unit.trim(),
        costPrice: Number(form.costPrice),
        sellingPrice: Number(form.sellingPrice),
        taxRate: Number(form.taxRate),
        currentStock: Number(form.currentStock),
        reorderLevel: Number(form.reorderLevel),
      }

      return updateProductById(productId, payload)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['product', productId] }),
        queryClient.invalidateQueries({ queryKey: ['pos-products'] }),
        queryClient.invalidateQueries({ queryKey: ['low-stock'] }),
      ])
      navigate(`/inventory/products/${productId}`)
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Unable to update product')
      }
    }
  })

  const validationError = useMemo(() => {
    if (!form.name.trim()) return 'Name is required.'
    if (!form.sku.trim()) return 'SKU is required.'
    if (Number(form.sellingPrice) < Number(form.costPrice)) return 'Selling price cannot be below cost price.'
    return ''
  }, [form])

  if (productQuery.isLoading) {
    return (
      <div className="space-y-5 max-w-[1000px]">
        <div className="card p-6 space-y-5">
          <Skeleton className="h-8 w-52" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={`edit-form-skeleton-${index}`} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (productQuery.isError || !productQuery.data) {
    return <div className="card p-6 text-sm text-danger">Unable to load this product for editing.</div>
  }

  return (
    <div className="space-y-5 max-w-[1000px]">
      <div className="page-header">
        <div>
          <Link to={`/inventory/products/${productId}`} className="text-xs text-text-secondary hover:text-text-primary inline-flex items-center gap-1 mb-2">
            <ArrowLeft size={12} /> Back to Product
          </Link>
          <h1 className="page-title">Edit Product</h1>
          <p className="page-subtitle">Update pricing, stock, and product information</p>
        </div>
      </div>

      <div className="card p-6 space-y-5">
        {(error || validationError) && (
          <div className="rounded-lg border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger">
            {error || validationError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">SKU</label>
            <input className="input" value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} />
          </div>
          <div>
            <label className="label">Barcode</label>
            <input className="input" value={form.barcode} onChange={(e) => setForm((p) => ({ ...p, barcode: e.target.value }))} />
          </div>
          <div>
            <label className="label">Unit</label>
            <input className="input" value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} />
          </div>
          <div>
            <label className="label">Category ID</label>
            <input className="input" value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))} />
          </div>
          <div>
            <label className="label">Supplier ID</label>
            <input className="input" value={form.supplierId} onChange={(e) => setForm((p) => ({ ...p, supplierId: e.target.value }))} />
          </div>
          <div>
            <label className="label">Cost Price</label>
            <input type="number" min="0" className="input" value={form.costPrice} onChange={(e) => setForm((p) => ({ ...p, costPrice: e.target.value }))} />
          </div>
          <div>
            <label className="label">Selling Price</label>
            <input type="number" min="0" className="input" value={form.sellingPrice} onChange={(e) => setForm((p) => ({ ...p, sellingPrice: e.target.value }))} />
          </div>
          <div>
            <label className="label">Tax Rate (%)</label>
            <input type="number" min="0" className="input" value={form.taxRate} onChange={(e) => setForm((p) => ({ ...p, taxRate: e.target.value }))} />
          </div>
          <div>
            <label className="label">Current Stock</label>
            <input type="number" min="0" className="input" value={form.currentStock} onChange={(e) => setForm((p) => ({ ...p, currentStock: e.target.value }))} />
          </div>
          <div>
            <label className="label">Reorder Level</label>
            <input type="number" min="0" className="input" value={form.reorderLevel} onChange={(e) => setForm((p) => ({ ...p, reorderLevel: e.target.value }))} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/inventory/products/${productId}`} className="btn-secondary btn-sm">Cancel</Link>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || Boolean(validationError)}
            className="btn-primary btn-sm"
          >
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
