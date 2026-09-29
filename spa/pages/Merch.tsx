import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Search,
  ZoomIn,
  Truck,
  FileText,
  ChevronRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { AdminControls } from '../../components/AdminControls';
import { StoreModal } from '../../components/StoreModal';
import { ScrollToTop } from '../../components/ScrollToTop';
import { CartProvider, useCart } from '../../lib/merch/CartContext';
import { CartDrawer } from '../../components/merch/CartDrawer';
import {
  StoreProduct,
  FALLBACK_PRODUCTS,
  normalizeSlug,
  parseProductDescription,
} from '../../lib/merch/catalog';
import { ProductCardSkeleton } from '../../components/merch/MerchSkeletons';
import { MerchHero } from '../../components/merch/MerchHero';
import { supabase } from '../../lib/supabase/client';
import { getApiUrl } from '../../lib/api-config';

const categories = ['All', 'Apparel', 'Accessories', 'In-Game'];

const ProductCard: React.FC<{
  product: StoreProduct;
  index: number;
  hoveredProduct: string | null;
  setHoveredProduct: (id: string | null) => void;
}> = ({ product, index, hoveredProduct, setHoveredProduct }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { addItem, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  const primaryImage = product.mockup_images[0]?.src || '/merch/hoodie.png';
  const displayPrice = `$${(product.retail_price_cents / 100).toFixed(2)}`;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const defaultVariant = product.variants.find((v) => v.is_in_stock && v.is_enabled) || product.variants[0];
    if (!defaultVariant) {
      navigate(`/merch/${product.slug}`);
      return;
    }

    addItem({
      printify_product_id: product.printify_product_id || product.id,
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

    try {
      confetti({
        particleCount: 20,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#f97316', '#ea580c', '#38bdf8'],
      });
    } catch {}

    setIsCartOpen(true);
  };

  return (
    <div
      ref={ref}
      className="group relative cursor-pointer"
      onMouseEnter={() => setHoveredProduct(product.id)}
      onMouseLeave={() => setHoveredProduct(null)}
    >
      <Link
        to={`/merch/${product.slug}`}
        className="block h-full bg-dark-900/60 border border-white/5 rounded-3xl overflow-hidden hover:border-vital-500/40 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(249,115,22,0.15)] flex flex-col justify-between"
      >
        {/* Mockup Container */}
        <div className="relative aspect-square bg-gradient-to-b from-dark-800/80 to-dark-900 overflow-hidden flex items-center justify-center p-8 border-b border-white/5">
          {product.badge && (
            <div className="absolute top-4 left-4 z-10">
              <span className="px-3 py-1 rounded-full bg-vital-500 text-white font-tech font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-vital-500/30 flex items-center gap-1.5">
                <Sparkles size={11} />
                {product.badge}
              </span>
            </div>
          )}

          <img
            src={primaryImage}
            alt={product.title}
            className="w-full h-full object-contain filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform duration-500"
          />

          {/* Hover Overlay Actions */}
          <AnimatePresence>
            {hoveredProduct === product.id && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-4 left-4 right-4 z-20 flex gap-2"
              >
                <div
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-display font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-colors border border-white/10"
                >
                  <ZoomIn size={14} />
                  View Details
                </div>
                <button
                  type="button"
                  onClick={handleQuickAdd}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-vital-500 hover:bg-vital-400 text-white font-display font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-colors shadow-lg shadow-vital-500/30 cursor-pointer"
                >
                  <ShoppingBag size={14} />
                  Quick Add
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Card Content */}
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
            <p className="text-gray-400 text-xs font-sans line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-tech text-gray-500 uppercase tracking-widest">
            <span>{product.category}</span>
            <span className="flex items-center gap-1 text-vital-400/80 group-hover:text-vital-400">
              <span>View Drop</span>
              <ArrowRight size={10} />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

const MerchContent: React.FC = () => {
  const { totalItems, setIsCartOpen } = useCart();
  const navigate = useNavigate();
  const [productsList, setProductsList] = useState<StoreProduct[]>(FALLBACK_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isStoreOpen, setIsStoreOpen] = useState(false);

  const handleScrollToCatalog = () => {
    const el = document.getElementById('catalog');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleViewLatestDrops = () => {
    setActiveCategory('All');
    setSearchQuery('');
    handleScrollToCatalog();
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    document.title = 'Vital RP Official Store | Heavyweight Gear & Limited Drops';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Rep the city in style. Official Vital RP premium heavyweight hoodies, graphic tees, kiss-cut decals, and exclusive apparel. Handcrafted quality for Los Santos citizens.'
      );
    }
  }, []);

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        // 1. Try server API route first
        try {
          const res = await fetch(getApiUrl('/api/merch/products'));
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
            const mapped: StoreProduct[] = dbProducts.map((p: any) => {
              const parsed = parseProductDescription(p.description);
              const cleanTitle = p.title.replace(/\s*\|.*$/, '').trim();
              const cleanSlug = normalizeSlug(p.slug);
              return {
                id: p.id,
                printify_product_id: p.printify_product_id,
                title: cleanTitle,
                slug: cleanSlug,
                description: parsed.cleanDescription,
                category: p.category,
                status: p.status,
                badge: p.badge || (cleanTitle.toLowerCase().includes('hoodie') ? 'Best Seller' : cleanTitle.toLowerCase().includes('sticker') ? 'Official Drop' : undefined),
                retail_price_cents: p.retail_price_cents,
                mockup_images: p.mockup_images || [],
                details: (p.details && p.details.length > 0) ? p.details : parsed.details,
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
              };
            });
            setProductsList(mapped);
          }
        } catch (err) {
          console.warn('Using local fallback catalog in SPA:', err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

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
    <div className="min-h-screen bg-dark-950 text-white selection:bg-vital-500 selection:text-white relative">
      <AdminControls />
      {/* Global Shared Website Navbar */}
      <Navbar onOpenStore={() => setIsStoreOpen(true)} />
      <CartDrawer />

      <main className="relative z-10 pt-24 sm:pt-28 pb-20">
        {/* Merch Storefront Utility & Breadcrumb Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 mb-10">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-tech tracking-wider uppercase text-gray-400">
              <Link to="/" className="hover:text-white transition-colors">
                Vital RP
              </Link>
              <ChevronRight size={13} className="text-gray-600" />
              <span className="text-vital-400 font-bold">Official Merch Store</span>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                to="/merch/orders"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-tech text-gray-400 hover:text-white border border-white/5 hover:border-white/20 transition-all uppercase tracking-wider"
              >
                <Truck size={13} className="text-vital-400" />
                <span>Track Orders</span>
              </Link>

              <Link
                to="/merch/policies"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-tech text-gray-400 hover:text-white border border-white/5 hover:border-white/20 transition-all uppercase tracking-wider"
              >
                <FileText size={13} />
                <span>Policies</span>
              </Link>

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-2 px-3.5 py-1.5 bg-vital-500 hover:bg-vital-400 text-white font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-vital-500/25 cursor-pointer"
              >
                <ShoppingBag size={14} />
                <span>Cart</span>
                {totalItems > 0 && (
                  <span className="w-4 h-4 rounded-full bg-white text-dark-900 text-[10px] font-tech font-extrabold flex items-center justify-center ml-0.5">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modern Minimal Hero Section */}
        <MerchHero
          onShopMerch={handleScrollToCatalog}
          onViewLatestDrops={handleViewLatestDrops}
          onSelectProduct={(slug) => navigate(`/merch/${slug}`)}
          featuredProducts={productsList}
        />

        {/* Filter and Product Grid */}
        <section id="catalog" className="sticky top-[72px] z-30 bg-dark-950/90 backdrop-blur-xl border-y border-white/5 py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center gap-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-tech uppercase tracking-widest transition-all cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-vital-500 text-white font-bold shadow-lg shadow-vital-500/30'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
                  }`}
                >
                  {cat}
                  <span className="text-[10px] rounded-full min-w-[16px] h-[16px] flex items-center justify-center bg-white/10">
                    {categoryCounts[cat] || 0}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative w-64 hidden sm:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search drops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-gray-500 font-tech focus:outline-none focus:border-vital-500/50"
              />
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {Array.from({ length: 4 }).map((_, idx) => (
                <ProductCardSkeleton key={idx} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filteredProducts.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  index={i}
                  hoveredProduct={hoveredProduct}
                  setHoveredProduct={setHoveredProduct}
                />
              ))}
            </div>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="py-20 text-center text-gray-500 font-tech">
              No products found matching &ldquo;{searchQuery}&rdquo;.
            </div>
          )}
        </section>
      </main>

      {/* Global Shared Footer */}
      <Footer onOpenStore={() => setIsStoreOpen(true)} />
      <StoreModal isOpen={isStoreOpen} onClose={() => setIsStoreOpen(false)} />
      <ScrollToTop />
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
