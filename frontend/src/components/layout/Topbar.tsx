import { useState } from 'react'
import { MagnifyingGlass, Bell, List, Plus } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchLowStockProducts } from '../../services/api'
import { Skeleton } from '../common/Skeleton'

interface TopbarProps {
  onMenuClick: () => void
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const [search, setSearch] = useState('')
  const { data: lowStockData, isLoading } = useQuery({
    queryKey: ['topbar-low-stock'],
    queryFn: fetchLowStockProducts
  })

  const alertCount = lowStockData?.length ?? 0

  return (
    <header className="sticky top-0 z-10 h-16 bg-surface/85 backdrop-blur-xl border-b border-border flex items-center px-4 lg:px-6 gap-4">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        aria-label="Open sidebar"
        className="lg:hidden btn-ghost p-2 rounded-DEFAULT"
      >
        <List size={20} />
      </button>

      <div className="hidden lg:flex items-center gap-2 text-sm">
        <span className="text-text-muted">Pages</span>
        <span className="text-text-muted">/</span>
        <span className="font-semibold text-text-primary">Workspace</span>
      </div>

      {/* Search */}
      <div className="search-shell flex-1 min-w-[13rem]">
        <MagnifyingGlass size={16} className="search-shell-icon" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products, invoices, or customers"
          className="search-input text-sm"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Quick actions */}
        <Link to="/pos" className="btn-primary btn-sm hidden sm:flex">
          <Plus size={14} />
          New Sale
        </Link>
        <Link to="/inventory/products/new" className="btn-secondary btn-sm hidden md:flex">
          Add Product
        </Link>

        {/* Notifications */}
        <Link to="/alerts" aria-label="View alerts" className="relative btn-ghost p-2 rounded-DEFAULT">
          <Bell size={20} />
          {isLoading && <Skeleton className="absolute top-1 right-1 w-4 h-4 rounded-full" />}
          {alertCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-danger rounded-full text-white text-[9px] font-bold flex items-center justify-center">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
