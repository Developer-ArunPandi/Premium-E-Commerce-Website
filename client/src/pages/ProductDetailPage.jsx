import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Heart, Share2, ChevronLeft, ChevronRight,
  Star, Package, Shield, RotateCcw, Truck, Plus, Minus, Check, ZoomIn
} from 'lucide-react';
import api from '@/services/api';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { StarRating } from '@/components/ui/StarRating';
import ProductCard from '@/components/product/ProductCard';
import { formatPrice, formatDate, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, isLoading: cartLoading } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('description');

  const inWishlist = product ? isInWishlist(product._id) : false;

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products/${slug}`);
        const p = res.data.data.product;
        setProduct(p);

        // Fetch reviews
        const revRes = await api.get(`/reviews/product/${p._id}`, { params: { limit: 5 } });
        setReviews(revRes.data.data.reviews || []);

        // Fetch related products
        if (p.category?._id) {
          const relRes = await api.get('/products', {
            params: { category: p.category.slug, limit: 4 }
          });
          setRelatedProducts((relRes.data.data.products || []).filter((rp) => rp._id !== p._id).slice(0, 4));
        }
      } catch (e) {
        navigate('/products', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo({ top: 0 });
  }, [slug]);

  if (loading) {
    return (
      <div className="container-fluid py-8">
        <div className="grid md:grid-cols-2 gap-8 animate-pulse">
          <div className="space-y-3">
            <div className="aspect-square bg-neutral-200 rounded-2xl" />
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => <div key={i} className="w-20 h-20 bg-neutral-200 rounded-xl" />)}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-8 bg-neutral-200 rounded w-3/4" />
            <div className="h-6 bg-neutral-200 rounded w-1/2" />
            <div className="h-10 bg-neutral-200 rounded w-1/3" />
            <div className="h-4 bg-neutral-200 rounded w-full" />
            <div className="h-4 bg-neutral-200 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const currentPrice = selectedVariant?.price || product.price;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isOutOfStock = currentStock === 0;
  const maxQty = Math.min(currentStock, 10);

  // Group variants by name
  const variantGroups = {};
  product.variants?.forEach((v) => {
    if (!variantGroups[v.name]) variantGroups[v.name] = [];
    variantGroups[v.name].push(v);
  });

  const handleAddToCart = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (product.hasVariants && !selectedVariant) {
      toast.error('Please select a variant first');
      return;
    }
    await addToCart(product._id, selectedVariant?._id, quantity);
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (product.hasVariants && !selectedVariant) {
      toast.error('Please select a variant first');
      return;
    }
    const success = await addToCart(product._id, selectedVariant?._id, quantity);
    if (success) navigate('/cart');
  };

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    return { star, count, percent: reviews.length > 0 ? (count / reviews.length) * 100 : 0 };
  });

  return (
    <div className="bg-white min-h-screen">
      <div className="container-fluid py-6 md:py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-neutral-500 mb-6">
          <Link to="/" className="hover:text-primary-600">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-primary-600">Products</Link>
          {product.category && <><span>/</span>
            <Link to={`/products?category=${product.category.slug}`} className="hover:text-primary-600">{product.category.name}</Link>
          </>}
          <span>/</span>
          <span className="text-neutral-700 truncate max-w-[200px]">{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div className="space-y-3">
            {/* Main Image */}
            <div className="relative aspect-square bg-neutral-50 rounded-2xl overflow-hidden border border-neutral-100 group">
              <img
                src={product.images?.[selectedImage]?.url || '/placeholder.jpg'}
                alt={product.name}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
              />
              {product.images?.length > 1 && (
                <>
                  <button onClick={() => setSelectedImage((p) => Math.max(p - 1, 0))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white shadow-card rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronLeft className="w-4 h-4 text-neutral-700" />
                  </button>
                  <button onClick={() => setSelectedImage((p) => Math.min(p + 1, (product.images?.length || 1) - 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white shadow-card rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-4 h-4 text-neutral-700" />
                  </button>
                </>
              )}
              {product.images?.[selectedImage]?.url && (
                <div className="absolute bottom-3 right-3 p-2 bg-white/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="w-4 h-4 text-neutral-500" />
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      'flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all',
                      selectedImage === i ? 'border-primary-500 shadow-soft' : 'border-neutral-200 hover:border-primary-300'
                    )}
                  >
                    <img src={img.url} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-5">
            {/* Brand & Name */}
            {product.brand && (
              <span className="text-xs font-bold text-primary-600 uppercase tracking-widest bg-primary-50 px-2.5 py-1 rounded-full">
                {product.brand}
              </span>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 font-display leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <StarRating rating={product.averageRating} size="sm" showValue />
              <span className="text-sm text-neutral-500">({product.reviewCount} reviews)</span>
              {product.soldCount > 0 && <span className="text-xs text-neutral-400">• {product.soldCount} sold</span>}
            </div>

            {/* Price */}
            <div className="flex items-end gap-3 py-2 border-y border-neutral-100">
              <span className="text-3xl font-bold text-neutral-900">{formatPrice(currentPrice)}</span>
              {product.compareAtPrice > currentPrice && (
                <>
                  <span className="text-lg text-neutral-400 line-through mb-1">{formatPrice(product.compareAtPrice)}</span>
                  <span className="text-sm font-bold text-green-600 mb-1">
                    Save {Math.round(((product.compareAtPrice - currentPrice) / product.compareAtPrice) * 100)}%
                  </span>
                </>
              )}
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-sm text-neutral-600 leading-relaxed">{product.shortDescription}</p>
            )}

            {/* Variants */}
            {product.hasVariants && Object.entries(variantGroups).map(([groupName, variants]) => (
              <div key={groupName}>
                <p className="text-sm font-semibold text-neutral-700 mb-2">
                  {groupName}: {selectedVariant?.value && <span className="text-primary-600">{selectedVariant.value}</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant) => (
                    <button
                      key={variant._id}
                      onClick={() => setSelectedVariant(selectedVariant?._id === variant._id ? null : variant)}
                      disabled={!variant.isActive || variant.stock === 0}
                      className={cn(
                        'px-4 py-2 border-2 rounded-xl text-sm font-medium transition-all',
                        selectedVariant?._id === variant._id
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : variant.stock === 0
                          ? 'border-neutral-200 text-neutral-300 cursor-not-allowed line-through'
                          : 'border-neutral-200 hover:border-primary-300 text-neutral-700'
                      )}
                    >
                      {variant.value}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Quantity */}
            <div>
              <p className="text-sm font-semibold text-neutral-700 mb-2">Quantity</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="px-3 py-2.5 text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 transition-colors">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2.5 font-semibold text-neutral-900 min-w-[3rem] text-center">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                    disabled={quantity >= maxQty || isOutOfStock}
                    className="px-3 py-2.5 text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Stock indicator */}
                <div className="text-sm">
                  {isOutOfStock ? (
                    <span className="text-red-500 font-medium">Out of Stock</span>
                  ) : currentStock <= 5 ? (
                    <span className="text-amber-600 font-medium">Only {currentStock} left!</span>
                  ) : (
                    <span className="text-green-600 font-medium flex items-center gap-1"><Check className="w-4 h-4" /> In Stock</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || cartLoading || (product.hasVariants && !selectedVariant)}
                className="flex-1 btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartLoading ? 'Adding...' : 'Add to Cart'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock || (product.hasVariants && !selectedVariant)}
                className="flex-1 btn-secondary btn-lg border border-primary-200 hover:bg-primary-50 disabled:opacity-50"
              >
                Buy Now
              </button>
              <button
                onClick={() => { if (!isAuthenticated) navigate('/login'); else toggleWishlist(product._id); }}
                className={cn(
                  'p-4 border rounded-2xl transition-all',
                  inWishlist ? 'border-red-200 bg-red-50 text-red-500' : 'border-neutral-200 text-neutral-500 hover:border-red-200 hover:bg-red-50 hover:text-red-500'
                )}
              >
                <Heart className={cn('w-5 h-5', inWishlist && 'fill-red-500')} />
              </button>
            </div>

            {/* Trust Signals */}
            <div className="grid grid-cols-3 gap-3 py-4 border-y border-neutral-100">
              <div className="flex flex-col items-center gap-1 text-center">
                <Truck className="w-5 h-5 text-primary-500" />
                <span className="text-xs text-neutral-600 font-medium">Free Delivery</span>
                <span className="text-[10px] text-neutral-400">Above ₹999</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <RotateCcw className="w-5 h-5 text-primary-500" />
                <span className="text-xs text-neutral-600 font-medium">30-Day Returns</span>
                <span className="text-[10px] text-neutral-400">Easy returns</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <Shield className="w-5 h-5 text-primary-500" />
                <span className="text-xs text-neutral-600 font-medium">Secure Payment</span>
                <span className="text-[10px] text-neutral-400">100% safe</span>
              </div>
            </div>

            {/* SKU / Category */}
            <div className="text-xs text-neutral-500 space-y-1">
              {product.sku && <p>SKU: <span className="text-neutral-700">{product.sku}</span></p>}
              {product.category && <p>Category: <Link to={`/products?category=${product.category.slug}`} className="text-primary-600 hover:underline">{product.category.name}</Link></p>}
              {product.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {product.tags.map((tag) => (
                    <Link key={tag} to={`/products?tags=${tag}`} className="px-2 py-0.5 bg-neutral-100 rounded-full text-neutral-600 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs: Description, Specs, Reviews */}
        <div className="mt-12">
          <div className="flex gap-1 border-b border-neutral-200 overflow-x-auto">
            {['description', 'specifications', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-6 py-3 text-sm font-semibold capitalize whitespace-nowrap transition-colors border-b-2 -mb-px',
                  activeTab === tab ? 'text-primary-600 border-primary-600' : 'text-neutral-500 border-transparent hover:text-neutral-700'
                )}
              >
                {tab === 'reviews' ? `Reviews (${product.reviewCount || 0})` : tab}
              </button>
            ))}
          </div>

          <div className="py-8">
            {activeTab === 'description' && (
              <div className="prose prose-sm max-w-none text-neutral-700 leading-relaxed whitespace-pre-line">
                {product.description}
              </div>
            )}

            {activeTab === 'specifications' && product.specifications?.length > 0 && (
              <div className="max-w-2xl">
                <table className="w-full text-sm">
                  <tbody>
                    {product.specifications.map((spec, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-neutral-50' : 'bg-white'}>
                        <td className="px-4 py-3 font-medium text-neutral-600 w-1/3">{spec.key}</td>
                        <td className="px-4 py-3 text-neutral-800">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6 max-w-3xl">
                {/* Rating Summary */}
                <div className="flex gap-8 items-start p-6 bg-neutral-50 rounded-2xl">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-neutral-900">{product.averageRating?.toFixed(1) || '0.0'}</div>
                    <StarRating rating={product.averageRating || 0} size="sm" className="justify-center mt-2" />
                    <p className="text-xs text-neutral-500 mt-1">{product.reviewCount} reviews</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {ratingDistribution.map(({ star, count, percent }) => (
                      <div key={star} className="flex items-center gap-3 text-sm">
                        <span className="text-neutral-600 w-8">{star}★</span>
                        <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="text-neutral-500 w-6 text-xs">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reviews List */}
                {reviews.length === 0 ? (
                  <div className="text-center py-10 text-neutral-500">
                    <Star className="w-10 h-10 mx-auto mb-3 text-neutral-300" />
                    <p>No reviews yet. Be the first to review this product!</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review._id} className="border-b border-neutral-100 pb-6">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-700 font-semibold">{review.user?.firstName?.[0]}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-neutral-800">{review.user?.firstName} {review.user?.lastName}</p>
                            <div className="flex items-center gap-2">
                              <StarRating rating={review.rating} size="xs" />
                              {review.isVerifiedPurchase && (
                                <span className="text-[10px] badge bg-green-50 text-green-600">✓ Verified</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-neutral-400">{formatDate(review.createdAt)}</span>
                      </div>
                      {review.title && <h4 className="text-sm font-semibold text-neutral-800 mb-1">{review.title}</h4>}
                      <p className="text-sm text-neutral-600 leading-relaxed">{review.body}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="section-title mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
