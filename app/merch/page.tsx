'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  ShoppingBag,
  ArrowLeft,
  Shirt,
  Star,
  Sparkles,
  Tag,
  Globe,
  CheckCircle,
  Search,
  X,
  ChevronLeft,
  ZoomIn,
  Truck,
  Shield,
  Loader2,
  FileText,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { VitalLogo } from '@/components/VitalLogo';
import { CartProvider, useCart } from '@/lib/merch/CartContext';
import { CartDrawer } from '@/components/merch/CartDrawer';
import { ProductModal, StoreProduct } from '@/components/merch/ProductModal';

// -----------------------------------------------------------------------
// Fallback initial products if database is currently being populated
// -----------------------------------------------------------------------
const FALLBACK_PRODUCTS: StoreProduct[] = [
  {
    id: '6abbfe5b33ab8a78df031de4',
    printify_product_id: '6abbfe5b33ab8a78df031de4',
    title: 'Orange Gradient V Chevron Hoodie',
    slug: 'orange-gradient-v-chevron-hoodie',
    description: 'Premium heavyweight hoodie featuring the official Vital RP orange chevron emblem. Archival DTG print.',
    category: 'Apparel',
    status: 'live',
    badge: 'Best Seller',
    retail_price_cents: 5499,
    mockup_images: [
      { src: '/merch/hoodie.png', is_default: true },
      { src: '/merch/zipup.png' },
    ],
    variants: [
      { id: '1', printify_variant_id: 101, title: 'Black / S', size: 'S', color: 'Black', retail_price_cents: 5499, is_enabled: true, is_in_stock: true },
      { id: '2', printify_variant_id: 102, title: 'Black / M', size: 'M', color: 'Black', retail_price_cents: 5499, is_enabled: true, is_in_stock: true },
      { id: '3', printify_variant_id: 103, title: 'Black / L', size: 'L', color: 'Black', retail_price_cents: 5499, is_enabled: true, is_in_stock: true },
      { id: '4', printify_variant_id: 104, title: 'Black / XL', size: 'XL', color: 'Black', retail_price_cents: 5499, is_enabled: true, is_in_stock: true },
      { id: '5', printify_variant_id: 105, title: 'Black / 2XL', size: '2XL', color: 'Black', retail_price_cents: 5799, is_enabled: true, is_in_stock: true },
    ],
  },
  {
    id: '6abbfe5b31cb7a899e0a67c0',
    printify_product_id: '6abbfe5b31cb7a899e0a67c0',
    title: 'Orange Gradient V Chevron T-Shirt',
    slug: 'orange-gradient-v-chevron-t-shirt',
    description: 'Minimal geometric Vital RP chevron tee. Soft-touch combed cotton with durable double stitching.',
    category: 'Apparel',
    status: 'live',
    badge: 'Popular',
    retail_price_cents: 2999,
    mockup_images: [
      { src: '/merch/tshirt.png', is_default: true },
      { src: '/merch/longsleeve.png' },
    ],
    variants: [
      { id: '6', printify_variant_id: 201, title: 'Black / S', size: 'S', color: 'Black', retail_price_cents: 2999, is_enabled: true, is_in_stock: true },
      { id: '7', printify_variant_id: 202, title: 'Black / M', size: 'M', color: 'Black', retail_price_cents: 2999, is_enabled: true, is_in_stock: true },
      { id: '8', printify_variant_id: 203, title: 'Black / L', size: 'L', color: 'Black', retail_price_cents: 2999, is_enabled: true, is_in_stock: true },
      { id: '9', printify_variant_id: 204, title: 'Black / XL', size: 'XL', color: 'Black', retail_price_cents: 2999, is_enabled: true, is_in_stock: true },
      { id: '10', printify_variant_id: 205, title: 'Black / 2XL', size: '2XL', color: 'Black', retail_price_cents: 3299, is_enabled: true, is_in_stock: true },
    ],
  },
  {
    id: '6abbfe5be62fc0336b093c0c',
    printify_product_id: '6abbfe5be62fc0336b093c0c',
    title: 'Orange Gradient V Chevron Sticker Pack',
    slug: 'orange-gradient-v-chevron-sticker',
    description: 'High-opacity, weather-resistant vinyl die-cut stickers. UV protected and waterproof.',
    category: 'Accessories',
    status: 'live',
    badge: 'New',
    retail_price_cents: 999,
    mockup_images: [
      { src: '/merch/stickers.png', is_default: true },
    ],
    variants: [
      { id: '11', printify_variant_id: 301, title: '3x3 in', size: '3x3"', retail_price_cents: 999, is_enabled: true, is_in_stock: true },
      { id: '12', printify_variant_id: 302, title: '4x4 in', size: '4x4"', retail_price_cents: 1299, is_enabled: true, is_in_stock: true },
    ],
  },
  {
    id: '6abbfe2b0129c74f770d5b02',
    printify_product_id: '6abbfe2b0129c74f770d5b02',
    title: 'Vital Graphic Streetwear Tee',
    slug: 'vital-graphic-streetwear-tee',
    description: 'Streetwear graphic tee showcasing the bold Vital Los Santos underground aesthetic.',
    category: 'Apparel',
    status: 'live',
    retail_price_cents: 3199,
    mockup_images: [
      { src: '/merch/tshirt.png', is_default: true },
    ],
    variants: [
      { id: '13', printify_variant_id: 401, title: 'Black / S', size: 'S', color: 'Black', retail_price_cents: 3199, is_enabled: true, is_in_stock: true },
      { id: '14', printify_variant_id: 402, title: 'Black / M', size: 'M', color: 'Black', retail_price_cents: 3199, is_enabled: true, is_in_stock: true },
      { id: '15', printify_variant_id: 403, title: 'Black / L', size: 'L', color: 'Black', retail_price_cents: 3199, is_enabled: true, is_in_stock: true },
      { id: '16', printify_variant_id: 404, title: 'Black / XL', size: 'XL', color: 'Black', retail_price_cents: 3199, is_enabled: true, is_in_stock: true },
    ],
  },
  {
    id: 'vital-desk-mat',
    printify_product_id: 'vital-desk-mat',
    title: 'Vital Gaming Desk Mat',
    slug: 'vital-gaming-desk-mat',
    description: 'Extended gaming mousepad (900x400mm) with anti-slip rubber base and precision micro-woven cloth surface.',
    category: 'Accessories',
    status: 'live',
    badge: 'Popular',
    retail_price_cents: 3999,
    mockup_images: [
      { src: '/merch/mousepad.png', is_default: true },
    ],
    variants: [
      { id: '17', printify_variant_id: 501, title: 'Extended (900x400mm)', size: 'Extended', retail_price_cents: 3999, is_enabled: true, is_in_stock: true },
    ],
  },
  {
    id: 'vital-mug-matte',
    printify_product_id: 'vital-mug-matte',
    title: 'Matte Ceramic Coffee Mug',
    slug: 'matte-ceramic-coffee-mug',
    description: '11oz ceramic mug with smooth black finish and vibrant orange emblem. Dishwasher and microwave safe.',
    category: 'Accessories',
    status: 'live',
    retail_price_cents: 1899,
    mockup_images: [
      { src: '/merch/mug.png', is_default: true },
    ],
    variants: [
      { id: '18', printify_variant_id: 601, title: '11oz / Matte Black', size: '11oz', color: 'Black', retail_price_cents: 1899, is_enabled: true, is_in_stock: true },
    ],
  },
];

const categories = ['All', 'Apparel', 'Accessories', 'In-Game'];

// -----------------------------------------------------------------------
// Animated Product Card Component
// -----------------------------------------------------------------------
const ProductCard: React.FC<{
  product: StoreProduct;
  index: number;
  onSelect: (product: StoreProduct) => void;
  hoveredProduct: string | null;
  setHoveredProduct: (id: string | null) => void;
}> = ({ product, index, onSelect, hoveredProduct, setHoveredProduct }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const { addItem } = useCart();

  const primaryImage = product.mockup_images[0]?.src || '/merch/hoodie.png';
  const displayPrice = `$${(product.retail_price_cents / 100).toFixed(2)}`;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const defaultVariant = product.variants.find((v) => v.is_in_stock && v.is_enabled) || product.variants[0];
    if (!defaultVariant) {
      onSelect(product);
      return;
    }

    addItem({
      printify_product_id: product.printify_product_id,
      printify_variant_id: defaultVariant.printify_variant_id,
      product_id: product.id,
      title: product.title,
      variant_title: defaultVariant.title,
      size: defaultVariant.size,
      color: defaultVariant.color,
      price_cents: defaultVariant.retail_price_cents || product.retail_price_cents,
      image_url: primaryImage,
      slug: product.slug,
    });
  };

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.96 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="group relative cursor-pointer"
      onMouseEnter={() => setHoveredProduct(product.id)}
      onMouseLeave={() => setHoveredProduct(null)}
      onClick={() => onSelect(product)}
    >
      <div className="relative bg-dark-800/50 border border-white/5 rounded-2xl overflow-hidden transition-all duration-500 hover:border-vital-500/30 hover:shadow-[0_0_40px_rgba(249,115,22,0.1)] flex flex-col h-full">
        {/* Badges */}
        <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-1.5">
          {product.badge && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-tech font-bold uppercase tracking-wider bg-vital-500 text-white shadow-lg shadow-vital-500/30">
              <Star size={10} className="fill-current" />
              {product.badge}
            </span>
          )}
          {product.is_limited_drop && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-tech font-bold uppercase tracking-wider bg-purple-500 text-white">
              <Sparkles size={10} />
              Limited
            </span>
          )}
          {product.status === 'draft' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-tech font-bold uppercase tracking-wider bg-amber-500 text-white">
              Coming Soon
            </span>
          )}
        </div>

        {/* Image Container */}
        <div className="relative aspect-square bg-gradient-to-b from-dark-700/50 to-dark-800/50 overflow-hidden">
          <div
            className={`absolute inset-0 bg-vital-500/5 transition-opacity duration-700 ${
              hoveredProduct === product.id ? 'opacity-100' : 'opacity-0'
            }`}
          />

          <motion.img
            src={primaryImage}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-700"
            style={{
              transform: hoveredProduct === product.id ? 'scale(1.08)' : 'scale(1)',
            }}
          />

          <div
            className={`absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent transition-opacity duration-500 ${
              hoveredProduct === product.id ? 'opacity-80' : 'opacity-40'
            }`}
          />

          {/* Quick Action Overlay on Hover */}
          <AnimatePresence>
            {hoveredProduct === product.id && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-4 left-4 right-4 z-20 flex gap-2"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(product);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-display font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-colors border border-white/10 cursor-pointer"
                >
                  <ZoomIn size={14} />
                  Options
                </button>
                <button
                  onClick={handleQuickAdd}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-vital-500 hover:bg-vital-400 text-white font-display font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-colors shadow-lg shadow-vital-500/30 cursor-pointer"
                >
                  <ShoppingBag size={14} />
                  Add
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Product Meta */}
        <div className="p-5 flex flex-col justify-between flex-1">
          <div>
            <div className="flex items-start justify-between mb-1.5">
              <h3 className="text-white font-display font-bold text-lg leading-tight group-hover:text-vital-400 transition-colors">
                {product.title}
              </h3>
              <span className="text-vital-400 font-display font-bold text-lg ml-2 whitespace-nowrap">
                {displayPrice}
              </span>
            </div>
            <p className="text-gray-500 text-xs font-sans line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-tech text-gray-500 uppercase tracking-widest">
            <span>{product.category}</span>
            <span>POD Archival</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// -----------------------------------------------------------------------
// Merch Storefront Inner Component
// -----------------------------------------------------------------------
const MerchStoreContent: React.FC = () => {
  const { totalItems, setIsCartOpen } = useCart();

  const [productsList, setProductsList] = useState<StoreProduct[]>(FALLBACK_PRODUCTS);
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [easterEggActive, setEasterEggActive] = useState(false);
  const [wiggleKey, setWiggleKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch live products from /api/merch/products
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await fetch('/api/merch/products');
        if (res.ok) {
          const data = await res.json();
          if (data.products && data.products.length > 0) {
            setProductsList(data.products);
          }
        }
      } catch (err) {
        console.warn('Using fallback local catalog data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const triggerEasterEgg = () => {
    setEasterEggActive(true);
    setWiggleKey((k) => k + 1);

    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f97316', '#10b981', '#3b82f6'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f97316', '#10b981', '#3b82f6'],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();

    setTimeout(() => setEasterEggActive(false), 4000);
  };

  const openProductModal = (product: StoreProduct) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const closeProductModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedProduct(null), 300);
  };

  const filteredProducts = productsList.filter((p) => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoryCounts = categories.reduce<Record<string, number>>((acc, cat) => {
    if (cat === 'All') {
      acc[cat] = productsList.filter(
        (p) =>
          searchQuery.trim() === '' ||
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      ).length;
    } else {
      acc[cat] = productsList.filter(
        (p) =>
          p.category === cat &&
          (searchQuery.trim() === '' ||
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      ).length;
    }
    return acc;
  }, {});

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="min-h-screen bg-dark-900 text-white selection:bg-vital-500 selection:text-white">
      {/* Product Detail Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={closeProductModal}
      />

      {/* Cart Slide-Over Drawer */}
      <CartDrawer />

      {/* Fixed Top Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-md border-b border-white/10 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <ArrowLeft
              size={18}
              className="text-gray-400 group-hover:text-vital-400 transition-colors"
            />
            <VitalLogo className="w-9 h-9 flex-shrink-0 filter drop-shadow-[0_0_10px_rgba(249,115,22,0.3)]" />
            <div className="flex flex-col">
              <span className="text-white font-display font-bold text-lg tracking-widest leading-none">
                VITAL
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-vital-400 to-vital-600 font-tech text-[10px] tracking-[0.3em] leading-none font-bold">
                ROLEPLAY
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {/* View Order Status Link */}
            <Link
              href="/merch/orders"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-tech text-gray-400 hover:text-white border border-white/5 hover:border-white/20 transition-all uppercase tracking-wider"
            >
              <Truck size={13} className="text-vital-400" />
              <span>Track Orders</span>
            </Link>

            {/* Cart Trigger Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2 bg-vital-500 hover:bg-vital-400 text-white font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-vital-500/30 cursor-pointer"
            >
              <ShoppingBag size={15} />
              <span>Cart</span>
              {totalItems > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-dark-900 text-[11px] font-tech font-extrabold flex items-center justify-center ml-0.5">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-28 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute inset-0">
          <div
            className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] blur-[120px] rounded-full pointer-events-none transition-colors duration-1000 ${
              easterEggActive ? 'bg-red-500/20' : 'bg-vital-500/10'
            }`}
          />
          <div
            className={`absolute bottom-0 right-0 w-[400px] h-[400px] blur-[80px] rounded-full pointer-events-none transition-colors duration-1000 ${
              easterEggActive ? 'bg-purple-500/10' : 'bg-vital-600/5'
            }`}
          />
        </div>

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
                <Shirt size={14} className="text-vital-400" />
                <span className="text-xs font-tech text-gray-300 uppercase tracking-widest font-bold">
                  Official Printify POD Collection
                </span>
              </div>

              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-display font-black text-white leading-[0.9] tracking-tighter mb-6 drop-shadow-xl">
                VITAL{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-vital-400 to-vital-600">
                  MERCH
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-400 font-light leading-relaxed mb-10 max-w-lg mx-auto lg:mx-0">
                Rep the city. High-grade apparel & accessories manufactured on-demand and delivered straight to your door.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <div className="flex items-center gap-2 bg-dark-800/80 border border-white/5 px-4 py-2 rounded-lg">
                  <CheckCircle size={16} className="text-emerald-500" />
                  <span className="text-sm font-tech text-gray-300 uppercase tracking-wider">
                    Archival DTG Print
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-dark-800/80 border border-white/5 px-4 py-2 rounded-lg">
                  <Globe size={16} className="text-blue-400" />
                  <span className="text-sm font-tech text-gray-300 uppercase tracking-wider">
                    Global Fulfillment
                  </span>
                </div>
                <Link
                  href="/merch/policies"
                  className="flex items-center gap-1.5 text-xs font-tech text-gray-400 hover:text-vital-400 transition-colors py-2"
                >
                  <FileText size={14} />
                  <span>Store & POD Policies</span>
                </Link>
              </div>
            </motion.div>

            {/* Right Column: Live Status Dashboard */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="hidden lg:block relative"
            >
              <div className="bg-dark-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-vital-500 to-vital-600" />

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <span className="text-[10px] text-gray-500 font-tech uppercase tracking-widest block mb-2">
                      Store Lineup
                    </span>
                    <div className="text-5xl font-display font-black text-white">
                      {productsList.length}
                    </div>
                    <span className="text-sm text-vital-500 font-tech">ACTIVE BLUEPRINTS</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-500 font-tech uppercase tracking-widest block mb-2">
                      Fulfillment
                    </span>
                    <div className="text-5xl font-display font-black text-white">2–4d</div>
                    <span className="text-sm text-emerald-500 font-tech">PRODUCTION TIME</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-vital-500 animate-pulse" />
                      <span className="text-xs text-gray-400 font-tech uppercase tracking-widest">
                        Printify API Engine
                      </span>
                    </div>
                    <span className="text-sm font-bold font-tech uppercase tracking-widest text-emerald-400">
                      LIVE & READY
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Category Filter + Search Bar */}
      <section className="sticky top-[61px] z-40 bg-dark-900/95 backdrop-blur-md border-b border-white/5 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-tech uppercase tracking-widest transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-vital-500 text-white font-bold shadow-lg shadow-vital-500/30'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
                  }`}
                >
                  {cat}
                  <span
                    className={`text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center ${
                      activeCategory === cat ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-500'
                    }`}
                  >
                    {categoryCounts[cat]}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex-shrink-0 sm:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-16 py-2 text-sm text-white placeholder-gray-500 font-tech focus:outline-none focus:border-vital-500/50 transition-all"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              ) : (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-tech text-gray-600 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 hidden sm:inline pointer-events-none">
                  Ctrl+K
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredProducts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <Search size={48} className="text-gray-700 mx-auto mb-4" />
              <h3 className="text-xl font-display font-bold text-gray-400 mb-2">
                No matching merchandise found
              </h3>
              <p className="text-gray-600 text-sm font-tech">
                Try clearing your search query or choosing another category.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All');
                }}
                className="mt-4 text-vital-400 hover:text-vital-300 text-sm font-tech uppercase tracking-wider transition-colors cursor-pointer"
              >
                Reset filters
              </button>
            </motion.div>
          )}

          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  onSelect={openProductModal}
                  hoveredProduct={hoveredProduct}
                  setHoveredProduct={setHoveredProduct}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Community CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-vital-500/5 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="bg-dark-800/30 border border-white/5 rounded-3xl p-8 sm:p-12 lg:p-16 backdrop-blur-sm">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-white tracking-tight mb-4">
              Wear Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-vital-400 to-vital-600">
                Story
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed mb-8">
              Every garment is created specifically for you using sustainable print-on-demand technology.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setIsCartOpen(true)}
                icon={<ShoppingBag size={18} />}
              >
                View Cart ({totalItems})
              </Button>
              <Button
                href="https://discord.gg/vitalrp"
                target="_blank"
                rel="noreferrer"
                variant="outline"
                size="lg"
              >
                Join Discord
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Back To Top Button */}
      <BackToTopButton />

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-xs font-sans">
            © {new Date().getFullYear()} Vital Roleplay. All rights reserved. Not affiliated with Rockstar Games.
          </p>

          {/* Damon Easter Egg */}
          <motion.button
            key={wiggleKey}
            onClick={triggerEasterEgg}
            animate={
              wiggleKey > 0
                ? {
                    rotate: [0, -12, 12, -8, 8, -4, 4, 0],
                    scale: [1, 1.08, 0.98, 1.04, 1],
                  }
                : {}
            }
            transition={{ duration: 0.55, ease: 'easeInOut' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 bg-dark-900/50 hover:bg-dark-900/80 backdrop-blur-md border p-1 pr-4 rounded-full transition-all duration-300 shadow-xl cursor-pointer ${
              easterEggActive
                ? 'border-vital-500/80 shadow-[0_0_25px_rgba(249,115,22,0.4)]'
                : 'border-white/10 hover:border-vital-500/50'
            }`}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-dark-800 flex-shrink-0 relative">
              <motion.img
                animate={easterEggActive ? { rotate: 360 } : {}}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                src="/damon-icon.jpg"
                alt="Damon"
                className="w-full h-full object-cover"
              />
            </div>
            <span
              className={`text-xs font-tech uppercase tracking-widest font-bold transition-colors ${
                easterEggActive
                  ? 'text-vital-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {easterEggActive ? "what's up n shit" : 'Made by Damon'}
            </span>
          </motion.button>

          <Link
            href="/"
            className="text-gray-500 hover:text-vital-400 text-xs font-tech uppercase tracking-widest transition-colors"
          >
            ← Back to VitalRP.net
          </Link>
        </div>
      </footer>
    </div>
  );
};

const BackToTopButton: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.25 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-vital-500 hover:bg-vital-400 text-white shadow-lg shadow-vital-500/30 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Back to top"
        >
          <ChevronLeft size={20} className="rotate-90" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default function MerchPage() {
  return (
    <CartProvider>
      <MerchStoreContent />
    </CartProvider>
  );
}
