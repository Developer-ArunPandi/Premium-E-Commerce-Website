import { useState, useEffect } from 'react';
import { Link, Outlet, NavLink } from 'react-router-dom';
import { User, Package, Heart, MapPin, Star, Settings, Bell } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const accountLinks = [
  { to: '/account', label: 'My Profile', icon: User, end: true },
  { to: '/account/orders', label: 'My Orders', icon: Package },
  { to: '/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/account/addresses', label: 'Addresses', icon: MapPin },
  { to: '/account/reviews', label: 'My Reviews', icon: Star },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/account/settings', label: 'Settings', icon: Settings },
];

export default function AccountLayout() {
  const { user } = useAuthStore();

  return (
    <div className="container-fluid py-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-8">My Account</h1>
      <div className="grid md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="card p-4">
            {/* Profile snippet */}
            <div className="flex items-center gap-3 p-3 mb-3 bg-gradient-to-r from-primary-50 to-indigo-50 rounded-xl">
              <div className="w-12 h-12 bg-primary-200 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary-800 text-lg font-bold">{user?.firstName?.[0]}</span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-neutral-800 text-sm truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
              </div>
            </div>
            <nav className="space-y-0.5">
              {accountLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl transition-colors ${isActive ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'}`
                  }
                >
                  <link.icon className="w-4 h-4 flex-shrink-0" />
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
