import { Suspense, lazy, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import { PageSuspenseSkeleton } from '../components/common/Skeleton'
import { getAccessToken } from '../services/session'

const LoginPage = lazy(() => import('../pages/LoginPage'))
const DashboardPage = lazy(() => import('../pages/DashboardPage'))
const ProductsPage = lazy(() => import('../pages/ProductsPage'))
const ProductCreatePage = lazy(() => import('../pages/ProductCreatePage'))
const ProductDetailsPage = lazy(() => import('../pages/ProductDetailsPage'))
const ProductEditPage = lazy(() => import('../pages/ProductEditPage'))
const CategoriesPage = lazy(() => import('../pages/CategoriesPage'))
const StockAdjustmentsPage = lazy(() => import('../pages/StockAdjustmentsPage'))
const InventoryMovementsPage = lazy(() => import('../pages/InventoryMovementsPage'))
const POSPage = lazy(() => import('../pages/POSPage'))
const SalesHistoryPage = lazy(() => import('../pages/SalesHistoryPage'))
const SaleDetailsPage = lazy(() => import('../pages/SaleDetailsPage'))
const AlertsPage = lazy(() => import('../pages/AlertsPage'))
const CustomersPage = lazy(() => import('../pages/CustomersPage'))
const SuppliersPage = lazy(() => import('../pages/SuppliersPage'))
const PurchaseOrdersPage = lazy(() => import('../pages/PurchaseOrdersPage'))
const PurchaseOrderCreatePage = lazy(() => import('../pages/PurchaseOrderCreatePage'))
const ReportsPage = lazy(() => import('../pages/ReportsPage'))
const SettingsPage = lazy(() => import('../pages/SettingsPage'))

function PageLoader({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PageSuspenseSkeleton />}>
      {children}
    </Suspense>
  )
}

function ProtectedLayout() {
  if (!getAccessToken()) {
    return <Navigate to="/login" replace />
  }

  return <AppLayout />
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <PageLoader><LoginPage /></PageLoader>,
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <PageLoader><DashboardPage /></PageLoader> },
      { path: 'pos', element: <PageLoader><POSPage /></PageLoader> },
      { path: 'inventory/products', element: <PageLoader><ProductsPage /></PageLoader> },
      { path: 'inventory/products/new', element: <PageLoader><ProductCreatePage /></PageLoader> },
      { path: 'inventory/products/:productId', element: <PageLoader><ProductDetailsPage /></PageLoader> },
      { path: 'inventory/products/:productId/edit', element: <PageLoader><ProductEditPage /></PageLoader> },
      { path: 'inventory/categories', element: <PageLoader><CategoriesPage /></PageLoader> },
      { path: 'inventory/adjustments', element: <PageLoader><StockAdjustmentsPage /></PageLoader> },
      { path: 'inventory/movements', element: <PageLoader><InventoryMovementsPage /></PageLoader> },
      { path: 'sales/history', element: <PageLoader><SalesHistoryPage /></PageLoader> },
      { path: 'sales/:saleId', element: <PageLoader><SaleDetailsPage /></PageLoader> },
      { path: 'sales/customers', element: <PageLoader><CustomersPage /></PageLoader> },
      { path: 'purchases/orders', element: <PageLoader><PurchaseOrdersPage /></PageLoader> },
      { path: 'purchases/orders/new', element: <PageLoader><PurchaseOrderCreatePage /></PageLoader> },
      { path: 'purchases/suppliers', element: <PageLoader><SuppliersPage /></PageLoader> },
      { path: 'reports', element: <PageLoader><ReportsPage /></PageLoader> },
      { path: 'alerts', element: <PageLoader><AlertsPage /></PageLoader> },
      { path: 'settings', element: <PageLoader><SettingsPage /></PageLoader> },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
