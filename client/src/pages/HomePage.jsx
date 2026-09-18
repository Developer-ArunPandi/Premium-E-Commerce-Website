import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, RotateCcw, Headphones, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/services/api';
import ProductCard from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';

const HERO_SLIDES = [
  {
    title: 'Discover Products That Define You',
    subtitle: 'Premium quality, unbeatable prices. Your perfect shopping destination.',
    cta: 'Shop Now',
    to: '/products',
    bg: 'from-primary-900 via-primary-800 to-indigo-900',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
    badge: '🔥 New Season Sale',
  },
  {
    title: 'Electronics That Inspire Innovation',
    subtitle: 'The latest gadgets and tech accessories at your fingertips.',
    cta: 'Explore Tech',
    to: '/products?category=electronics',
    bg: 'from-neutral-900 via-neutral-800 to-primary-900',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800',
    badge: '⚡ Up to 40% Off',
  },
  {
    title: 'Fashion Forward, Always',
    subtitle: "Trending styles curated for today's modern lifestyle.",
    cta: 'Shop Fashion',
    to: '/products?category=fashion',
    bg: 'from-rose-900 via-pink-900 to-purple-900',
    image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800',
    badge: '👗 New Arrivals',
  },
];

const CATEGORIES = [
  { name: 'Electronics', slug: 'electronics', emoji: '💻', color: 'bg-blue-50 hover:bg-blue-100', textColor: 'text-blue-700' },
  { name: 'Fashion', slug: 'fashion', emoji: '👔', color: 'bg-rose-50 hover:bg-rose-100', textColor: 'text-rose-700' },
  { name: 'Home & Living', slug: 'home-living', emoji: '🏠', color: 'bg-amber-50 hover:bg-amber-100', textColor: 'text-amber-700' },
  { name: 'Sports & Fitness', slug: 'sports-fitness', emoji: '🏃', color: 'bg-green-50 hover:bg-green-100', textColor: 'text-green-700' },
  { name: 'Books', slug: 'books', emoji: '📚', color: 'bg-purple-50 hover:bg-purple-100', textColor: 'text-purple-700' },
  { name: 'Beauty', slug: 'beauty-personal-care', emoji: '✨', color: 'bg-pink-50 hover:bg-pink-100', textColor: 'text-pink-700' },
];

const TRUST_BADGES = [
  { icon: Truck, title: 'Free Shipping', subtitle: 'On orders above ₹999' },
  { icon: RotateCcw, title: '30-Day Returns', subtitle: 'Hassle-free returns' },
  { icon: ShieldCheck, title: 'Secure Payments', subtitle: 'Razorpay secured' },
  { icon: Headphones, title: '24/7 Support', subtitle: 'Always here for you' },
];

const TESTIMONIALS = [
  { name: 'Priya Sharma', location: 'Mumbai', rating: 5, text: 'Absolutely love shopping here! Products are exactly as described and delivery is super fast. Highly recommend!' },
  { name: 'Rahul Verma', location: 'Delhi', rating: 5, text: 'Best online shopping experience I\'ve had. Great deals and the customer service is outstanding.' },
  { name: 'Anjali Patel', location: 'Bangalore', rating: 5, text: 'Quality products at amazing prices. The return process was seamless when I needed it.' },
  { name: 'Arjun Nair', location: 'Hyderabad', rating: 5, text: 'ShopSphere has everything I need. The app is smooth and payments are always secure.' },
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, newRes, bestRes] = await Promise.all([
          api.get('/products', { params: { isFeatured: true, limit: 8 } }),
          api.get('/products', { params: { newArrival: true, limit: 4 } }),
          api.get('/products', { params: { bestSeller: true, limit: 4 } }),
        ]);
        setFeaturedProducts(featuredRes.data.data.products || []);
        setNewArrivals(newRes.data.data.products || []);
        setBestSellers(bestRes.data.data.products || []);
      } catch (e) {
        console.error('Homepage data error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto slide hero
  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide((p) => (p + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[currentSlide];

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <section className={`relative min-h-[75vh] bg-gradient-to-r ${slide.bg} transition-all duration-700 overflow-hidden`}>
        {/* Background image */}
        <div className="absolute inset-0">
          <img src={slide.image} alt="Hero" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        </div>

        <div className="container-fluid relative z-10 flex items-center min-h-[75vh] py-20">
          <div className="max-w-2xl animate-fade-in">
            <span className="inline-block text-sm font-semibold text-amber-400 mb-4 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
              {slide.badge}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-display leading-tight mb-6">
              {slide.title}
            </h1>
            <p className="text-lg text-white/80 mb-8 leading-relaxed">{slide.subtitle}</p>
            <div className="flex gap-4 flex-wrap">
              <Link to={slide.to} className="btn-primary btn-lg bg-white text-neutral-900 hover:bg-neutral-100 hover:text-neutral-900">
                {slide.cta} <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/products" className="btn-lg border border-white/30 text-white hover:bg-white/10 rounded-2xl inline-flex items-center gap-2 px-8 py-3.5 font-semibold transition-all">
                Browse All
              </Link>
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`transition-all duration-300 rounded-full ${i === currentSlide ? 'w-8 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/60'}`}
            />
          ))}
        </div>

        {/* Nav arrows */}
        <button onClick={() => setCurrentSlide((p) => (p - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-all z-10">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={() => setCurrentSlide((p) => (p + 1) % HERO_SLIDES.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-all z-10">
          <ChevronRight className="w-5 h-5" />
        </button>
      </section>

      {/* Trust Badges */}
      <section className="bg-white border-y border-neutral-100">
        <div className="container-fluid py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TRUST_BADGES.map(({ icon: Icon, title, subtitle }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-800">{title}</p>
                  <p className="text-xs text-neutral-500">{subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="section bg-neutral-50">
        <div className="container-fluid">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="section-title">Shop by Category</h2>
              <p className="section-subtitle">Explore our curated collections</p>
            </div>
            <Link to="/products" className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {CATEGORIES.map((cat) => (
              <Link key={cat.slug} to={`/products?category=${cat.slug}`}
                className={`${cat.color} rounded-2xl p-5 flex flex-col items-center gap-2 transition-all duration-300 hover:shadow-card hover:-translate-y-1 text-center group`}>
                <span className="text-4xl">{cat.emoji}</span>
                <span className={`text-sm font-semibold ${cat.textColor}`}>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section bg-white">
        <div className="container-fluid">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="section-title">Featured Products</h2>
              <p className="section-subtitle">Hand-picked for you</p>
            </div>
            <Link to="/products?featured=true" className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-center text-neutral-500 py-12">No featured products yet.</p>
          )}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="section bg-gradient-to-r from-primary-600 to-indigo-700">
        <div className="container-fluid">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white font-display">
                New Season. New Arrivals. 🎉
              </h2>
              <p className="text-primary-200 mt-2 text-lg">Fresh picks added daily — be the first to grab them.</p>
            </div>
            <Link to="/products?newArrival=true" className="flex-shrink-0 px-8 py-4 bg-white text-primary-600 font-bold rounded-2xl hover:bg-primary-50 transition-all hover:shadow-elevated text-sm">
              Shop New Arrivals <ArrowRight className="w-4 h-4 inline ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* New Arrivals + Best Sellers */}
      <section className="section bg-neutral-50">
        <div className="container-fluid">
          <div className="grid lg:grid-cols-2 gap-10">
            {/* New Arrivals */}
            <div>
              <div className="flex items-end justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 font-display">New Arrivals</h2>
                  <p className="text-sm text-neutral-500 mt-0.5">Just landed</p>
                </div>
                <Link to="/products?newArrival=true" className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              {loading ? (
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="h-64 skeleton rounded-2xl" />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {newArrivals.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              )}
            </div>

            {/* Best Sellers */}
            <div>
              <div className="flex items-end justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 font-display">Best Sellers</h2>
                  <p className="text-sm text-neutral-500 mt-0.5">Most loved by customers</p>
                </div>
                <Link to="/products?bestSeller=true" className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              {loading ? (
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="h-64 skeleton rounded-2xl" />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {bestSellers.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section bg-white">
        <div className="container-fluid">
          <div className="text-center mb-10">
            <h2 className="section-title">What Our Customers Say</h2>
            <p className="section-subtitle">Loved by thousands across India</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card p-5 space-y-3">
                <div className="flex gap-0.5">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed">"{t.text}"</p>
                <div className="pt-2 border-t border-neutral-100">
                  <p className="text-sm font-semibold text-neutral-800">{t.name}</p>
                  <p className="text-xs text-neutral-500">{t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
