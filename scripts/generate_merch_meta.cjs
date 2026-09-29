const fs = require('fs');
const path = require('path');

const docsIndexPath = path.join(__dirname, '..', 'docs', 'index.html');
if (!fs.existsSync(docsIndexPath)) {
  console.error('[Error] docs/index.html not found. Run vite build first.');
  process.exit(1);
}

let html = fs.readFileSync(docsIndexPath, 'utf8');

const merchTitle = 'Vital RP Official Store | Heavyweight Gear & Limited Drops';
const merchDesc = 'Rep the city in style. Official Vital RP premium heavyweight hoodies, graphic tees, kiss-cut decals, and exclusive apparel. Handcrafted quality for Los Santos citizens.';
const merchImage = 'https://r2.fivemanage.com/image/6NG24OsqzUct.png';
const merchUrl = 'https://vitalrp.net/merch';

// Replace titles and descriptions
html = html.replace(/<title>.*?<\/title>/, `<title>${merchTitle}</title>`);
html = html.replace(/<meta name="title" content=".*?" \/>/, `<meta name="title" content="${merchTitle}" />`);
html = html.replace(/<meta name="description"[\s\S]*?content=".*?" \/>/, `<meta name="description"\n    content="${merchDesc}" />`);
html = html.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${merchUrl}" />`);

// Replace OG tags
html = html.replace(/<meta property="og:site_name" content=".*?" \/>/, `<meta property="og:site_name" content="Vital RP • Official Store" />`);
html = html.replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${merchUrl}" />`);
html = html.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${merchTitle}" />`);
html = html.replace(/<meta property="og:description"[\s\S]*?content=".*?" \/>/, `<meta property="og:description"\n    content="${merchDesc}" />`);
html = html.replace(/<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${merchImage}" />`);
html = html.replace(/<meta property="og:image:secure_url" content=".*?" \/>/, `<meta property="og:image:secure_url" content="${merchImage}" />`);
html = html.replace(/<meta property="og:image:alt" content=".*?" \/>/, `<meta property="og:image:alt" content="Vital RP Official Merchandise Collection" />`);

// Replace Twitter tags
html = html.replace(/<meta name="twitter:url" content=".*?" \/>/, `<meta name="twitter:url" content="${merchUrl}" />`);
html = html.replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${merchTitle}" />`);
html = html.replace(/<meta name="twitter:description"[\s\S]*?content=".*?" \/>/, `<meta name="twitter:description"\n    content="${merchDesc}" />`);
html = html.replace(/<meta name="twitter:image" content=".*?" \/>/, `<meta name="twitter:image" content="${merchImage}" />`);
html = html.replace(/<meta name="twitter:image:alt" content=".*?" \/>/, `<meta name="twitter:image:alt" content="Vital RP Official Merchandise Collection" />`);

// Write to docs/merch/index.html and docs/merch.html
const merchDir = path.join(__dirname, '..', 'docs', 'merch');
if (!fs.existsSync(merchDir)) {
  fs.mkdirSync(merchDir, { recursive: true });
}
fs.writeFileSync(path.join(merchDir, 'index.html'), html, 'utf8');
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'merch.html'), html, 'utf8');

console.log('[Success] Generated docs/merch/index.html and docs/merch.html with custom social embeds.');
