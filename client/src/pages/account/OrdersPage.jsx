import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Package, ChevronRight, CheckCircle } from 'lucide-react';
import api from '@/services/api';
import { formatPrice, formatDate, getOrderStatusColor, getOrderStatusLabel } from '@/lib/utils';
import { OrderCardSkeleton } from '@/components/ui/Skeleton';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/orders/my-orders', { params: { page, limit: 10 } });
        setOrders(data.data.orders || []);
        setTotal(data.meta?.total || 0);
      } catch (e) {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [page]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => <OrderCardSkeleton key={i} />)}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="card p-12 text-center">
        <Package className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-neutral-800 mb-2">No orders yet</h3>
        <p className="text-neutral-500 mb-6">Start shopping to see your orders here</p>
        <Link to="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-neutral-900">My Orders</h2>
        <span className="text-sm text-neutral-500">{total} orders total</span>
      </div>

      {orders.map((order) => (
        <Link key={order._id} to={`/account/orders/${order._id}`} className="card p-5 hover:shadow-elevated transition-all block group">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-sm font-bold text-neutral-800 group-hover:text-primary-600 transition-colors">
                #{order.orderNumber}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">{formatDate(order.createdAt)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={getOrderStatusColor(order.status)}>
                {getOrderStatusLabel(order.status)}
              </span>
              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-primary-600 transition-colors" />
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex -space-x-2">
              {order.items?.slice(0, 4).map((item, i) => (
                <img key={i} src={item.image || '/placeholder.jpg'} alt={item.name}
                  className="w-10 h-10 rounded-xl object-cover border-2 border-white" />
              ))}
              {order.items?.length > 4 && (
                <div className="w-10 h-10 rounded-xl bg-neutral-100 border-2 border-white flex items-center justify-center text-xs font-semibold text-neutral-600">
                  +{order.items.length - 4}
                </div>
              )}
            </div>
            <div className="text-sm text-neutral-600">{order.items?.length} item(s)</div>
          </div>

          <div className="flex items-center justify-between text-sm border-t border-neutral-100 pt-3">
            <span className="text-neutral-500">Total paid</span>
            <span className="font-bold text-neutral-900">{formatPrice(order.total)}</span>
          </div>
        </Link>
      ))}

      {/* Pagination */}
      {Math.ceil(total / 10) > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-outline btn-sm disabled:opacity-40">Previous</button>
          <span className="flex items-center px-4 text-sm text-neutral-600">Page {page} of {Math.ceil(total / 10)}</span>
          <button onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(total / 10)} className="btn-outline btn-sm disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
