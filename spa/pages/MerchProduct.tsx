import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  ArrowLeft,
  ChevronRight,
  CheckCircle,
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Share2,
  Check,
  Copy,
  Info,
  Layers,
  ZoomIn,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { AdminControls } from '../../components/AdminControls';
import { StoreModal } from '../../components/StoreModal';
import { ScrollToTop } from '../../components/ScrollToTop';
import { CartDrawer } from '../../components/merch/CartDrawer';
import { CartProvider, useCart } from '../../lib/merch/CartContext';
import {
  StoreProduct,
  FALLBACK_PRODUCTS,
  findProductBySlug,
  normalizeSlug,
  parseProductDescription,
} from '../../lib/merch/catalog';
import { ProductDetailSkeleton } from '../../components/merch/MerchSkeletons';
import { getApiUrl } from '../../lib/api-config';
import { supabase } from '../../lib/supabase/client';

const MerchProductInner: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem, setIsCartOpen, totalItems, initiateCheckout, isCheckingOut } = useCart();

  const [product, setProduct] = useState<StoreProduct | null>(() => findProductBySlug(slug || ''));
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<StoreProduct[]>(FALLBACK_PRODUCTS);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);

  // Always scroll to top immediately when mounting or changing product slug
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [slug]);

  // Fetch full catalog and product by slug
  useEffect(() => {
    let isMounted = true;
    const loadProduct = async () => {
      setLoading(true);
      const targetSlug = slug || '';

      // 1. Initial check against local fallback (synchronized with DB)
      const initial = findProductBySlug(targetSlug, FALLBACK_PRODUCTS);
      if (initial && isMounted) {
        setProduct(initial);
      }

      // 2. Fetch live database products
      try {
        const res = await fetch(getApiUrl('/api/merch/products'));
        const contentType = res.headers.get('content-type') || '';
        let liveProducts: StoreProduct[] = [];

        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data.products) && data.products.length > 0) {
            liveProducts = data.products.map((p: any) => {
              const parsed = parseProductDescription(p.description);
              const cleanTitle = p.title.replace(/\s*\|.*$/, '').trim();
              return {
                ...p,
                title: cleanTitle,
                slug: normalizeSlug(p.slug),
                description: parsed.cleanDescription,
                details: (p.details && p.details.length > 0) ? p.details : parsed.details,
              };
            });
          }
        }

        // Direct Supabase fallback if API returns empty
        if (liveProducts.length === 0) {
          const { data: dbProducts } = await supabase
            .from('merch_products')
            .select('*, merch_variants(*)')
            .eq('status', 'live')
            .order('display_order', { ascending: true });

          if (dbProducts && dbProducts.length > 0) {
            liveProducts = dbProducts.map((p: any) => {
              const parsed = parseProductDescription(p.description);
              const cleanTitle = p.title.replace(/\s*\|.*$/, '').trim();
              return {
                id: p.id,
                printify_product_id: p.printify_product_id,
                title: cleanTitle,
                slug: normalizeSlug(p.slug),
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
          }
        }

        if (liveProducts.length > 0 && isMounted) {
          setCatalog(liveProducts);
          const found = findProductBySlug(targetSlug, liveProducts);
          if (found) {
            setProduct(found);
          }
        }
      } catch (err) {
        console.warn('Using local fallback catalog for product lookup:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Set default color and size when product resolves
  useEffect(() => {
    if (!product) return;

    setSelectedImageIndex(0);
    setQuantity(1);

    const variants = product.variants || [];
    const firstInStock = variants.find((v) => v.is_in_stock && v.is_enabled) || variants[0];
    if (firstInStock) {
      setSelectedColor(firstInStock.color || null);
      setSelectedSize(firstInStock.size || null);
    }

    // Dynamic Title & Meta tags
    const priceFormatted = `$${(product.retail_price_cents / 100).toFixed(2)}`;
    document.title = `${product.title} (${priceFormatted}) | Vital RP Official Store`;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        `${product.description} Official Vital RP heavyweight merchandise. Ships worldwide.`
      );
    }
  }, [product]);

  // Copy shareable link
  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  // Compute available colors and sizes
  const variants = product?.variants || [];
  const colors = Array.from(new Set(variants.map((v) => v.color).filter(Boolean))) as string[];
  const sizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean))) as string[];

  // Find currently selected variant based on chosen color and size
  const selectedVariant = variants.find((v) => {
    const matchesColor = !v.color || v.color === selectedColor;
    const matchesSize = !v.size || v.size === selectedSize;
    return matchesColor && matchesSize;
  }) || variants[0];

  const currentPriceCents = selectedVariant?.retail_price_cents || product?.retail_price_cents || 0;
  const displayPrice = `$${(currentPriceCents / 100).toFixed(2)}`;
  const isInStock = selectedVariant ? selectedVariant.is_in_stock && selectedVariant.is_enabled : true;

  // Add to cart action
  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;

    const primaryImage = product.mockup_images[selectedImageIndex]?.src || product.mockup_images[0]?.src || '';

    addItem(
      {
        printify_product_id: product.printify_product_id || product.id,
        printify_variant_id: selectedVariant.printify_variant_id || 0,
        product_id: product.id,
        title: product.title,
        variant_title: selectedVariant.title || `${selectedColor || ''} ${selectedSize || ''}`.trim(),
        size: selectedSize || undefined,
        color: selectedColor || undefined,
        price_cents: currentPriceCents,
        image_url: primaryImage,
        slug: product.slug,
      },
      quantity
    );

    // Confetti burst
    try {
      confetti({
        particleCount: 28,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#f97316', '#ea580c', '#38bdf8', '#10b981'],
      });
    } catch {}

    setIsCartOpen(true);
  };

  // Instant Buy Now
  const handleBuyNow = async () => {
    if (!product || !selectedVariant) return;
    handleAddToCart();
    setTimeout(() => {
      initiateCheckout();
    }, 200);
  };

  // Related products
  const relatedProducts = catalog
    .filter((p) => p.slug !== product?.slug && p.status === 'live')
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-dark-950 text-white selection:bg-vital-500 selection:text-white relative">
      <AdminControls />
      <Navbar onOpenStore={() => setIsStoreOpen(true)} />
      <CartDrawer />

      <main className="relative z-10 pt-24 sm:pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Sub-Header Breadcrumb & Store Utility Bar */}
          <div className="py-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 mb-8 sm:mb-12">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-tech tracking-wider uppercase text-gray-400">
              <Link to="/" className="hover:text-white transition-colors">
                Vital RP
              </Link>
              <ChevronRight size={13} className="text-gray-600" />
              <Link to="/merch" className="hover:text-vital-400 transition-colors">
                Merch Store
              </Link>
              {product && (
                <>
                  <ChevronRight size={13} className="text-gray-600" />
                  <span className="text-gray-200 font-bold truncate max-w-[200px] sm:max-w-xs">
                    {product.title}
                  </span>
                </>
              )}
            </nav>

            <div className="flex items-center gap-3">
              <Link
                to="/merch"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-tech text-gray-400 hover:text-white border border-white/5 hover:border-white/20 transition-all uppercase tracking-wider"
              >
                <ArrowLeft size={13} />
                <span>All Drops</span>
              </Link>

              <Link
                to="/merch/orders"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-tech text-gray-400 hover:text-white border border-white/5 hover:border-white/20 transition-all uppercase tracking-wider"
              >
                <Truck size={13} className="text-vital-400" />
                <span>Track Orders</span>
              </Link>

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-2 px-3.5 py-1.5 bg-vital-500 hover:bg-vital-400 text-white font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-vital-500/25 cursor-pointer"
              >
                <ShoppingBag size={14} />
                <span className="hidden sm:inline">Cart</span>
                {totalItems > 0 && (
                  <span className="w-4 h-4 rounded-full bg-white text-dark-900 text-[10px] font-tech font-extrabold flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Loading Skeleton State */}
          {loading && <ProductDetailSkeleton />}

          {/* Product Not Found State */}
          {!loading && !product && (
            <div className="py-20 text-center max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-vital-500/10 border border-vital-500/30 flex items-center justify-center mx-auto mb-6 text-vital-400 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                <AlertCircle size={32} />
              </div>
              <span className="text-xs font-tech uppercase tracking-widest text-vital-400 font-bold block mb-2">
                404 • Drop Unavailable
              </span>
              <h1 className="text-3xl sm:text-4xl font-display font-black text-white mb-4">
                Product Not Found
              </h1>
              <p className="text-gray-400 text-sm font-sans leading-relaxed mb-8">
                The merch drop you are looking for ({slug}) might have been archived, renamed, or is currently restocking.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/merch"
                  className="px-6 py-3 bg-vital-500 hover:bg-vital-400 text-white font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-vital-500/30"
                >
                  Browse Merch Store
                </Link>
                <Link
                  to="/"
                  className="px-6 py-3 bg-dark-800 hover:bg-dark-700 text-gray-300 font-display font-bold text-xs uppercase tracking-wider rounded-xl border border-white/10 transition-colors"
                >
                  Return Home
                </Link>
              </div>
            </div>
          )}

          {/* Product Details Section */}
          {!loading && product && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
              {/* Left Column: Image Gallery Carousel */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                {/* Main Large Mockup Preview */}
                <div className="relative aspect-square w-full rounded-3xl bg-gradient-to-b from-dark-800/80 to-dark-900 border border-white/10 overflow-hidden flex items-center justify-center shadow-2xl group">
                  {product.badge && (
                    <div className="absolute top-5 left-5 z-20">
                      <span className="px-3.5 py-1.5 rounded-full bg-vital-500 text-white font-tech font-bold text-xs uppercase tracking-widest shadow-lg shadow-vital-500/30 flex items-center gap-1.5">
                        <Sparkles size={12} />
                        {product.badge}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={handleCopyLink}
                    title="Share direct product link"
                    className="absolute top-5 right-5 z-20 p-2.5 rounded-full bg-dark-900/80 hover:bg-dark-800 border border-white/15 text-gray-300 hover:text-white backdrop-blur-md transition-all shadow-lg cursor-pointer"
                  >
                    {copiedLink ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
                  </button>

                  {copiedLink && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute top-16 right-5 z-30 bg-emerald-500 text-dark-950 text-[11px] font-tech font-bold px-3 py-1 rounded shadow-lg uppercase tracking-wider"
                    >
                      Direct Link Copied!
                    </motion.div>
                  )}

                  <AnimatePresence mode="wait">
                    <motion.img
                      key={selectedImageIndex}
                      src={product.mockup_images[selectedImageIndex]?.src || product.mockup_images[0]?.src}
                      alt={product.title}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="w-full h-full object-contain p-6 sm:p-12 filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.7)] group-hover:scale-105 transition-transform duration-500"
                    />
                  </AnimatePresence>
                </div>

                {/* Thumbnails Row */}
                {product.mockup_images.length > 1 && (
                  <div className="flex items-center gap-3 overflow-x-auto pb-2">
                    {product.mockup_images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative w-20 h-20 rounded-2xl bg-dark-800/80 border p-2 flex-shrink-0 transition-all cursor-pointer ${
                          selectedImageIndex === idx
                            ? 'border-vital-500 ring-2 ring-vital-500/30'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <img
                          src={img.src}
                          alt={`${product.title} view ${idx + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Details, Sizing, Colors, Actions */}
              <div className="lg:col-span-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-xs font-tech uppercase tracking-widest text-vital-400 font-bold">
                      {product.category} • Official Vital RP Drop
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-tech uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Made To Order
                    </span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-white leading-tight mb-4">
                    {product.title}
                  </h1>

                  <div className="flex items-baseline gap-3 mb-6">
                    <span className="text-3xl sm:text-4xl font-display font-black text-vital-400">
                      {displayPrice}
                    </span>
                    <span className="text-xs font-tech text-gray-400 uppercase tracking-wider">
                      USD • Free Shipping on $75+
                    </span>
                  </div>

                  <p className="text-gray-300 text-sm font-sans leading-relaxed mb-6">
                    {product.description}
                  </p>

                  {/* Color Selector */}
                  {colors.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-tech uppercase tracking-wider text-gray-400 font-bold">
                          Color: <span className="text-white">{selectedColor}</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {colors.map((color) => {
                          const isSelected = selectedColor === color;
                          return (
                            <button
                              key={color}
                              onClick={() => setSelectedColor(color)}
                              className={`px-4 py-2 rounded-xl text-xs font-tech uppercase tracking-wider transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-vital-500 text-white font-bold shadow-lg shadow-vital-500/30'
                                  : 'bg-dark-800 text-gray-300 hover:bg-dark-700 border border-white/10'
                              }`}
                            >
                              {color}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Size Selector */}
                  {sizes.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-tech uppercase tracking-wider text-gray-400 font-bold">
                          Size: <span className="text-white">{selectedSize}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowSizeGuide(!showSizeGuide)}
                          className="text-[11px] font-tech text-vital-400 hover:text-vital-300 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          <Info size={12} />
                          Size Guide
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {sizes.map((size) => {
                          const isSelected = selectedSize === size;
                          const variantForSize = variants.find(
                            (v) => (!v.color || v.color === selectedColor) && v.size === size
                          );
                          const isAvailable = variantForSize ? variantForSize.is_in_stock && variantForSize.is_enabled : true;

                          return (
                            <button
                              key={size}
                              disabled={!isAvailable}
                              onClick={() => setSelectedSize(size)}
                              className={`min-w-[48px] px-3.5 py-2.5 rounded-xl text-xs font-tech uppercase font-bold tracking-wider transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-vital-500 text-white shadow-lg shadow-vital-500/30'
                                  : isAvailable
                                  ? 'bg-dark-800 text-gray-300 hover:bg-dark-700 border border-white/10'
                                  : 'bg-dark-900/50 text-gray-600 border border-white/5 cursor-not-allowed opacity-50 line-through'
                              }`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>

                      {/* Expandable Size Guide */}
                      <AnimatePresence>
                        {showSizeGuide && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 p-4 rounded-xl bg-dark-800/80 border border-white/10 text-xs font-tech text-gray-300 overflow-hidden"
                          >
                            <span className="font-bold text-white block mb-1">Standard Unisex Sizing Chart</span>
                            <div className="grid grid-cols-4 gap-2 text-[11px] text-gray-400 pt-2 border-t border-white/5">
                              <div><strong>Size</strong><br/>S<br/>M<br/>L<br/>XL<br/>2XL</div>
                              <div><strong>Chest</strong><br/>34-36"<br/>38-40"<br/>42-44"<br/>46-48"<br/>50-52"</div>
                              <div><strong>Length</strong><br/>28"<br/>29"<br/>30"<br/>31"<br/>32"</div>
                              <div><strong>Fit</strong><br/>Regular<br/>Regular<br/>Regular<br/>Regular<br/>Oversized</div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Quantity Selector */}
                  <div className="mb-8">
                    <span className="text-xs font-tech uppercase tracking-wider text-gray-400 font-bold block mb-2.5">
                      Quantity
                    </span>
                    <div className="inline-flex items-center rounded-xl bg-dark-800 border border-white/10 p-1">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-300 disabled:opacity-30 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-tech font-bold text-sm text-white">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                        disabled={quantity >= 10}
                        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-300 disabled:opacity-30 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Actions: Add To Cart & Instant Checkout */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-8">
                    <button
                      onClick={handleAddToCart}
                      disabled={!isInStock}
                      className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-vital-500 hover:bg-vital-400 disabled:bg-gray-700 text-white font-display font-bold text-sm uppercase tracking-wider rounded-2xl transition-all shadow-xl shadow-vital-500/30 cursor-pointer"
                    >
                      <ShoppingBag size={18} />
                      <span>{isInStock ? 'Add To Cart' : 'Sold Out'}</span>
                    </button>

                    <button
                      onClick={handleBuyNow}
                      disabled={!isInStock || isCheckingOut}
                      className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-dark-800 hover:bg-dark-700 border border-vital-500/40 text-white font-display font-bold text-sm uppercase tracking-wider rounded-2xl transition-all hover:border-vital-500 shadow-lg cursor-pointer"
                    >
                      <Sparkles size={18} className="text-vital-400" />
                      <span>{isCheckingOut ? 'Loading...' : 'Instant Checkout'}</span>
                    </button>
                  </div>

                  {/* Fulfillment Features */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 border-t border-white/5 text-xs font-tech text-gray-400">
                    <div className="flex items-center gap-2.5 bg-dark-900/60 border border-white/5 p-3 rounded-xl">
                      <Truck size={16} className="text-vital-400 shrink-0" />
                      <span>Ships in 2-4 business days</span>
                    </div>
                    <div className="flex items-center gap-2.5 bg-dark-900/60 border border-white/5 p-3 rounded-xl">
                      <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                      <span>100% Free Reprint Guarantee</span>
                    </div>
                  </div>
                </div>

                {/* Manufacturing Specifications */}
                {product.details && product.details.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-white/5">
                    <h3 className="text-xs font-tech uppercase tracking-wider text-gray-400 font-bold mb-3">
                      Drop Specifications
                    </h3>
                    <ul className="space-y-2 text-xs font-sans text-gray-300">
                      {product.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle size={14} className="text-vital-400 shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Related Items Section */}
          {relatedProducts.length > 0 && (
            <div className="mt-24 pt-16 border-t border-white/5">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="text-xs font-tech uppercase tracking-widest text-vital-400 font-bold block mb-1">
                    Complete Your Fit
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-display font-black text-white">
                    Other Official Drops
                  </h2>
                </div>
                <Link
                  to="/merch"
                  className="text-xs font-tech uppercase tracking-wider text-gray-400 hover:text-vital-400 flex items-center gap-1 transition-colors"
                >
                  <span>View All Drops</span>
                  <ChevronRight size={14} />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedProducts.map((p) => (
                  <Link
                    key={p.id}
                    to={`/merch/${p.slug}`}
                    className="group rounded-3xl bg-dark-800/40 border border-white/5 hover:border-vital-500/40 transition-all p-5 flex flex-col justify-between"
                  >
                    <div className="aspect-square rounded-2xl bg-dark-900/60 overflow-hidden mb-4 flex items-center justify-center p-4">
                      <img
                        src={p.mockup_images[0]?.src}
                        alt={p.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div>
                      <h4 className="text-white font-display font-bold text-base group-hover:text-vital-400 transition-colors">
                        {p.title}
                      </h4>
                      <p className="text-vital-400 font-display font-bold text-sm mt-1">
                        ${(p.retail_price_cents / 100).toFixed(2)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer onOpenStore={() => setIsStoreOpen(true)} />
      <StoreModal isOpen={isStoreOpen} onClose={() => setIsStoreOpen(false)} />
      <ScrollToTop />
    </div>
  );
};

export const MerchProduct: React.FC = () => {
  return (
    <CartProvider>
      <MerchProductInner />
    </CartProvider>
  );
};
