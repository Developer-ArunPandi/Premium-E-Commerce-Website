require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB for seeding');
};

const categories = [
  { name: 'Electronics', slug: 'electronics', description: 'Latest gadgets and electronic devices' },
  { name: 'Fashion', slug: 'fashion', description: 'Trending clothes, shoes, and accessories' },
  { name: 'Home & Living', slug: 'home-living', description: 'Everything for your home' },
  { name: 'Sports & Fitness', slug: 'sports-fitness', description: 'Sports equipment and fitness gear' },
  { name: 'Books', slug: 'books', description: 'Books, magazines, and educational materials' },
  { name: 'Beauty & Personal Care', slug: 'beauty-personal-care', description: 'Beauty products and personal care items' },
];

const subcategories = [
  { name: 'Smartphones', slug: 'smartphones', parent: 'electronics' },
  { name: 'Laptops', slug: 'laptops', parent: 'electronics' },
  { name: 'Audio & Headphones', slug: 'audio-headphones', parent: 'electronics' },
  { name: 'Cameras', slug: 'cameras', parent: 'electronics' },
  { name: "Men's Clothing", slug: 'mens-clothing', parent: 'fashion' },
  { name: "Women's Clothing", slug: 'womens-clothing', parent: 'fashion' },
  { name: 'Footwear', slug: 'footwear', parent: 'fashion' },
  { name: 'Furniture', slug: 'furniture', parent: 'home-living' },
  { name: 'Kitchen & Dining', slug: 'kitchen-dining', parent: 'home-living' },
  { name: 'Gym Equipment', slug: 'gym-equipment', parent: 'sports-fitness' },
];

const seedProducts = (categoryMap) => [
  {
    name: 'Premium Wireless Headphones Pro X1',
    slug: 'premium-wireless-headphones-pro-x1',
    description: 'Experience studio-quality sound with our flagship wireless headphones. Featuring active noise cancellation, 40-hour battery life, and premium leather ear cups for maximum comfort during extended listening sessions.',
    shortDescription: 'Studio-quality ANC wireless headphones with 40-hour battery',
    sku: 'EL-HP-001',
    price: 7999,
    compareAtPrice: 12999,
    brand: 'AudioMax',
    category: categoryMap['electronics'],
    subcategory: categoryMap['audio-headphones'],
    stock: 45,
    isFeatured: true,
    isNewArrival: true,
    specifications: [
      { key: 'Driver Size', value: '40mm Dynamic Driver' },
      { key: 'Frequency Response', value: '20Hz - 20kHz' },
      { key: 'Battery Life', value: '40 hours (ANC on), 50 hours (ANC off)' },
      { key: 'Connectivity', value: 'Bluetooth 5.2, 3.5mm Jack' },
      { key: 'Weight', value: '250g' },
    ],
    tags: ['wireless', 'headphones', 'anc', 'bluetooth', 'premium'],
    images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', alt: 'Premium Headphones' }],
  },
  {
    name: 'UltraSlim Pro Laptop 15"',
    slug: 'ultraslim-pro-laptop-15',
    description: 'Power meets portability. This ultra-thin laptop features a 12th Gen Intel Core i7, 16GB RAM, and 512GB NVMe SSD. The stunning 15" OLED display delivers vibrant colors for professionals and creatives.',
    shortDescription: 'Ultra-thin laptop with 12th Gen Intel i7 and OLED display',
    sku: 'EL-LP-001',
    price: 89999,
    compareAtPrice: 109999,
    brand: 'TechCore',
    category: categoryMap['electronics'],
    subcategory: categoryMap['laptops'],
    stock: 20,
    isFeatured: true,
    isBestSeller: true,
    specifications: [
      { key: 'Processor', value: 'Intel Core i7-1260P (12th Gen)' },
      { key: 'RAM', value: '16GB LPDDR5' },
      { key: 'Storage', value: '512GB NVMe PCIe SSD' },
      { key: 'Display', value: '15.6" OLED FHD 120Hz' },
      { key: 'Battery', value: '70Wh, up to 12 hours' },
    ],
    tags: ['laptop', 'ultrabook', 'intel', 'oled', 'productivity'],
    images: [{ url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600', alt: 'UltraSlim Laptop' }],
  },
  {
    name: 'Smartphone Galaxy Pro 5G',
    slug: 'smartphone-galaxy-pro-5g',
    description: 'The next-generation smartphone with a 108MP triple camera system, 120Hz AMOLED display, and the latest Snapdragon processor. 5G ready for the future.',
    shortDescription: '108MP camera, 120Hz AMOLED, Snapdragon 5G smartphone',
    sku: 'EL-SP-001',
    price: 54999,
    compareAtPrice: 64999,
    brand: 'NovaTech',
    category: categoryMap['electronics'],
    subcategory: categoryMap['smartphones'],
    stock: 35,
    isFeatured: true,
    hasVariants: true,
    variants: [
      { name: 'Color', value: 'Midnight Black', stock: 15, price: 54999 },
      { name: 'Color', value: 'Pearl White', stock: 10, price: 54999 },
      { name: 'Color', value: 'Ocean Blue', stock: 10, price: 56999 },
    ],
    specifications: [
      { key: 'Processor', value: 'Snapdragon 8 Gen 2' },
      { key: 'RAM', value: '12GB' },
      { key: 'Storage', value: '256GB UFS 3.1' },
      { key: 'Display', value: '6.7" FHD+ AMOLED 120Hz' },
      { key: 'Camera', value: '108MP + 12MP + 10MP Triple' },
      { key: 'Battery', value: '5000mAh, 67W Fast Charging' },
    ],
    tags: ['smartphone', '5g', 'snapdragon', 'amoled', 'flagship'],
    images: [{ url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600', alt: 'Smartphone' }],
  },
  {
    name: 'Classic Comfort Joggers',
    slug: 'classic-comfort-joggers',
    description: 'Premium cotton-blend joggers designed for both performance and everyday wear. Featuring a tapered fit, elastic waistband, and zippered pockets for convenience.',
    shortDescription: 'Premium cotton-blend tapered joggers for all-day comfort',
    sku: 'FA-MC-001',
    price: 1299,
    compareAtPrice: 2499,
    brand: 'UrbanFit',
    category: categoryMap['fashion'],
    subcategory: categoryMap['mens-clothing'],
    stock: 100,
    isBestSeller: true,
    hasVariants: true,
    variants: [
      { name: 'Size', value: 'S', stock: 20, price: 1299 },
      { name: 'Size', value: 'M', stock: 30, price: 1299 },
      { name: 'Size', value: 'L', stock: 30, price: 1299 },
      { name: 'Size', value: 'XL', stock: 15, price: 1299 },
      { name: 'Size', value: 'XXL', stock: 5, price: 1299 },
    ],
    specifications: [
      { key: 'Material', value: '80% Cotton, 20% Polyester' },
      { key: 'Fit', value: 'Tapered' },
      { key: 'Pockets', value: '2 Side Pockets + 1 Zip Pocket' },
      { key: 'Care', value: 'Machine Washable' },
    ],
    tags: ['joggers', 'men', 'comfort', 'casual', 'cotton'],
    images: [{ url: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600', alt: 'Joggers' }],
  },
  {
    name: 'Minimalist Leather Sneakers',
    slug: 'minimalist-leather-sneakers',
    description: 'Handcrafted genuine leather sneakers with a clean, minimalist design. Perfect for both casual outings and semi-formal occasions. Italian leather upper with memory foam insole.',
    shortDescription: 'Handcrafted genuine leather minimalist sneakers',
    sku: 'FA-FW-001',
    price: 3499,
    compareAtPrice: 5999,
    brand: 'CraftStep',
    category: categoryMap['fashion'],
    subcategory: categoryMap['footwear'],
    stock: 60,
    isFeatured: true,
    hasVariants: true,
    variants: [
      { name: 'Size', value: 'UK 6', stock: 10, price: 3499 },
      { name: 'Size', value: 'UK 7', stock: 15, price: 3499 },
      { name: 'Size', value: 'UK 8', stock: 15, price: 3499 },
      { name: 'Size', value: 'UK 9', stock: 12, price: 3499 },
      { name: 'Size', value: 'UK 10', stock: 8, price: 3499 },
    ],
    specifications: [
      { key: 'Upper Material', value: 'Genuine Italian Leather' },
      { key: 'Sole', value: 'Rubber Outsole' },
      { key: 'Insole', value: 'Memory Foam' },
      { key: 'Closure', value: 'Lace-Up' },
    ],
    tags: ['sneakers', 'leather', 'minimalist', 'casual', 'men'],
    images: [{ url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', alt: 'Leather Sneakers' }],
  },
  {
    name: 'Smart Home Air Purifier 360',
    slug: 'smart-home-air-purifier-360',
    description: 'True HEPA air purifier with 360-degree filtration technology. Covers up to 500 sq ft, removes 99.97% of airborne particles. Smart Wi-Fi enabled with app control and real-time air quality monitoring.',
    shortDescription: 'True HEPA smart air purifier, 500 sq ft coverage, Wi-Fi enabled',
    sku: 'HL-AP-001',
    price: 12999,
    compareAtPrice: 18999,
    brand: 'PureAir',
    category: categoryMap['home-living'],
    stock: 28,
    isFeatured: true,
    isNewArrival: true,
    specifications: [
      { key: 'Coverage Area', value: 'Up to 500 sq ft' },
      { key: 'Filter Type', value: 'True HEPA H13 + Activated Carbon' },
      { key: 'Noise Level', value: '22-48 dB' },
      { key: 'Connectivity', value: 'Wi-Fi, Alexa & Google Home Compatible' },
      { key: 'Power', value: '45W' },
    ],
    tags: ['air purifier', 'hepa', 'smart home', 'wifi', 'home'],
    images: [{ url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600', alt: 'Air Purifier' }],
  },
  {
    name: 'Professional Yoga Mat Pro',
    slug: 'professional-yoga-mat-pro',
    description: 'Eco-friendly natural rubber yoga mat with alignment lines, premium grip surface, and 6mm cushioning. Perfect for all levels from beginner to advanced practitioners.',
    shortDescription: 'Eco-friendly natural rubber yoga mat with alignment lines',
    sku: 'SF-YM-001',
    price: 2499,
    compareAtPrice: 3999,
    brand: 'ZenFlex',
    category: categoryMap['sports-fitness'],
    subcategory: categoryMap['gym-equipment'],
    stock: 75,
    isBestSeller: true,
    isNewArrival: true,
    specifications: [
      { key: 'Material', value: 'Natural Rubber + TPE' },
      { key: 'Dimensions', value: '183cm x 61cm' },
      { key: 'Thickness', value: '6mm' },
      { key: 'Weight', value: '2.1kg' },
      { key: 'Features', value: 'Alignment Lines, Non-slip Surface' },
    ],
    tags: ['yoga', 'fitness', 'mat', 'eco-friendly', 'rubber'],
    images: [{ url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600', alt: 'Yoga Mat' }],
  },
  {
    name: 'Electric Coffee Grinder Pro',
    slug: 'electric-coffee-grinder-pro',
    description: 'Burr coffee grinder with 18 grind settings from espresso-fine to French press coarse. Stainless steel conical burrs ensure consistent particle size for the perfect cup every time.',
    shortDescription: 'Professional burr coffee grinder with 18 grind settings',
    sku: 'HL-KD-001',
    price: 4299,
    compareAtPrice: 6999,
    brand: 'BrewMaster',
    category: categoryMap['home-living'],
    subcategory: categoryMap['kitchen-dining'],
    stock: 40,
    isFeatured: true,
    specifications: [
      { key: 'Grind Settings', value: '18 Settings' },
      { key: 'Burr Type', value: 'Conical Stainless Steel Burr' },
      { key: 'Hopper Capacity', value: '250g' },
      { key: 'Motor Power', value: '150W' },
      { key: 'Warranty', value: '2 Years' },
    ],
    tags: ['coffee', 'grinder', 'kitchen', 'burr', 'espresso'],
    images: [{ url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600', alt: 'Coffee Grinder' }],
  },
  {
    name: 'The Art of Mindfulness',
    slug: 'the-art-of-mindfulness',
    description: 'A comprehensive guide to mindfulness practices for modern life. This bestselling book covers meditation techniques, stress management, and building lasting mental resilience. Includes practical exercises for beginners and advanced practitioners.',
    shortDescription: 'Bestselling mindfulness guide with practical meditation exercises',
    sku: 'BK-MD-001',
    price: 499,
    compareAtPrice: 799,
    brand: 'PeacePub',
    category: categoryMap['books'],
    stock: 200,
    isBestSeller: true,
    specifications: [
      { key: 'Author', value: 'Dr. Sarah Chen' },
      { key: 'Pages', value: '320' },
      { key: 'Publisher', value: 'PeacePub India' },
      { key: 'Language', value: 'English' },
      { key: 'Format', value: 'Paperback' },
    ],
    tags: ['mindfulness', 'meditation', 'self-help', 'wellness', 'books'],
    images: [{ url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600', alt: 'Mindfulness Book' }],
  },
  {
    name: 'Vitamin C Brightening Serum',
    slug: 'vitamin-c-brightening-serum',
    description: '20% stabilized Vitamin C serum with hyaluronic acid and niacinamide. Brightens skin tone, reduces hyperpigmentation, and provides antioxidant protection. Dermatologically tested, suitable for all skin types.',
    shortDescription: '20% Vitamin C serum for brightening and anti-aging',
    sku: 'BC-SK-001',
    price: 1799,
    compareAtPrice: 2999,
    brand: 'GlowLab',
    category: categoryMap['beauty-personal-care'],
    stock: 80,
    isFeatured: true,
    isNewArrival: true,
    specifications: [
      { key: 'Key Ingredients', value: '20% Vitamin C, Hyaluronic Acid, Niacinamide' },
      { key: 'Skin Type', value: 'All Skin Types' },
      { key: 'Volume', value: '30ml' },
      { key: 'Usage', value: 'AM/PM, Apply after cleansing' },
      { key: 'Fragrance', value: 'Fragrance-Free' },
    ],
    tags: ['vitamin-c', 'serum', 'brightening', 'skincare', 'beauty'],
    images: [{ url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600', alt: 'Vitamin C Serum' }],
  },
];

const seedCoupons = () => [
  {
    code: 'WELCOME10',
    description: '10% off for new customers',
    type: 'percentage',
    value: 10,
    maxDiscount: 500,
    minOrderValue: 500,
    usageLimit: 1000,
    perUserLimit: 1,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
  {
    code: 'FLAT200',
    description: '₹200 off on orders above ₹1500',
    type: 'fixed',
    value: 200,
    minOrderValue: 1500,
    usageLimit: 500,
    perUserLimit: 2,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
  {
    code: 'SUMMER25',
    description: '25% off, up to ₹1000 discount',
    type: 'percentage',
    value: 25,
    maxDiscount: 1000,
    minOrderValue: 2000,
    usageLimit: 200,
    perUserLimit: 1,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
];

const seed = async () => {
  try {
    await connectDB();

    console.log('🌱 Starting seed...');

    // Create admin user
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@shopsphere.com' });
    if (!adminExists) {
      await User.create({
        firstName: 'Admin',
        lastName: 'ShopSphere',
        email: process.env.ADMIN_EMAIL || 'admin@shopsphere.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@123456',
        role: 'admin',
        isActive: true,
      });
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create categories
    const categoryMap = {};
    for (const cat of categories) {
      const existing = await Category.findOne({ slug: cat.slug });
      if (!existing) {
        const created = await Category.create({ ...cat, isActive: true });
        categoryMap[cat.slug] = created._id;
        console.log(`✅ Category: ${cat.name}`);
      } else {
        categoryMap[cat.slug] = existing._id;
      }
    }

    // Create subcategories
    for (const sub of subcategories) {
      const existing = await Category.findOne({ slug: sub.slug });
      if (!existing) {
        await Category.create({
          name: sub.name,
          slug: sub.slug,
          parent: categoryMap[sub.parent],
          isActive: true,
        });
        categoryMap[sub.slug] = (await Category.findOne({ slug: sub.slug }))._id;
        console.log(`✅ Subcategory: ${sub.name}`);
      } else {
        categoryMap[sub.slug] = existing._id;
      }
    }

    // Create products
    const products = seedProducts(categoryMap);
    for (const product of products) {
      const existing = await Product.findOne({ slug: product.slug });
      if (!existing) {
        await Product.create(product);
        console.log(`✅ Product: ${product.name}`);
      }
    }

    // Create coupons
    const coupons = seedCoupons();
    for (const coupon of coupons) {
      const existing = await Coupon.findOne({ code: coupon.code });
      if (!existing) {
        await Coupon.create(coupon);
        console.log(`✅ Coupon: ${coupon.code}`);
      }
    }

    console.log('\n🎉 Seed completed successfully!');
    console.log(`\n📝 Admin Login:`);
    console.log(`   Email: ${process.env.ADMIN_EMAIL || 'admin@shopsphere.com'}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'Admin@123456'}`);
    console.log(`\n🎟️  Coupon Codes: WELCOME10, FLAT200, SUMMER25`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seed();
