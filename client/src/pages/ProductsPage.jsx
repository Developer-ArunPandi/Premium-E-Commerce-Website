import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Filter, X, ChevronDown, ChevronUp, SlidersHorizontal, Grid, List, Search } from 'lucide-react';
import api from '@/services/api';
import ProductCard from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { debounce, formatPrice } from '@/lib/utils';

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popularity', label: 'Most Popular' },
];

const PRICE_RANGES = [
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 - ₹2,000', min: 500, max: 2000 },
  { label: '₹2,000 - ₹10,000', min: 2000, max: 10000 },
  { label: '₹10,000 - ₹50,000', min: 10000, max: 50000 },
  { label: 'Above ₹50,000', min: 50000, max: undefined },
];

const RATING_OPTIONS = [4, 3, 2];

function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-neutral-100 py-4">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full text-sm font-semibold text-neutral-800 mb-2">
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);

  const page = parseInt(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const minRating = searchParams.get('minRating') || '';
  const sort = searchParams.get('sort') || '-createdAt';
  const availability = searchParams.get('availability') || '';
  const featured = searchParams.get('featured') || '';
  const newArrival = searchParams.get('newArrival') || '';
  const bestSeller = searchParams.get('bestSeller') || '';

  const LIMIT = 12;

  const setParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    setSearchParams(params);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    setSearchParams(params);
  };

  const hasFilters = category || brand || minPrice || maxPrice || minRating || availability || featured || newArrival || bestSeller;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = { page, limit: LIMIT, sort };
        if (search) params.search = search;
        if (category) params.category = category;
        if (brand) params.brand = brand;
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;
        if (minRating) params.minRating = minRating;
        if (availability) params.availability = availability;
        if (featured) params.featured = featured;
        if (newArrival) params.newArrival = newArrival;
        if (bestSeller) params.bestSeller = bestSeller;

        const res = await api.get('/products', { params });
        setProducts(res.data.data.products || []);
        setTotal(res.data.meta?.total || 0);
      } catch (e) {
        setProducts([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [searchParams]);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get('/categories'),
          api.get('/products/brands'),
        ]);
        setCategories(catRes.data.data.categories || []);
        setBrands(brandRes.data.data.brands || []);
      } catch (e) {}
    };
    fetchMeta();
  }, []);

  const totalPages = Math.ceil(total / LIMIT);

  const FiltersContent = () => (
    <div className="space-y-0">
      {/* Search */}
      <FilterSection title="Search">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search products..."
            defaultValue={search}
            onChange={debounce((e) => setParam('search', e.target.value), 400)}
            className="input pl-9 text-xs"
          />
        </div>
      </FilterSection>

      {/* Categories */}
      <FilterSection title="Category">
        <div className="space-y-1">
          <button onClick={() => setParam('category', '')}
            className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${!category ? 'text-primary-600 font-semibold bg-primary-50' : 'text-neutral-600 hover:bg-neutral-50'}`}>
            All Categories
          </button>
          {categories.map((cat) => (
            <button key={cat._id} onClick={() => setParam('category', cat.slug)}
              className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${category === cat.slug ? 'text-primary-600 font-semibold bg-primary-50' : 'text-neutral-600 hover:bg-neutral-50'}`}>
              {cat.name}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range">
        <div className="space-y-1">
          {PRICE_RANGES.map((range) => {
            const isActive = minPrice == range.min && ((!range.max && !maxPrice) || maxPrice == range.max);
            return (
              <button key={range.label}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set('minPrice', range.min);
                  if (range.max) params.set('maxPrice', range.max);
                  else params.delete('maxPrice');
                  params.set('page', '1');
                  setSearchParams(params);
                }}
                className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${isActive ? 'text-primary-600 font-semibold bg-primary-50' : 'text-neutral-600 hover:bg-neutral-50'}`}>
                {range.label}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Customer Rating">
        <div className="space-y-1">
          {RATING_OPTIONS.map((r) => (
            <button key={r} onClick={() => setParam('minRating', minRating == r ? '' : r)}
              className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${minRating == r ? 'text-primary-600 bg-primary-50' : 'text-neutral-600 hover:bg-neutral-50'}`}>
              <span className="text-amber-400">{'★'.repeat(r)}</span>
              <span className="text-neutral-400">{'☆'.repeat(5 - r)}</span>
              <span>& above</span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Availability */}
      <FilterSection title="Availability">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-700">
          <input type="checkbox" checked={availability === 'in_stock'}
            onChange={(e) => setParam('availability', e.target.checked ? 'in_stock' : '')}
            className="w-4 h-4 rounded border-neutral-300 text-primary-600" />
          In Stock Only
        </label>
      </FilterSection>

      {/* Brands */}
      {brands.length > 0 && (
        <FilterSection title="Brand" defaultOpen={false}>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {brands.map((b) => (
              <button key={b} onClick={() => setParam('brand', brand === b ? '' : b)}
                className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${brand === b ? 'text-primary-600 font-semibold bg-primary-50' : 'text-neutral-600 hover:bg-neutral-50'}`}>
                {b}
              </button>
            ))}
          </div>
        </FilterSection>
      )}
    </div>
  );

  return (
    <div className="container-fluid py-6 md:py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-neutral-500 mb-6">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <span>/</span>
        <span className="text-neutral-700 font-medium">Products</span>
        {category && <><span>/</span><span className="text-neutral-700 font-medium capitalize">{category.replace(/-/g, ' ')}</span></>}
      </div>

      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-60 flex-shrink-0">
          <div className="card p-4 sticky top-20">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-neutral-900">Filters</h2>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            <FiltersContent />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-lg font-bold text-neutral-900">
                {search ? `Results for "${search}"` : category ? category.replace(/-/g, ' ') : 'All Products'}
              </h1>
              <p className="text-sm text-neutral-500">{total} products found</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Mobile filter button */}
              <button onClick={() => setFilterOpen(true)}
                className="lg:hidden btn-outline btn-sm flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4" /> Filters
                {hasFilters && <span className="w-4 h-4 bg-primary-600 text-white text-[10px] rounded-full flex items-center justify-center">!</span>}
              </button>

              {/* Sort */}
              <select value={sort} onChange={(e) => setParam('sort', e.target.value)}
                className="input text-xs py-2 w-auto pr-8 cursor-pointer">
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Active filters */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 mb-5">
              {category && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">
                  {category.replace(/-/g, ' ')}
                  <button onClick={() => setParam('category', '')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {brand && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">
                  Brand: {brand}
                  <button onClick={() => setParam('brand', '')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">
                  {minPrice && maxPrice ? `₹${minPrice} - ₹${maxPrice}` : minPrice ? `Above ₹${minPrice}` : `Below ₹${maxPrice}`}
                  <button onClick={() => { setParam('minPrice', ''); setParam('maxPrice', ''); }}><X className="w-3 h-3" /></button>
                </span>
              )}
              {minRating && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">
                  {minRating}★ & above
                  <button onClick={() => setParam('minRating', '')}><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          )}

          {/* Products */}
          {loading ? (
            <ProductGridSkeleton count={LIMIT} />
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-neutral-800 mb-2">No products found</h3>
              <p className="text-neutral-500 mb-6">Try adjusting your filters or search query</p>
              <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  <button
                    onClick={() => setParam('page', page - 1)}
                    disabled={page === 1}
                    className="btn-outline btn-sm disabled:opacity-40"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setParam('page', pageNum)}
                        className={`w-8 h-8 text-sm rounded-lg font-medium transition-colors ${pageNum === page ? 'bg-primary-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setParam('page', page + 1)}
                    disabled={page >= totalPages}
                    className="btn-outline btn-sm disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {filterOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/30" onClick={() => setFilterOpen(false)} />
          <div className="relative z-50 ml-auto w-80 bg-white h-full overflow-y-auto shadow-modal animate-slide-up">
            <div className="sticky top-0 bg-white border-b border-neutral-100 p-4 flex items-center justify-between z-10">
              <h3 className="font-bold text-neutral-900">Filters</h3>
              <div className="flex items-center gap-3">
                {hasFilters && <button onClick={clearFilters} className="text-xs text-red-500 font-medium">Clear All</button>}
                <button onClick={() => setFilterOpen(false)} className="p-1 text-neutral-400"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-4">
              <FiltersContent />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
