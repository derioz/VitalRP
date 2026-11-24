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
  { id: 'vision', label: 'Our vision' },
  { id: 'leonida', label: 'Explore Leonida' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'community', label: 'Community' },
  { id: 'faq', label: 'FAQ' },
] as const;

/** Approved promotional images live in /public/gta6. Credit: Rockstar Games. */
export const GTA6_IMAGES = {
  hero: {
    src: '/gta6/hero-bay.webp',
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

export interface Principle {
  title: string;
  body: string;
}

export const principles: Principle[] = [
  {
    title: 'Roleplay first',
    body: 'Meaningful interactions and storytelling over repetitive gameplay loops.',
  },
  {
    title: 'Native world',
    body: "Using Rockstar's existing businesses, brands, interiors and environments wherever technically possible.",
  },
  {
    title: 'Player-driven stories',
    body: 'Characters and communities shape the direction of the world.',
  },
  {
    title: 'Living economy',
    body: 'Interconnected businesses, meaningful employment and player-driven services.',
  },
  {
    title: 'World immersion',
    body: 'Fewer menus, less intrusive interface and fewer artificial mechanics.',
  },
  {
    title: 'Character development',
    body: 'Progression through reputation, relationships, qualifications and accomplishments.',
  },
];

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
    image: { src: '/gta6/region-port-gellhorn.webp', alt: 'The Starlet Motel sign glowing at dusk among palm trees in Port Gellhorn, Rockstar Games promotional image' },
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
      'We do not have a launch date and we are not going to guess one. We are in the concept stage. What we can build depends on the multiplayer development tools that become available for GTA VI, and we will share dates only when we can stand behind them.',
  },
  {
    question: 'Will the current GTA V server remain open?',
    answer:
      'Yes. Vital RP on GTA V is not going anywhere because of this project. Nothing about the GTA VI plans changes how the current server runs.',
  },
  {
    question: 'Will existing characters or assets transfer?',
    answer:
      'We have not decided. Character stories and relationships matter to us, but a new game and a new world raise real questions about what can carry over. We will talk about it with the community before anything is set.',
  },
  {
    question: 'Is everything on this page guaranteed?',
    answer:
      'No. Everything on this page is a proposal. Some of it may not be possible with the available tools, and some of it may change once players tell us what they want. Treat it as direction, not a feature list.',
  },
  {
    question: 'How can I help shape the server?',
    answer:
      'Join the Vital Discord. That is where we collect concepts, discuss ideas and, later, will ask for testers. There is no separate form on this page. If something needs one, we will add it when it works.',
  },
  {
    question: 'Will Vital use native GTA VI businesses?',
    answer:
      'That is the goal. We would rather use what Rockstar already built than fill the world with custom interiors and invented brands. Which ones we can use depends on what is available and technically workable, and we will confirm each one before naming it.',
  },
  {
    question: 'What type of roleplay experience is Vital planning?',
    answer:
      'Serious, story-first roleplay with less grinding, a strong civilian side, and crime that runs on relationships and consequences. The same values as the current server, built for a different setting.',
  },
];
