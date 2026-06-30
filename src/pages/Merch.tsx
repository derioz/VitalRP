import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowLeft, ExternalLink, Shirt, Coffee, Sticker, Package, Star, Sparkles, Tag, Globe, CheckCircle } from 'lucide-react';
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
  },
  {
    id: 'tee-logo',
    name: 'V Logo Tee',
    description: 'Soft-touch cotton tee with printed Vital RP chest logo.',
    price: '$29.99',
    category: 'Apparel',
    image: '/merch/tshirt.png',
  },
  {
    id: 'snapback',
    name: 'Vital Snapback',
    description: 'Structured snapback cap with embroidered V logo. One size fits all.',
    price: '$34.99',
    category: 'Apparel',
    image: '/merch/hat.png',
    badge: 'New',
  },
  {
    id: 'mug-matte',
    name: 'Matte Black Mug',
    description: 'Premium ceramic mug with Vital RP logo. 11oz capacity.',
    price: '$19.99',
    category: 'Accessories',
    image: '/merch/mug.png',
  },
  {
    id: 'sticker-pack',
    name: 'Sticker Pack',
    description: 'Die-cut vinyl sticker set. Waterproof, weather-resistant.',
    price: '$12.99',
    category: 'Accessories',
    image: '/merch/stickers.png',
  },
  {
    id: 'desk-mat',
    name: 'Gaming Desk Mat',
    description: 'Extended desk pad with anti-slip rubber base. 900x400mm.',
    price: '$39.99',
    category: 'Accessories',
    image: '/merch/mousepad.png',
    badge: 'Popular',
  },
  
  // New Additions: Apparel
  {
    id: 'joggers',
    name: 'Vital Premium Joggers',
    description: 'Slim-fit black joggers with orange V logo on the thigh. Ultra-soft fleece.',
    price: '$49.99',
    category: 'Apparel',
    image: '/merch/joggers.png',
  },
  {
    id: 'beanie',
    name: 'Classic Knit Beanie',
    description: 'Warm winter beanie with woven Vital RP tag on the cuff.',
    price: '$24.99',
    category: 'Apparel',
    image: '/merch/beanie.png',
  },
  {
    id: 'zipup-hoodie',
    name: 'Vital Zip-Up Hoodie',
    description: 'Lightweight premium zip-up with subtle chest logo.',
    price: '$54.99',
    category: 'Apparel',
    image: '/merch/zipup.png',
  },
  {
    id: 'longsleeve-tee',
    name: 'Los Santos Long Sleeve',
    description: 'Long sleeve tee with "LOS SANTOS" typography down the arms.',
    price: '$34.99',
    category: 'Apparel',
    image: 'https://placehold.co/800x800/1e1e1e/f97316?text=Long+Sleeve',
  },
  {
    id: 'windbreaker',
    name: 'Vital Windbreaker',
    description: 'Water-resistant lightweight jacket perfect for breezy nights.',
    price: '$64.99',
    category: 'Apparel',
    image: 'https://placehold.co/800x800/1e1e1e/f97316?text=Windbreaker',
    badge: 'Premium',
  },

  // New Additions: Accessories & EDC
  {
    id: 'neon-sign',
    name: 'V Logo Neon Sign',
    description: 'LED neon wall sign to elevate your gaming setup.',
    price: '$89.99',
    category: 'Accessories',
    image: 'https://placehold.co/800x800/1e1e1e/f97316?text=Neon+Sign',
    badge: 'Limited',
  },
  {
    id: 'keycap',
    name: 'Artisan Keycap',
    description: 'Custom mechanical keyboard keycap featuring the Vital logo.',
    price: '$19.99',
    category: 'Accessories',
    image: 'https://placehold.co/800x800/1e1e1e/f97316?text=Keycap',
  },
  {
    id: 'coasters',
    name: 'Matte Slate Coasters',
    description: 'Set of 4 heavy-duty slate coasters with engraved logo.',
    price: '$24.99',
    category: 'Accessories',
    image: 'https://placehold.co/800x800/1e1e1e/f97316?text=Coasters',
  },
  {
    id: 'phone-case',
    name: 'Tough Phone Case',
    description: 'Matte black phone case with geometric pattern and logo.',
    price: '$29.99',
    category: 'Accessories',
    image: 'https://placehold.co/800x800/1e1e1e/f97316?text=Phone+Case',
  },
  {
    id: 'lanyard',
    name: 'Vital Lanyard & Keychain',
    description: 'Heavy duty lanyard with metal enamel V logo keychain.',
    price: '$14.99',
    category: 'Accessories',
    image: 'https://placehold.co/800x800/1e1e1e/f97316?text=Lanyard',
  },
  {
    id: 'tote-bag',
    name: 'Canvas Tote Bag',
    description: 'Durable black canvas tote for everyday carry.',
    price: '$22.99',
    category: 'Accessories',
    image: 'https://placehold.co/800x800/1e1e1e/f97316?text=Tote+Bag',
  },
  {
    id: 'water-bottle',
    name: 'Insulated Water Bottle',
    description: 'Keeps drinks cold for 24h during long RP sessions.',
    price: '$34.99',
    category: 'Accessories',
    image: 'https://placehold.co/800x800/1e1e1e/f97316?text=Water+Bottle',
  },

  // New Additions: In-Game Factions
  {
    id: 'lspd-tee',
    name: 'LSPD Dept Tee',
    description: 'Official Los Santos Police Department graphic tee.',
    price: '$29.99',
    category: 'In-Game',
    image: 'https://placehold.co/800x800/1e1e1e/3b82f6?text=LSPD',
  },
  {
    id: 'burgershot-tee',
    name: 'Burgershot Uniform',
    description: 'Vintage wash tee featuring the iconic Burgershot logo.',
    price: '$29.99',
    category: 'In-Game',
    image: 'https://placehold.co/800x800/1e1e1e/ef4444?text=Burgershot',
  },
];

const categories = ['All', 'Apparel', 'Accessories', 'In-Game'];

export const Merch: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [easterEggActive, setEasterEggActive] = useState(false);

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

  const filteredProducts = activeCategory === 'All'
    ? products
    : products.filter(p => p.category === activeCategory);

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

      {/* Category Filter */}
      <section className="sticky top-[61px] z-40 bg-dark-900/95 backdrop-blur-md border-b border-white/5 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-xs font-tech uppercase tracking-widest transition-all duration-200 ${
                    activeCategory === cat
                      ? 'bg-vital-500 text-white font-bold shadow-lg shadow-vital-500/30'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <span className="text-xs font-tech text-gray-500 hidden sm:block">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="group relative"
                  onMouseEnter={() => setHoveredProduct(product.id)}
                  onMouseLeave={() => setHoveredProduct(null)}
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
                            : 'bg-blue-500 text-white'
                        }`}>
                          {product.badge === 'Best Seller' && <Star size={10} className="fill-current" />}
                          {product.badge === 'New' && <Sparkles size={10} />}
                          {product.badge === 'Popular' && <Tag size={10} />}
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
                            className="absolute bottom-4 left-4 right-4 z-20"
                          >
                            {STORE_LIVE ? (
                              <a
                                href={product.fourthwallUrl || FOURTHWALL_STORE_URL}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full flex items-center justify-center gap-2 bg-vital-500 hover:bg-vital-400 text-white font-display font-bold text-sm uppercase tracking-wider py-3 rounded-xl transition-colors shadow-lg shadow-vital-500/30"
                              >
                                <ShoppingBag size={16} />
                                Shop Now
                                <ExternalLink size={12} />
                              </a>
                            ) : (
                              <div className="w-full flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white font-display font-bold text-sm uppercase tracking-wider py-3 rounded-xl border border-white/10">
                                <Sparkles size={16} className="text-vital-400" />
                                Coming Soon
                              </div>
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
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <span className="text-[10px] font-tech text-gray-600 uppercase tracking-widest">
                          {product.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
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
