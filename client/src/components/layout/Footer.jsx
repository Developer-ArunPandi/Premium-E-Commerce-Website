import { Link } from 'react-router-dom';
import { Grid3X3, Mail, Phone, MapPin, Share2, MessageCircle, Globe, Rss } from 'lucide-react';

const SOCIAL_LINKS = [
  { icon: Share2, label: 'Social', href: '#' },
  { icon: MessageCircle, label: 'Chat', href: '#' },
  { icon: Globe, label: 'Web', href: '#' },
  { icon: Rss, label: 'RSS', href: '#' },
];

const footerLinks = {
  Shop: [
    { label: 'All Products', to: '/products' },
    { label: 'Electronics', to: '/products?category=electronics' },
    { label: 'Fashion', to: '/products?category=fashion' },
    { label: 'Home & Living', to: '/products?category=home-living' },
    { label: 'New Arrivals', to: '/products?newArrival=true' },
  ],
  Account: [
    { label: 'My Account', to: '/account' },
    { label: 'My Orders', to: '/account/orders' },
    { label: 'Wishlist', to: '/wishlist' },
    { label: 'Cart', to: '/cart' },
    { label: 'Track Order', to: '/account/orders' },
  ],
  Company: [
    { label: 'About Us', to: '/about' },
    { label: 'Contact', to: '/contact' },
    { label: 'Blog', to: '/blog' },
    { label: 'Careers', to: '/careers' },
  ],
  Support: [
    { label: 'Help Center', to: '/help' },
    { label: 'Return Policy', to: '/returns' },
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
    { label: 'Shipping Info', to: '/shipping' },
  ],
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-900 text-neutral-300">
      {/* Newsletter Banner */}
      <div className="bg-primary-600">
        <div className="container-fluid py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-white font-display">Stay in the loop</h3>
              <p className="text-primary-200 text-sm mt-1">Get the latest deals and arrivals in your inbox.</p>
            </div>
            <form className="flex gap-2 w-full md:w-auto" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-72 px-4 py-2.5 rounded-xl text-sm bg-primary-700 text-white placeholder:text-primary-300 border border-primary-500 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button className="px-5 py-2.5 bg-white text-primary-600 font-semibold rounded-xl text-sm hover:bg-primary-50 transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-fluid py-14">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Grid3X3 className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white font-display">ShopSphere</span>
            </Link>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-xs">
              Your premium destination for quality products at great prices. Shop with confidence — we've got you covered.
            </p>
            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <Mail className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <span>support@shopsphere.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <Phone className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <span>1800-123-4567 (Toll Free)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <MapPin className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <span>Mumbai, Maharashtra, India</span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              {SOCIAL_LINKS.map(({ icon: Icon, label, href }) => (
                <a key={label} href={href} aria-label={label} className="w-9 h-9 bg-neutral-800 hover:bg-primary-600 rounded-xl flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-sm font-semibold text-white mb-4">{section}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-neutral-400 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-neutral-800">
        <div className="container-fluid py-5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs text-neutral-500">
              © {currentYear} ShopSphere. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                🔒 SSL Secured
              </span>
              <span>•</span>
              <span>🇮🇳 Made in India</span>
              <span>•</span>
              <span>Razorpay Powered</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
