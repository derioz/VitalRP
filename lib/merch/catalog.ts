export interface ProductDetailVariant {
  id: string | number;
  printify_variant_id: number;
  title: string;
  size?: string;
  color?: string;
  retail_price_cents: number;
  cost_cents?: number;
  is_enabled: boolean;
  is_in_stock: boolean;
}

export interface StoreProduct {
  id: string;
  printify_product_id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  badge?: string;
  is_limited_drop?: boolean;
  is_coming_soon?: boolean;
  retail_price_cents: number;
  mockup_images: Array<{
    src: string;
    position?: string;
    is_default?: boolean;
    variant_ids?: number[];
  }>;
  details?: string[];
  variants: ProductDetailVariant[];
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseProductDescription(rawDesc?: string): {
  cleanDescription: string;
  details: string[];
  careInstructions: string[];
} {
  if (!rawDesc) {
    return { cleanDescription: '', details: [], careInstructions: [] };
  }

  const featuresIndex = rawDesc.search(/\bProduct features\b/i);
  const careIndex = rawDesc.search(/\bCare instructions\b/i);

  let cleanDescription = rawDesc;
  let featuresSection = '';
  let careSection = '';

  if (featuresIndex !== -1) {
    cleanDescription = rawDesc.substring(0, featuresIndex).trim();
    if (careIndex !== -1 && careIndex > featuresIndex) {
      featuresSection = rawDesc.substring(featuresIndex, careIndex);
      careSection = rawDesc.substring(careIndex);
    } else {
      featuresSection = rawDesc.substring(featuresIndex);
    }
  } else if (careIndex !== -1) {
    cleanDescription = rawDesc.substring(0, careIndex).trim();
    careSection = rawDesc.substring(careIndex);
  }

  const details = featuresSection
    ? featuresSection
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('-'))
        .map((line) => line.replace(/^-\s*/, '').trim())
        .filter(Boolean)
    : [];

  const careInstructions = careSection
    ? careSection
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('-'))
        .map((line) => line.replace(/^-\s*/, '').trim())
        .filter(Boolean)
    : [];

  return {
    cleanDescription: cleanDescription || rawDesc,
    details,
    careInstructions,
  };
}

export const FALLBACK_PRODUCTS: StoreProduct[] = [
  {
    id: "5ff1c7ef-29fe-4999-bc65-54ecc3903345",
    printify_product_id: "6abbfe5b33ab8a78df031de4",
    title: "Orange Gradient V Chevron Hoodie",
    slug: "orange-gradient-v-chevron-hoodie",
    description: "Clean, bold, and effortlessly modern — this hoodie carries a warm, geometric emblem that sits proud on the chest and reads like a personal badge. The soft, medium-weight blend wraps you in cozy warmth while keeping lines crisp, so the vibrant V stays sharp wash after wash. Wear it on cool mornings with coffee in hand, layered for low-key neighborhood walks, or at creative meetups where subtle design speaks louder than noise. The roomy kangaroo pocket and adjustable hood make it an easy reach-for piece that moves with your day. It’s for people who lean minimalist but appreciate a single bright detail that anchors an outfit.",
    category: "Apparel",
    status: "live",
    badge: "Best Seller",
    retail_price_cents: 3596,
    mockup_images: [
      {
        src: "https://images-api.printify.com/mockup/6abbfe5b33ab8a78df031de4/32912/98424/orange-gradient-v-chevron-hoodie-minimal-geometric-logo.jpg?camera_label=front",
        position: "front",
        is_default: true,
      },
      {
        src: "https://images-api.printify.com/mockup/6abbfe5b33ab8a78df031de4/32912/98426/orange-gradient-v-chevron-hoodie-minimal-geometric-logo.jpg?camera_label=back",
        position: "back",
        is_default: false,
      },
      {
        src: "https://images-api.printify.com/mockup/6abbfe5b33ab8a78df031de4/32912/98436/orange-gradient-v-chevron-hoodie-minimal-geometric-logo.jpg?camera_label=context-1",
        position: "context",
        is_default: false,
      }
    ],
    details: [
      "50/50 cotton-poly blend (8.0 oz/yd²) for cozy warmth and soft hand",
      "Tubular knit without side seams for a smooth, waste-reducing finish",
      "Double-lined hood with color-matched drawcord and roomy kangaroo pouch pocket",
      "DTF and DTG print compatibility with vibrant gradient emblem",
      "OEKO-TEX® certified dyes and ethically sourced cotton",
    ],
    variants: [
      { id: "101", printify_variant_id: 32912, title: "S / Black", size: "S", color: "Black", retail_price_cents: 3596, is_enabled: true, is_in_stock: true },
      { id: "102", printify_variant_id: 32913, title: "M / Black", size: "M", color: "Black", retail_price_cents: 3596, is_enabled: true, is_in_stock: true },
      { id: "103", printify_variant_id: 32914, title: "L / Black", size: "L", color: "Black", retail_price_cents: 3596, is_enabled: true, is_in_stock: true },
      { id: "104", printify_variant_id: 32915, title: "XL / Black", size: "XL", color: "Black", retail_price_cents: 3596, is_enabled: true, is_in_stock: true },
      { id: "105", printify_variant_id: 32916, title: "2XL / Black", size: "2XL", color: "Black", retail_price_cents: 3899, is_enabled: true, is_in_stock: true },
    ]
  },
  {
    id: "4e1057ca-c36e-4867-bfd6-0b9962ee42da",
    printify_product_id: "6abbfe5b31cb7a899e0a67c0",
    title: "Orange Gradient V Chevron T-Shirt",
    slug: "orange-gradient-v-chevron-t-shirt",
    description: "A lightweight, breathable jersey tee designed for everyday wear with a bold, minimalist emblem at the center. The soft Airlume combed and ring-spun cotton feels gentle on skin while the retail fit and crew neckline keep the silhouette clean and versatile. Thoughtful construction—side seams, ribbed knit collar, shoulder tape and a tear-away label—adds lasting shape and comfort. The warm gradient “V” graphic stands out against a crisp canvas, giving the shirt a modern, confident edge that slips easily into casual and slightly dressed-up outfits.",
    category: "Apparel",
    status: "live",
    badge: "Popular",
    retail_price_cents: 1881,
    mockup_images: [
      {
        src: "https://images-api.printify.com/mockup/6abbfe5b31cb7a899e0a67c0/18542/102044/orange-gradient-v-chevron-t-shirt-minimal-geometric-tee.jpg?camera_label=front-2",
        position: "front",
        is_default: true,
      },
      {
        src: "https://images-api.printify.com/mockup/6abbfe5b31cb7a899e0a67c0/18542/102046/orange-gradient-v-chevron-t-shirt-minimal-geometric-tee.jpg?camera_label=back",
        position: "back",
        is_default: false,
      }
    ],
    details: [
      "100% Airlume combed and ring-spun cotton (lightweight 142 g/m²) for breathability and softness",
      "Retail fit with crew neckline — neat, easy to layer and accessorize",
      "Durable construction: side seams, ribbed knit collar, and shoulder tape to retain shape",
      "Tear-away label to minimize skin irritation; REACH certified",
      "Vibrant printed emblem with DTF/DTG printing options",
    ],
    variants: [
      { id: "201", printify_variant_id: 18542, title: "S / Black", size: "S", color: "Black", retail_price_cents: 1881, is_enabled: true, is_in_stock: true },
      { id: "202", printify_variant_id: 18543, title: "M / Black", size: "M", color: "Black", retail_price_cents: 1881, is_enabled: true, is_in_stock: true },
      { id: "203", printify_variant_id: 18544, title: "L / Black", size: "L", color: "Black", retail_price_cents: 1881, is_enabled: true, is_in_stock: true },
      { id: "204", printify_variant_id: 18545, title: "XL / Black", size: "XL", color: "Black", retail_price_cents: 1881, is_enabled: true, is_in_stock: true },
      { id: "205", printify_variant_id: 18546, title: "2XL / Black", size: "2XL", color: "Black", retail_price_cents: 2299, is_enabled: true, is_in_stock: true },
    ]
  },
  {
    id: "41df6bf5-704d-415b-9c8b-87dcab32577d",
    printify_product_id: "6abbfe5be62fc0336b093c0c",
    title: "Orange Gradient V Chevron Sticker Pack",
    slug: "orange-gradient-v-chevron-sticker",
    description: "A glossy kiss-cut vinyl sticker featuring a bold, angular V rendered in sunlit gold and fiery orange gradients. The vibrant eco-solvent inks give the design a luminous, jewel-like depth that catches the eye on laptops, journals, water bottles, or inside planners. The sticker ships with a smooth, permanent acrylic adhesive for quick, bubble-free application on flat surfaces and comes in either white or transparent backing to suit your look. Lightweight and durable, it adds a bright, modern accent — a small touch of warmth and energy that fits naturally into everyday carry or workspace setups.",
    category: "Accessories",
    status: "live",
    badge: "Official Drop",
    retail_price_cents: 236,
    mockup_images: [
      {
        src: "https://images-api.printify.com/mockup/6abbfe5be62fc0336b093c0c/45750/16655/orange-gradient-v-chevron-sticker-kiss-cut-sticker.jpg?camera_label=front",
        position: "front",
        is_default: true,
      },
      {
        src: "https://images-api.printify.com/mockup/6abbfe5be62fc0336b093c0c/45750/2176/orange-gradient-v-chevron-sticker-kiss-cut-sticker.jpg?camera_label=context-1",
        position: "context",
        is_default: false,
      }
    ],
    details: [
      "Durable 100% vinyl with strong permanent acrylic adhesive",
      "Glossy paper finish with scratch-resistant surface",
      "Printed with eco-solvent inks for vivid, long-lasting color",
      "Quick, bubble-free application; designed for smooth flat surfaces only",
    ],
    variants: [
      { id: "301", printify_variant_id: 45750, title: "3\" × 3\"", size: "3x3\"", color: "White", retail_price_cents: 263, is_enabled: true, is_in_stock: true },
      { id: "302", printify_variant_id: 45752, title: "4\" × 4\"", size: "4x4\"", color: "White", retail_price_cents: 333, is_enabled: true, is_in_stock: true },
      { id: "303", printify_variant_id: 45754, title: "6\" × 6\"", size: "6x6\"", color: "White", retail_price_cents: 386, is_enabled: true, is_in_stock: true },
    ]
  },
  {
    id: "10e6a33a-9c21-483e-87a1-0832691b1a76",
    printify_product_id: "6abbfe2b0129c74f770d5b02",
    title: "Vital Graphic Streetwear Tee",
    slug: "vital-graphic-streetwear-tee",
    description: "This heavyweight, garment-dyed tee brings a lived-in softness and bold graphic energy to everyday wear. The deep, washed color and relaxed cut feel broken-in from the first wear, while the bright, angular emblem sits crisp against the fabric — a confident accent for low-key days and loud nights. Wear it to signal steady taste: comfortable enough for long mornings, sturdy enough for repeated washes, and versatile enough to layer under a jacket or wear solo when you want the design front-and-center.",
    category: "Apparel",
    status: "live",
    badge: "Limited Drop",
    retail_price_cents: 2108,
    mockup_images: [
      {
        src: "https://images-api.printify.com/mockup/6abbfe2b0129c74f770d5b02/73204/98445/orange-gradient-v-chevron-t-shirt-graphic-logo-tee.jpg?camera_label=front",
        position: "front",
        is_default: true,
      }
    ],
    details: [
      "100% ring-spun US cotton for durable, comfortable wear",
      "Garment-dyed after construction for a soft, lived-in color and texture",
      "Heavyweight fabric (6.1 oz/yd²) with a relaxed, sewn-in label fit",
      "Tubular knit (no side seams) with double-needle stitching for long-lasting construction",
      "Available S–4XL; pre-shrunk to maintain fit",
    ],
    variants: [
      { id: "401", printify_variant_id: 73204, title: "S / Black", size: "S", color: "Black", retail_price_cents: 2108, is_enabled: true, is_in_stock: true },
      { id: "402", printify_variant_id: 73205, title: "M / Black", size: "M", color: "Black", retail_price_cents: 2108, is_enabled: true, is_in_stock: true },
      { id: "403", printify_variant_id: 73206, title: "L / Black", size: "L", color: "Black", retail_price_cents: 2108, is_enabled: true, is_in_stock: true },
      { id: "404", printify_variant_id: 73207, title: "XL / Black", size: "XL", color: "Black", retail_price_cents: 2108, is_enabled: true, is_in_stock: true },
    ]
  }
];

// Unified slug alias mapping
export const SLUG_ALIASES: Record<string, string> = {
  // Hoodie aliases
  'vital-logo-hoodie': 'orange-gradient-v-chevron-hoodie',
  'vital-hoodie': 'orange-gradient-v-chevron-hoodie',
  'chevron-hoodie': 'orange-gradient-v-chevron-hoodie',
  'orange-gradient-v-chevron-hoodie-minimal-geometric-logo': 'orange-gradient-v-chevron-hoodie',
  // T-Shirt aliases
  'vital-logo-t-shirt': 'orange-gradient-v-chevron-t-shirt',
  'vital-logo-tee': 'orange-gradient-v-chevron-t-shirt',
  'vital-t-shirt': 'orange-gradient-v-chevron-t-shirt',
  'chevron-tee': 'orange-gradient-v-chevron-t-shirt',
  'chevron-t-shirt': 'orange-gradient-v-chevron-t-shirt',
  'orange-gradient-v-chevron-t-shirt-minimal-geometric-tee': 'orange-gradient-v-chevron-t-shirt',
  // Graphic Tee aliases
  'vital-streetwear-tee': 'vital-graphic-streetwear-tee',
  'vital-tee': 'vital-graphic-streetwear-tee',
  'orange-gradient-v-chevron-t-shirt-graphic-logo-tee': 'vital-graphic-streetwear-tee',
  // Sticker aliases
  'vital-logo-sticker': 'orange-gradient-v-chevron-sticker',
  'vital-logo-stickers': 'orange-gradient-v-chevron-sticker',
  'vital-sticker': 'orange-gradient-v-chevron-sticker',
  'vital-stickers': 'orange-gradient-v-chevron-sticker',
  'orange-gradient-v-chevron-sticker-pack': 'orange-gradient-v-chevron-sticker',
  'orange-gradient-v-chevron-sticker-kiss-cut-sticker': 'orange-gradient-v-chevron-sticker',
};

export function normalizeSlug(rawSlug: string): string {
  const clean = slugify(rawSlug);
  return SLUG_ALIASES[clean] || clean;
}

export function findProductBySlug(rawSlug: string, catalog: StoreProduct[] = FALLBACK_PRODUCTS): StoreProduct | null {
  const targetSlug = normalizeSlug(rawSlug);
  const found = catalog.find(
    (p) =>
      p.slug === targetSlug ||
      normalizeSlug(p.slug) === targetSlug ||
      p.slug === rawSlug ||
      p.id === rawSlug ||
      p.printify_product_id === rawSlug
  );
  return found || null;
}
