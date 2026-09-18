import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { useState } from 'react';
import { StarRating } from '@/components/ui/StarRating';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { formatPrice, getDiscount, cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export default function ProductCard({ product }) {
  const [imgError, setImgError] = useState(false);
  const [hovering, setHovering] = useState(false);
  const { addToCart, isLoading } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const image = product.images?.[0]?.url;
  const hoverImage = product.images?.[1]?.url;
  const inWishlist = isInWishlist(product._id);

  const discount = getDiscount(product.price, product.compareAtPrice) || product.discountPercent || 0;

  const getStockBadge = () => {
    const stockStatus = product.stockStatus;
    if (stockStatus === 'out_of_stock' || (!product.hasVariants && product.stock === 0)) {
      return <span className="badge bg-red-50 text-red-600 text-[10px]">Out of Stock</span>;
    }
    if (stockStatus === 'low_stock' || (!product.hasVariants && product.stock <= 5)) {
      return <span className="badge bg-amber-50 text-amber-600 text-[10px]">Low Stock</span>;
    }
    return null;
  };

  const isOutOfStock = product.stockStatus === 'out_of_stock' || (!product.hasVariants && product.stock === 0);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (product.hasVariants) {
      navigate(`/products/${product.slug}`);
      return;
    }
    await addToCart(product._id);
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    await toggleWishlist(product._id);
  };

  return (
    <div
      className="card-hover group relative overflow-visible"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <Link to={`/products/${product.slug}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-neutral-100 rounded-t-2xl">
          <img
            src={!imgError ? (hovering && hoverImage ? hoverImage : image || '') : '/placeholder.jpg'}
            alt={product.name}
            onError={() => setImgError(true)}
            className={cn(
              'w-full h-full object-cover transition-all duration-500',
              hovering ? 'scale-105' : 'scale-100',
              isOutOfStock && 'opacity-60'
            )}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {discount > 0 && (
              <span className="badge bg-red-500 text-white text-[10px] font-bold px-2">-{discount}%</span>
            )}
            {product.isNewArrival && (
              <span className="badge bg-primary-500 text-white text-[10px] font-bold px-2">NEW</span>
            )}
            {product.isBestSeller && (
              <span className="badge bg-amber-500 text-white text-[10px] font-bold px-2">🔥 HOT</span>
            )}
            {getStockBadge()}
          </div>

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className={cn(
              'absolute top-3 right-3 p-2 rounded-full shadow-soft transition-all duration-200',
              inWishlist ? 'bg-red-50 text-red-500' : 'bg-white/90 text-neutral-400 opacity-0 group-hover:opacity-100',
              'hover:scale-110 active:scale-95'
            )}
          >
            <Heart className={cn('w-4 h-4', inWishlist && 'fill-red-500')} />
          </button>

          {/* Quick view (on hover) */}
          <div className={cn(
            'absolute bottom-3 right-3 transition-all duration-200',
            hovering ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          )}>
            <button
              onClick={(e) => { e.preventDefault(); navigate(`/products/${product.slug}`); }}
              className="p-2 bg-white/90 rounded-full shadow-soft hover:bg-white transition-colors block"
              aria-label="Quick view"
            >
              <Eye className="w-4 h-4 text-neutral-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pb-3">
          {product.brand && (
            <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">{product.brand}</p>
          )}
          <h3 className="text-sm font-semibold text-neutral-800 leading-snug mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              <StarRating rating={product.averageRating} size="xs" />
              <span className="text-[11px] text-neutral-500">({product.reviewCount})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-neutral-900">{formatPrice(product.price)}</span>
            {product.compareAtPrice > product.price && (
              <span className="text-xs text-neutral-400 line-through">{formatPrice(product.compareAtPrice)}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Add to Cart */}
      <div className="px-4 pb-4">
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || isLoading}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
            isOutOfStock
              ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              : 'bg-neutral-900 text-white hover:bg-primary-600 active:bg-primary-700 hover:shadow-md'
          )}
        >
          <ShoppingCart className="w-4 h-4" />
          {isOutOfStock ? 'Out of Stock' : product.hasVariants ? 'Select Options' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
