import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  House, Package, ShoppingCart, Receipt, Truck,
  ChartBar, Bell, Gear, X,
  CaretDown, CaretRight, Star, SignOut
} from '@phosphor-icons/react'
import { cn } from '../../utils'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchLowStockProducts, logout } from '../../services/api'
import { getSession } from '../../services/session'
import { Skeleton } from '../common/Skeleton'

interface NavGroupProps {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  basePath: string
}

function NavGroup({ label, icon, children, defaultOpen = false, basePath }: NavGroupProps) {
  const location = useLocation()
  const isActive = location.pathname.startsWith(basePath)
  const [open, setOpen] = useState(isActive || defaultOpen)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'nav-item w-full text-left',
          isActive && !open && 'text-text-primary font-semibold'
        )}
      >
        <span className="nav-item-icon">{icon}</span>
        <span className="flex-1">{label}</span>
        {open ? <CaretDown size={14} /> : <CaretRight size={14} />}
      </button>
      {open && (
        <div className="ml-3 pl-3 border-l border-border mt-0.5 space-y-0.5">
          {children}
        </div>
      )}
    </div>
  )
}

function NavItem({ to, label, icon }: { to: string; label: string; icon?: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn('nav-item text-sm', isActive && 'active')
      }
    >
      {icon && <span className="nav-item-icon">{icon}</span>}
      <span>{label}</span>
    </NavLink>
  )
}

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const session = getSession()
  const userName = session?.user?.name?.trim() || 'User'
  const userRole = session?.user?.role?.toUpperCase() || 'STAFF'
  const userInitial = userName.charAt(0).toUpperCase()

  const { data, isLoading } = useQuery({
    queryKey: ['sidebar-low-stock'],
    queryFn: fetchLowStockProducts
  })

  const openAlerts = data?.length ?? 0

  const handleLogout = async () => {
    await logout()
    queryClient.clear()
    onClose()
    navigate('/login', { replace: true })
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        id="sidebar"
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-surface-muted border-r border-border flex flex-col z-30 transition-transform duration-200',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <Star size={14} weight="fill" className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-heading font-bold text-base text-text-primary truncate">Bespoke Inventory</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Premium Management</p>
          </div>
          <button aria-label="Close sidebar" className="ml-auto lg:hidden text-text-secondary hover:text-text-primary" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <NavItem to="/dashboard" label="Dashboard" icon={<House size={18} />} />

          <div className="pt-2">
            <p className="section-heading">Inventory</p>
          </div>
          <NavGroup label="Inventory" icon={<Package size={18} />} basePath="/inventory">
            <NavItem to="/inventory/products" label="Products" />
            <NavItem to="/inventory/categories" label="Categories" />
            <NavItem to="/inventory/adjustments" label="Adjustments" />
            <NavItem to="/inventory/movements" label="Movements" />
          </NavGroup>

          <div className="pt-2">
            <p className="section-heading">Sales</p>
          </div>
          <NavItem to="/pos" label="POS" icon={<ShoppingCart size={18} />} />
          <NavGroup label="Sales" icon={<Receipt size={18} />} basePath="/sales">
            <NavItem to="/sales/history" label="Sales History" />
            <NavItem to="/sales/customers" label="Customers" />
          </NavGroup>

          <div className="pt-2">
            <p className="section-heading">Procurement</p>
          </div>
          <NavGroup label="Purchases" icon={<Truck size={18} />} basePath="/purchases">
            <NavItem to="/purchases/orders" label="Purchase Orders" />
            <NavItem to="/purchases/suppliers" label="Suppliers" />
          </NavGroup>

          <div className="pt-2">
            <p className="section-heading">Analytics</p>
          </div>
          <NavItem to="/reports" label="Reports" icon={<ChartBar size={18} />} />
          <NavLink
            to="/alerts"
            className={({ isActive }) => cn('nav-item', isActive && 'active')}
          >
            <Bell size={18} className="nav-item-icon" />
            <span className="flex-1">Alerts</span>
            {isLoading && <Skeleton className="h-4 w-5 rounded-pill" />}
            {openAlerts > 0 && (
              <span className="bg-danger text-white text-[10px] font-bold rounded-pill px-1.5 py-0.5 min-w-[18px] text-center">
                {openAlerts}
              </span>
            )}
          </NavLink>
        </nav>

        {/* Bottom */}
        <div className="border-t border-border px-3 py-3">
          <NavItem to="/settings" label="Settings" icon={<Gear size={18} />} />
          <button onClick={handleLogout} className="nav-item w-full mt-1">
            <span className="nav-item-icon"><SignOut size={18} /></span>
            <span>Log Out</span>
          </button>
          {/* User */}
          <div className="flex items-center gap-3 px-3 py-2 mt-1 rounded-DEFAULT hover:bg-surface-muted cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{userName}</p>
              <p className="text-xs text-text-secondary truncate">{userRole}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
