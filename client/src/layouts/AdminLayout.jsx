import { useState } from 'react';
import { NavLink, Link, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Package, FolderOpen, ShoppingBag, Users,
  Tag, Star, LogOut, Menu, X, Grid3X3, BarChart2, Settings,
  ChevronRight, Bell
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin' },
  { label: 'Products', icon: Package, to: '/admin/products' },
  { label: 'Categories', icon: FolderOpen, to: '/admin/categories' },
  { label: 'Orders', icon: ShoppingBag, to: '/admin/orders' },
  { label: 'Customers', icon: Users, to: '/admin/customers' },
  { label: 'Coupons', icon: Tag, to: '/admin/coupons' },
  { label: 'Reviews', icon: Star, to: '/admin/reviews' },
  { label: 'Analytics', icon: BarChart2, to: '/admin/analytics' },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-5 border-b border-neutral-100">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Grid3X3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-neutral-900 font-display">ShopSphere</span>
            <span className="block text-xs text-neutral-500">Admin Panel</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              cn('sidebar-link', isActive && 'sidebar-link-active')
            }
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-neutral-100">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-neutral-50 mb-1">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary-700 text-sm font-semibold">{user?.firstName?.[0]}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-800 truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-neutral-100 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-50 w-64 bg-white h-full shadow-modal animate-slide-up">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Top Bar */}
        <header className="flex-shrink-0 h-14 bg-white border-b border-neutral-100 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-neutral-500 hover:text-neutral-700 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center gap-1 text-sm text-neutral-500">
              <Link to="/admin" className="hover:text-primary-600">Admin</Link>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" target="_blank" className="text-xs text-neutral-500 hover:text-primary-600 font-medium hidden md:block">
              View Store ↗
            </Link>
            <Link to="/notifications" className="p-2 text-neutral-500 hover:text-neutral-700 rounded-lg">
              <Bell className="w-5 h-5" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
