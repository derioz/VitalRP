# GTA VI page (`/gta6`): design notes

Status: concept development. Nothing on the page is a confirmed feature.

## Direction (unslop-ui)

- **Product.** A concept page for Vital Roleplay's possible GTA VI server, for players deciding whether to follow it.
- **Character.** Cinematic, restrained, honest about what is not decided.
- **World.** Dusk over a South Florida style coast: near-black ink, warm paper whites, the city's own sunset in the photographs.
- **Moments.** The Rockstar promotional photographs (hero, vision, Vice City, underworld, living world, closing) and the interactive supply chain. Everything else stays quiet.
- **Signature.** The status marker: a small ring before every concept and phase ("Concept", "Upcoming"), filled orange only for the current phase. It makes the unconfirmed nature of every idea visible.

## System

- Display: Outfit 500, tracking -0.04em at large sizes, -0.015em at small sizes (`.g6-sm`). Body: IBM Plex Sans. Meta and indexes: JetBrains Mono. All three are already loaded by the site layout.
- Neutrals: `#0a0a0a` base, hairlines at 10% white, text `#f4efe8` / `#d3cbc0` / `#a39b90`. One accent, Vital orange `#f97316`, for the primary action, the current phase and the active tab. Dusk rose `#e8789e` appears only in the status ring.
- No card grids. Sections use six different compositions: asymmetric editorial split, sticky-heading ruled list, full-bleed tabbed stage, typographic run, broadcast rundown, text over photograph.
- Rhythm: two warm paper sections (Six principles, Civilian life: `#eee3d2` ground, `#17120d` ink, `#b43f0a` accent for contrast) break the dark run. Section headings vary in scale and placement on purpose.
- Regions without approved imagery use flat stand-in colors from `regions[].tone` and a large numeral, so the stage still reads as designed.
- Radius: 6px on buttons and the supply chain. Everything else is square or hairline.
- Motion: one restrained reveal (`Reveal`), 12% hero parallax, 700ms opacity crossfade between regions, 200ms accordion. All disabled under `prefers-reduced-motion`.
- Styles are scoped to `.g6` in [app/gta6/gta6.css](app/gta6/gta6.css). Nothing global changed.

## File map

| Path | Purpose |
|---|---|
| `app/gta6/page.tsx` | Route, SEO and Open Graph metadata |
| `app/gta6/gta6.css` | Scoped styles |
| `lib/gta6/content.ts` | All copy and data: regions, concepts, principles, roadmap, FAQ, articles, images |
| `components/gta6/*` | Section components. `Gta6Page` is the client shell |
| `components/ui/accordion.tsx` | shadcn Accordion (new-york) adapted to Tailwind v3 |
| `spa/pages/Gta6.tsx` + route in `App.tsx` | Same page in the Vite bundle that serves vitalrp.net |
| `public/gta6/` | Optimized promotional images and `og.jpg` |
| `components.json` | shadcn configuration (Tailwind v3, `@/` aliases) |

## External components and sources

| Used | Source | Notes |
|---|---|---|
| Accordion | shadcn/ui, https://ui.shadcn.com/docs/components/accordion | MIT. Rebuilt on `@radix-ui/react-accordion` already in the project. |
| Region stage | Pattern inspired by "Cinematic List" on 21st.dev | Not installed. The original is hover-only and animates height, so it was rebuilt with ARIA tabs and opacity crossfades. No code copied. |
| Aceternity UI, Cult UI | Reviewed as references only | Their effects (spotlight, glow, marquee) are the kind this brief rules out. Nothing installed. |

21st.dev MCP was connected and searched. The free tier allows two component retrievals per day, so only one was used.

## Dependencies added

None. `@radix-ui/react-accordion`, `framer-motion` (unused by this page), `lucide-react` and `class-variance-authority` were already installed.

## Images and licensing

All imagery is official promotional material downloaded from rockstargames.com/VI, resized to WebP, and stored locally. It is not hotlinked.

**Confirm before going live.** Rockstar's fan-content terms should be checked, particularly because Vital runs a merch store. Every image is credited "Rockstar Games" in the page and the closing disclaimer states the project is unofficial. Swap or remove images by editing `GTA6_IMAGES` in `lib/gta6/content.ts`.

Missing assets (placeholders in the Leonida stage, marked "Image slot"):
Leonida Keys, Port Gellhorn, Ambrosia, Grassrivers and Mount Kalaga National Park have no approved region-specific image. The images used for Vice City, underworld, living world and closing are general promotional art chosen for mood, not claims about a location.

## Not confirmed on purpose

No launch date, no countdown, no percentages, no named native businesses, no Weazel News headquarters, no official map claim, no fabricated articles.

## Open items

- The Development journal is an intentional empty state. `ArticleCard` links to `/gta6/journal/[slug]`, which does not exist yet. Build that route before adding the first article.
- Roleplay concepts have stable slugs (`concept-<slug>` anchors) so each can become `/gta6/concepts/[slug]` later.

## Recommended CMS integration

Move `articles` (and later `concepts`, `regions`) to a Supabase table, e.g. `gta6_articles(slug, category, title, description, body, image_url, published_at, published bool)`, reading only `published = true` rows on the server. Reuse the existing admin console and role checks so staff can write and publish from `/admin`. No database changes were made.
