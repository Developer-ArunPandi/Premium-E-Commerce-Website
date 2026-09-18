import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { formatPrice, getDiscount } from '@/lib/utils';

export default function WishlistPage() {
  const { items, fetchWishlist, removeFromWishlist } = useWishlistStore();
  const { addToCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) fetchWishlist();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="container-fluid py-20 text-center">
        <Heart className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Your wishlist is empty</h2>
        <p className="text-neutral-500 mb-6">Sign in to save and view your wishlist</p>
        <Link to="/login" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-fluid py-20 text-center">
        <Heart className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Your wishlist is empty</h2>
        <p className="text-neutral-500 mb-6">Save products you love to buy them later</p>
        <Link to="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="container-fluid py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Wishlist <span className="text-neutral-400 font-normal text-lg">({items.length} items)</span></h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((item) => {
          const product = item.product;
          if (!product) return null;
          const discount = getDiscount(product.price, product.compareAtPrice);

          return (
            <div key={item._id} className="card-hover group relative">
              <Link to={`/products/${product.slug}`} className="block">
                <div className="relative aspect-square bg-neutral-100 rounded-t-2xl overflow-hidden">
                  <img src={product.images?.[0]?.url} alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  {discount > 0 && (
                    <span className="absolute top-2 left-2 badge bg-red-500 text-white text-[10px] font-bold">-{discount}%</span>
                  )}
                </div>
                <div className="p-3">
                  {product.brand && <p className="text-[10px] text-neutral-400 font-semibold uppercase">{product.brand}</p>}
                  <h3 className="text-sm font-semibold text-neutral-800 line-clamp-2 group-hover:text-primary-600 transition-colors">{product.name}</h3>
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <span className="text-sm font-bold text-neutral-900">{formatPrice(product.price)}</span>
                    {product.compareAtPrice > product.price && (
                      <span className="text-xs text-neutral-400 line-through">{formatPrice(product.compareAtPrice)}</span>
                    )}
                  </div>
                </div>
              </Link>

              <div className="px-3 pb-3 flex gap-2">
                <button onClick={() => addToCart(product._id)}
                  disabled={product.stock === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  <ShoppingCart className="w-3 h-3" />
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
                <button onClick={() => removeFromWishlist(product._id)}
                  className="p-2 border border-neutral-200 rounded-xl text-neutral-400 hover:text-red-500 hover:border-red-200 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
