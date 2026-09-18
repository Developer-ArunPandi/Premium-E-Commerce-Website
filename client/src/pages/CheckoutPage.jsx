import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Check, MapPin, CreditCard, ShoppingBag, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { formatPrice, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 1, label: 'Address', icon: MapPin },
  { id: 2, label: 'Review', icon: ShoppingBag },
  { id: 3, label: 'Payment', icon: CreditCard },
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry',
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, subtotal, couponCode, couponDiscount, shippingCost, getTotal, resetCart } = useCartStore();

  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [processing, setProcessing] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
      return;
    }
    const fetchAddresses = async () => {
      try {
        const { data } = await api.get('/auth/addresses');
        const addrs = data.data.addresses || [];
        setAddresses(addrs);
        const def = addrs.find((a) => a.isDefault);
        if (def) setSelectedAddressId(def._id);
        else if (addrs.length === 0) setShowNewAddress(true);
      } catch (e) {
        setShowNewAddress(true);
      }
    };
    fetchAddresses();
  }, []);

  const handleAddAddress = async (formData) => {
    try {
      const { data } = await api.post('/auth/addresses', formData);
      const addrs = data.data.addresses;
      setAddresses(addrs);
      const newAddr = addrs[addrs.length - 1];
      setSelectedAddressId(newAddr._id);
      setShowNewAddress(false);
      toast.success('Address added');
    } catch (e) {
      toast.error('Failed to save address');
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId && !showNewAddress) {
      toast.error('Please select a delivery address');
      return;
    }
    setProcessing(true);
    try {
      if (paymentMethod === 'razorpay') {
        // Create Razorpay order
        const { data } = await api.post('/orders/create-payment', {
          addressId: selectedAddressId,
          couponCode,
        });

        const loaded = await loadRazorpayScript();
        if (!loaded) {
          toast.error('Payment service unavailable. Please try again.');
          setProcessing(false);
          return;
        }

        const options = {
          key: data.data.keyId,
          amount: data.data.amount * 100,
          currency: 'INR',
          name: 'ShopSphere',
          description: 'Order Payment',
          order_id: data.data.razorpayOrderId,
          prefill: {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            contact: user.phone || '',
          },
          theme: { color: '#6366f1' },
          handler: async (response) => {
            try {
              const { data: orderData } = await api.post('/orders/confirm', {
                razorpayOrderId: data.data.razorpayOrderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                addressId: selectedAddressId,
                couponCode,
                paymentMethod: 'razorpay',
              });
              resetCart();
              toast.success('Order placed successfully!');
              navigate(`/account/orders/${orderData.data.order._id}?success=true`);
            } catch (e) {
              toast.error(e.response?.data?.message || 'Order confirmation failed');
              setProcessing(false);
            }
          },
          modal: {
            ondismiss: () => {
              setProcessing(false);
              toast.error('Payment cancelled');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // COD
        const { data: orderData } = await api.post('/orders/confirm', {
          addressId: selectedAddressId,
          couponCode,
          paymentMethod: 'cod',
        });
        resetCart();
        toast.success('Order placed successfully!');
        navigate(`/account/orders/${orderData.data.order._id}?success=true`);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to process order');
      setProcessing(false);
    }
  };

  const total = getTotal();

  return (
    <div className="container-fluid py-8 max-w-6xl">
      {/* Steps */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all',
              step >= s.id ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-400'
            )}>
              {step > s.id ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-neutral-300" />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left - Steps Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* STEP 1: Address */}
          {step === 1 && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-5 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-500" /> Delivery Address
              </h2>

              {/* Saved Addresses */}
              {addresses.length > 0 && !showNewAddress && (
                <div className="space-y-3 mb-5">
                  {addresses.map((addr) => (
                    <label key={addr._id}
                      className={cn(
                        'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                        selectedAddressId === addr._id ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:border-primary-200'
                      )}>
                      <input type="radio" name="address" value={addr._id} checked={selectedAddressId === addr._id}
                        onChange={() => setSelectedAddressId(addr._id)} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-neutral-800">{addr.fullName}</p>
                          {addr.isDefault && <span className="badge badge-primary text-[10px]">Default</span>}
                        </div>
                        <p className="text-sm text-neutral-600 mt-0.5">{addr.phone}</p>
                        <p className="text-sm text-neutral-600 mt-0.5">
                          {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, {addr.city}, {addr.state} - {addr.postalCode}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Add new address */}
              {showNewAddress ? (
                <form onSubmit={handleSubmit(handleAddAddress)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="label">Full Name</label>
                      <input {...register('fullName', { required: 'Required' })} placeholder="John Doe" className={`input ${errors.fullName ? 'input-error' : ''}`} />
                    </div>
                    <div className="col-span-2">
                      <label className="label">Phone Number</label>
                      <input {...register('phone', { required: 'Required' })} placeholder="+91 98765 43210" className={`input ${errors.phone ? 'input-error' : ''}`} />
                    </div>
                    <div className="col-span-2">
                      <label className="label">Address Line 1</label>
                      <input {...register('addressLine1', { required: 'Required' })} placeholder="House/Flat no., Building, Street" className={`input ${errors.addressLine1 ? 'input-error' : ''}`} />
                    </div>
                    <div className="col-span-2">
                      <label className="label">Address Line 2 <span className="text-neutral-400 font-normal">(optional)</span></label>
                      <input {...register('addressLine2')} placeholder="Area, Landmark" className="input" />
                    </div>
                    <div>
                      <label className="label">City</label>
                      <input {...register('city', { required: 'Required' })} placeholder="Mumbai" className={`input ${errors.city ? 'input-error' : ''}`} />
                    </div>
                    <div>
                      <label className="label">Postal Code</label>
                      <input {...register('postalCode', { required: 'Required', pattern: { value: /^\d{6}$/, message: '6-digit code' } })} placeholder="400001" className={`input ${errors.postalCode ? 'input-error' : ''}`} />
                    </div>
                    <div className="col-span-2">
                      <label className="label">State</label>
                      <select {...register('state', { required: 'Required' })} className={`input ${errors.state ? 'input-error' : ''}`}>
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" className="btn-primary">Save Address</button>
                    {addresses.length > 0 && (
                      <button type="button" onClick={() => setShowNewAddress(false)} className="btn-outline">Cancel</button>
                    )}
                  </div>
                </form>
              ) : (
                <button onClick={() => setShowNewAddress(true)} className="flex items-center gap-2 text-sm text-primary-600 font-semibold hover:text-primary-700 border border-dashed border-primary-300 rounded-xl px-4 py-3 w-full justify-center hover:bg-primary-50 transition-colors">
                  <Plus className="w-4 h-4" /> Add New Address
                </button>
              )}

              {!showNewAddress && selectedAddressId && (
                <button onClick={() => setStep(2)} className="btn-primary w-full mt-5">
                  Continue to Review <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* STEP 2: Review */}
          {step === 2 && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-5">Review Your Order</h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item._id} className="flex gap-4 py-3 border-b border-neutral-100 last:border-0">
                    <img src={item.image || '/placeholder.jpg'} alt={item.name}
                      className="w-16 h-16 object-cover rounded-xl border border-neutral-100 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-800 line-clamp-1">{item.name}</p>
                      {item.variantValue && <p className="text-xs text-neutral-500">{item.variantName}: {item.variantValue}</p>}
                      <p className="text-xs text-neutral-500 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-bold text-neutral-900 whitespace-nowrap">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Payment method */}
              <div className="mt-6">
                <h3 className="text-sm font-bold text-neutral-800 mb-3">Payment Method</h3>
                <div className="space-y-2">
                  <label className={cn('flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all', paymentMethod === 'razorpay' ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:border-primary-200')}>
                    <input type="radio" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} />
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">Online Payment</p>
                      <p className="text-xs text-neutral-500">UPI, Cards, Netbanking via Razorpay</p>
                    </div>
                    <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Recommended</span>
                  </label>
                  <label className={cn('flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all', paymentMethod === 'cod' ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:border-primary-200')}>
                    <input type="radio" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">Cash on Delivery</p>
                      <p className="text-xs text-neutral-500">Pay when your order arrives</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="btn-outline flex-1">Back</button>
                <button onClick={() => setStep(3)} className="btn-primary flex-1">
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Place Order */}
          {step === 3 && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-5">Confirm & Pay</h2>

              {/* Selected address */}
              {selectedAddressId && (() => {
                const addr = addresses.find((a) => a._id === selectedAddressId);
                return addr ? (
                  <div className="p-4 bg-neutral-50 rounded-xl mb-5">
                    <p className="text-xs text-neutral-500 mb-1">Delivering to:</p>
                    <p className="text-sm font-semibold">{addr.fullName}</p>
                    <p className="text-sm text-neutral-600">{addr.addressLine1}, {addr.city}, {addr.state} - {addr.postalCode}</p>
                    <p className="text-sm text-neutral-600">{addr.phone}</p>
                  </div>
                ) : null;
              })()}

              <button
                onClick={handlePlaceOrder}
                disabled={processing}
                className="btn-primary w-full btn-lg"
              >
                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                {processing ? 'Processing...' : paymentMethod === 'cod' ? `Place COD Order (${formatPrice(total)})` : `Pay ${formatPrice(total)}`}
              </button>

              <button onClick={() => setStep(2)} className="btn-ghost w-full mt-3">Back to Review</button>

              <p className="text-xs text-neutral-400 text-center mt-4">
                🔒 Your payment information is secure and encrypted
              </p>
            </div>
          )}
        </div>

        {/* Right - Summary */}
        <div>
          <div className="card p-5 sticky top-20">
            <h3 className="text-base font-bold text-neutral-800 mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm border-b border-neutral-100 pb-4 mb-4">
              {items.slice(0, 3).map((item) => (
                <div key={item._id} className="flex justify-between gap-2">
                  <span className="text-neutral-600 truncate flex-1">{item.name} ×{item.quantity}</span>
                  <span className="font-medium whitespace-nowrap">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              {items.length > 3 && <p className="text-xs text-neutral-400">+ {items.length - 3} more items</p>}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span><span>-{formatPrice(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-600">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? <span className="text-green-600">FREE</span> : formatPrice(shippingCost)}</span>
              </div>
              <div className="flex justify-between font-bold text-neutral-900 text-base pt-2 border-t border-neutral-100">
                <span>Total</span><span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
