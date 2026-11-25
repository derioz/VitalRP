# GTA VI page (`/gta6`): design notes

Status: concept development. Nothing on the page is a confirmed feature.

## Direction (unslop-ui)

- **Product.** A concept page for Vital Roleplay's possible GTA VI server, for players deciding whether to follow it.
- **Character.** Cinematic, restrained, honest about what is not decided.
- **World.** Dusk over a South Florida style coast: near-black ink, warm paper whites, the city's own sunset in the photographs.
- **Moments.** The Rockstar promotional photographs (hero, vision, regions, closing) and the interactive supply chain. Everything else stays quiet.
- **Signature.** The status marker: a small ring before every concept and phase ("Concept", "Upcoming"), filled orange only for the current phase. It makes the unconfirmed nature of every idea visible.

## System

- Display: Outfit 500, tracking -0.04em at large sizes, -0.015em at small sizes (`.g6-sm`). Body: IBM Plex Sans. Meta and indexes: JetBrains Mono. All three are already loaded by the site layout.
- Neutrals: `#0a0a0a` base, hairlines at 10% white, text `#f4efe8` / `#d3cbc0` / `#a39b90`. One accent, Vital orange `#f97316`, for the primary action, the current phase and the active tab. Dusk rose `#e8789e` appears only in the status ring.
- No card grids. Sections use six different compositions: asymmetric editorial split, sticky-heading ruled list, full-bleed tabbed stage, typographic run, broadcast rundown, text over photograph.
- Rhythm: two warm paper sections (Six principles, Civilian life: `#eee3d2` ground, `#17120d` ink, `#b43f0a` accent for contrast) break the dark run. Section headings vary in scale and placement on purpose.
- Regions without approved imagery use flat stand-in colors from `regions[].tone` and a large numeral, so the stage still reads as designed.
- Hero: the one poster-scale moment. The headline is set to the width of the page along the base of the photograph (`.g6-hero-title`, capped by screen height), stacked to four lines on phones. The skyline stays open above it; status, summary and actions sit under a single rule. Section headings stay smaller than it.
- Radius: 6px on buttons and the supply chain. Everything else is square or hairline.
- Motion explains where the reader is, what changed and how the parts connect. Easing `--g6-ease-out`. There is no scroll reveal on headings or body text.
  - Main moment: the supply chain. A light runs along it once on first view; "Follow the dinner" hands the meal from player to player (4.5s each), pausing on any manual choice, offscreen or in a hidden tab.
  - Opening: the hero photograph brightens and settles while the two headline sentences rise; 12% parallax on scroll.
  - Selection: photographs fade and settle from a 1.07 push-in (`.g6-photo`), replaced text arrives (`.g6-arrive`), underlines travel (`SlidingIndicator`).
  - Once on view (`InView`): the vision and community lists arrive item by item; the roadmap line draws only to the current phase.
  - Reduced motion: no movement and instant scrolling; short fades remain.
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

All imagery is official promotional material from Rockstar's own pages (rockstargames.com/VI and its "Only in Leonida" place pages), resized to WebP and stored locally, not hotlinked. The hero is the Vice City bay skyline; each of the six regions uses the image Rockstar published for that place (Vice City sign at sunset, Leonida Keys causeway, Starlet Motel in Port Gellhorn, Ambrosia motorcycle club, Grassrivers wetlands, Mount Kalaga canyon road). No placeholders remain.

**Permissions.** Rockstar's published policy (support.rockstargames.com, "Policy on posting copyrighted Rockstar Games material") tolerates non-commercial fan use and reserves the right to remove material at any time. It does not cover commercial use. Vital sells merchandise, so this is a judgment call for the owner: keep credits visible (each image is labeled Rockstar Games and the closing states the project is unofficial), and be ready to swap images by editing `GTA6_IMAGES` and `regions` in `lib/gta6/content.ts` if asked to remove them. For certainty, email copyright@take2games.com.

## Not confirmed on purpose

No launch date, no countdown, no percentages, no named native businesses, no Weazel News headquarters, no official map claim, no fabricated articles.

## Open items

- The Development journal is an intentional empty state. `ArticleCard` links to `/gta6/journal/[slug]`, which does not exist yet. Build that route before adding the first article.
- Roleplay concepts have stable slugs (`concept-<slug>` anchors) so each can become `/gta6/concepts/[slug]` later.

## Recommended CMS integration

Move `articles` (and later `concepts`, `regions`) to a Supabase table, e.g. `gta6_articles(slug, category, title, description, body, image_url, published_at, published bool)`, reading only `published = true` rows on the server. Reuse the existing admin console and role checks so staff can write and publish from `/admin`. No database changes were made.

## Update

The Roleplay concepts and Development journal sections were removed at the owner's request, along with their components, data and images. The hero image file is `hero-bay.webp` (renamed from `hero-skyline.webp` so CDN and browser caches fetch the new photo).

## Update: lore, lifestyles and structure

Page order: Overview, Our Vision, GTA VI Lore, Explore Leonida, Life in Leonida, Concepts, Roadmap, Journal, Community, FAQ, Closing. Section numbers come from `sectionNo()` in `lib/gta6/content.ts`, so they follow `GTA6_SECTIONS` automatically. Core Principles was removed.

| Section | Component | Source |
|---|---|---|
| GTA VI Lore | `Lore.tsx` | Pattern: "Media Accordion" (shadcnspace, accordion-05) from 21st.dev, rebuilt on the shadcn Accordion already in the project. One sticky frame crossfades on large screens, the image moves inside the open item on small ones. |
| Life in Leonida | `Life.tsx` | shadcn/ui Tabs (`components/ui/tabs.tsx`, new dependency `@radix-ui/react-tabs`). Image-led selector idea from 21st.dev "Feature Showcase" (ruixen.ui), simplified: no card, no pill bar. |
| Concepts | `Concepts.tsx` | Text-only ledger, own design. Native-first line on every row. |
| FAQ | `Faq.tsx` | Unchanged shadcn Accordion, 12 new questions. |

21st.dev retrievals used: Media Accordion (27691) and Feature Showcase (9309), both read as references. Free tier is two per day. Cinematic List (9860) was reviewed earlier and still inspires Explore Leonida. Aceternity UI and Cult UI were reviewed and not used: their effects (spotlight, glow, fanned stacks) conflict with the quiet chrome of this page.

**Lore sources.** Everything named as "in Rockstar's materials" comes from rockstargames.com/VI (the Ultimate Edition cards and the "Only in Leonida" character pages): Stock 305, Rideout Customs, Sara's Unisex Salon, Electric Fang Tattoo, One-Eyed Willie's, PTT YOUNGIN$, Only Raw Records, Jack of Hearts, Real Dimez, Macca the Gator, Gambit Bay, Washington Beach, Stockyard, Lake Leonida, Watson Bay, Leonida Penitentiary, Coast Guard. "Vice Beach Police" is read off a patrol car in an official image. Weazel News and any police agency names are deliberately NOT listed as native because they were not found in those pages. Several businesses are marked by Rockstar as Ultimate Edition only; the page says so.

**Images.** Eleven new official stills (`public/gta6/lore-*.webp`, `life-*.webp`), downloaded from rockstargames.com/VI, converted to 1920px WebP, stored locally. Same credit caption as the rest of the page.
