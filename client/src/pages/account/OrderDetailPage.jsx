import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Package, Check, MapPin, CreditCard, RotateCcw, X, CheckCircle } from 'lucide-react';
import api from '@/services/api';
import { formatPrice, formatDate, formatDateTime, getOrderStatusColor, getOrderStatusLabel, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState(false);
  const [returnModal, setReturnModal] = useState(false);
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/orders/my-orders/${id}`);
        setOrder(data.data.order);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleCancel = async () => {
    if (!reason.trim()) { toast.error('Please provide a reason'); return; }
    setActionLoading(true);
    try {
      const { data } = await api.patch(`/orders/my-orders/${id}/cancel`, { reason });
      setOrder(data.data.order);
      setCancelModal(false);
      toast.success('Order cancelled');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to cancel');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!reason.trim()) { toast.error('Please provide a reason'); return; }
    setActionLoading(true);
    try {
      const { data } = await api.post(`/orders/my-orders/${id}/return`, { reason });
      setOrder(data.data.order);
      setReturnModal(false);
      toast.success('Return request submitted');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit return');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="card p-8 animate-pulse space-y-4"><div className="h-6 bg-neutral-200 rounded w-1/3" /><div className="h-4 bg-neutral-200 rounded w-full" /></div>;
  if (!order) return <div className="card p-8 text-center"><p className="text-neutral-500">Order not found</p></div>;

  const canCancel = ['pending', 'confirmed', 'processing'].includes(order.status);
  const canReturn = order.status === 'delivered';

  const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
  const currentStepIndex = statusSteps.indexOf(order.status);
  const isCancelledOrReturned = ['cancelled', 'return_requested', 'returned', 'refunded'].includes(order.status);

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      {isSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-4">
          <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-green-800">Order Placed Successfully! 🎉</h3>
            <p className="text-sm text-green-600">We'll send you updates on your order status.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Order #{order.orderNumber}</h2>
            <p className="text-sm text-neutral-500 mt-0.5">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={getOrderStatusColor(order.status)}>{getOrderStatusLabel(order.status)}</span>
            {canCancel && (
              <button onClick={() => setCancelModal(true)} className="btn-outline btn-sm text-red-600 border-red-300 hover:bg-red-50">
                <X className="w-4 h-4" /> Cancel Order
              </button>
            )}
            {canReturn && (
              <button onClick={() => setReturnModal(true)} className="btn-outline btn-sm">
                <RotateCcw className="w-4 h-4" /> Return
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {!isCancelledOrReturned && (
          <div className="relative">
            <div className="overflow-x-auto pb-2">
              <div className="flex items-center min-w-max">
                {statusSteps.map((status, i) => (
                  <div key={status} className="flex items-center">
                    <div className={cn(
                      'flex flex-col items-center gap-1',
                    )}>
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                        i <= currentStepIndex ? 'bg-primary-600 text-white' : 'bg-neutral-200 text-neutral-400'
                      )}>
                        {i < currentStepIndex ? <Check className="w-4 h-4" /> : i + 1}
                      </div>
                      <span className={cn('text-[10px] font-medium whitespace-nowrap', i <= currentStepIndex ? 'text-primary-600' : 'text-neutral-400')}>
                        {getOrderStatusLabel(status)}
                      </span>
                    </div>
                    {i < statusSteps.length - 1 && (
                      <div className={cn('h-0.5 w-12 mx-2 mb-4', i < currentStepIndex ? 'bg-primary-600' : 'bg-neutral-200')} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Items */}
        <div className="card p-5">
          <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2"><Package className="w-4 h-4 text-primary-500" /> Order Items</h3>
          <div className="space-y-3">
            {order.items?.map((item, i) => (
              <div key={i} className="flex gap-3 py-2 border-b border-neutral-100 last:border-0">
                <img src={item.image || '/placeholder.jpg'} alt={item.name}
                  className="w-14 h-14 object-cover rounded-xl border border-neutral-100 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-800 line-clamp-1">{item.name}</p>
                  {item.variantValue && <p className="text-xs text-neutral-500">{item.variantName}: {item.variantValue}</p>}
                  <p className="text-xs text-neutral-500 mt-0.5">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                </div>
                <span className="text-sm font-bold text-neutral-900 whitespace-nowrap">{formatPrice(item.total)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          {/* Delivery Address */}
          <div className="card p-5">
            <h3 className="font-bold text-neutral-900 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary-500" /> Delivery Address</h3>
            <p className="text-sm font-semibold text-neutral-800">{order.shippingAddress?.fullName}</p>
            <p className="text-sm text-neutral-600">{order.shippingAddress?.phone}</p>
            <p className="text-sm text-neutral-600 mt-1">
              {order.shippingAddress?.addressLine1}{order.shippingAddress?.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}
            </p>
            <p className="text-sm text-neutral-600">
              {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
            </p>
          </div>

          {/* Payment */}
          <div className="card p-5">
            <h3 className="font-bold text-neutral-900 mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary-500" /> Payment</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-neutral-600"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              {order.couponDiscount > 0 && <div className="flex justify-between text-green-600"><span>Coupon ({order.couponCode})</span><span>-{formatPrice(order.couponDiscount)}</span></div>}
              <div className="flex justify-between text-neutral-600"><span>Shipping</span><span>{order.shippingCost === 0 ? 'FREE' : formatPrice(order.shippingCost)}</span></div>
              <div className="flex justify-between font-bold text-neutral-900 text-base border-t pt-2"><span>Total</span><span>{formatPrice(order.total)}</span></div>
              <div className="flex justify-between text-neutral-500 mt-2">
                <span>Payment Method</span>
                <span className="capitalize">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Payment Status</span>
                <span className={`font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : order.paymentStatus === 'failed' ? 'text-red-600' : 'text-amber-600'}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {order.timeline?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-neutral-900 mb-4">Order Timeline</h3>
          <div className="space-y-4">
            {[...order.timeline].reverse().map((event, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-primary-600' : 'bg-neutral-300'} flex-shrink-0 mt-1`} />
                  {i < order.timeline.length - 1 && <div className="w-0.5 h-full bg-neutral-200 mt-1" />}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-semibold text-neutral-800 capitalize">{getOrderStatusLabel(event.status)}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{event.message}</p>
                  <p className="text-xs text-neutral-400 mt-1">{formatDateTime(event.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30" onClick={() => setCancelModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-modal animate-scale-in">
            <h3 className="text-lg font-bold mb-4">Cancel Order</h3>
            <p className="text-sm text-neutral-600 mb-4">Please provide a reason for cancellation.</p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)}
              className="input min-h-[100px] resize-none" placeholder="Reason for cancellation..." />
            <div className="flex gap-3 mt-4">
              <button onClick={handleCancel} disabled={actionLoading} className="btn-danger flex-1">
                {actionLoading ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
              <button onClick={() => setCancelModal(false)} className="btn-outline flex-1">Keep Order</button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {returnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30" onClick={() => setReturnModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-modal animate-scale-in">
            <h3 className="text-lg font-bold mb-4">Request Return</h3>
            <p className="text-sm text-neutral-600 mb-4">Please provide a reason for the return.</p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)}
              className="input min-h-[100px] resize-none" placeholder="Reason for return..." />
            <div className="flex gap-3 mt-4">
              <button onClick={handleReturn} disabled={actionLoading} className="btn-primary flex-1">
                {actionLoading ? 'Submitting...' : 'Submit Return Request'}
              </button>
              <button onClick={() => setReturnModal(false)} className="btn-outline flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
