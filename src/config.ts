export type StaffMember = {
  name: string;
  badge: string;
  title: string;
  discord?: string;
};

export type RuleItem = {
  title: string;
  summary: string;
  example: string;
};

export type JobItem = {
  key: "pd" | "ems" | "fire" | "criminal" | "civilian" | "player_owned";
  title: string;
  summary: string;
  highlights: string[];
  badge?: string;
};

export const siteConfig = {
  serverName: "Vital RP",
  tagline: "Story-first roleplay, with a community that actually feels alive.",
  discordInvite: "https://discord.gg/vitalrp",
  
  socials: [
    { key: "x", label: "Twitter/X", url: "https://x.com/vital_roleplay/" },
    { key: "instagram", label: "Instagram", url: "https://www.instagram.com/vital_roleplay/" },
    { key: "tiktok", label: "TikTok", url: "https://www.tiktok.com/@vitalroleplay_" },
    { key: "youtube", label: "YouTube", url: "https://www.youtube.com/@VitalRP" },
  ],
connectUrl: "https://cfx.re/join/ogpvmv",
  storeUrl: "https://vitalrp.tebex.io/",
  /**
   * Optional. Used for best-effort status lookup.
   * Common formats:
   * - "ip:port" (example: "123.45.67.89:30120")
   * - server id if you have one (depends on endpoint availability)
   */
  serverAddress: "OGPVMV",

  featuredCaptionTitle: "Welcome to the vibe.",
  featuredCaptionSub: "A quick look at what makes Vital feel like Vital.",


  jobs: [
    {
      key: "pd",
      title: "Police Department (PD)",
      badge: "Public Service",
      summary: "Patrol, investigations, and city-wide storylines that keep everything grounded.",
      highlights: ["Cadet to Command progression", "Training and ride-alongs", "Scene-first policing"]
    },
    {
      key: "ems",
      title: "EMS (Medical)",
      badge: "Public Service",
      summary: "Medical RP that keeps scenes alive, from street calls to major incidents.",
      highlights: ["Triage and treatment RP", "Rescue operations", "Hospital and dispatch scenes"]
    },
    {
      key: "fire",
      title: "Fire Department",
      badge: "Public Service",
      summary: "Fires, rescues, crashes, and big incident response when the city gets spicy.",
      highlights: ["Rescue and extraction RP", "Incident command", "Major event support"]
    },
    {
      key: "criminal",
      title: "Criminal Jobs",
      badge: "High Risk",
      summary: "Heists, trafficking, boosting, and underworld work, built with escalation and consequences.",
      highlights: ["Build-up required, no random chaos", "Crew coordination and planning", "Heat, investigations, and fallout"]
    },
    {
      key: "civilian",
      title: "Civilian Jobs",
      badge: "Everyday RP",
      summary: "Taxi, trucking, delivery, legal work, construction, and the day-to-day that makes the city feel real.",
      highlights: ["Steady income and progression", "Great for new players", "Easy to weave into stories"]
    },
    {
      key: "player_owned",
      title: "Player-Owned Businesses",
      badge: "Community Driven",
      summary: "Run a shop, club, restaurant, mechanic, or anything else that creates daily RP and relationships.",
      highlights: ["Hiring and payroll RP", "Events, promos, partnerships", "Build your own reputation"]
    }
  ] as JobItem[],

  rulesFullUrl: "https://docs.google.com/document/d/YOUR_DOC_ID/view",

  staff: [
        { name: "Grumpy", badge: "Server Owner", title: "Owner and Developer", discord: "@grumpyfinster" },
        { name: "Nez", badge: "Server Owner", title: "Owner and Lead Developer", discord: "@nnezzie" },
        { name: "Soup", badge: "Server Owner", title: "Owner", discord: "@soup.lua" },

        { name: "Bug", badge: "Community Manager", title: "Community Manager", discord: "@sweetbug03" },

        { name: "Strix", badge: "Head Administrator", title: "Head of Staff", discord: "@iistrix" },
        { name: "Artemis", badge: "Administrator", title: "Administrator", discord: "@gtschaos" },
        { name: "Damon", badge: "Administrator", title: "Head of Whitelisting, Marketing, & Support Staff", discord: "@mcspace" },
        { name: "Rue", badge: "Administrator", title: "Head of Rules", discord: "@ruekatu" },
        { name: "Parzival", badge: "Administrator", title: "Administrator", discord: "@gtsdeathclutch" },
        { name: "Beth", badge: "Administrator", title: "Head of Property Management", discord: "@authenticbeth" },

        { name: "Damon", badge: "Head of Subgroups", title: "Whitelisting, Marketing, & Support Staff", discord: "@mcspace" },
        { name: "Chach", badge: "Head of Subgroups", title: "Content Creation", discord: "@cptchach" },
        { name: "Boo Berry", badge: "Head of Subgroups", title: "Business Management", discord: "@craysteens" },
        { name: "Beth", badge: "Head of Subgroups", title: "Property Management", discord: "@authenticbeth" },

        { name: "Jonsey", badge: "Developer", title: "Clothing Developer", discord: "@sail_jpg" },
      ] as StaffMember[],


  rules: [
    {
      title: "No RDM (random violence)",
      summary: "Violence needs clear RP reasoning and build-up. Random attacks are not allowed.",
      example: "You can’t open fire because someone looked at you funny. Talk, threaten, escalate, then act if it makes sense."
    },
    {
      title: "No VDM (using cars as weapons)",
      summary: "Vehicles aren’t weapons. Intentionally running people over is not allowed.",
      example: "Accidents happen, but repeated ‘accidents’ in a chase or scene will be treated as VDM."
    },
    {
      title: "No metagaming or powergaming",
      summary: "Keep IC and OOC separate, and don’t force unrealistic outcomes.",
      example: "Don’t use Discord/stream chat to locate people, and don’t do superhuman actions to ‘win’."
    },
    {
      title: "Value your life (NVL)",
      summary: "Act like your character wants to survive. Fear and consequences matter.",
      example: "Outnumbered with guns on you? Compliance or smart negotiation is expected, not superhero mode."
    },
    {
      title: "New Life Rule (NLR)",
      summary: "After you die, don’t return to the same situation, and don’t remember the moments leading up to it.",
      example: "If you get killed in a shootout, don’t race back to the scene for revenge."
    },
    {
      title: "Keep RP realistic and cooperative",
      summary: "Aim for believable actions and give others room to respond. Avoid ‘no-selling’ the scene.",
      example: "If someone’s trying to RP with you, meet them halfway instead of ignoring or shutting it down."
    },
    {
      title: "No cheating or exploiting",
      summary: "Don’t use cheats or abuse bugs for advantage. Report issues instead.",
      example: "If you find a duplication bug, don’t ‘test it’ 50 times. Report it."
    },
    {
      title: "Enforcement",
      summary: "Consequences scale with severity, intent, history, and impact on RP.",
      example: "We’d rather correct behavior than punish, but repeat issues will escalate."
    }
  ] as RuleItem[]
};
