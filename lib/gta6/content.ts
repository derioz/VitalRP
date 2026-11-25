/**
 * Content for the /gta6 concept page.
 *
 * Everything on the page is data in this file so it can later move to
 * Supabase (or a CMS) without touching components. Nothing here is a
 * confirmed feature. Every concept is a proposal and is rendered as one.
 */

export const DISCORD_URL = 'https://discord.gg/vitalrp';

export const GTA6_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'vision', label: 'Our Vision' },
  { id: 'lore', label: 'GTA VI Lore' },
  { id: 'leonida', label: 'Explore Leonida' },
  { id: 'life', label: 'Life in Leonida' },
  { id: 'concepts', label: 'Concepts' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'journal', label: 'Journal' },
  { id: 'community', label: 'Community' },
  { id: 'faq', label: 'FAQ' },
] as const;

/** Two-digit index of a section, so numbering follows the page order automatically. */
export function sectionNo(id: (typeof GTA6_SECTIONS)[number]['id']): string {
  return String(GTA6_SECTIONS.findIndex((s) => s.id === id) + 1).padStart(2, '0');
}

/** Approved promotional images live in /public/gta6. Credit: Rockstar Games. */
export const GTA6_IMAGES = {
  hero: {
    src: '/gta6/hero-vice-city.webp',
    alt: 'A city skyline across a turquoise bay under a bright sky, from Rockstar Games promotional material for Grand Theft Auto VI',
  },
  vision: {
    src: '/gta6/vision-dusk.webp',
    alt: 'Two characters standing on a glass-walled balcony above a city skyline at dusk, Rockstar Games promotional art for Grand Theft Auto VI',
  },
  closing: {
    src: '/gta6/closing-sunset.webp',
    alt: 'Two characters walking past a gas station under palm trees at sunset, Rockstar Games promotional art',
  },
} as const;

export const visionPoints = [
  { label: 'Less grinding', body: 'Time spent with people, not on loops.' },
  { label: 'More meaningful interactions', body: 'Player to player before player to NPC.' },
  { label: 'Native world integration', body: 'The world Rockstar built, used as it is.' },
  { label: 'Civilian opportunities', body: 'A job can be a story as much as a heist can.' },
  { label: 'Character development', body: 'Reputation and relationships over bank balance.' },
  { label: 'Organic storytelling', body: 'Plots that grow out of play, not out of scripts.' },
];

export interface Region {
  id: string;
  name: string;
  summary: string;
  themes: string[];
  /** Official Rockstar promotional image from the "Only in Leonida" pages. */
  image: { src: string; alt: string };
}

export const regions: Region[] = [
  {
    id: 'vice-city',
    name: 'Vice City',
    summary:
      'The densest part of the state: nightlife, entertainment, luxury property and corporate offices, with street gangs and neighborhood communities underneath.',
    themes: [
      'Nightlife and entertainment',
      'Luxury real estate',
      'Corporate businesses',
      'Street gangs',
      'Urban communities',
    ],
    image: { src: '/gta6/region-vice-city.webp', alt: 'The VICE CITY sign lit at sunset among palm trees with a jet overhead, Rockstar Games promotional image for Grand Theft Auto VI' },
  },
  {
    id: 'leonida-keys',
    name: 'Leonida Keys',
    summary:
      'Island life built around the water. Charter captains, marina owners and resort staff depend on the same tourists and the same weather.',
    themes: [
      'Fishing charters',
      'Marinas',
      'Tourism',
      'Waterfront businesses',
      'Resorts and coastal living',
    ],
    image: { src: '/gta6/region-leonida-keys.webp', alt: 'A seaplane over turquoise water and a causeway linking the islands of the Leonida Keys, Rockstar Games promotional image' },
  },
  {
    id: 'port-gellhorn',
    name: 'Port Gellhorn',
    summary:
      'A working port town. Steady paychecks, cheap rooms and the local crews who know who owes whom.',
    themes: [
      'Blue-collar employment',
      'Motels',
      'Affordable housing',
      'Trucking companies',
      'Local criminal organizations',
    ],
    image: { src: '/gta6/region-port-gellhorn-delights.webp', alt: 'The Delights Cabaret sign glowing over a rain-slick parking lot at night in Port Gellhorn, Rockstar Games promotional image' },
  },
  {
    id: 'ambrosia',
    name: 'Ambrosia',
    summary:
      'Small-town Leonida where the plants and workshops are the largest employers and the clubhouse is the largest social club.',
    themes: [
      'Industrial businesses',
      'Manufacturing',
      'Motorcycle clubs',
      'Small-town communities',
    ],
    image: { src: '/gta6/region-ambrosia.webp', alt: 'A motorcycle club riding down a main road past roadside signs in Ambrosia, Rockstar Games promotional image' },
  },
  {
    id: 'grassrivers',
    name: 'Grassrivers',
    summary:
      'Slower and quieter than the coast. Guides, anglers and locals who know the water, and the people who go looking when someone does not come back.',
    themes: [
      'Wildlife',
      'Fishing',
      'Rural living',
      'Outdoor activities',
      'Search and rescue',
    ],
    image: { src: '/gta6/region-grassrivers.webp', alt: 'Trucks and a helicopter crossing flooded wetlands in Grassrivers, Rockstar Games promotional image' },
  },
  {
    id: 'mount-kalaga',
    name: 'Mount Kalaga National Park',
    summary:
      'Protected wilderness for rangers, campers and anyone who wants to get away from the city for a weekend.',
    themes: [
      'Park rangers',
      'Camping',
      'Off-roading',
      'Outdoor recreation',
      'Wilderness roleplay',
    ],
    image: { src: '/gta6/region-mount-kalaga.webp', alt: 'A road winding through a red rock canyon in Mount Kalaga National Park, Rockstar Games promotional image' },
  },
];

export interface RoadmapPhase {
  number: string;
  title: string;
  body: string;
  status: 'current' | 'upcoming';
}

export const roadmap: RoadmapPhase[] = [
  {
    number: '01',
    title: 'Concept and vision',
    body: 'Deciding what Vital should be in GTA VI and writing it down. This is where we are.',
    status: 'current',
  },
  {
    number: '02',
    title: 'Technical research',
    body: 'Finding out what the available multiplayer tools can and cannot do.',
    status: 'upcoming',
  },
  {
    number: '03',
    title: 'Foundation development',
    body: 'Building the core systems the rest of the server depends on.',
    status: 'upcoming',
  },
  {
    number: '04',
    title: 'Community testing',
    body: 'Putting the foundations in front of players and listening.',
    status: 'upcoming',
  },
  {
    number: '05',
    title: 'Welcome to Leonida',
    body: 'Opening the doors.',
    status: 'upcoming',
  },
];

export const communityWays = [
  'Submit roleplay concepts',
  'Discuss proposed features',
  'Take community surveys when we run them',
  'Tell us which businesses you would want to run',
  'Register interest in testing when it opens',
];

export interface Faq {
  question: string;
  answer: string;
}

export const faqs: Faq[] = [
  {
    question: 'When will Vital GTA VI RP launch?',
    answer:
      'There is no launch date and we are not going to guess one. We are in the concept stage, and what we can build depends on the multiplayer development tools that become available for GTA VI. Dates will be shared only when we can stand behind them.',
  },
  {
    question: 'What type of roleplay experience is Vital building?',
    answer:
      'Serious, story-first roleplay with less grinding, a strong civilian side, and crime that runs on relationships and consequences. The same values Vital has always had, built for a new setting.',
  },
  {
    question: "Will Vital follow GTA VI's established lore?",
    answer:
      "That is the intention. We want players to feel like they are living in Rockstar's world, not on a heavily modified version of it. We start from what Rockstar has published and build on it, and we do not present anything as official unless Rockstar has confirmed it.",
  },
  {
    question: 'Will Vital use native GTA VI businesses and interiors?',
    answer:
      'Where it is technically possible, yes, that is the goal. We would rather use what Rockstar already built than fill the map with invented brands and custom interiors. Which businesses and interiors can actually be used depends on the available multiplayer tools, and we will confirm each one before naming it as part of the project.',
  },
  {
    question: 'Will gangs be based on existing GTA VI organizations?',
    answer:
      "We want to prioritize the gangs and criminal organizations Rockstar has established, and respect their identities and territories. Players would develop their own stories inside that framework. How membership, territory and original organizations are handled has not been decided.",
  },
  {
    question: 'Will custom businesses and factions be allowed?',
    answer:
      'Custom content should complement the world, not replace it. We are open to original businesses and factions that fit Leonida and serve a real purpose, and native options come first. There is no approval process yet, and we will explain one before anyone needs it.',
  },
  {
    question: 'How will business ownership work?',
    answer:
      'It is not designed yet. The direction is to build ownership around the businesses that exist in the game, so players can run existing names rather than waiting for us to build new ones. What that looks like in practice depends on what the tools allow.',
  },
  {
    question: 'Will there be opportunities for civilian roleplay?',
    answer:
      'Yes, that is a core part of the vision. A civilian career should be as rewarding to play as a criminal one: entrepreneurs, everyday citizens, public servants and entertainers are all part of what we are planning for. Specific jobs and systems are still concepts.',
  },
  {
    question: 'Will the server be whitelisted?',
    answer:
      'We have not decided. Access and application details will be announced in the Vital Discord before any testing begins.',
  },
  {
    question: 'How can I contribute ideas?',
    answer:
      'Join the Vital Discord. That is where we collect roleplay concepts, discuss proposals and, later, will ask for testers. There is no separate form on this page.',
  },
  {
    question: 'How can I follow development?',
    answer:
      'The Discord is the main place for updates. The Development journal on this page will carry written updates once there is something real to report, and the roadmap will be marked as phases are completed.',
  },
  {
    question: 'Are all showcased concepts guaranteed?',
    answer:
      'No. Everything on this page is a proposal. Some of it may not be possible with the available tools, and some of it may change once players tell us what they want. Treat it as direction, not a feature list.',
  },
];

/* ------------------------------------------------------------------ */
/* Built around the lore of GTA VI                                     */
/* ------------------------------------------------------------------ */

export const LORE_STATEMENT = "Rockstar built the world. We're giving players a place to live in it.";

export interface LoreTopic {
  id: string;
  title: string;
  /** One-sentence commitment shown under the title. */
  summary: string;
  /** What we intend to do. */
  points: string[];
  /** Names that appear in Rockstar's own GTA VI pages. Never invented. */
  seen?: { label: string; items: string[] };
  /** Honest limits: what is not confirmed yet. */
  caveat?: string;
  image: { src: string; alt: string };
}

export const loreTopics: LoreTopic[] = [
  {
    id: 'businesses',
    title: 'Native businesses and brands',
    summary: 'Keep the names, the signs and the interiors Rockstar built',
    points: [
      'Use the businesses, storefronts and locations that exist in the base game, with their original names and branding.',
      'Let players operate existing businesses and franchises, using native interiors wherever it is technically possible.',
      "Avoid custom businesses, buildings and interiors that do not need to exist, and build ownership around Leonida's existing fictional economy.",
    ],
    seen: {
      label: "Named in Rockstar's materials",
      items: ['Stock 305', 'Rideout Customs', "Sara's Unisex Salon", 'Electric Fang Tattoo', "One-Eyed Willie's"],
    },
    caveat:
      'Rockstar lists several of these as open only with the Ultimate Edition. Whether any can be used in multiplayer is an open question.',
    image: {
      src: '/gta6/lore-businesses.webp',
      alt: 'The Stock 305 storefront sign on a colorful mural wall, Rockstar Games promotional image for Grand Theft Auto VI',
    },
  },
  {
    id: 'gangs',
    title: 'Gangs and criminal organizations',
    summary: "Start with the crews Rockstar has already put on the map",
    points: [
      "Prioritize organizations established in GTA VI's lore, and respect their identities, backgrounds, cultures and geography.",
      'Use existing territories and locations where it makes sense, and let players write original stories inside established organizations.',
      "Keep real-world gangs out, so nothing clashes with the game's fictional universe.",
    ],
    seen: {
      label: "Named in Rockstar's materials",
      items: ['PTT YOUNGIN$ (Southside Vice City)', "Boobie Ike's operation", 'Drug runners of the Keys'],
    },
    image: {
      src: '/gta6/lore-gangs.webp',
      alt: 'Members of the PTT Youngin$ gathered outside their compound at night, Rockstar Games promotional image',
    },
  },
  {
    id: 'government',
    title: 'Government and public services',
    summary: "Build law enforcement and emergency roleplay on Leonida's own institutions",
    points: [
      'Use native law enforcement agencies and government institutions wherever possible.',
      'Keep established department names, jurisdictions, uniforms and identities.',
      'Build emergency services and government roleplay around the world that already exists.',
    ],
    seen: {
      label: "Shown in Rockstar's materials",
      items: ['Police patrols', 'Police boats and helicopters', 'The Coast Guard', 'Leonida Penitentiary'],
    },
    caveat:
      'We have not confirmed agency names, jurisdictions or uniforms, and we will not list any until we have.',
    image: {
      src: '/gta6/lore-government.webp',
      alt: 'An aerial view of a speedboat chased by a police boat, with a police helicopter overhead, Rockstar Games promotional image',
    },
  },
  {
    id: 'culture',
    title: 'Culture and entertainment',
    summary: "Let the state's own media, music and venues set the tone",
    points: [
      'Use native media organizations, radio stations, entertainment venues and fictional brands.',
      'Embrace the local culture and identity of each region.',
      'Encourage businesses and events that naturally fit the world Rockstar has created.',
    ],
    seen: {
      label: "Named in Rockstar's materials",
      items: ['Only Raw Records', 'Jack of Hearts', 'Real Dimez', "Macca the Gator, the Goodtime State's TV show"],
    },
    caveat:
      'Weazel News is a Rockstar brand from earlier games. We have not seen it confirmed for GTA VI, so we will not call it native until it is.',
    image: {
      src: '/gta6/lore-culture.webp',
      alt: 'Two people in Macca the Gator shirts in front of a Vice City mural, Rockstar Games promotional image',
    },
  },
  {
    id: 'world',
    title: 'World and environment',
    summary: 'Preserve the identity of Vice City and the regions around it',
    points: [
      'Use native homes, commercial locations and public spaces.',
      'Prioritize native vehicles, clothing, props and other game assets.',
      'Introduce custom assets only when they serve a real purpose and sit comfortably beside the originals.',
    ],
    seen: {
      label: "Named in Rockstar's materials",
      items: ['Gambit Bay', 'Washington Beach', 'Stockyard', 'Lake Leonida', 'Watson Bay', 'Vapid, Grotti and Dinka vehicles'],
    },
    image: {
      src: '/gta6/lore-world.webp',
      alt: 'A Vice City street under an overpass with murals, cars and scooters, Rockstar Games promotional image',
    },
  },
  {
    id: 'story',
    title: 'Storytelling',
    summary: "Your story, set inside Rockstar's universe",
    points: [
      "Staying true to the lore does not mean replaying the game's single-player story.",
      'Players should be free to create original characters, build relationships, earn reputations and tell their own stories.',
      'Rockstar supplies the setting. The people playing supply the plot.',
    ],
    image: {
      src: '/gta6/lore-story.webp',
      alt: 'Characters gathered around a pool table in a colorful bar, Rockstar Games promotional image',
    },
  },
];

export const LORE_DISCLAIMER =
  'How much of this can be done depends on the multiplayer development tools available for GTA VI. Names listed above come from Rockstar’s own pages and are not a promise that each will be playable on Vital.';

/* ------------------------------------------------------------------ */
/* Life in Leonida                                                     */
/* ------------------------------------------------------------------ */

export interface Lifestyle {
  id: string;
  title: string;
  tagline: string;
  summary: string;
  careers: string[];
  opportunities: string[];
  /** Real names from Rockstar's own pages, where they apply. */
  connections: string[];
  image: { src: string; alt: string };
}

export const lifestyles: Lifestyle[] = [
  {
    id: 'entrepreneur',
    title: 'The Entrepreneur',
    tagline: 'Open the doors and make it yours',
    summary:
      'Run a business inside the fictional economy Rockstar built. Hire people, win regulars, and earn a name that opens doors, or closes them.',
    careers: ['Shop owner', 'Franchise operator', 'Mod shop or salon owner', 'Property manager', 'Business partner'],
    opportunities: [
      'Hiring your first employee and training them properly',
      'Competing with the shop across the street for the same customers',
      'Negotiating a partnership with someone you do not fully trust',
    ],
    connections: ['Stock 305', 'Rideout Customs', "Sara's Unisex Salon", "Boobie Ike's real estate holdings"],
    image: {
      src: '/gta6/life-entrepreneur.webp',
      alt: 'A woman leaning on a counter inside the Stock 305 clothing store, Rockstar Games promotional image',
    },
  },
  {
    id: 'citizen',
    title: 'The Everyday Citizen',
    tagline: 'A good life made of ordinary days',
    summary:
      'Build a life through steady work, friendships, hobbies and the places you end up at every weekend. Not every story needs a gun.',
    careers: ['Local employee', 'Lifeguard or beach worker', 'Angler or boat hand', 'Resort and hotel staff', 'Community organizer'],
    opportunities: [
      'Becoming a regular somewhere and being missed when you are gone',
      'Organizing a neighborhood cookout, a tournament or a cleanup',
      'Working your way from a first job to a place of your own',
    ],
    connections: ['Washington Beach', 'Ocean View Hotel', 'Leonida Keys', 'Gambit Bay'],
    image: {
      src: '/gta6/life-citizen.webp',
      alt: 'Beachgoers around a lifeguard tower on a Vice City beach, Rockstar Games promotional image',
    },
  },
  {
    id: 'criminal',
    title: 'The Criminal',
    tagline: 'Everyone has something to gain, and more to lose',
    summary:
      "Work your way into the underworld Rockstar has already drawn. Build connections, navigate rivalries and let one decision shape the next season of your character's life.",
    careers: ['Crew member', 'Smuggler', 'Fixer', 'Heist planner', 'Club or street-level operator'],
    opportunities: [
      'Earning a place in an established crew, and keeping it',
      'A rivalry that escalates slowly instead of exploding on day one',
      'A debt that is still there next week',
    ],
    connections: ['PTT YOUNGIN$ in Southside Vice City', 'Smugglers of the Keys', 'Leonida Penitentiary'],
    image: {
      src: '/gta6/life-criminal.webp',
      alt: 'A man in glasses on a phone call in a dim room, from Rockstar Games promotional material for Grand Theft Auto VI',
    },
  },
  {
    id: 'public-servant',
    title: 'The Public Servant',
    tagline: 'Keep the state running, one shift at a time',
    summary:
      'Serve through law enforcement, emergency services, government institutions or the legal system, inside the agencies that already exist in the world.',
    careers: ['Police officer', 'Coast Guard', 'Paramedic or firefighter', 'Government staff', 'Attorney or court staff'],
    opportunities: [
      'A patrol that turns into a case you follow for weeks',
      'A hearing where the paperwork matters as much as the evidence',
      'A coastal call-out that needs three agencies to cooperate',
    ],
    connections: ['Vice Beach Police (seen on patrol cars)', 'Police boats and helicopters', 'The Coast Guard'],
    image: {
      src: '/gta6/life-public-servant.webp',
      alt: 'Police officers and a patrol car on a neon-lit Vice City street at night, Rockstar Games promotional image',
    },
  },
  {
    id: 'entertainer',
    title: 'The Entertainer',
    tagline: 'Be the name people talk about',
    summary:
      'Make music, report the news, take the photographs, run the stream or host the night. Become a local face in the culture of the state.',
    careers: ['Musician or producer', 'Journalist', 'Photographer', 'Influencer', 'Radio personality'],
    opportunities: [
      'Chasing a first hit with a label that is not sure about you yet',
      'Breaking a story that someone would rather stay quiet',
      'Building an audience that talks back',
    ],
    connections: ['Only Raw Records', 'Jack of Hearts', 'Real Dimez', 'In-game radio'],
    image: {
      src: '/gta6/life-entertainer.webp',
      alt: 'Two men in a recording studio, one working at a mixing console, Rockstar Games promotional image',
    },
  },
];

export const LIFE_NOTE =
  'These are possibilities, not character classes or finished systems. Anyone can mix them, and none of them is a promise.';

/* ------------------------------------------------------------------ */
/* Roleplay concepts                                                   */
/* ------------------------------------------------------------------ */

export interface Concept {
  slug: string;
  title: string;
  summary: string;
  /** How the native-first approach applies to this concept. */
  native: string;
  items: string[];
  note?: string;
}

export const concepts: Concept[] = [
  {
    slug: 'native-business-ownership',
    title: 'Business ownership',
    summary:
      'Instead of filling the map with custom interiors and invented brands, build on the businesses Rockstar already put in the world. A player could own a franchise, lease a unit or run a shop without waiting for us to build the building.',
    native: 'Existing names, storefronts and interiors come first.',
    items: [
      'Franchise ownership',
      'Commercial leases',
      'Employee recruitment',
      'Supplier contracts',
      'Business licenses',
      'Advertising',
      'Partnerships',
      'Multiple locations',
    ],
    note: 'We will only name a specific business once we have confirmed it exists and can be used.',
  },
  {
    slug: 'interconnected-economy',
    title: 'Interconnected economy',
    summary:
      'Businesses that need each other create roleplay without anyone writing it. One plate of fish can involve five players and five conversations. Crafting loops and repeated fetch tasks give way to people who depend on other people.',
    native: 'Built from the fictional economy the game already has.',
    items: [],
  },
  {
    slug: 'civilian-life',
    title: 'Civilian careers',
    summary:
      'A civilian career should be as rewarding to play as a criminal one. Most of these jobs do not need their own script. They need a world that gives them clients, licenses, a place to work and someone to answer to.',
    native: 'Workplaces are native locations, not invented ones.',
    items: [
      'Attorneys',
      'Realtors',
      'Photographers',
      'Journalists',
      'Insurance agents',
      'Private investigators',
      'Event planners',
      'Hotel managers',
      'Tour guides',
      'Music producers',
    ],
  },
  {
    slug: 'news-and-entertainment',
    title: 'News and entertainment',
    summary:
      "A player-run newsroom and broadcaster with real stories, real advertisers and an audience that talks back, alongside the music, nightlife and shows that already define the state's culture.",
    native: 'Native media brands and stations, once confirmed.',
    items: [
      'Breaking news',
      'Investigations',
      'Live interviews',
      'Advertising',
      'Radio',
      'Sports reporting',
      'Weather reports',
      'Live events',
    ],
    note: 'We have not confirmed which media organizations exist in the game, so none are named as native yet.',
  },
  {
    slug: 'criminal-underworld',
    title: 'The underworld',
    summary:
      'Crime that runs on relationships, reputation and consequences. Fewer scripted missions and constant gunfights, more territory that is earned and lost through people, and debts that are still there next week.',
    native: "Rockstar's established organizations first, original stories inside them.",
    items: [
      'Territory',
      'Connections',
      'Underground economies',
      'Rivalries',
      'Alliances',
      'Organized crime',
      'Long-term consequences',
    ],
  },
  {
    slug: 'government-and-emergency-services',
    title: 'Institutions',
    summary:
      'Law enforcement, emergency services, courts and government that players can work inside, appeal to and argue with. The paperwork, hearings and meetings are part of the roleplay, not a gate in front of it.',
    native: 'Native agencies, names and uniforms, where we can confirm them.',
    items: [
      'Law enforcement',
      'Emergency medical services',
      'Courts',
      'Government agencies',
      'Business licensing',
      'Public meetings',
      'Park and wildlife services',
    ],
    note: 'None of these structures are final. We are listing what interests us, not what will exist.',
  },
  {
    slug: 'a-living-world',
    title: 'A living world',
    summary:
      'Events that keep going after the announcement. A storm is not a ten minute staff event. It closes a marina, which delays a delivery, which sparks an insurance dispute, which ends up on the news.',
    native: 'Tied to real regions and the culture of each one.',
    items: [
      'Hurricanes',
      'Power outages',
      'Music festivals',
      'Spring break',
      'Fishing tournaments',
      'Business disputes',
      'Missing persons',
      'Regional celebrations',
    ],
  },
];

export interface ChainStep {
  role: string;
  does: string;
  roleplay: string;
}

/** The example inside the Interconnected economy concept. Generic by design. */
export const supplyChain: ChainStep[] = [
  {
    role: 'Fisherman',
    does: 'Lands the catch at dawn and has to sell it before it spoils.',
    roleplay: 'Negotiating a price at the dock, running late because of weather, building a reputation with regular buyers.',
  },
  {
    role: 'Wholesale distributor',
    does: 'Buys from several boats, grades the catch and sells in volume.',
    roleplay: 'Setting prices, choosing who gets priority, handling a complaint about a bad batch.',
  },
  {
    role: 'Trucking company',
    does: 'Moves cold product across the state on a schedule.',
    roleplay: 'Dispatching drivers, covering a breakdown, signing a delivery contract with a restaurant group.',
  },
  {
    role: 'Restaurant',
    does: 'Turns the delivery into a menu and has to be open on time.',
    roleplay: 'Switching the special when the delivery is late, hiring a cook, arguing with the supplier about an invoice.',
  },
  {
    role: 'Customer',
    does: 'Sits down, orders and notices whether any of it went well.',
    roleplay: 'A first date, a business dinner, a review that reaches the right ears, a tip that is remembered.',
  },
];

/* ------------------------------------------------------------------ */
/* Development journal                                                 */
/* ------------------------------------------------------------------ */

export interface Article {
  slug: string;
  category: string;
  title: string;
  description: string;
  /** ISO date, set only when a real article is published. */
  publishedAt: string;
  image?: { src: string; alt: string };
}

/**
 * Published development articles. Intentionally empty until leadership has
 * real updates to share. Do not add placeholder entries here.
 */
export const articles: Article[] = [];

export const plannedTopics = [
  { category: 'Philosophy', title: "Why we're moving away from grinding" },
  { category: 'Lore', title: 'How we decide what counts as native' },
  { category: 'Economy', title: 'Rethinking business ownership' },
  { category: 'Civilian', title: 'Building a better civilian experience' },
  { category: 'World', title: 'Exploring the regions of Leonida' },
];
