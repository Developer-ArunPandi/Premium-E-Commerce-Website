import { create } from 'zustand';
import api from '@/services/api';
import toast from 'react-hot-toast';

export const useWishlistStore = create((set, get) => ({
  items: [],
  isLoading: false,

  fetchWishlist: async () => {
    try {
      const { data } = await api.get('/wishlist');
      set({ items: data.data.wishlist?.items || [] });
    } catch (error) {
      console.error('Fetch wishlist error:', error);
    }
  },

  addToWishlist: async (productId) => {
    try {
      await api.post('/wishlist/add', { productId });
      await get().fetchWishlist();
      toast.success('Added to wishlist');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to wishlist');
      return false;
    }
  },

  removeFromWishlist: async (productId) => {
    try {
      await api.delete(`/wishlist/remove/${productId}`);
      set((state) => ({
        items: state.items.filter((item) => item.product?._id !== productId && item.product !== productId),
      }));
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove from wishlist');
    }
  },

  isInWishlist: (productId) => {
    const { items } = get();
    return items.some((item) => {
      const id = item.product?._id || item.product;
      return id === productId || id?.toString() === productId?.toString();
    });
  },

  toggleWishlist: async (productId) => {
    if (get().isInWishlist(productId)) {
      await get().removeFromWishlist(productId);
    } else {
      await get().addToWishlist(productId);
    }
  },
}));
