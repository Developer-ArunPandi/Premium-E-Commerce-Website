import { useState, useEffect } from 'react';
import { Search, Eye, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { formatPrice, formatDate, getOrderStatusColor, getOrderStatusLabel, debounce } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updateModal, setUpdateModal] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  const fetchOrders = async (pg = 1, status = 'all', q = '') => {
    setLoading(true);
    try {
      const params = { page: pg, limit: 20 };
      if (status !== 'all') params.status = status;
      if (q) params.search = q;
      const { data } = await api.get('/orders', { params });
      setOrders(data.data.orders || []);
      setTotal(data.meta?.total || 0);
    } catch (e) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(page, statusFilter, search); }, [page, statusFilter]);

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    try {
      const body = { status: newStatus };
      if (trackingNumber) body.trackingNumber = trackingNumber;
      await api.patch(`/orders/${updateModal._id}/status`, body);
      setOrders((prev) => prev.map((o) => o._id === updateModal._id ? { ...o, status: newStatus } : o));
      setUpdateModal(null);
      toast.success('Order status updated');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Orders</h1>
        <p className="text-sm text-neutral-500 mt-1">{total} orders total</p>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input type="text" placeholder="Search by order #..." className="input pl-9 text-sm"
            onChange={debounce((e) => { setSearch(e.target.value); fetchOrders(1, statusFilter, e.target.value); }, 400)} />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input text-sm w-auto pr-8">
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : getOrderStatusLabel(s)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-100">
              <tr>
                <th className="table-header">Order #</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Date</th>
                <th className="table-header">Items</th>
                <th className="table-header">Total</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(7)].map((_, j) => <td key={j} className="table-cell"><div className="h-4 bg-neutral-200 rounded animate-pulse" /></td>)}</tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-12 text-neutral-400">No orders found</td></tr>
              ) : orders.map((order) => (
                <tr key={order._id} className="hover:bg-neutral-50 transition-colors">
                  <td className="table-cell">
                    <p className="text-sm font-bold text-neutral-800">#{order.orderNumber}</p>
                    <p className="text-xs text-neutral-400 capitalize">{order.paymentMethod}</p>
                  </td>
                  <td className="table-cell">
                    <p className="text-sm font-medium text-neutral-800">{order.user?.firstName} {order.user?.lastName}</p>
                    <p className="text-xs text-neutral-500">{order.user?.email}</p>
                  </td>
                  <td className="table-cell text-xs text-neutral-500">{formatDate(order.createdAt)}</td>
                  <td className="table-cell text-sm">{order.items?.length} items</td>
                  <td className="table-cell font-bold text-neutral-900">{formatPrice(order.total)}</td>
                  <td className="table-cell">
                    <span className={getOrderStatusColor(order.status)}>{getOrderStatusLabel(order.status)}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setUpdateModal(order); setNewStatus(order.status); setTrackingNumber(''); }}
                        className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors text-xs"
                        title="Update Status"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {Math.ceil(total / 20) > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-neutral-100">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-outline btn-sm disabled:opacity-40">Previous</button>
            <span className="flex items-center px-4 text-sm text-neutral-600">Page {page} of {Math.ceil(total / 20)}</span>
            <button onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(total / 20)} className="btn-outline btn-sm disabled:opacity-40">Next</button>
          </div>
        )}
      </div>

      {/* Update Status Modal */}
      {updateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30" onClick={() => setUpdateModal(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-modal animate-scale-in">
            <h3 className="text-lg font-bold mb-1">Update Order Status</h3>
            <p className="text-sm text-neutral-500 mb-5">Order #{updateModal.orderNumber}</p>
            <div className="space-y-4">
              <div>
                <label className="label">New Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="input">
                  {['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].map((s) => (
                    <option key={s} value={s}>{getOrderStatusLabel(s)}</option>
                  ))}
                </select>
              </div>
              {(newStatus === 'shipped' || newStatus === 'out_for_delivery') && (
                <div>
                  <label className="label">Tracking Number <span className="text-neutral-400 font-normal">(optional)</span></label>
                  <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="AWB12345678" className="input" />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleUpdateStatus} className="btn-primary flex-1">Update Status</button>
              <button onClick={() => setUpdateModal(null)} className="btn-outline flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
