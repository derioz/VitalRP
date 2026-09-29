const fs = require('fs');
const path = require('path');

const docsIndexPath = path.join(__dirname, '..', 'docs', 'index.html');
if (!fs.existsSync(docsIndexPath)) {
  console.error('[Error] docs/index.html not found. Run vite build first.');
  process.exit(1);
}

const baseHtml = fs.readFileSync(docsIndexPath, 'utf8');

function injectMeta(template, { title, description, image, url, siteName }) {
  let output = template;
  output = output.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
  output = output.replace(/<meta name="title" content=".*?" \/>/, `<meta name="title" content="${title}" />`);
  output = output.replace(/<meta name="description"[\s\S]*?content=".*?" \/>/, `<meta name="description"\n    content="${description}" />`);
  output = output.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${url}" />`);

  // Open Graph
  output = output.replace(/<meta property="og:site_name" content=".*?" \/>/, `<meta property="og:site_name" content="${siteName || 'Vital RP • Official Store'}" />`);
  output = output.replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${url}" />`);
  output = output.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${title}" />`);
  output = output.replace(/<meta property="og:description"[\s\S]*?content=".*?" \/>/, `<meta property="og:description"\n    content="${description}" />`);
  output = output.replace(/<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${image}" />`);
  output = output.replace(/<meta property="og:image:secure_url" content=".*?" \/>/, `<meta property="og:image:secure_url" content="${image}" />`);
  output = output.replace(/<meta property="og:image:alt" content=".*?" \/>/, `<meta property="og:image:alt" content="${title}" />`);

  // Twitter
  output = output.replace(/<meta name="twitter:url" content=".*?" \/>/, `<meta name="twitter:url" content="${url}" />`);
  output = output.replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${title}" />`);
  output = output.replace(/<meta name="twitter:description"[\s\S]*?content=".*?" \/>/, `<meta name="twitter:description"\n    content="${description}" />`);
  output = output.replace(/<meta name="twitter:image" content=".*?" \/>/, `<meta name="twitter:image" content="${image}" />`);
  output = output.replace(/<meta name="twitter:image:alt" content=".*?" \/>/, `<meta name="twitter:image:alt" content="${title}" />`);

  return output;
}

// 1. Generate Main Merch Storefront Embed
const merchTitle = 'Vital RP Official Store | Heavyweight Gear & Limited Drops';
const merchDesc = 'Rep the city in style. Official Vital RP premium heavyweight hoodies, graphic tees, kiss-cut decals, and exclusive apparel. Handcrafted quality for Los Santos citizens.';
const merchImage = 'https://r2.fivemanage.com/image/6NG24OsqzUct.png';
const merchUrl = 'https://vitalrp.net/merch';

const mainMerchHtml = injectMeta(baseHtml, {
  title: merchTitle,
  description: merchDesc,
  image: merchImage,
  url: merchUrl,
  siteName: 'Vital RP • Official Store',
});

const merchDir = path.join(__dirname, '..', 'docs', 'merch');
if (!fs.existsSync(merchDir)) {
  fs.mkdirSync(merchDir, { recursive: true });
}
fs.writeFileSync(path.join(merchDir, 'index.html'), mainMerchHtml, 'utf8');
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'merch.html'), mainMerchHtml, 'utf8');

// 2. Generate Orders and Policies Static Entrypoints
const ordersDir = path.join(merchDir, 'orders');
if (!fs.existsSync(ordersDir)) fs.mkdirSync(ordersDir, { recursive: true });
fs.writeFileSync(
  path.join(ordersDir, 'index.html'),
  injectMeta(baseHtml, {
    title: 'Track Merch Orders | Vital RP Official Store',
    description: 'Track the production progress, carrier tracking, and delivery status of your Vital RP merchandise orders.',
    image: merchImage,
    url: 'https://vitalrp.net/merch/orders',
  }),
  'utf8'
);

const policiesDir = path.join(merchDir, 'policies');
if (!fs.existsSync(policiesDir)) fs.mkdirSync(policiesDir, { recursive: true });
fs.writeFileSync(
  path.join(policiesDir, 'index.html'),
  injectMeta(baseHtml, {
    title: 'Store Policies & Fulfillment Guidelines | Vital RP Official Store',
    description: 'Read the official fulfillment timeline, print-on-demand guarantees, and return guidelines for Vital RP merchandise.',
    image: merchImage,
    url: 'https://vitalrp.net/merch/policies',
  }),
  'utf8'
);

// 3. Generate Individual Product Dedicated Embeds
const products = [
  {
    title: 'Orange Gradient V Chevron Hoodie',
    slug: 'orange-gradient-v-chevron-hoodie',
    aliases: ['vital-logo-hoodie', 'vital-hoodie', 'chevron-hoodie', 'orange-gradient-v-chevron-hoodie-minimal-geometric-logo'],
    description: 'Clean, bold, and effortlessly modern — this hoodie carries a warm, geometric emblem that sits proud on the chest. Soft, medium-weight fleece with kangaroo pocket.',
    price: '$35.96',
    image: 'https://images-api.printify.com/mockup/6abbfe5b33ab8a78df031de4/32912/98424/orange-gradient-v-chevron-hoodie-minimal-geometric-logo.jpg?camera_label=front',
  },
  {
    title: 'Orange Gradient V Chevron T-Shirt',
    slug: 'orange-gradient-v-chevron-t-shirt',
    aliases: ['vital-logo-t-shirt', 'vital-logo-tee', 'vital-t-shirt', 'chevron-tee', 'chevron-t-shirt', 'orange-gradient-v-chevron-t-shirt-minimal-geometric-tee'],
    description: 'A lightweight, breathable jersey tee designed for everyday wear with a bold, minimalist emblem at the center. Soft Airlume combed cotton with clean, retail fit.',
    price: '$18.81',
    image: 'https://images-api.printify.com/mockup/6abbfe5b31cb7a899e0a67c0/18542/102044/orange-gradient-v-chevron-t-shirt-minimal-geometric-tee.jpg?camera_label=front-2',
  },
  {
    title: 'Orange Gradient V Chevron Sticker Pack',
    slug: 'orange-gradient-v-chevron-sticker',
    aliases: ['vital-logo-sticker', 'vital-logo-stickers', 'vital-sticker', 'vital-stickers', 'orange-gradient-v-chevron-sticker-pack', 'orange-gradient-v-chevron-sticker-kiss-cut-sticker'],
    description: 'A glossy kiss-cut vinyl sticker featuring a bold, angular V rendered in sunlit gold and fiery orange gradients. Durable, scratch-resistant, and weatherproof.',
    price: '$2.36',
    image: 'https://images-api.printify.com/mockup/6abbfe5be62fc0336b093c0c/45750/16655/orange-gradient-v-chevron-sticker-kiss-cut-sticker.jpg?camera_label=front',
  },
  {
    title: 'Vital Graphic Streetwear Tee',
    slug: 'vital-graphic-streetwear-tee',
    aliases: ['vital-streetwear-tee', 'vital-tee', 'orange-gradient-v-chevron-t-shirt-graphic-logo-tee'],
    description: 'Heavyweight, garment-dyed tee bringing lived-in softness and bold graphic energy to everyday wear with a relaxed cut and sharp chest emblem.',
    price: '$21.08',
    image: 'https://images-api.printify.com/mockup/6abbfe2b0129c74f770d5b02/73204/98445/orange-gradient-v-chevron-t-shirt-graphic-logo-tee.jpg?camera_label=front',
  },
];

products.forEach((prod) => {
  const prodTitle = `${prod.title} (${prod.price}) | Vital RP Official Store`;
  const prodDesc = `${prod.description} Official heavyweight merchandise for Los Santos citizens. Ships worldwide.`;
  const prodUrl = `https://vitalrp.net/merch/${prod.slug}`;

  const prodHtml = injectMeta(baseHtml, {
    title: prodTitle,
    description: prodDesc,
    image: prod.image,
    url: prodUrl,
    siteName: 'Vital RP • Official Store',
  });

  // Write primary slug directory and html file
  const slugDir = path.join(merchDir, prod.slug);
  if (!fs.existsSync(slugDir)) fs.mkdirSync(slugDir, { recursive: true });
  fs.writeFileSync(path.join(slugDir, 'index.html'), prodHtml, 'utf8');
  fs.writeFileSync(path.join(merchDir, `${prod.slug}.html`), prodHtml, 'utf8');

  // Write alias directories and html files
  (prod.aliases || []).forEach((alias) => {
    const aliasDir = path.join(merchDir, alias);
    if (!fs.existsSync(aliasDir)) fs.mkdirSync(aliasDir, { recursive: true });
    fs.writeFileSync(path.join(aliasDir, 'index.html'), prodHtml, 'utf8');
    fs.writeFileSync(path.join(merchDir, `${alias}.html`), prodHtml, 'utf8');
  });

  console.log(`[Success] Generated embed metadata for ${prod.slug} (+${prod.aliases.length} aliases)`);
});

console.log('[Success] All merch and dedicated product social embeds generated successfully.');
