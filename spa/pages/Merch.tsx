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
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { VitalLogo } from '../../components/VitalLogo';
import { CartProvider, useCart } from '../../lib/merch/CartContext';
import { CartDrawer } from '../../components/merch/CartDrawer';
import { ProductModal, StoreProduct } from '../../components/merch/ProductModal';
import { supabase } from '../../lib/supabase/client';

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
];

const categories = ['All', 'Apparel', 'Accessories', 'In-Game'];

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
        </div>

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

const MerchContent: React.FC = () => {
  const { totalItems, setIsCartOpen } = useCart();
  const [productsList, setProductsList] = useState<StoreProduct[]>(FALLBACK_PRODUCTS);
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [easterEggActive, setEasterEggActive] = useState(false);
  const [wiggleKey, setWiggleKey] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      // 1. Try server API route first
      try {
        const res = await fetch('/api/merch/products');
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data.products) && data.products.length > 0) {
            setProductsList(data.products);
            return;
          }
        }
      } catch {}

      // 2. Direct Supabase Query (Runs on vitalrp.net static SPA)
      try {
        const { data: dbProducts } = await supabase
          .from('merch_products')
          .select('*, merch_variants(*)')
          .eq('status', 'live')
          .order('display_order', { ascending: true });

        if (dbProducts && dbProducts.length > 0) {
          const mapped: StoreProduct[] = dbProducts.map((p: any) => ({
            id: p.id,
            printify_product_id: p.printify_product_id,
            title: p.title,
            slug: p.slug,
            description: p.description,
            category: p.category,
            status: p.status,
            badge: p.badge,
            retail_price_cents: p.retail_price_cents,
            mockup_images: p.mockup_images || [],
            variants: (p.merch_variants || []).map((v: any) => ({
              id: v.id,
              printify_variant_id: v.printify_variant_id,
              title: v.title,
              size: v.size,
              color: v.color,
              retail_price_cents: v.retail_price_cents,
              is_enabled: v.is_enabled,
              is_in_stock: v.is_in_stock,
            })),
          }));
          setProductsList(mapped);
        }
      } catch (err) {
        console.warn('Using local fallback catalog in SPA:', err);
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

  const filteredProducts = productsList.filter((p) => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoryCounts = categories.reduce<Record<string, number>>((acc, cat) => {
    if (cat === 'All') {
      acc[cat] = productsList.length;
    } else {
      acc[cat] = productsList.filter((p) => p.category === cat).length;
    }
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-dark-900 text-white selection:bg-vital-500 selection:text-white">
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <CartDrawer />

      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-md border-b border-white/10 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
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
            <Link
              to="/merch/orders"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-tech text-gray-400 hover:text-white border border-white/5 hover:border-white/20 transition-all uppercase tracking-wider"
            >
              <Truck size={13} className="text-vital-400" />
              <span>Track Orders</span>
            </Link>

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center lg:text-left">
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
              to="/merch/policies"
              className="flex items-center gap-1.5 text-xs font-tech text-gray-400 hover:text-vital-400 transition-colors py-2"
            >
              <FileText size={14} />
              <span>Store & POD Policies</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Filter and Product Grid */}
      <section className="sticky top-[61px] z-40 bg-dark-900/95 backdrop-blur-md border-b border-white/5 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center gap-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-tech uppercase tracking-widest transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-vital-500 text-white font-bold shadow-lg shadow-vital-500/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                {cat}
                <span className="text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center bg-white/10">
                  {categoryCounts[cat]}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-64 hidden sm:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 font-tech focus:outline-none focus:border-vital-500/50"
            />
          </div>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredProducts.map((p, i) => (
            <ProductCard
              key={p.id}
              product={p}
              index={i}
              onSelect={(prod) => {
                setSelectedProduct(prod);
                setIsModalOpen(true);
              }}
              hoveredProduct={hoveredProduct}
              setHoveredProduct={setHoveredProduct}
            />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-xs font-sans">
            © {new Date().getFullYear()} Vital Roleplay. All rights reserved.
          </p>

          <Link
            to="/"
            className="text-gray-500 hover:text-vital-400 text-xs font-tech uppercase tracking-widest transition-colors"
          >
            ← Back to VitalRP.net
          </Link>
        </div>
      </footer>
    </div>
  );
};

export const Merch: React.FC = () => {
  return (
    <CartProvider>
      <MerchContent />
    </CartProvider>
  );
};
