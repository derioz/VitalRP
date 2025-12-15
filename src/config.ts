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
  title: string;
  summary: string;
  highlights: string[];
};

export const siteConfig = {
  serverName: "Vital RP",
  tagline: "Story-first roleplay, with a community that actually feels alive.",
  discordInvite: "https://discord.gg/vitalrp",
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
      title: "Police (PD)",
      summary: "Patrol, investigations, traffic stops, and big story arcs with the city.",
      highlights: ["Cadet to Command progression", "Scene-first policing", "Training and ride-alongs"]
    },
    {
      title: "EMS (Medical)",
      summary: "Medical RP that keeps scenes alive, from street calls to major incidents.",
      highlights: ["Roleplay-focused triage", "Rescue operations", "Hospital and dispatch RP"]
    },
    {
      title: "Player Businesses",
      summary: "Own, run, or work for businesses that create daily RP, drama, and alliances.",
      highlights: ["Custom business opportunities", "Hiring and payroll RP", "Events, promos, and partnerships"]
    },
    {
      title: "Legal and Court RP",
      summary: "Lawyers, trials, contracts, and consequences that make choices matter.",
      highlights: ["Representation and plea deals", "Court cases and filings", "Business and criminal defense"]
    },
    {
      title: "Criminal Life",
      summary: "If you choose the dark path, keep it grounded, built-up, and story-driven.",
      highlights: ["RP escalation required", "Territory and relationships", "Consequences that stick"]
    }
  ] as JobItem[],

  rulesFullUrl: "https://docs.google.com/document/d/YOUR_DOC_ID/view",

  staff: [
    { name: "Grumpy", badge: "Server Owner", title: "Owner and Developer", discord: "@grumpyfinster" },
    { name: "Nez", badge: "Server Owner", title: "Owner and Lead Developer", discord: "@nnezzie" },
    { name: "Soup", badge: "Server Owner", title: "Owner", discord: "@soup.lua" },
    { name: "Daniel", badge: "Head Administrator", title: "Head of Staff", discord: "@dan1els0n" },
    { name: "Strix", badge: "Head Administrator", title: "Head of Staff", discord: "@iistrix" },
    { name: "Damon", badge: "Administrator", title: "Head of Support, Whitelisting, & Marketing", discord: "@mcspace" },
    { name: "Rue", badge: "Administrator", title: "Head of Rules", discord: "@ruekatu" },
    { name: "Parzival", badge: "Administrator", title: "Administrator", discord: "@gtsdeathclutch" },
    { name: "Peaches", badge: "Administrator", title: "Head of Property Management", discord: "@authenticbeth" },
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
