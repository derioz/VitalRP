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
    id: '6abbfe5b33ab8a78df031de4',
    printify_product_id: '6abbfe5b33ab8a78df031de4',
    title: 'Orange Gradient V Chevron Hoodie',
    slug: 'orange-gradient-v-chevron-hoodie',
    description: 'Premium heavyweight hoodie featuring the official Vital RP orange chevron emblem. Archival DTG print on ultra-soft fleece.',
    category: 'Apparel',
    status: 'live',
    badge: 'Best Seller',
    retail_price_cents: 5499,
    mockup_images: [
      { src: '/merch/hoodie.png', is_default: true },
      { src: '/merch/zipup.png' },
    ],
    details: [
      'Heavyweight 80% ring-spun cotton, 20% polyester fleece (330 GSM)',
      'Double-lined hood with custom metal-tipped drawstrings',
      'High-definition archival DTG chest & sleeve prints',
      'Split-stitch double-needle sewing on all seams for maximum durability',
      'True to size modern streetwear fit (size up for oversized aesthetic)',
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
    description: 'Minimal geometric Vital RP chevron tee. Soft-touch combed ring-spun cotton with durable reinforced stitching.',
    category: 'Apparel',
    status: 'live',
    badge: 'Popular',
    retail_price_cents: 2999,
    mockup_images: [
      { src: '/merch/tshirt.png', is_default: true },
      { src: '/merch/longsleeve.png' },
    ],
    details: [
      '100% combed ring-spun cotton (180 GSM premium weight)',
      'Pre-shrunk fabric to maintain tailored fit wash after wash',
      'Shoulder-to-shoulder taping for comfort and longevity',
      'Breathable eco-friendly water-based discharge print',
      'Standard unisex streetwear cut',
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
    description: 'High-opacity, weather-resistant vinyl die-cut decals. UV protected, scratch-proof, and waterproof.',
    category: 'Accessories',
    status: 'live',
    badge: 'New',
    retail_price_cents: 999,
    mockup_images: [
      { src: '/merch/stickers.png', is_default: true },
    ],
    details: [
      'High-opacity film that is completely impossible to see through',
      'Fast, effortless, bubble-free adhesive application',
      'Durable premium vinyl, ideal for laptops, PC cases, consoles, and cars',
      'UV protective matte finish prevents fading under sunlight',
      '95µ density film withstands weather and dishwasher cycles',
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
    description: 'Streetwear graphic tee showcasing the bold Vital Los Santos underground aesthetic with high-density pigment print.',
    category: 'Apparel',
    status: 'live',
    retail_price_cents: 3199,
    mockup_images: [
      { src: '/merch/tshirt.png', is_default: true },
    ],
    details: [
      '100% heavy cotton jersey (210 GSM boxy cut)',
      'Distressed cyberpunk inspired back artwork with front chest mini-logo',
      'Seamless double-needle 7/8" collar',
      'Tear-away neck label for friction-free wearing',
    ],
    variants: [
      { id: '13', printify_variant_id: 401, title: 'Black / S', size: 'S', color: 'Black', retail_price_cents: 3199, is_enabled: true, is_in_stock: true },
      { id: '14', printify_variant_id: 402, title: 'Black / M', size: 'M', color: 'Black', retail_price_cents: 3199, is_enabled: true, is_in_stock: true },
      { id: '15', printify_variant_id: 403, title: 'Black / L', size: 'L', color: 'Black', retail_price_cents: 3199, is_enabled: true, is_in_stock: true },
      { id: '16', printify_variant_id: 404, title: 'Black / XL', size: 'XL', color: 'Black', retail_price_cents: 3199, is_enabled: true, is_in_stock: true },
    ],
  },
];

// Common alias map to support friendly vanity URLs
export const SLUG_ALIASES: Record<string, string> = {
  'vital-logo-hoodie': 'orange-gradient-v-chevron-hoodie',
  'vital-hoodie': 'orange-gradient-v-chevron-hoodie',
  'chevron-hoodie': 'orange-gradient-v-chevron-hoodie',
  'vital-logo-t-shirt': 'orange-gradient-v-chevron-t-shirt',
  'vital-logo-tee': 'orange-gradient-v-chevron-t-shirt',
  'vital-t-shirt': 'orange-gradient-v-chevron-t-shirt',
  'chevron-t-shirt': 'orange-gradient-v-chevron-t-shirt',
  'vital-logo-sticker': 'orange-gradient-v-chevron-sticker',
  'vital-logo-stickers': 'orange-gradient-v-chevron-sticker',
  'vital-sticker': 'orange-gradient-v-chevron-sticker',
  'vital-stickers': 'orange-gradient-v-chevron-sticker',
  'orange-gradient-v-chevron-sticker-pack': 'orange-gradient-v-chevron-sticker',
  'vital-streetwear-tee': 'vital-graphic-streetwear-tee',
  'vital-tee': 'vital-graphic-streetwear-tee',
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
      p.slug === rawSlug ||
      p.id === rawSlug ||
      p.printify_product_id === rawSlug
  );
  return found || null;
}
