import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ShoppingBag, ArrowLeft, ExternalLink, Shirt, Coffee, Sticker, Package, Star, Sparkles, Tag, Globe, CheckCircle, Search, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { VitalLogo } from '../../components/VitalLogo';

// -----------------------------------------------------------------------
// CONFIGURATION — Update this URL once your Fourthwall store is live
// -----------------------------------------------------------------------
const FOURTHWALL_STORE_URL = 'https://vitalrp-shop.fourthwall.com/';
const STORE_LIVE = true;

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  image: string;
  badge?: string;
  fourthwallUrl?: string;
  details?: string[];
  sizes?: string[];
}

const products: Product[] = [
  // Original 6
  {
    id: 'hoodie-classic',
    name: 'Vital Classic Hoodie',
    description: 'Premium heavyweight hoodie with embroidered V logo. 400 GSM cotton blend.',
    price: '$59.99',
    category: 'Apparel',
    image: '/merch/hoodie.png',
    badge: 'Best Seller',
    details: ['400 GSM heavyweight cotton blend', 'Embroidered V logo on chest', 'Kangaroo pocket', 'Ribbed cuffs & hem', 'Relaxed fit'],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
  },
  {
    id: 'tee-logo',
    name: 'V Logo Tee',
    description: 'Soft-touch cotton tee with printed Vital RP chest logo.',
    price: '$29.99',
    category: 'Apparel',
    image: '/merch/tshirt.png',
    details: ['100% ring-spun cotton', 'Screen-printed chest logo', 'Pre-shrunk fabric', 'Crew neck'],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
  },
  {
    id: 'snapback',
    name: 'Vital Snapback',
    description: 'Structured snapback cap with embroidered V logo. One size fits all.',
    price: '$34.99',
    category: 'Apparel',
    image: '/merch/hat.png',
    badge: 'New',
    details: ['Structured 6-panel design', 'Embroidered front logo', 'Adjustable snapback closure', 'Flat brim'],
  },
  {
    id: 'mug-matte',
    name: 'Matte Black Mug',
    description: 'Premium ceramic mug with Vital RP logo. 11oz capacity.',
    price: '$19.99',
    category: 'Accessories',
    image: '/merch/mug.png',
    details: ['Premium ceramic', '11oz capacity', 'Dishwasher safe', 'Matte black finish'],
  },
  {
    id: 'sticker-pack',
    name: 'Sticker Pack',
    description: 'Die-cut vinyl sticker set. Waterproof, weather-resistant.',
    price: '$12.99',
    category: 'Accessories',
    image: '/merch/stickers.png',
    details: ['10 die-cut vinyl stickers', 'Waterproof & weather-resistant', 'UV protected', 'Various sizes included'],
  },
  {
    id: 'desk-mat',
    name: 'Gaming Desk Mat',
    description: 'Extended desk pad with anti-slip rubber base. 900x400mm.',
    price: '$39.99',
    category: 'Accessories',
    image: '/merch/mousepad.png',
    badge: 'Popular',
    details: ['900x400mm extended size', 'Anti-slip rubber base', 'Smooth cloth surface', 'Stitched edges', '3mm thickness'],
  },
  
  // New Additions: Apparel
  {
    id: 'joggers',
    name: 'Vital Premium Joggers',
    description: 'Slim-fit black joggers with orange V logo on the thigh. Ultra-soft fleece.',
    price: '$49.99',
    category: 'Apparel',
    image: '/merch/joggers.png',
    details: ['Ultra-soft fleece interior', 'Printed V logo on thigh', 'Elastic waistband with drawcord', 'Zippered pockets', 'Tapered fit'],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
  },
  {
    id: 'beanie',
    name: 'Classic Knit Beanie',
    description: 'Warm winter beanie with woven Vital RP tag on the cuff.',
    price: '$24.99',
    category: 'Apparel',
    image: '/merch/beanie.png',
    details: ['100% acrylic knit', 'Woven label on cuff', 'One size fits most', 'Fold-over cuff design'],
  },
  {
    id: 'zipup-hoodie',
    name: 'Vital Zip-Up Hoodie',
    description: 'Lightweight premium zip-up with subtle chest logo.',
    price: '$54.99',
    category: 'Apparel',
    image: '/merch/zipup.png',
    details: ['Lightweight 280 GSM french terry', 'Metal YKK zipper', 'Subtle embroidered logo', 'Split kangaroo pockets', 'Slim fit'],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
  },
  {
    id: 'longsleeve-tee',
    name: 'Los Santos Long Sleeve',
    description: 'Long sleeve tee with "LOS SANTOS" typography down the arms.',
    price: '$34.99',
    category: 'Apparel',
    image: '/merch/longsleeve.png',
    details: ['100% combed cotton', 'Typography print on both sleeves', 'Ribbed cuffs', 'Relaxed fit'],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
  },
  {
    id: 'windbreaker',
    name: 'Vital Windbreaker',
    description: 'Water-resistant lightweight jacket perfect for breezy nights.',
    price: '$64.99',
    category: 'Apparel',
    image: '/merch/windbreaker.png',
    badge: 'Premium',
    details: ['Water-resistant shell', 'Mesh lined interior', 'Packable design', 'Adjustable hood & cuffs', 'Zippered pockets'],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
  },

  // New Additions: Accessories & EDC
  {
    id: 'neon-sign',
    name: 'V Logo Neon Sign',
    description: 'LED neon wall sign to elevate your gaming setup.',
    price: '$89.99',
    category: 'Accessories',
    image: '/merch/neonsign.png',
    badge: 'Limited',
    details: ['LED neon flex tubes', 'Acrylic backboard', 'Warm orange glow', 'Wall-mount ready', 'Low power consumption'],
  },
  {
    id: 'keycap',
    name: 'Artisan Keycap',
    description: 'Custom mechanical keyboard keycap featuring the Vital logo.',
    price: '$19.99',
    category: 'Accessories',
    image: '/merch/keycap.png',
    details: ['PBT plastic construction', 'Laser-engraved logo', 'Cherry MX compatible', 'SA profile'],
  },
  {
    id: 'coasters',
    name: 'Matte Slate Coasters',
    description: 'Set of 4 heavy-duty slate coasters with engraved logo.',
    price: '$24.99',
    category: 'Accessories',
    image: '/merch/coasters.png',
    details: ['Natural slate material', 'Laser engraved logo', 'Set of 4', 'Cork backing', 'Heat resistant'],
  },
  {
    id: 'phone-case',
    name: 'Tough Phone Case',
    description: 'Matte black phone case with geometric pattern and logo.',
    price: '$29.99',
    category: 'Accessories',
    image: '/merch/phonecase.png',
    details: ['Dual-layer protection', 'Raised bezel for screen', 'Wireless charging compatible', 'Matte finish'],
  },
  {
    id: 'lanyard',
    name: 'Vital Lanyard & Keychain',
    description: 'Heavy duty lanyard with metal enamel V logo keychain.',
    price: '$14.99',
    category: 'Accessories',
    image: '/merch/lanyard.png',
    details: ['Woven polyester strap', 'Metal enamel V keychain', 'Safety breakaway clasp', 'Detachable lower clip'],
  },
  {
    id: 'tote-bag',
    name: 'Canvas Tote Bag',
    description: 'Durable black canvas tote for everyday carry.',
    price: '$22.99',
    category: 'Accessories',
    image: '/merch/totebag.png',
    details: ['12oz heavy canvas', 'Reinforced stitching', 'Interior pocket', 'Long carry handles'],
  },
  {
    id: 'water-bottle',
    name: 'Insulated Water Bottle',
    description: 'Keeps drinks cold for 24h during long RP sessions.',
    price: '$34.99',
    category: 'Accessories',
    image: '/merch/waterbottle.png',
    details: ['Double-wall vacuum insulated', '24h cold / 12h hot', '750ml capacity', 'Leak-proof lid', 'BPA free'],
  },

  // New Additions: In-Game Factions
  {
    id: 'lspd-tee',
    name: 'LSPD Dept Tee',
    description: 'Official Los Santos Police Department graphic tee.',
    price: '$29.99',
    category: 'In-Game',
    image: '/merch/lspd.png',
    details: ['100% cotton', 'Front badge graphic', 'Back department text', 'Relaxed fit'],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
  },
  {
    id: 'burgershot-tee',
    name: 'Burgershot Uniform',
    description: 'Vintage wash tee featuring the iconic Burgershot logo.',
    price: '$29.99',
    category: 'In-Game',
    image: '/merch/burgershot.png',
    details: ['Vintage wash finish', 'Retro-style print', 'Soft hand feel', 'Slim fit'],
    sizes: ['S', 'M', 'L', 'XL'],
  },
];

const categories = ['All', 'Apparel', 'Accessories', 'In-Game'];

// -----------------------------------------------------------------------
// Product Detail Modal
// -----------------------------------------------------------------------
const ProductModal: React.FC<{
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ product, isOpen, onClose }) => {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setSelectedSize(null);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="relative w-full max-w-3xl max-h-[90vh] bg-dark-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all duration-200 cursor-pointer backdrop-blur-sm"
            >
              <X size={18} />
            </button>

            <div className="grid md:grid-cols-2 gap-0">
              {/* Image Side */}
              <div className="relative aspect-square md:aspect-auto bg-gradient-to-br from-dark-800 to-dark-900 overflow-hidden">
                {product.badge && (
                  <div className="absolute top-4 left-4 z-20">
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-tech font-bold uppercase tracking-wider ${
                      product.badge === 'Best Seller'
                        ? 'bg-vital-500 text-white'
                        : product.badge === 'New'
                        ? 'bg-emerald-500 text-white'
                        : product.badge === 'Limited'
                        ? 'bg-purple-500 text-white'
                        : product.badge === 'Premium'
                        ? 'bg-amber-500 text-white'
                        : 'bg-blue-500 text-white'
                    }`}>
                      {product.badge === 'Best Seller' && <Star size={10} className="fill-current" />}
                      {product.badge === 'New' && <Sparkles size={10} />}
                      {product.badge === 'Limited' && <Sparkles size={10} />}
                      {product.badge}
                    </span>
                  </div>
                )}
                <motion.img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  layoutId={`product-image-${product.id}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900/30 via-transparent to-transparent" />
              </div>

              {/* Details Side */}
              <div className="p-6 sm:p-8 overflow-y-auto max-h-[50vh] md:max-h-[90vh] flex flex-col">
                <span className="text-[10px] font-tech text-vital-400 uppercase tracking-[0.3em] mb-2 block">
                  {product.category}
                </span>
                <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight mb-2">
                  {product.name}
                </h2>
                <p className="text-3xl font-display font-bold text-vital-400 mb-6">
                  {product.price}
                </p>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  {product.description}
                </p>

                {/* Size Selector */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="mb-6">
                    <span className="text-xs font-tech text-gray-500 uppercase tracking-widest mb-3 block">Size</span>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size === selectedSize ? null : size)}
                          className={`w-12 h-10 rounded-lg text-xs font-tech font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                            selectedSize === size
                              ? 'bg-vital-500 text-white border border-vital-400 shadow-lg shadow-vital-500/30'
                              : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product Details */}
                {product.details && product.details.length > 0 && (
                  <div className="mb-8">
                    <span className="text-xs font-tech text-gray-500 uppercase tracking-widest mb-3 block">Details</span>
                    <ul className="space-y-2">
                      {product.details.map((detail, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.05 }}
                          className="flex items-center gap-2 text-sm text-gray-300"
                        >
                          <CheckCircle size={14} className="text-vital-500 flex-shrink-0" />
                          {detail}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTA */}
                <div className="mt-auto pt-4">
                  {STORE_LIVE ? (
                    <a
                      href={product.fourthwallUrl || FOURTHWALL_STORE_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-vital-500 hover:bg-vital-400 text-white font-display font-bold text-sm uppercase tracking-wider py-4 rounded-xl transition-all duration-200 shadow-lg shadow-vital-500/30 hover:shadow-vital-500/50"
                    >
                      <ShoppingBag size={18} />
                      Shop on Fourthwall
                      <ExternalLink size={14} />
                    </a>
                  ) : (
                    <div className="w-full flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white font-display font-bold text-sm uppercase tracking-wider py-4 rounded-xl border border-white/10">
                      <Sparkles size={16} className="text-vital-400" />
                      Coming Soon
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// -----------------------------------------------------------------------
// Animated Product Grid Row (staggered whileInView)
// -----------------------------------------------------------------------
const ProductCard: React.FC<{
  product: Product;
  index: number;
  onSelect: (product: Product) => void;
  hoveredProduct: string | null;
  setHoveredProduct: (id: string | null) => void;
}> = ({ product, index, onSelect, hoveredProduct, setHoveredProduct }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.96 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="group relative cursor-pointer"
      onMouseEnter={() => setHoveredProduct(product.id)}
      onMouseLeave={() => setHoveredProduct(null)}
      onClick={() => onSelect(product)}
    >
      <div className="relative bg-dark-800/50 border border-white/5 rounded-2xl overflow-hidden transition-all duration-500 hover:border-vital-500/30 hover:shadow-[0_0_40px_rgba(249,115,22,0.1)]">

        {/* Product Badge */}
        {product.badge && (
          <div className="absolute top-4 left-4 z-20">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-tech font-bold uppercase tracking-wider ${
              product.badge === 'Best Seller'
                ? 'bg-vital-500 text-white'
                : product.badge === 'New'
                ? 'bg-emerald-500 text-white'
                : product.badge === 'Limited'
                ? 'bg-purple-500 text-white'
                : product.badge === 'Premium'
                ? 'bg-amber-500 text-white'
                : 'bg-blue-500 text-white'
            }`}>
              {product.badge === 'Best Seller' && <Star size={10} className="fill-current" />}
              {product.badge === 'New' && <Sparkles size={10} />}
              {product.badge === 'Popular' && <Tag size={10} />}
              {product.badge === 'Limited' && <Sparkles size={10} />}
              {product.badge}
            </span>
          </div>
        )}

        {/* Image Container */}
        <div className="relative aspect-square bg-gradient-to-b from-dark-700/50 to-dark-800/50 overflow-hidden">
          {/* Background Glow on Hover */}
          <div className={`absolute inset-0 bg-vital-500/5 transition-opacity duration-700 ${
            hoveredProduct === product.id ? 'opacity-100' : 'opacity-0'
          }`}></div>

          <motion.img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700"
            style={{
              transform: hoveredProduct === product.id ? 'scale(1.08)' : 'scale(1)',
            }}
            layoutId={`product-image-${product.id}`}
          />

          {/* Hover Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent transition-opacity duration-500 ${
            hoveredProduct === product.id ? 'opacity-80' : 'opacity-40'
          }`}></div>

          {/* Quick Action on Hover */}
          <AnimatePresence>
            {hoveredProduct === product.id && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.25 }}
                className="absolute bottom-4 left-4 right-4 z-20 flex gap-2"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect(product); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-display font-bold text-sm uppercase tracking-wider py-3 rounded-xl transition-colors border border-white/10 cursor-pointer"
                >
                  <ZoomIn size={16} />
                  Quick View
                </button>
                {STORE_LIVE && (
                  <a
                    href={product.fourthwallUrl || FOURTHWALL_STORE_URL}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 flex items-center justify-center gap-2 bg-vital-500 hover:bg-vital-400 text-white font-display font-bold text-sm uppercase tracking-wider py-3 rounded-xl transition-colors shadow-lg shadow-vital-500/30"
                  >
                    <ShoppingBag size={16} />
                    Shop
                    <ExternalLink size={12} />
                  </a>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Product Info */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-white font-display font-bold text-lg leading-tight group-hover:text-vital-400 transition-colors">
              {product.name}
            </h3>
            <span className="text-vital-400 font-display font-bold text-lg ml-3 whitespace-nowrap">
              {product.price}
            </span>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed">
            {product.description}
          </p>
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-tech text-gray-600 uppercase tracking-widest">
              {product.category}
            </span>
            {product.sizes && (
              <span className="text-[10px] font-tech text-gray-600 uppercase tracking-widest">
                {product.sizes.join(' / ')}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// -----------------------------------------------------------------------
// Main Merch Page
// -----------------------------------------------------------------------
export const Merch: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [easterEggActive, setEasterEggActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const triggerEasterEgg = () => {
    setEasterEggActive(true);
    
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5, angle: 60, spread: 55, origin: { x: 0 },
        colors: ['#f97316', '#10b981', '#3b82f6']
      });
      confetti({
        particleCount: 5, angle: 120, spread: 55, origin: { x: 1 },
        colors: ['#f97316', '#10b981', '#3b82f6']
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();

    setTimeout(() => setEasterEggActive(false), 4000);
  };

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const closeProductModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedProduct(null), 300);
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = searchQuery.trim() === '' || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Category counts for pills
  const categoryCounts = categories.reduce<Record<string, number>>((acc, cat) => {
    if (cat === 'All') {
      acc[cat] = products.filter(p => 
        searchQuery.trim() === '' || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      ).length;
    } else {
      acc[cat] = products.filter(p => 
        p.category === cat && (
          searchQuery.trim() === '' || 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      ).length;
    }
    return acc;
  }, {});

  // Keyboard shortcut: Ctrl+K to focus search
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

  // Scroll to top on mount for smooth transition
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-screen bg-dark-900 text-white selection:bg-vital-500 selection:text-white"
    >

      {/* Product Detail Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={closeProductModal}
      />

      {/* Fixed Top Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-md border-b border-white/10 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <ArrowLeft size={18} className="text-gray-400 group-hover:text-vital-400 transition-colors" />
            <VitalLogo className="w-9 h-9 flex-shrink-0 filter drop-shadow-[0_0_10px_rgba(249,115,22,0.3)]" />
            <div className="flex flex-col">
              <span className="text-white font-display font-bold text-lg tracking-widest leading-none">VITAL</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-vital-400 to-vital-600 font-tech text-[10px] tracking-[0.3em] leading-none font-bold">ROLEPLAY</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs font-tech text-gray-500 uppercase tracking-widest">Official Merch</span>
            {STORE_LIVE ? (
              <Button
                href={FOURTHWALL_STORE_URL}
                target="_blank"
                rel="noreferrer"
                variant="primary"
                size="sm"
                icon={<ShoppingBag size={16} />}
              >
                Visit Store
              </Button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-vital-500/10 border border-vital-500/20">
                <Sparkles size={14} className="text-vital-400" />
                <span className="text-xs font-tech text-vital-400 uppercase tracking-wider font-bold">Coming Soon</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-28 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] blur-[120px] rounded-full pointer-events-none transition-colors duration-1000 ${easterEggActive ? 'bg-red-500/20' : 'bg-vital-500/8'}`}></div>
          <div className={`absolute bottom-0 right-0 w-[400px] h-[400px] blur-[80px] rounded-full pointer-events-none transition-colors duration-1000 ${easterEggActive ? 'bg-purple-500/10' : 'bg-vital-600/5'}`}></div>
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        ></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column: Title & Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className={`text-center lg:text-left transition-all duration-300 ${easterEggActive ? 'hue-rotate-180 contrast-125 scale-105' : ''}`}
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm"
              >
                <Shirt size={14} className={easterEggActive ? 'text-red-500' : 'text-vital-400'} />
                <span className="text-xs font-tech text-gray-300 uppercase tracking-widest font-bold">
                  {easterEggActive ? 'OVERRIDE PROTOCOL' : 'Official Collection'}
                </span>
              </motion.div>

              {/* Main Heading */}
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-display font-black text-white leading-[0.9] tracking-tighter mb-6 drop-shadow-xl">
                VITAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-vital-400 to-vital-600">MERCH</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-400 font-light leading-relaxed mb-10 max-w-lg mx-auto lg:mx-0">
                Rep the community. Premium quality apparel and accessories designed exclusively for the{' '}
                <span className="text-white font-medium">Vital RP</span> universe.
              </p>

              {/* Interactive Pills */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <div className="flex items-center gap-2 bg-dark-800/80 border border-white/5 px-4 py-2 rounded-lg">
                  <CheckCircle size={16} className="text-emerald-500" />
                  <span className="text-sm font-tech text-gray-300 uppercase tracking-wider">Premium Quality</span>
                </div>
                <div className="flex items-center gap-2 bg-dark-800/80 border border-white/5 px-4 py-2 rounded-lg">
                  <Globe size={16} className="text-blue-400" />
                  <span className="text-sm font-tech text-gray-300 uppercase tracking-wider">Global Shipping</span>
                </div>
                
              </div>
            </motion.div>

            {/* Right Column: Visual Dashboard */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={easterEggActive ? { 
                opacity: 1, 
                x: [-10, 10, -10, 10, 0],
                filter: 'hue-rotate(90deg) contrast(200%)'
              } : { opacity: 1, x: 0 }}
              transition={{ duration: easterEggActive ? 0.2 : 0.6, repeat: easterEggActive ? Infinity : 0 }}
              className="hidden lg:block relative"
            >
              <div className="bg-dark-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${easterEggActive ? 'from-red-500 to-red-600' : 'from-vital-500 to-vital-600'}`}></div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <span className="text-[10px] text-gray-500 font-tech uppercase tracking-widest block mb-2">Total Collection</span>
                    <div className="text-5xl font-display font-black text-white">{easterEggActive ? '999' : products.length}</div>
                    <span className="text-sm text-vital-500 font-tech">ACTIVE ITEMS</span>
                  </div>
                  
                  <div>
                    <span className="text-[10px] text-gray-500 font-tech uppercase tracking-widest block mb-2">Global Orders</span>
                    <div className="text-5xl font-display font-black text-white">2.4k+</div>
                    <span className="text-sm text-emerald-500 font-tech">DELIVERED</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${easterEggActive ? 'bg-red-500 animate-ping' : 'bg-vital-500 animate-pulse'}`}></div>
                      <span className="text-xs text-gray-400 font-tech uppercase tracking-widest">Store Status</span>
                    </div>
                    <span className={`text-sm font-bold font-tech uppercase tracking-widest ${easterEggActive ? 'text-red-500' : 'text-white'}`}>
                      {easterEggActive ? 'CRITICAL OVERRIDE' : 'ONLINE & SHIPPING'}
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
            {/* Categories */}
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
                  <span className={`text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center ${
                    activeCategory === cat
                      ? 'bg-white/20 text-white'
                      : 'bg-white/5 text-gray-500'
                  }`}>
                    {categoryCounts[cat]}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative flex-shrink-0 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-16 py-2 text-sm text-white placeholder-gray-500 font-tech focus:outline-none focus:border-vital-500/50 focus:ring-1 focus:ring-vital-500/30 transition-all duration-200"
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

      {/* Products Grid */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Empty state */}
          {filteredProducts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <Search size={48} className="text-gray-700 mx-auto mb-4" />
              <h3 className="text-xl font-display font-bold text-gray-400 mb-2">No products found</h3>
              <p className="text-gray-600 text-sm font-tech">
                Try adjusting your search or category filter.
              </p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                className="mt-4 text-vital-400 hover:text-vital-300 text-sm font-tech uppercase tracking-wider transition-colors cursor-pointer"
              >
                Clear filters
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

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-vital-500/5 to-transparent pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-dark-800/30 border border-white/5 rounded-3xl p-8 sm:p-12 lg:p-16 backdrop-blur-sm">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vital-500/10 border border-vital-500/20 mb-6">
                <Package size={14} className="text-vital-400" />
                <span className="text-xs font-tech text-vital-400 uppercase tracking-widest font-bold">Worldwide Shipping</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-white tracking-tight mb-4">
                Wear Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-vital-400 to-vital-600">Story</span>
              </h2>

              <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed mb-8">
                Every piece is designed with the community in mind. Premium materials, quality prints, shipped worldwide via Fourthwall.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {STORE_LIVE ? (
                  <Button
                    href={FOURTHWALL_STORE_URL}
                    target="_blank"
                    rel="noreferrer"
                    variant="primary"
                    size="lg"
                    icon={<ShoppingBag size={20} />}
                  >
                    Browse Full Store
                  </Button>
                ) : (
                  <div className="flex items-center gap-3 bg-dark-700/50 border border-white/10 rounded-xl px-6 py-4">
                    <Sparkles size={20} className="text-vital-400" />
                    <div className="text-left">
                      <div className="text-white font-display font-bold text-sm">Store Opening Soon</div>
                      <div className="text-gray-500 text-xs font-tech">Follow us for launch announcements</div>
                    </div>
                  </div>
                )}
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
          </motion.div>
        </div>
      </section>

      {/* Back to Top Button */}
      <BackToTopButton />

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-xs font-sans">
            © {new Date().getFullYear()} Vital Roleplay. Not affiliated with Rockstar Games.
          </p>

          {/* Easter Egg Trigger Pill */}
          <button 
            onClick={triggerEasterEgg}
            className="group/pill flex items-center gap-2 bg-dark-900/40 hover:bg-dark-900/80 backdrop-blur-md border border-white/10 p-1 pr-4 rounded-full transition-all duration-300 shadow-xl overflow-hidden cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-dark-800 flex-shrink-0 relative">
              <motion.img 
                animate={easterEggActive ? { rotate: 360 } : {}}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                src="/damon-icon.jpg" 
                alt="Damon" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-vital-500/0 group-hover/pill:bg-vital-500/20 transition-colors"></div>
            </div>
            <span className="text-xs font-tech text-gray-400 group-hover/pill:text-white uppercase tracking-widest font-bold transition-colors">
              Made by Damon
            </span>
          </button>

          <Link to="/" className="text-gray-500 hover:text-vital-400 text-xs font-tech uppercase tracking-widest transition-colors">
            ← Back to VitalRP.net
          </Link>
        </div>
      </footer>
    </motion.div>
  );
};

// -----------------------------------------------------------------------
// Back to Top Button
// -----------------------------------------------------------------------
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
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-vital-500/90 hover:bg-vital-400 text-white shadow-lg shadow-vital-500/30 flex items-center justify-center transition-colors duration-200 backdrop-blur-sm border border-vital-400/30 cursor-pointer"
          aria-label="Back to top"
        >
          <ChevronLeft size={20} className="rotate-90" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
