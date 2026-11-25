/**
 * GitHub Pages serves vitalrp.net from docs/. Without a real file at /gta6 the
 * page returns 404 and falls back to the homepage's title and social preview.
 * This writes a dedicated entry point with the GTA VI metadata.
 *
 * Keep title, description and image in step with app/gta6/page.tsx.
 */
const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..', 'docs');
const indexPath = path.join(docsDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('[Error] docs/index.html not found. Run vite build first.');
  process.exit(1);
}

const title = 'GTA VI: The Next Chapter | Vital Roleplay';
const description =
  "Vital Roleplay's concept development for Grand Theft Auto VI. How we plan to build around the lore of GTA VI, life in Leonida, and our roadmap for a story-first, roleplay-heavy server. Unofficial community project.";
const url = 'https://vitalrp.net/gta6/';
const image = 'https://vitalrp.net/gta6/og-bay.jpg';
const imageAlt =
  'A city skyline and harbor at dusk, from Rockstar Games promotional material for Grand Theft Auto VI';

let html = fs.readFileSync(indexPath, 'utf8');

/** Replace and fail loudly, so a change to index.html cannot silently ship stale metadata. */
function swap(pattern, replacement) {
  if (!pattern.test(html)) {
    console.error(`[Error] GTA VI metadata: no match for ${pattern}`);
    process.exit(1);
  }
  html = html.replace(pattern, () => replacement);
}

const meta = (attr, key, value) =>
  swap(
    new RegExp(`<meta ${attr}="${key}"\\s+content="[^"]*"\\s*/>`),
    `<meta ${attr}="${key}" content="${value}" />`
  );

swap(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
swap(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${url}" />`);

meta('name', 'title', title);
meta('name', 'description', description);
meta('name', 'keywords', 'Vital RP, Vital Roleplay, GTA VI roleplay, GTA 6 roleplay, Leonida roleplay, Vice City roleplay');

meta('property', 'og:url', url);
meta('property', 'og:title', title);
meta('property', 'og:description', description);
meta('property', 'og:image', image);
meta('property', 'og:image:secure_url', image);
meta('property', 'og:image:type', 'image/jpeg');
meta('property', 'og:image:alt', imageAlt);

meta('name', 'twitter:url', url);
meta('name', 'twitter:title', title);
meta('name', 'twitter:description', description);
meta('name', 'twitter:image', image);
meta('name', 'twitter:image:alt', imageAlt);

// The homepage's structured data describes the FiveM server (including "whitelist: yes"),
// none of which is decided for GTA VI.
html = html.replace(/\s*(<!-- JSON-LD:[^>]*-->\s*)?<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');

swap(/Connecting to Los Santos v2\.0\.\.\./, 'Loading GTA VI concept...');

const pageDir = path.join(docsDir, 'gta6');
fs.mkdirSync(pageDir, { recursive: true });
fs.writeFileSync(path.join(pageDir, 'index.html'), html, 'utf8');
fs.writeFileSync(path.join(docsDir, 'gta6.html'), html, 'utf8');

console.log('[Success] Generated /gta6 entry point with GTA VI metadata.');
