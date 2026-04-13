import type { HTMLAttributes } from 'react'
import { cn } from '../../utils'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={cn('skeleton', className)} {...props} />
}

export function PageSuspenseSkeleton() {
  return (
    <div className="space-y-4">
      <div className="card p-5 space-y-3">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="card p-5 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}

export function PageHeaderSkeleton({
  titleWidth = 'w-48',
  subtitleWidth = 'w-72',
  actionWidths = ['w-24', 'w-32']
}: {
  titleWidth?: string
  subtitleWidth?: string
  actionWidths?: string[]
}) {
  return (
    <div className="page-header">
      <div className="space-y-2">
        <Skeleton className={cn('h-8', titleWidth)} />
        <Skeleton className={cn('h-4 max-w-full', subtitleWidth)} />
      </div>
      {actionWidths.length > 0 && (
        <div className="flex items-center gap-2">
          {actionWidths.map((width, index) => (
            <Skeleton key={`header-action-skeleton-${index}`} className={cn('h-9', width)} />
          ))}
        </div>
      )}
    </div>
  )
}

export function FilterBarSkeleton({
  pillCount = 0,
  pillWidth = 'w-20',
  showSearch = true,
  trailingWidths = []
}: {
  pillCount?: number
  pillWidth?: string
  showSearch?: boolean
  trailingWidths?: string[]
}) {
  return (
    <div className="card p-4 flex flex-col sm:flex-row gap-3">
      {showSearch && <Skeleton className="h-10 flex-1" />}
      {pillCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: pillCount }).map((_, index) => (
            <Skeleton key={`filter-pill-skeleton-${index}`} className={cn('h-9', pillWidth)} />
          ))}
        </div>
      )}
      {trailingWidths.map((width, index) => (
        <Skeleton key={`filter-trailing-skeleton-${index}`} className={cn('h-10', width)} />
      ))}
    </div>
  )
}

export function StatCardsSkeleton({
  cards = 3,
  gridClassName = 'grid-cols-1 md:grid-cols-3',
  iconShape = 'circle'
}: {
  cards?: number
  gridClassName?: string
  iconShape?: 'circle' | 'rounded'
}) {
  return (
    <div className={cn('grid gap-4', gridClassName)}>
      {Array.from({ length: cards }).map((_, index) => (
        <div key={`stat-card-skeleton-${index}`} className="card p-5 flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-28" />
          </div>
          <Skeleton className={cn('h-10 w-10', iconShape === 'circle' ? 'rounded-full' : 'rounded-lg')} />
        </div>
      ))}
    </div>
  )
}

export function PaginationSkeleton({ labelWidth = 'w-56' }: { labelWidth?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <Skeleton className={cn('h-4', labelWidth)} />
      <div className="flex items-center gap-1">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-10" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  )
}

export function TableSectionSkeleton({
  rows = 8,
  columns = 6,
  showPagination = true,
  paginationLabelWidth
}: {
  rows?: number
  columns?: number
  showPagination?: boolean
  paginationLabelWidth?: string
}) {
  return (
    <div className="table-wrapper">
      <div className="overflow-x-auto">
        <table className="table">
          <tbody>
            <TableLoadingRows rows={rows} columns={columns} />
          </tbody>
        </table>
      </div>
      {showPagination && <PaginationSkeleton labelWidth={paginationLabelWidth} />}
    </div>
  )
}

export function TableLoadingRows({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={`skeleton-row-${rowIndex}`}>
          {Array.from({ length: columns }).map((__, colIndex) => (
            <td key={`skeleton-cell-${rowIndex}-${colIndex}`}>
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
