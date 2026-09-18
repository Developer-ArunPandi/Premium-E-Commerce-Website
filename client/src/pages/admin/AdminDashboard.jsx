import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingBag, Users, DollarSign, TrendingUp, ArrowUpRight, Eye, Clock, BarChart } from 'lucide-react';
import api from '@/services/api';
import { formatPrice, formatDate, getOrderStatusColor, getOrderStatusLabel } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart as RBarChart, Bar, CartesianGrid } from 'recharts';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/orders/analytics', { params: { period: '30' } });
        setAnalytics(data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const summary = analytics?.summary || {};
  const avgOrderValue = summary.orders > 0 ? summary.revenue / summary.orders : 0;

  const stats = [
    {
      label: 'Revenue (30d)',
      value: analytics ? formatPrice(summary.revenue || 0) : '—',
      icon: DollarSign,
      color: 'bg-green-50 text-green-600',
      change: '+12.5%',
      trend: 'up',
    },
    {
      label: 'Orders (30d)',
      value: summary.orders ?? '—',
      icon: ShoppingBag,
      color: 'bg-blue-50 text-blue-600',
      change: '+8.2%',
      trend: 'up',
    },
    {
      label: 'New Customers',
      value: summary.customers ?? '—',
      icon: Users,
      color: 'bg-purple-50 text-purple-600',
      change: '+5.1%',
      trend: 'up',
    },
    {
      label: 'Avg Order Value',
      value: analytics ? formatPrice(avgOrderValue) : '—',
      icon: TrendingUp,
      color: 'bg-orange-50 text-orange-600',
      change: '+3.7%',
      trend: 'up',
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">Welcome back! Here's what's happening with ShopSphere.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />{stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-neutral-900">{loading ? <span className="skeleton h-7 w-24 block rounded" /> : stat.value}</p>
            <p className="text-xs text-neutral-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card p-5">
          <h3 className="text-base font-bold text-neutral-900 mb-4">Revenue (Last 30 days)</h3>
          {analytics?.salesByDay && analytics.salesByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={analytics.salesByDay}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} width={50} />
                <Tooltip formatter={(v) => formatPrice(v)} labelFormatter={(d) => formatDate(d)} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-neutral-400 text-sm">No revenue data available</p>
            </div>
          )}
        </div>

        {/* Orders by status */}
        <div className="card p-5">
          <h3 className="text-base font-bold text-neutral-900 mb-4">Orders by Status</h3>
          {analytics?.ordersByStatus && analytics.ordersByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <RBarChart data={analytics.ordersByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="_id" tick={{ fontSize: 10 }} tickFormatter={(s) => s.replace(/_/g, ' ')} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </RBarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-neutral-400 text-sm">No order data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders + Top Products */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-neutral-100">
            <h3 className="text-base font-bold text-neutral-900">Recent Orders</h3>
            <Link to="/admin/orders" className="text-xs text-primary-600 font-semibold hover:text-primary-700 flex items-center gap-1">
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-neutral-50">
            {analytics?.recentOrders?.length > 0 ? analytics.recentOrders.slice(0, 5).map((order) => (
              <Link key={order._id} to={`/admin/orders`} className="flex items-center justify-between px-5 py-3.5 hover:bg-neutral-50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-neutral-800">#{order.orderNumber}</p>
                  <p className="text-xs text-neutral-500">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={getOrderStatusColor(order.status)}>{getOrderStatusLabel(order.status)}</span>
                  <span className="text-sm font-bold text-neutral-900">{formatPrice(order.total)}</span>
                </div>
              </Link>
            )) : (
              <div className="p-8 text-center text-sm text-neutral-400">No recent orders</div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-neutral-100">
            <h3 className="text-base font-bold text-neutral-900">Top Products</h3>
            <Link to="/admin/products" className="text-xs text-primary-600 font-semibold hover:text-primary-700 flex items-center gap-1">
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-neutral-50">
            {analytics?.topProducts?.length > 0 ? analytics.topProducts.slice(0, 5).map((p, i) => (
              <div key={p._id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="text-sm font-bold text-neutral-300 w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-800 truncate">{p.name}</p>
                  <p className="text-xs text-neutral-500">{p.soldCount || 0} sold</p>
                </div>
                <span className="text-sm font-bold text-neutral-900">{formatPrice(p.price)}</span>
              </div>
            )) : (
              <div className="p-8 text-center text-sm text-neutral-400">No product data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
