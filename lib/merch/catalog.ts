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

export const FALLBACK_PRODUCTS: StoreProduct[] = [
  {
    id: "5ff1c7ef-29fe-4999-bc65-54ecc3903345",
    printify_product_id: "6abbfe5b33ab8a78df031de4",
    title: "Orange Gradient V Chevron Hoodie",
    slug: "orange-gradient-v-chevron-hoodie",
    description: "Clean, bold, and effortlessly modern — this hoodie carries a warm, geometric emblem that sits proud on the chest. The soft, medium-weight blend wraps you in cozy warmth while keeping lines crisp, so the vibrant V stays sharp wash after wash.",
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
      "Double-lined hood with color-matched drawcord and roomy pouch pocket",
      "High-definition archival DTG chest print with vibrant gradient inks",
      "Ethically manufactured with OEKO-TEX® certified dyes",
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
    id: "349141be-1c8f-4ba3-ab0d-327c130327f2",
    printify_product_id: "6abbfe5b31cb7a899e0a67c0",
    title: "Orange Gradient V Chevron T-Shirt",
    slug: "orange-gradient-v-chevron-t-shirt",
    description: "Minimal geometric Vital RP chevron tee. Soft-touch combed ring-spun cotton with durable reinforced stitching and sharp chest emblem.",
    category: "Apparel",
    status: "live",
    badge: "Popular",
    retail_price_cents: 1999,
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
      "100% ring-spun cotton (4.5 oz/yd²) for lightweight comfort",
      "Tubular construction for a smooth, relaxed streetwear fit",
      "Archival quality vibrant eco-solvent print",
      "Pre-shrunk fabric to maintain tailored fit wash after wash",
    ],
    variants: [
      { id: "201", printify_variant_id: 18542, title: "S / Black", size: "S", color: "Black", retail_price_cents: 1999, is_enabled: true, is_in_stock: true },
      { id: "202", printify_variant_id: 18543, title: "M / Black", size: "M", color: "Black", retail_price_cents: 1999, is_enabled: true, is_in_stock: true },
      { id: "203", printify_variant_id: 18544, title: "L / Black", size: "L", color: "Black", retail_price_cents: 1999, is_enabled: true, is_in_stock: true },
      { id: "204", printify_variant_id: 18545, title: "XL / Black", size: "XL", color: "Black", retail_price_cents: 1999, is_enabled: true, is_in_stock: true },
      { id: "205", printify_variant_id: 18546, title: "2XL / Black", size: "2XL", color: "Black", retail_price_cents: 2299, is_enabled: true, is_in_stock: true },
    ]
  },
  {
    id: "41df6bf5-704d-415b-9c8b-87dcab32577d",
    printify_product_id: "6abbfe5be62fc0336b093c0c",
    title: "Orange Gradient V Chevron Sticker Pack",
    slug: "orange-gradient-v-chevron-sticker",
    description: "Glossy kiss-cut vinyl sticker featuring a bold, angular V rendered in sunlit gold and fiery orange gradients. Durable, scratch-resistant, and weatherproof.",
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
      "Glossy finish with scratch-resistant, UV-protected surface",
      "Printed with eco-solvent inks for vivid, long-lasting color",
      "Effortless, bubble-free application for laptops, bottles, and consoles",
    ],
    variants: [
      { id: "301", printify_variant_id: 45750, title: "3\" × 3\"", size: "3x3\"", color: "White", retail_price_cents: 263, is_enabled: true, is_in_stock: true },
      { id: "302", printify_variant_id: 45752, title: "4\" × 4\"", size: "4x4\"", color: "White", retail_price_cents: 333, is_enabled: true, is_in_stock: true },
      { id: "303", printify_variant_id: 45754, title: "6\" × 6\"", size: "6x6\"", color: "White", retail_price_cents: 386, is_enabled: true, is_in_stock: true },
    ]
  },
  {
    id: "db13e00b-3cbe-4a1d-a99f-071a938644e5",
    printify_product_id: "6abbfe2b0129c74f770d5b02",
    title: "Vital Graphic Streetwear Tee",
    slug: "vital-graphic-streetwear-tee",
    description: "Streetwear graphic tee showcasing the bold Vital Los Santos underground aesthetic with high-density pigment print.",
    category: "Apparel",
    status: "live",
    badge: "Limited Drop",
    retail_price_cents: 2199,
    mockup_images: [
      {
        src: "https://images-api.printify.com/mockup/6abbfe2b0129c74f770d5b02/73204/98445/orange-gradient-v-chevron-t-shirt-graphic-logo-tee.jpg?camera_label=front",
        position: "front",
        is_default: true,
      }
    ],
    details: [
      "100% heavy cotton jersey for a structured boxy aesthetic",
      "Double-needle sleeve and bottom hem stitching",
      "Tear-away label for friction-free wearing",
    ],
    variants: [
      { id: "401", printify_variant_id: 73204, title: "S / Black", size: "S", color: "Black", retail_price_cents: 2199, is_enabled: true, is_in_stock: true },
      { id: "402", printify_variant_id: 73205, title: "M / Black", size: "M", color: "Black", retail_price_cents: 2199, is_enabled: true, is_in_stock: true },
      { id: "403", printify_variant_id: 73206, title: "L / Black", size: "L", color: "Black", retail_price_cents: 2199, is_enabled: true, is_in_stock: true },
      { id: "404", printify_variant_id: 73207, title: "XL / Black", size: "XL", color: "Black", retail_price_cents: 2199, is_enabled: true, is_in_stock: true },
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
