'use client';

import React from 'react';

const offers = [
  { title: '18+ semi-serious RP', description: 'Focused on story, character development, and immersive scenes rather than simple shootouts.' },
  { title: 'Whitelisted community', description: "Keeping quality high and reducing trolls to protect the integrity of everyone's storylines." },
  { title: 'Diverse staff team', description: 'Active staff made up of legal, criminal, lawyer, and LEO players for balanced city insight.' },
  { title: 'Ongoing development', description: 'Regular content updates, script enhancements, and bug fixes.' },
  { title: 'Balanced economy', description: 'Plenty of ways to make money legally and illegally, so every hustle feels rewarding.' },
  { title: 'Player-run events', description: 'Server-wide holidays and community-driven story arcs, organized by players.' },
];

const opportunities = [
  {
    title: 'Law and services',
    items: [
      { name: 'Law enforcement (LSPD and BCSO)', text: 'Police and county sheriff departments with custom faction scripts, dispatch, MDTs, tactical gear, and patrol fleets.' },
      { name: 'Emergency medical services', text: 'Triage systems, dynamic patient treatment, rescue vehicles, and high-standard medical RP.' },
    ],
  },
  {
    title: 'Civilian life',
    items: [
      { name: 'Civilian jobs', text: 'Power washing, garbage routes, construction trades, fishing (with dynamite), and hunting.' },
      { name: 'Player-run businesses', text: 'Own restaurants, nightclubs, strip clubs, mechanic shops, and custom retail storefronts.' },
      { name: 'Housing and decorating', text: 'Customizable homes with furniture, private garages, and interior styling.' },
      { name: 'Social RP', text: 'Golf, skateboarding, street racing, local hangouts, and community events.' },
    ],
  },
  {
    title: 'Criminal life',
    items: [
      { name: 'Illegal factions', text: 'Mafia syndicates, street gangs, outlaw motorcycle clubs, and racing crews with real turf rivalries.' },
      { name: 'Crime and heists', text: 'Petty crime, vehicle boosting, multi-stage bank vaults, and Cayo Perico Extraction loot runs.' },
      { name: 'Black market and crafting', text: 'Material farming, scrapping, mining, drug synthesis, and weapon crafting.' },
    ],
  },
];

const worldFeatures = [
  { title: 'In-house scripts', description: 'Written from scratch as custom code, so every system is ours to fix and extend.' },
  { title: 'Vehicle fleet', description: 'Custom import cars, bikes, and work vehicles with realistic handling and deep tuning.' },
  { title: 'Diamond Casino', description: 'Blackjack, roulette, slots, and the daily Lucky Wheel with exclusive podium rides.' },
  { title: 'Cayo Perico Extraction', description: 'Custom missions on Cayo Perico: complete objectives, survive hostile territory, extract with rare loot.' },
];

const SectionLabel = ({ label }: { label: string }) => (
  <h3 className="text-xl font-display font-bold text-white mb-6 pb-3 border-b border-white/10">{label}</h3>
);

export const Features: React.FC = () => {
  return (
    <section id="features" className="py-24 relative overflow-hidden scroll-mt-24">
      <div className="absolute inset-0 bg-dark-950/95 z-0"></div>
      <div className="absolute top-0 left-0 w-full h-px bg-white/10 z-20"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-16 max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-display font-black text-white mb-5 tracking-tight">
            What you can do in Vital RP
          </h2>
          <p className="text-gray-300 text-lg leading-relaxed">
            Police, EMS, civilian careers, crime, and a casino, all running on scripts we wrote ourselves.
          </p>
        </div>

        <SectionLabel label="What we offer" />
        <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8 mb-20">
          {offers.map((feature) => (
            <div key={feature.title}>
              <dt className="font-display font-bold text-white mb-1.5">{feature.title}</dt>
              <dd className="text-gray-300 text-[15px] leading-relaxed">{feature.description}</dd>
            </div>
          ))}
        </dl>

        <SectionLabel label="In-game opportunities" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-10 gap-y-10 mb-20">
          {opportunities.map((group) => (
            <div key={group.title}>
              <h4 className="font-display font-bold text-vital-500 mb-4">{group.title}</h4>
              <ul className="space-y-4">
                {group.items.map((item) => (
                  <li key={item.name} className="text-[15px] leading-relaxed text-gray-300">
                    <strong className="block text-white font-semibold">{item.name}</strong>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <SectionLabel label="World and features" />
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-8">
          {worldFeatures.map((feature) => (
            <div key={feature.title} className="border-t border-white/10 pt-4">
              <dt className="font-display font-bold text-white mb-1.5">{feature.title}</dt>
              <dd className="text-gray-300 text-[15px] leading-relaxed">{feature.description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};
