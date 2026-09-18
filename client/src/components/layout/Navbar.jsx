import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, ShoppingCart, Heart, User, Menu, X, ChevronDown,
  LogOut, Package, Settings, Bell, Home, Grid3X3
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { cn, debounce } from '@/lib/utils';
import api from '@/services/api';

const CATEGORIES = [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Fashion', slug: 'fashion' },
  { name: 'Home & Living', slug: 'home-living' },
  { name: 'Sports & Fitness', slug: 'sports-fitness' },
  { name: 'Books', slug: 'books' },
  { name: 'Beauty', slug: 'beauty-personal-care' },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { itemCount } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setSearchOpen(false);
  }, [location]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = debounce(async (q) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const { data } = await api.get('/products', { params: { search: q, limit: 6 } });
      setSearchResults(data.data.products || []);
    } catch (e) {
      setSearchResults([]);
    }
    setSearchLoading(false);
  }, 350);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    doSearch(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchResults([]);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const wishlistCount = wishlistItems?.length || 0;

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-primary-600 text-white text-xs text-center py-2 px-4 font-medium">
        🎉 Free shipping on orders above ₹999 &nbsp;|&nbsp; Use code <strong>WELCOME10</strong> for 10% off
      </div>

      <nav className={cn(
        'sticky top-0 z-50 bg-white border-b border-neutral-100 transition-shadow duration-300',
        scrolled ? 'shadow-soft' : ''
      )}>
        <div className="container-fluid">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Grid3X3 className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold font-display text-primary-600 tracking-tight">ShopSphere</span>
            </Link>

            {/* Desktop Categories */}
            <nav className="hidden lg:flex items-center gap-6 ml-8">
              <NavLink to="/" className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}>Home</NavLink>
              {CATEGORIES.slice(0, 5).map((cat) => (
                <NavLink key={cat.slug} to={`/products?category=${cat.slug}`} className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}>
                  {cat.name}
                </NavLink>
              ))}
              <NavLink to="/products" className="nav-link">All</NavLink>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Search Toggle */}
              <button
                onClick={() => { setSearchOpen(!searchOpen); setUserMenuOpen(false); }}
                className="p-2.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Wishlist */}
              {isAuthenticated && (
                <Link to="/wishlist" className="relative p-2.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors">
                  <Heart className="w-5 h-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {wishlistCount > 9 ? '9+' : wishlistCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Cart */}
              <Link to="/cart" className="relative p-2.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>

              {/* User menu */}
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => { setUserMenuOpen(!userMenuOpen); setSearchOpen(false); }}
                    className="flex items-center gap-1.5 p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-700 text-sm font-semibold">
                        {user?.firstName?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <ChevronDown className={cn('w-4 h-4 hidden md:block transition-transform', userMenuOpen && 'rotate-180')} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-12 w-56 card shadow-elevated animate-scale-in z-50">
                      <div className="p-3 border-b border-neutral-100">
                        <p className="text-sm font-semibold text-neutral-900">{user?.fullName || `${user?.firstName} ${user?.lastName}`}</p>
                        <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                      </div>
                      <div className="p-1.5">
                        {user?.role === 'admin' && (
                          <Link to="/admin" className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors">
                            <Settings className="w-4 h-4" /> Admin Dashboard
                          </Link>
                        )}
                        <Link to="/account" className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors">
                          <User className="w-4 h-4" /> My Account
                        </Link>
                        <Link to="/account/orders" className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors">
                          <Package className="w-4 h-4" /> My Orders
                        </Link>
                        <Link to="/notifications" className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors">
                          <Bell className="w-4 h-4" /> Notifications
                        </Link>
                        <hr className="my-1 border-neutral-100" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="hidden md:block btn-outline btn-sm">Sign in</Link>
                  <Link to="/register" className="btn-primary btn-sm">Join</Link>
                </div>
              )}

              {/* Mobile menu */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2.5 text-neutral-500 hover:text-neutral-700 rounded-xl transition-colors"
                aria-label="Menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Search Bar */}
        {searchOpen && (
          <div className="border-t border-neutral-100 py-3 animate-slide-down" ref={searchRef}>
            <div className="container-fluid">
              <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search products, categories, brands..."
                  className="w-full pl-12 pr-10 py-3 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  autoFocus
                />
                {searchQuery && (
                  <button type="button" onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Search Suggestions */}
                {(searchResults.length > 0 || searchLoading) && (
                  <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-elevated border border-neutral-100 overflow-hidden z-50">
                    {searchLoading ? (
                      <div className="p-4 text-center text-sm text-neutral-500">Searching...</div>
                    ) : (
                      <>
                        {searchResults.map((product) => (
                          <Link
                            key={product._id}
                            to={`/products/${product.slug}`}
                            onClick={() => { setSearchOpen(false); setSearchResults([]); setSearchQuery(''); }}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors border-b border-neutral-50 last:border-0"
                          >
                            <img src={product.images?.[0]?.url || '/placeholder.jpg'} alt={product.name}
                              className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-neutral-800 truncate">{product.name}</p>
                              <p className="text-xs text-primary-600 font-semibold">₹{product.price?.toLocaleString()}</p>
                            </div>
                          </Link>
                        ))}
                        {searchResults.length > 0 && (
                          <button
                            type="submit"
                            className="w-full py-3 text-sm text-primary-600 font-semibold hover:bg-primary-50 transition-colors"
                          >
                            See all results for "{searchQuery}"
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-neutral-100 bg-white animate-slide-down">
            <div className="container-fluid py-4 space-y-1">
              <NavLink to="/" className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700">
                <Home className="w-4 h-4" /> Home
              </NavLink>
              <NavLink to="/products" className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700">
                <Grid3X3 className="w-4 h-4" /> All Products
              </NavLink>
              {CATEGORIES.map((cat) => (
                <NavLink key={cat.slug} to={`/products?category=${cat.slug}`}
                  className="px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-600 hover:bg-primary-50 hover:text-primary-700 block pl-10">
                  {cat.name}
                </NavLink>
              ))}
              {!isAuthenticated && (
                <div className="flex gap-3 pt-3 border-t border-neutral-100 mt-3">
                  <Link to="/login" className="flex-1 btn-outline text-center text-sm py-2.5">Sign in</Link>
                  <Link to="/register" className="flex-1 btn-primary text-center text-sm py-2.5">Register</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
