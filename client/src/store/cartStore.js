import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/services/api';
import toast from 'react-hot-toast';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      itemCount: 0,
      couponCode: null,
      couponDiscount: 0,
      isLoading: false,
      shippingCost: 49,

      fetchCart: async () => {
        const { data } = await api.get('/cart');
        const cart = data.data.cart;
        const shipping = cart.subtotal >= 999 ? 0 : 49;
        set({
          items: cart.items || [],
          subtotal: cart.subtotal || 0,
          itemCount: cart.itemCount || 0,
          couponCode: cart.couponCode || null,
          couponDiscount: cart.couponDiscount || 0,
          shippingCost: shipping,
        });
      },

      addToCart: async (productId, variantId = null, quantity = 1) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/cart/add', { productId, variantId, quantity });
          const cart = data.data.cart;
          const shipping = (cart.subtotal || 0) >= 999 ? 0 : 49;
          set({
            items: cart.items || [],
            subtotal: cart.subtotal || 0,
            itemCount: cart.itemCount || 0,
            isLoading: false,
            shippingCost: shipping,
          });
          toast.success('Added to cart');
          return true;
        } catch (error) {
          set({ isLoading: false });
          toast.error(error.response?.data?.message || 'Failed to add to cart');
          return false;
        }
      },

      updateItem: async (itemId, quantity) => {
        set({ isLoading: true });
        try {
          const { data } = await api.patch(`/cart/item/${itemId}`, { quantity });
          const cart = data.data.cart;
          const shipping = (cart.subtotal || 0) >= 999 ? 0 : 49;
          set({
            items: cart.items || [],
            subtotal: cart.subtotal || 0,
            itemCount: cart.itemCount || 0,
            isLoading: false,
            shippingCost: shipping,
          });
        } catch (error) {
          set({ isLoading: false });
          toast.error(error.response?.data?.message || 'Failed to update cart');
        }
      },

      removeItem: async (itemId) => {
        try {
          await api.delete(`/cart/item/${itemId}`);
          await get().fetchCart();
          toast.success('Item removed');
        } catch (error) {
          toast.error('Failed to remove item');
        }
      },

      clearCart: async () => {
        try {
          await api.delete('/cart/clear');
          set({ items: [], subtotal: 0, itemCount: 0, couponCode: null, couponDiscount: 0, shippingCost: 49 });
        } catch (error) {
          console.error('Clear cart error:', error);
        }
      },

      applyCoupon: async (couponCode) => {
        try {
          const { data } = await api.post('/cart/coupon', { couponCode });
          set({ couponCode: data.data.coupon, couponDiscount: data.data.discount });
          toast.success('Coupon applied!');
          return { success: true, discount: data.data.discount };
        } catch (error) {
          toast.error(error.response?.data?.message || 'Invalid coupon');
          return { success: false };
        }
      },

      removeCoupon: async () => {
        try {
          await api.delete('/cart/coupon');
          set({ couponCode: null, couponDiscount: 0 });
          toast.success('Coupon removed');
        } catch (error) {
          console.error('Remove coupon error:', error);
        }
      },

      getTotal: () => {
        const { subtotal, couponDiscount, shippingCost } = get();
        return Math.max(subtotal - couponDiscount + shippingCost, 0);
      },

      resetCart: () => {
        set({ items: [], subtotal: 0, itemCount: 0, couponCode: null, couponDiscount: 0, shippingCost: 49 });
      },
    }),
    {
      name: 'shopsphere-cart',
      partialize: (state) => ({ itemCount: state.itemCount }),
    }
  )
);
