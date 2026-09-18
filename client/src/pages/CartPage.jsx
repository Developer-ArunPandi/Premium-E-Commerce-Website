import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, Tag, X, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { items, subtotal, itemCount, couponCode, couponDiscount, shippingCost, fetchCart, updateItem, removeItem, applyCoupon, removeCoupon, getTotal, isLoading } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) fetchCart();
  }, [isAuthenticated]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    await applyCoupon(couponInput.trim());
    setCouponInput('');
    setCouponLoading(false);
  };

  const total = getTotal();

  if (!isAuthenticated) {
    return (
      <div className="container-fluid py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Your cart is empty</h2>
        <p className="text-neutral-500 mb-6">Sign in to view your cart and start shopping</p>
        <div className="flex justify-center gap-4">
          <Link to="/login" className="btn-primary">Sign In</Link>
          <Link to="/products" className="btn-outline">Browse Products</Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-fluid py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Your cart is empty</h2>
        <p className="text-neutral-500 mb-6">Add some products to get started</p>
        <Link to="/products" className="btn-primary">
          <ShoppingBag className="w-4 h-4" /> Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container-fluid py-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-8">Shopping Cart <span className="text-neutral-400 font-normal text-lg">({itemCount} items)</span></h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item._id} className="card p-4 flex gap-4">
              <Link to={`/products/${item.product?.slug || ''}`}>
                <img src={item.image || '/placeholder.jpg'} alt={item.name}
                  className="w-20 h-20 object-cover rounded-xl flex-shrink-0 border border-neutral-100" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.product?.slug || ''}`}>
                  <h3 className="text-sm font-semibold text-neutral-800 hover:text-primary-600 transition-colors line-clamp-2">{item.name}</h3>
                </Link>
                {item.variantValue && (
                  <p className="text-xs text-neutral-500 mt-0.5">{item.variantName}: {item.variantValue}</p>
                )}
                {item.stockAvailable <= 5 && item.stockAvailable > 0 && (
                  <p className="text-xs text-amber-600 font-medium mt-1">Only {item.stockAvailable} left!</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden">
                    <button onClick={() => item.quantity > 1 ? updateItem(item._id, item.quantity - 1) : null}
                      disabled={item.quantity <= 1 || isLoading}
                      className="px-3 py-1.5 text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 transition-colors text-sm">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-3 py-1.5 font-semibold text-sm">{item.quantity}</span>
                    <button onClick={() => updateItem(item._id, item.quantity + 1)}
                      disabled={item.quantity >= (item.stockAvailable || 10) || isLoading}
                      className="px-3 py-1.5 text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 transition-colors text-sm">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-neutral-900">{formatPrice(item.price * item.quantity)}</span>
                    <button onClick={() => removeItem(item._id)} className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          {/* Coupon */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-neutral-800 mb-3 flex items-center gap-2"><Tag className="w-4 h-4 text-primary-500" /> Coupon Code</h3>
            {couponCode ? (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                <div>
                  <p className="text-sm font-bold text-green-700">{couponCode} applied</p>
                  <p className="text-xs text-green-600">You save {formatPrice(couponDiscount)}</p>
                </div>
                <button onClick={removeCoupon} className="text-red-400 hover:text-red-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  placeholder="Enter code"
                  className="input flex-1 text-sm uppercase"
                />
                <button onClick={handleApplyCoupon} disabled={couponLoading || !couponInput}
                  className="btn-primary btn-sm px-4 disabled:opacity-50">
                  Apply
                </button>
              </div>
            )}
            <p className="text-xs text-neutral-400 mt-2">Try: WELCOME10, FLAT200, SUMMER25</p>
          </div>

          {/* Summary */}
          <div className="card p-5 space-y-3">
            <h3 className="text-base font-bold text-neutral-800">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal ({itemCount} items)</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount</span>
                  <span className="font-medium">-{formatPrice(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-600">
                <span>Shipping</span>
                <span className="font-medium">{shippingCost === 0 ? <span className="text-green-600">FREE</span> : formatPrice(shippingCost)}</span>
              </div>
              {shippingCost > 0 && (
                <p className="text-xs text-neutral-400">Add {formatPrice(999 - (subtotal - couponDiscount))} more for free shipping</p>
              )}
            </div>
            <div className="border-t border-neutral-100 pt-3 flex justify-between">
              <span className="font-bold text-neutral-900">Total</span>
              <span className="text-xl font-bold text-neutral-900">{formatPrice(total)}</span>
            </div>
            <button onClick={() => navigate('/checkout')} className="btn-primary w-full btn-lg mt-2">
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </button>
            <Link to="/products" className="block text-center text-sm text-neutral-500 hover:text-primary-600 transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
