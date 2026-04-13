import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { StockStatus } from '../types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function getStockStatus(current: number, reorder: number): StockStatus {
  if (current === 0) return 'out_of_stock'
  if (current <= reorder) return 'low_stock'
  return 'in_stock'
}

export function getStockChipClass(status: StockStatus): string {
  return {
    in_stock: 'chip-success',
    low_stock: 'chip-warning',
    out_of_stock: 'chip-danger',
  }[status]
}

export function getStockLabel(status: StockStatus): string {
  return {
    in_stock: 'In Stock',
    low_stock: 'Low Stock',
    out_of_stock: 'Out of Stock',
  }[status]
}

export function getPaymentStatusChip(status: string): string {
  return {
    paid: 'chip-success',
    pending: 'chip-warning',
    refunded: 'chip-neutral',
    voided: 'chip-neutral',
  }[status] ?? 'chip-neutral'
}

export function getPOStatusChip(status: string): string {
  return {
    draft: 'chip-neutral',
    sent: 'chip-info',
    received: 'chip-success',
    partial: 'chip-warning',
    cancelled: 'chip-neutral',
  }[status] ?? 'chip-neutral'
}

export function formatDelta(delta: number): string {
  return `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d} day${d > 1 ? 's' : ''} ago`
  if (h > 0) return `${h} hour${h > 1 ? 's' : ''} ago`
  return 'Just now'
}

export function downloadCsv(filename: string, rows: Array<Record<string, unknown>>): void {
  if (rows.length === 0) return

  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
  const escapeCell = (value: unknown) => {
    const text = String(value ?? '')
    const escaped = text.replace(/"/g, '""')
    return `"${escaped}"`
  }

  const header = keys.join(',')
  const body = rows
    .map((row) => keys.map((key) => escapeCell(row[key])).join(','))
    .join('\n')
  const csv = `${header}\n${body}`

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
