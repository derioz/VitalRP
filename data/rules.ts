export interface RuleCallout {
  type: 'IMPORTANT' | 'WARNING' | 'EXAMPLE' | 'COOLDOWN' | 'REQUIRES_APPROVAL' | 'NOT_ALLOWED';
  title?: string;
  text: string;
}

export interface Rule {
  id: string;
  category: string;
  title: string;
  shortTitle?: string;
  summary: string;
  content: string;
  aliases: string[];
  featured?: boolean;
  coreRuleNumber?: number;
  callouts?: RuleCallout[];
}

export interface RuleCategory {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export const RULE_CATEGORIES: RuleCategory[] = [
  {
    id: 'general',
    title: 'General Server Rules',
    description: 'Fundamental server guidelines, age restrictions, and platform expectations.',
    iconName: 'ShieldAlert',
  },
  {
    id: 'roleplay',
    title: 'Roleplay Standards',
    description: 'Foundational roleplay mechanics including Value of Life, NLR, and immersion rules.',
    iconName: 'Drama',
  },
  {
    id: 'combat-interactions',
    title: 'Combat & Player Interactions',
    description: 'Rules governing hostilities, robberies, combat logging, and player confrontations.',
    iconName: 'Crosshair',
  },
  {
    id: 'criminal-rp',
    title: 'Criminal RP & Heists',
    description: 'Crime caps, robbery tiers, police response limits, and Extraction Island regulations.',
    iconName: 'Flame',
  },
  {
    id: 'government',
    title: 'Government & Public Services',
    description: 'Regulations for Law Enforcement (LSPD), Medical Services (EMS), and Department of Justice (DOJ).',
    iconName: 'BadgeCheck',
  },
  {
    id: 'community-conduct',
    title: 'Community Conduct',
    description: 'Zero tolerance policies regarding toxicity, discrimination, harassment, and gross RP.',
    iconName: 'HeartHandshake',
  },
  {
    id: 'factions',
    title: 'Factions & Gang Operations',
    description: 'Faction creation, member caps, attire requirements, IFM communication, and crew guidelines.',
    iconName: 'Users',
  },
  {
    id: 'faction-conflict',
    title: 'Faction Conflict & Wars',
    description: 'Gang wars, conflict escalation, bleed-in/bleed-out rules, recording requirements, and racing.',
    iconName: 'Swords',
  },
  {
    id: 'reports-enforcement',
    title: 'Reports & Enforcement',
    description: 'How to report rule breaks, rule baiting bans, and server dispute protocols.',
    iconName: 'FileText',
  },
];

export const RULES: Rule[] = [
  // =========================================================================
  // 1. GENERAL SERVER RULES
  // =========================================================================
  {
    id: 'server-age-restriction',
    category: 'general',
    title: 'Server Age Restriction (18+)',
    shortTitle: '18+ Server',
    summary: 'Vital RP is strictly an 18+ community with zero exceptions. Mature themes and adult conversations may occur.',
    content: `This is an 18+ Server with no exceptions. That means that humor and conversation topics could be adult in nature at times.

All members must be at least 18 years of age to whitelist and play on Vital RP. Any player found to be under 18 will be permanently banned until they reach legal age.`,
    aliases: ['18+', 'age limit', 'mature', 'adult', 'underage'],
    featured: true,
    coreRuleNumber: 1,
    callouts: [
      {
        type: 'WARNING',
        title: 'Zero Tolerance on Underage Players',
        text: 'Providing false age information during whitelisting or in Discord will result in an immediate permanent unappealable ban.'
      }
    ]
  },
  {
    id: 'community-expectations',
    category: 'general',
    title: 'Community Expectations',
    shortTitle: 'Expectations',
    summary: 'Set your Discord name to your IC name, consent to PC checks upon whitelisting, and maintain adult accountability.',
    content: `Upon joining the Discord, you must change your Discord name to your main roleplay first and last name (exceptions apply to staff, who may use their staff name).

By becoming whitelisted and participating in the city, you also automatically consent to random PC checks at any time. For more information, please submit a ticket.

Criticism is welcome; toxicity is not. You’re free to share concerns, but abuse, harassment, or targeted negativity toward the community, server, or staff won’t be tolerated. We take accountability seriously. Reports involving staff (even owners) are reviewed independently. This includes ban disputes.

This is a space for fun, collaborative RP. If you bring constant negativity, stir OOC drama, or fuel arguments, you may be removed. You don’t need to be friends with everyone, just act like an adult.`,
    aliases: ['discord name', 'pc check', 'toxicity', 'criticism', 'accountability', 'whitelisting'],
    callouts: [
      {
        type: 'IMPORTANT',
        title: 'Random PC Checks',
        text: 'Participation in Vital RP includes automatic consent to random PC checks by authorized staff to verify game integrity.'
      }
    ]
  },
  {
    id: 'voice-communication',
    category: 'general',
    title: 'Voice Communication',
    shortTitle: 'Voice & Mic',
    summary: 'The majority of communication must be in English. A working microphone is required at all times.',
    content: `The majority of communication MUST be in English.

Every player is required to have a working, clear microphone while connected to the server. Roleplaying as mute or communicating exclusively through text/third-party apps without prior staff approval is not permitted. Voice changers and soundboards must sound realistic and fit your character concept.`,
    aliases: ['mic', 'voice', 'microphone', 'english', 'soundboard', 'voice changer'],
  },
  {
    id: 'exploits-cheating',
    category: 'general',
    title: 'Exploits & Cheating',
    shortTitle: 'No Exploiting',
    summary: 'Intentionally abusing server bugs, animations, scripts, or third-party software for competitive advantage is strictly forbidden.',
    content: `Players must not intentionally abuse any server bugs, script bugs, scripts or GTA game mechanics to gain an unfair advantage. Use of game mechanics (intended or otherwise) to gain an unfair advantage is considered exploiting (e.g., using known bugs or using game features in inappropriate and unintended ways).

Any changes you make to your game that give you a competitive advantage over other players are not allowed to be used on this server. This includes, but is not limited to:
- Crosshair overlays or external aim aids
- Modified game files granting speed, stamina, or field of view advantages
- Custom weapon visual effects that remove smoke, flash, or recoil
- Abusing emote cancelling or animation cancelling in gunfights or robberies`,
    aliases: ['exploiting', 'cheating', 'bugs', 'hacks', 'crosshairs', 'modifications', 'animation cancelling', 'abusing'],
    featured: true,
    coreRuleNumber: 8,
    callouts: [
      {
        type: 'NOT_ALLOWED',
        title: 'Permanent Ban',
        text: 'Using malicious software, memory injection, speed hacks, or third-party combat enhancements will lead to an immediate permanent hardware ban.'
      }
    ]
  },
  {
    id: 'disrupting-server-operations',
    category: 'general',
    title: 'Disrupting Server Operations (DSO)',
    shortTitle: 'DSO',
    summary: 'Prohibits advertising other communities, poaching members, slandering the server, cyber attacks, and doxxing.',
    content: `Disrupting Server Operations (DSO) is an umbrella term used to protect the server and its community from harmful external or out-of-character actions.

Players are strictly not allowed to take part in or have knowledge of:
1. Advertising any other roleplay servers/communities or attempting to poach members from Vital RP's Discord server or any official platforms.
2. Slandering: Attempting to discredit or defame Vital RP or its members across Discord, Twitch, social media, or other public platforms.
3. Doxxing: Leaking personal, private, or real-life information of any member of the Vital RP community.
4. Cyber Attacks: Engaging in, coordinating, or having knowledge of DDoS attacks, account theft, credential stuffing, or server sabotage.
5. Severe Unreported Rulebreaks: Shielding players who are actively exploiting or running malicious activities against the community.`,
    aliases: ['DSO', 'advertising', 'poaching', 'slander', 'doxxing', 'ddos', 'cyber attack', 'sabotage'],
    callouts: [
      {
        type: 'WARNING',
        title: 'Immediate Community Removal',
        text: 'DSO violations are treated as malicious attacks against the server and result in instant blacklisting across all Vital RP infrastructure.'
      }
    ]
  },
  {
    id: 'ban-evasion',
    category: 'general',
    title: 'Ban Evasion',
    shortTitle: 'Ban Evading',
    summary: 'Circumventing a suspension using alternate accounts, VPNs, or new identifiers converts temporary suspensions into permanent unappealable bans.',
    content: `Ban evading is strictly prohibited. If you are banned or suspended from Vital RP, you must follow the appropriate method to appeal that ban for it to be lifted.

If you attempt to circumvent a ban using alternate Discord accounts, new Steam/Rockstar accounts, VPNs, or hardware spoofing, your suspension will automatically turn into a permanent ban with zero chance of appeal.`,
    aliases: ['ban evasion', 'alt account', 'ban evading', 'vpn', 'spoofing', 'appeal'],
    callouts: [
      {
        type: 'NOT_ALLOWED',
        title: 'Unappealable Permanent Ban',
        text: 'Attempting to evade a ban forfeits any right to standard ticket appeals.'
      }
    ]
  },
  {
    id: 'real-world-trading',
    category: 'general',
    title: 'Real-World Trading (RWT) & Asset Transfers',
    shortTitle: 'RWT & Transfers',
    summary: 'Exchanging in-game items or currency for real-world money, or transferring assets between your own characters, is strictly prohibited.',
    content: `Real-World Trading (RWT) and/or transferring accumulated assets from one of your own characters to another, regardless of the reason, is strictly prohibited.

RWT refers to the exchange of in-game items, currency, or services for real-world money or goods, or vice versa, either directly or through third-party platforms. Engaging in RWT undermines the integrity of the game environment and creates unfair advantages for those who participate.

Any player found participating in RWT will face penalties, including but not limited to:
- Temporary or permanent suspension from Vital Roleplay.
- Complete confiscation and wipe of in-game items, properties, and currency involved.

Note: In-character gifting or selling between completely separate players for in-character money is valid; transferring assets between characters owned by the same real-life player is not.`,
    aliases: ['RWT', 'real world trading', 'selling money', 'asset transfer', 'alt character', 'cash buying'],
    callouts: [
      {
        type: 'NOT_ALLOWED',
        title: 'Asset Confiscation',
        text: 'All assets and funds involved in illicit transfers or real-world money transactions will be permanently deleted from the database.'
      }
    ]
  },

  // =========================================================================
  // 2. ROLEPLAY STANDARDS
  // =========================================================================
  {
    id: 'stay-in-character',
    category: 'roleplay',
    title: 'Stay in Character (No Breaking Character)',
    shortTitle: 'Stay in Character',
    summary: 'Do not break character during active scenes. If a rule is broken, play out the scene and report it afterward.',
    content: `No Breaking Character – Stay in character during scenes. If a rule is broken, normally finish the RP and report it afterward unless it involves serious issues that require immediate intervention (such as hate speech, gross RP, or severe game disruption).

Do not discuss server rules, OOC tickets, bans, discord messages, or mechanics in voice chat or /me. Roleplay over ruleplay: prioritize keeping the scene immersive and handle disputes through the proper ticket channels afterward.`,
    aliases: ['breaking character', 'ooc in voice', 'in character', 'stay in character', 'ruleplay', 'finish the scene'],
    featured: true,
    coreRuleNumber: 2,
    callouts: [
      {
        type: 'IMPORTANT',
        title: 'Roleplay Over Ruleplay',
        text: 'Do not pause active scenes to argue rules in voice chat. Complete the roleplay organically and submit a ticket afterward with your recording.'
      }
    ]
  },
  {
    id: 'fear-rp',
    category: 'roleplay',
    title: 'Value of Life (Fear Roleplay)',
    shortTitle: 'Value of Life (FearRP)',
    summary: 'Characters must realistically value their lives at all times and react appropriately when facing deadly threats.',
    content: `Players must prioritise their character's life and act as if they have only one life to live. When placed in a situation where your life is in clear and immediate danger, you must display genuine fear and value for your survival.

Key FearRP Requirements:
1. When a firearm is drawn and pointed at you before you have drawn a weapon, you must comply with reasonable demands. You may not pull a weapon out while staring down the barrel of a loaded gun.
2. If multiple armed assailants have the drop on you, you cannot "superhero" your way out by pulling a gun or jumping into moving traffic.
3. If you have clear cover or the assailant looks away / lowers their weapon, you may realistically evaluate escape or retaliation options, but reckless disregard for fatal injury is a rule violation.`,
    aliases: ['FearRP', 'value of life', 'fear roleplay', 'gunpoint', 'hands up', 'hostage fear'],
    featured: true,
    coreRuleNumber: 3,
    callouts: [
      {
        type: 'IMPORTANT',
        title: 'Immediate Lethal Threat',
        text: 'Drawing a firearm while someone already has a firearm aimed directly at your head or chest with intent to fire is a direct FearRP violation.'
      }
    ]
  },
  {
    id: 'new-life-rule',
    category: 'roleplay',
    title: 'New Life Rule (NLR)',
    shortTitle: 'New Life Rule (NLR)',
    summary: 'When flatbacked (second stage), you forget all events leading to your death and must observe a mandatory 30-minute scene restriction.',
    content: `When a character is flatbacked (the second stage of being downed where you bleed out or respawn at the hospital), they experience memory loss regarding the events, conflict, and circumstances that led up to their death.

NLR Regulations:
1. Memory Loss: Your character has no memory of who killed them, where it happened, or why. You cannot seek revenge or act on that specific incident.
2. 30-Minute Restriction: For 30 minutes, the flatbacked player may not interact with, pursue, acknowledge, or return to the scene of their death.
3. Cooldown Actions: During the 30-minute cooldown, you cannot rejoin the active conflict, communicate information about the shootout to your faction, or re-engage the opposing party.
4. Downed (1st Stage) vs Flatbacked (2nd Stage):
   - Downed (1st stage): A downed player awaiting EMS may communicate basic physical information (such as personal identification or brief description of physical injuries).
   - Flatbacked (2nd stage): Once respawned at the hospital, complete NLR takes effect immediately.`,
    aliases: ['NLR', 'new life rule', 'flatbacked', 'respawn', 'bleed out', 'hospital', 'memory loss', '30 minutes'],
    featured: true,
    coreRuleNumber: 4,
    callouts: [
      {
        type: 'COOLDOWN',
        title: '30-Minute Exclusion Zone',
        text: 'You may not return to the radius of your death for a full 30 minutes following hospital respawn.'
      }
    ]
  },
  {
    id: 'metagaming',
    category: 'roleplay',
    title: 'Meta Gaming (MG)',
    shortTitle: 'Metagaming (MG)',
    summary: 'Using Out-Of-Character (OOC) knowledge in-character (IC) from streams, Discord, or external sources is strictly prohibited.',
    content: `Metagaming is the act of gathering information Out-Of-Character (OOC) and using it In-Character (IC). This could be information from different platforms such as Twitch streams, Discord channels, YouTube videos, or other methods of external information spreading.

Examples of Metagaming:
- Watching a streamer's broadcast to locate their stash house, convoy, or active position in-game.
- Calling out enemy locations in a Discord voice channel while in an active shootout instead of using in-game radios or phones.
- Using character names seen over heads or in Discord rosters without having met them in-character.
- Reading police dispatch or faction chats outside the game to prepare an ambush.`,
    aliases: ['MG', 'metagaming', 'meta', 'stream sniping', 'discord calls', 'ooc info'],
    featured: true,
    coreRuleNumber: 5,
    callouts: [
      {
        type: 'NOT_ALLOWED',
        title: 'Third-Party Comms in Active Scenes',
        text: 'Relaying tactical in-game positions through Discord voice or direct messages during shootouts, chases, or robberies is treated as severe Metagaming.'
      }
    ]
  },
  {
    id: 'powergaming',
    category: 'roleplay',
    title: 'Powergaming (PG)',
    shortTitle: 'Powergaming (PG)',
    summary: 'Forcing outcomes on other players without giving them a fair opportunity to react, or performing physically impossible actions.',
    content: `Powergaming is the act of forcing outcomes on other players without giving them the ability to react or respond in a fair way. Give people a fair shot to respond or make choices, play it out and let the story happen.

Examples of Powergaming:
- Using /me commands that leave no room for reaction (e.g., '/me slits throat killing him instantly').
- Performing actions that are physically impossible in realistic human scenarios (e.g., carrying 4 heavy rifles while jumping over 10-foot fences).
- Driving a standard sedan off a 50-foot cliff at 120 MPH, landing on four wheels, and driving away as if nothing happened without roleplaying vehicle damage or severe physical trauma.
- Talking or giving detailed radio callouts while handcuffed and gagged.`,
    aliases: ['PG', 'powergaming', 'unrealistic', 'forced rp', 'forced outcomes', 'impossible actions'],
    featured: true,
    coreRuleNumber: 6,
    callouts: [
      {
        type: 'EXAMPLE',
        title: 'Proper /me Usage',
        text: 'Always use descriptive actions that invite a reaction: `/me attempts to tackle the suspect to the ground` rather than `/me tackles him and knocks him unconscious`.'
      }
    ]
  },
  {
    id: 'fail-rp',
    category: 'roleplay',
    title: 'Fail / Low Quality Roleplay',
    shortTitle: 'Fail RP',
    summary: 'Unrealistic actions or low-effort roleplay that ruins immersion or the gameplay experience for others.',
    content: `Fail Roleplay, also known as Low Quality roleplay, refers to actions that are unrealistic or roleplay that ruins the experience for yourself and others. If you ruin the RP of others and are not taking the server seriously, there will be consequences.

Examples of Fail RP:
- Baiting police officers or gang members into chases for no in-character reason ('cop baiting').
- Intentionally running around punching random strangers or jumping onto moving vehicles.
- Treating serious medical emergencies or felony murder investigations as casual jokes.
- Not roleplaying injuries after major traffic collisions, bullet wounds, or severe falls.`,
    aliases: ['fail rp', 'low quality rp', 'cop baiting', 'trolling', 'unrealistic behavior', 'griefing'],
  },
  {
    id: 'animal-peds',
    category: 'roleplay',
    title: 'Animal Peds',
    shortTitle: 'Animal Peds',
    summary: 'Portraying animals requires management approval. You must act like a real animal with zero human speech, tools, or ERP.',
    content: `Members are allowed to portray as animal peds strictly with the prior permission of Vital management. This limits the amount on the server but also ensures that those portraying them maintain a high standard of roleplay.

Animal Ped Rules:
1. Act like a real animal: no human speech, no typing in OOC to communicate IC, and no complex human reasoning.
2. No trolling, griefing, blocking doorways, harassing players, or disrupting active scenes.
3. No ERP (Erotic Roleplay) with or as animals under any circumstances.
4. No unrealistic actions: driving vehicles, picking up weapons, opening complex doors, or displaying superhuman abilities.
5. Aggression must be realistic and justified; no random biting or unprovoked attacks on citizens.
6. No interfering in police scenes unless part of natural authorized RP progression (such as an official K9 unit).
7. No exploiting animal ped hitboxes or jumping animations.
8. If captured or handled by animal control/EMS, cooperate realistically (leashes, veterinary examinations, etc.).
9. Admins reserve the right to revoke animal ped privileges immediately for misuse.`,
    aliases: ['animal', 'dog', 'k9', 'animal ped', 'cat', 'beast'],
    callouts: [
      {
        type: 'REQUIRES_APPROVAL',
        title: 'Management Whitelist Required',
        text: 'Animal ped skins are whitelisted. Spawning as an animal without explicit staff permission will result in an immediate kick and warning.'
      }
    ]
  },
  {
    id: 'character-creation-killing',
    category: 'roleplay',
    title: 'Character Creation & Character Killing (CK)',
    shortTitle: 'Character & CK',
    summary: 'Characters must have realistic names and backstory. Character Killing (permanent death) requires player consent or staff approval.',
    content: `Character Creation and Development:
Players must ensure that the creation of their character and their name is realistic. Troll names, celebrity names, or offensive puns are prohibited. Any player wishing to be part of a government faction (LSPD, EMS, DOJ) must possess a realistic, professional legal name.

Character Killing (CK):
Character killing is when your character dies permanently and is wiped from the city.
1. A player must voluntarily agree to the CK of their own character, OR
2. A formal CK application with extensive narrative evidence must be submitted to and approved by Vital Management/Staff beforehand.
3. Certain high-stakes criminal contracts or faction blood-in agreements may contain binding CK clauses if agreed upon in writing prior to the event.`,
    aliases: ['CK', 'character kill', 'perma death', 'character creation', 'name rules', 'perma'],
  },

  // =========================================================================
  // 3. COMBAT & PLAYER INTERACTIONS
  // =========================================================================
  {
    id: 'combat-logging',
    category: 'combat-interactions',
    title: 'Combat Logging',
    shortTitle: 'Combat Logging',
    summary: 'Disconnecting or respawning from an active scene or combat to escape consequences carries a minimum 24-hour suspension.',
    content: `Players are not to disconnect or respawn from any roleplay or combat scenarios that have in-character consequences. This is completely forbidden as it denies the other player an RP opportunity in-game.

If your game crashes during an active scene or combat scenario:
1. You must immediately notify the other party or staff via the official Discord #crash-reports or active ticket.
2. You must reconnect as soon as possible and return to the exact scene to resume the roleplay.

Combat logging carries a minimum mandatory 24-hour suspension from the game server, with repeated offenses resulting in permanent bans.`,
    aliases: ['combat logging', 'f8 quit', 'disconnect', 'combat log', 'logging', 'quitting', 'crashing'],
    featured: true,
    coreRuleNumber: 9,
    callouts: [
      {
        type: 'COOLDOWN',
        title: 'Minimum 24-Hour Suspension',
        text: 'Disconnecting during a police chase, robbery, or shootout automatically incurs a minimum 24-hour ban.'
      }
    ]
  },
  {
    id: 'rdm-vdm',
    category: 'combat-interactions',
    title: 'Random Deathmatch (RDM) & Vehicle Deathmatch (VDM)',
    shortTitle: 'No RDM / VDM',
    summary: 'Killing without valid in-character reasoning and proper initiation is prohibited. Vehicles cannot be used as weapons.',
    content: `Random Death Matching (RDM) and Vehicle Death Matching (VDM) are strictly forbidden.

Random Deathmatching (RDM):
- RDM is when you harm or kill another player without a valid in-character reason or proper RP setup.
- Verbal initiation and clear roleplay demands must occur prior to opening fire, allowing the opposing party a fair chance to comply or react.
- Do not camp teleports or entries to 3rd dimension areas / interior loading spots.

Vehicle Deathmatching (VDM):
- VDM is when you use your vehicle to intentionally harm, ram, or kill someone.
- Vehicles are modes of transportation, not primary weapons.
- The ONLY reason a vehicle should ever be used as a weapon is when your character has no other avenue of escape and your life is in mortal danger (single strike to escape, not repeatedly running people over).`,
    aliases: ['RDM', 'VDM', 'random deathmatch', 'vehicle deathmatch', 'initiation', 'ramming', 'car weapon'],
    featured: true,
    coreRuleNumber: 7,
    callouts: [
      {
        type: 'WARNING',
        title: 'Proper Initiation Required',
        text: 'Shooting someone on sight without prior ongoing conflict, verbal dialogue, or clear hostile initiation is considered RDM.'
      }
    ]
  },
  {
    id: 'robberies-theft',
    category: 'combat-interactions',
    title: 'Player Theft & Robberies',
    shortTitle: 'Robberies & Theft',
    summary: 'Must have valid IC reasons. No pocket wiping, no forcing bank withdrawals, and no robbing protected public workers or facilities.',
    content: `All robberies must be conducted in a realistic way with a proper IC reason as to why you are robbing the player.

Theft Restrictions:
1. No Pocket Wiping: You are only permitted to grab a few valuable or situational items. You are not allowed to empty complete player inventories. Only take what makes sense for the scenario and nothing more.
2. Financial Assets: Players may not force other players to withdraw money from a bank, sell a house, sell a vehicle, or withdraw a vehicle from their garage.
3. Moving Vehicles: Verbal demands shouted at a car in full motion are not valid; the occupants have the right to flee without being accused of FearRP.
4. Protected Services: Robbing Medical (EMS) or Fire Department personnel is strictly prohibited in all aspects. Robbing Police (LSPD) personnel is prohibited unless specific high-tier heist scenarios permit.
5. Protected Facilities: PD and MD facilities are safe havens and strictly prohibited from robbery.
6. Work Zones: You’re not allowed to rob individuals in or outside of the following civilian job locations:
   - Quarry, Mine, Foundry, Truckers yard, Police stations, & Hospitals.
   - Exception: Unless they have a heavy weapon visible, display rival gang identifiers, or are actively committing a crime on site.`,
    aliases: ['robbery', 'player theft', 'pocket wipe', 'robbing', 'stealing', 'quarry', 'mine', 'foundry', 'trucker'],
    callouts: [
      {
        type: 'NOT_ALLOWED',
        title: 'Pocket Wiping Forbidden',
        text: 'Taking food, water, ID, cellphones, or cleaning out every minor item in an inventory is strictly forbidden.'
      }
    ]
  },
  {
    id: 'hostages',
    category: 'combat-interactions',
    title: 'Hostages & Kidnapping',
    shortTitle: 'Hostages',
    summary: 'Hostages must be random, non-affiliated players. Fake or planned hostages are strictly prohibited.',
    content: `Kidnapping or taking someone hostage is allowed as long as these are done in a realistic way, with high-quality roleplay leading to the event, aiming to make the scenario engaging and enjoyable for everyone.

Hostage Guidelines:
1. Hostages must be random and non-related to your character. They must not be OOC planned or personal friends.
2. Fake hostages (friends agreeing to be taken hostage for a cut of heist money) are strictly prohibited and will result in punishment for all participants.
3. You must keep the hostage constantly under FearRP. The hostage must also realistically act as under fear for their life.
4. Hostages cannot be held indefinitely; the scene must progress smoothly without keeping players hostage for hours without active roleplay.`,
    aliases: ['hostage', 'kidnap', 'kidnapping', 'fake hostage', 'negotiations'],
    callouts: [
      {
        type: 'NOT_ALLOWED',
        title: 'No Fake Hostages',
        text: 'Using friends, crew members, or alt accounts as staged hostages for bank robberies or heists is an immediate exploit infraction.'
      }
    ]
  },
  {
    id: 'green-zones',
    category: 'combat-interactions',
    title: 'Green Zones',
    shortTitle: 'Green Zones',
    summary: 'Designated safe zones (Police stations, Hospitals, City Hall) where criminal violence and hostilities are prohibited.',
    content: `Green zones refer to Police Departments (stations), Medical Departments (Hospitals), and Government Administration buildings (City Hall/Courthouse).

Rules within Green Zones:
1. No criminal activity, violence, shooting, stabbing, or kidnapping may originate or take place inside green zones or their immediate parking lots.
2. You cannot flee into a green zone during an active chase or shootout in order to abuse the safe zone protection. If a scene began outside, the roleplay naturally continues.
3. Loitering in green zones while carrying illegal firearms or contraband to avoid gang conflict is considered safe-zone abuse.`,
    aliases: ['green zone', 'safe zone', 'hospital safe', 'pd safe', 'police station', 'safezone'],
    callouts: [
      {
        type: 'IMPORTANT',
        title: 'Dynamic Continuation',
        text: 'Green zone protection does NOT apply if you flee into a hospital or police station while being actively pursued in a chase.'
      }
    ]
  },

  // =========================================================================
  // 4. CRIMINAL ROLEPLAY & HEISTS
  // =========================================================================
  {
    id: 'criminal-activity-limits',
    category: 'criminal-rp',
    title: 'General Criminal Activity & Storm Rules',
    shortTitle: 'Crime & Storm Rules',
    summary: 'No major crimes may be committed within 30 minutes of a scheduled server restart/storm.',
    content: `Criminal activity is a cornerstone of Vital RP's ecosystem, but must be conducted within established boundaries to ensure high-quality counter-play and balanced law enforcement response.

Restart & Tsunami Restrictions:
No major crimes (Basic or Advanced Criminal Activities) are to be committed 30 minutes prior to a scheduled server restart/storm (tsunami). This ensures adequate time for scenes, arrests, processing, and medical transport to conclude naturally without being cut off by a server reboot.`,
    aliases: ['restart', 'storm', 'tsunami', 'major crimes', '30 min restart', 'crime cooldown'],
    callouts: [
      {
        type: 'COOLDOWN',
        title: '30-Minute Pre-Restart Freeze',
        text: 'Do not start any store robberies, bank jobs, heists, or organized shootouts if the server restart is less than 30 minutes away.'
      }
    ]
  },
  {
    id: 'heist-tiers-limits',
    category: 'criminal-rp',
    title: 'Heist Tiers & Player Limits',
    shortTitle: 'Heist Caps & PD Limits',
    summary: 'Strict criminal participant caps and maximum police response limits apply to every tier of criminal activity.',
    content: `Every criminal activity on Vital RP has strict limits on the number of criminal participants allowed and the maximum number of police officers permitted to respond.

Basic Criminal Activity:
- Yacht Heist: 2 Max Crims | 4 Max PD Response
- Container Heist (H): 2 Max Crims | 4 Max PD Response
- Vehicle Boosting: 4 Max Crims | 6 Max PD Response
- Store Robbery: 2 Max Crims | 4 Max PD Response
- ATM Robbery: 2 Max Crims | 4 Max PD Response

Advanced Criminal Activity:
- Ammu-Nation Robbery (H): 4 Max Crims | 6 Max PD Response
- IAA Facility (H): 4 Max Crims | 6 Max PD Response
- Shipment Heist (H): 4 Max Crims | 6 Max PD Response
- Bobcat Security Heist (H): 4 Max Crims | 6 Max PD Response
- Humane Labs (H): 4 Max Crims | 6 Max PD Response
- Bank Trucks: 2 Max Crims | 4 Max PD Response
- Fleeca Bank Robbery (H): 4 Max Crims | 6 Max PD Response
- Vangelico Jewelry (H): 6 Max Crims | 8 Max PD Response
- Maze Bank Robbery (H): 4 Max Crims | 6 Max PD Response
- Train Robbery Heist (H): 6 Max Crims | 8 Max PD Response
- Cursed Carat: 4 Max Crims | 6 Max PD Response
- Pacific Standard Bank: 6 Max Crims | 15 Max PD Response

Note: '(H)' indicates that a hostage may be required or utilized during the heist.`,
    aliases: ['heists', 'caps', 'pd response', 'fleeca', 'vangelico', 'bobcat', 'humane labs', 'pac bank', 'boosting', 'atm', 'yacht'],
    callouts: [
      {
        type: 'IMPORTANT',
        title: 'Strict Cap Adherence',
        text: 'Bringing outside interference or extra lookouts exceeding the criminal cap is considered Third-Partying and will result in heist disqualification and disciplinary action.'
      }
    ]
  },
  {
    id: 'extraction-island',
    category: 'criminal-rp',
    title: 'The Extraction Island Rules',
    shortTitle: 'Extraction Island',
    summary: 'Kill-on-sight zone with mandatory gang uniforms, travel restrictions by boat/swimming only, and unique conflict rules.',
    content: `Extraction Island is a high-risk, high-reward territory operating under specialized rules designed for intense tactical roleplay.

Extraction Island Regulations:
1. Gang Uniforms: Faction members must wear recognizable gang uniforms or matching identifiable colors while on the island.
2. Kill on Sight (KOS): Kill on Sight is explicitly authorized within the perimeter of Extraction Island. Prior verbal initiation is not mandatory inside the designated island combat area.
3. Island Conflict: Conflict on the island stays on the island. Retaliatory attacks back in the mainland city of Los Santos based solely on island combat must have appropriate roleplay justification and follow standard city initiation.
4. Police Rules: Law enforcement operates under specific tactical rules of engagement on Extraction Island.
5. Travel Restrictions: You may travel to Extraction Island by boat or swimming only. Unauthorized aircraft, parachuting, or black-market air travel is prohibited unless authorized by dynamic server events.`,
    aliases: ['island', 'extraction island', 'cayo', 'kos', 'kill on sight', 'island rules', 'boat travel'],
    callouts: [
      {
        type: 'WARNING',
        title: 'Authorized Kill-on-Sight',
        text: 'Entering the designated Extraction Island zone carries inherent risk of immediate combat without verbal warning.'
      }
    ]
  },

  // =========================================================================
  // 5. GOVERNMENT & PUBLIC SERVICES
  // =========================================================================
  {
    id: 'government-corruption',
    category: 'government',
    title: 'Government Services & Anti-Corruption',
    shortTitle: 'Gov & Anti-Corruption',
    summary: 'Corruption is strictly forbidden for all government and whitelisted personnel (LSPD, EMS, DOJ). High standards of service apply.',
    content: `Law Enforcement (LSPD), Medical Services (EMS), and the Department of Justice (DOJ) hold vital public responsibilities that sustain the server's realism.

Anti-Corruption Policy:
Taking part in corruption is strictly NOT allowed on the server. This policy applies unconditionally to all government and whitelisted public service positions:
- Police officers may not sell weapons, evidence, body armor, or police cruisers to criminals.
- EMS personnel may not deliberately withhold treatment, supply bandages/medkits illegally to gangs, or assist in combat.
- Department of Justice judges and prosecutors may not accept bribes or falsify legal rulings.

Any government employee found engaging in corruption will be immediately dismissed from their department, blacklisted from public services, and subject to administrative sanctions.`,
    aliases: ['corruption', 'police corruption', 'ems', 'doj', 'lspd', 'selling police weapons', 'government rules'],
    callouts: [
      {
        type: 'NOT_ALLOWED',
        title: 'Zero Corruption Policy',
        text: 'There is zero tolerance for government corruption on Vital RP. Whitelisted equipment cannot be transferred to civilians or criminals under any circumstance.'
      }
    ]
  },

  // =========================================================================
  // 6. COMMUNITY CONDUCT
  // =========================================================================
  {
    id: 'zero-tolerance-conduct',
    category: 'community-conduct',
    title: 'Zero Tolerance: Toxicity, Slurs & Gross RP',
    shortTitle: 'Zero Tolerance Rules',
    summary: 'Racism, hate speech, slurs, discrimination, non-consensual sexual RP, and suicide RP are strictly prohibited with permanent ban penalties.',
    content: `Vital Roleplay enforces a strict zero-tolerance policy against toxic, abusive, and non-consensual behavior across all mediums.

Prohibited Conduct:
1. Racism, slurs, and any form of discrimination based on race, ethnicity, nationality, sexual orientation, gender identity, religion, or disability is strictly forbidden.
2. Scope: This prohibition applies to in-game voice chat (VoIP), in-game text (/me, /do, /ooc), character names, Discord messages, live streams, and community forums.
3. Gross Roleplay: Non-consensual sexual roleplay, sexual harassment, rape, or non-consensual mutilation is forbidden.
4. Suicide Roleplay: Roleplaying suicide, self-harm, or severe psychiatric self-mutilation is completely prohibited.

Violations of this section will result in an immediate and permanent removal from the Vital Roleplay community.`,
    aliases: ['racism', 'slurs', 'toxicity', 'gross rp', 'hate speech', 'suicide rp', 'harassment', 'zero tolerance'],
    featured: true,
    coreRuleNumber: 10,
    callouts: [
      {
        type: 'NOT_ALLOWED',
        title: 'Permanent Immediate Ban',
        text: 'Use of racial slurs, derogatory hate speech, or non-consensual sexual roleplay results in an irreversible permanent ban.'
      }
    ]
  },

  // =========================================================================
  // 7. FACTIONS & GANG OPERATIONS
  // =========================================================================
  {
    id: 'faction-creation-roster',
    category: 'factions',
    title: 'Faction Guidelines & Member Rosters',
    shortTitle: 'Faction Guidelines',
    summary: 'Illegal Factions are capped at 22 members; Racing Crews at 12 members. All factions must register their roster with IFM.',
    content: `This handbook outlines all essential guidelines for illegal factions operating within Vital Roleplay, managed by the Illegal Faction Management (IFM) team.

Faction Standards & Caps:
1. Starting a Faction: Factions must submit a formal application to IFM demonstrating original character concepts, backstory, hierarchy, and roleplay value.
2. Faction Roster Caps:
   - Illegal Factions (Gangs / Mafias / Cartels): Strict 22-Member Cap.
   - Racing Crews: Strict 12-Member Cap.
3. Roster Management: All faction members must be officially registered on the faction roster sheet with IFM. Members not on the roster cannot participate in gang wars or territory defense.
4. Faction Cooldowns: When a player voluntarily leaves or is discharged from an official faction, a mandatory cooldown applies before they may join another faction.
5. Faction Disbandment: If a faction goes inactive or is disbanded by IFM, assets and properties revert to server management.`,
    aliases: ['factions', 'gangs', 'roster', '22 cap', 'racing crew', 'ifm', 'gang cap', 'illegal factions', 'faction rules'],
    callouts: [
      {
        type: 'IMPORTANT',
        title: 'Official Roster Registration',
        text: 'Only members officially listed on your IFM roster document are permitted to engage in faction shootouts and territory actions.'
      }
    ]
  },
  {
    id: 'faction-attire-threads',
    category: 'factions',
    title: 'Faction Attire & IFM Communication',
    shortTitle: 'Faction Attire & Comms',
    summary: 'Factions must maintain recognizable gang colors/attire during operations. Official faction threads and IFM tickets are required.',
    content: `Faction Attire:
During criminal activities, conflict, and turf defense, faction members must wear their designated colors, uniform items, or recognizable gang clothing. "Blending in" as ordinary civilians while actively participating in organized gang shootouts is prohibited.

Faction Threads & IFM Communication:
1. All factions are expected to maintain an active, respectful roleplay thread on the community forums showcasing screenshots, stories, and character progression.
2. Official communication between faction leadership and staff must occur through designated IFM leadership tickets.
3. Multi-Faction Roleplay & Alliances: When fighting alongside allies in joint operations, your combined side is strictly limited to the maximum player cap (you cannot team up to create a 30-man army).`,
    aliases: ['gang colors', 'faction attire', 'attire', 'uniforms', 'faction thread', 'alliances', 'multi faction'],
  },

  // =========================================================================
  // 8. FACTION CONFLICT & WARS
  // =========================================================================
  {
    id: 'conflict-rules-expectations',
    category: 'faction-conflict',
    title: 'Faction Conflict & War Expectations',
    shortTitle: 'Conflict & Gang Wars',
    summary: 'Requires valid RP buildup. No toxic behavior (COD lobby talk) after gunfights. Faction wars must have IFM terms and approval.',
    content: `Faction Conflict Rules:
Conflict between factions must develop organically through story progression, trade disputes, territory friction, or character rivalries.

Rules of Engagement:
1. Valid Escalation: You cannot jump straight to shooting over a minor verbal disagreement. Conflict must escalate through warnings, fistfights, robberies, or negotiations before turning into deadly warfare.
2. Post-Fight Conduct: No toxic behavior after gunfights. Absolutely no 'Call of Duty lobby talk', screaming insults over downed bodies, or taunting players in hospital beds. Take your win or loss with maturity.
3. Faction Wars:
   - Official gang wars require prior submission to and approval by IFM.
   - War terms (duration, weapons permitted, participant caps, victory conditions) must be agreed upon by both faction leaders and signed off by IFM.
   - Third parties are not permitted to intervene in active war fights.`,
    aliases: ['gang war', 'conflict', 'war rules', 'toxic behavior', 'cod lobby talk', 'trash talk', 'ifm approval'],
    callouts: [
      {
        type: 'NOT_ALLOWED',
        title: 'No Post-Fight Toxicity',
        text: 'Teabagging, screaming slurs, or toxic trash talk over downed opponents will result in immediate conflict penalties and bans.'
      }
    ]
  },
  {
    id: 'bleed-in-bleed-out',
    category: 'faction-conflict',
    title: 'Bleed-In & Bleed-Out Rules',
    shortTitle: 'Bleed-In / Bleed-Out',
    summary: 'Joining or leaving a gang carries in-character weight. Bleed-outs incur memory loss of all sensitive faction secrets.',
    content: `Bleed-In / Bleed-Out Rules:
1. Bleed-In: A bleed-in is an in-character ritual or initiation where an applicant commits fully to a faction, acknowledging the dangers and code of silence.
2. Bleed-Out: A bleed-out occurs when a member leaves or is excommunicated from a faction.
   - When a player is bled out, their character suffers permanent memory loss regarding sensitive gang secrets, stash house locations, secret suppliers, and illegal trade networks.
   - The ex-member cannot turn around and leak all gang secrets to rival factions or the police (doing so constitutes severe Metagaming / Fail RP).
   - If a member agreed to a CK clause upon joining, the bleed-out may result in permanent character death if approved by IFM.`,
    aliases: ['bleed in', 'bleed out', 'leaving gang', 'gang initiation', 'gang secrets'],
    callouts: [
      {
        type: 'IMPORTANT',
        title: 'Secret Protection',
        text: 'A bled-out member completely forgets the locations of gang stashes, supply routes, and internal criminal operations.'
      }
    ]
  },
  {
    id: 'racing-recording-pov',
    category: 'faction-conflict',
    title: 'Street Racing & Mandatory Recording (POV)',
    shortTitle: 'Racing & POV Rules',
    summary: 'All faction members in conflicts must record clean audio/video POV and retain recordings for at least 48 hours.',
    content: `Street Racing Rules:
Illegal street racing crews must respect public safety boundaries, coordinate races in suitable routes, and account for police pursuits realistically. Ramming or pitting competitors at 160 MPH in non-contact races is considered VDM/Fail RP.

Mandatory Recording / POV Policy:
1. All faction members involved in active shootouts, faction wars, territory conflicts, or high-tier heists MUST record their point-of-view (POV) with clean in-game audio and video.
2. Recordings must be retained for a minimum of 48 hours following any combat situation.
3. If a ticket or dispute is filed and a player fails to provide required POV footage upon staff request, the situation may be ruled against them automatically and disciplinary action may follow.
4. Ticket Warring: Submitting false, malicious, or retaliatory tickets solely to weaponize staff against rival factions is strictly prohibited.`,
    aliases: ['racing', 'pov', 'recording', 'medal', 'shadowplay', 'ticket warring', 'evidence', '48 hours'],
    callouts: [
      {
        type: 'IMPORTANT',
        title: 'Mandatory 48-Hour Retention',
        text: 'Always save your gameplay recordings when entering combat. Failing to provide requested POV in a dispute carries administrative penalties.'
      }
    ]
  },

  // =========================================================================
  // 9. REPORTS & ENFORCEMENT
  // =========================================================================
  {
    id: 'reports-rule-baiting',
    category: 'reports-enforcement',
    title: 'Player Reports & Rule Baiting',
    shortTitle: 'Reports & Rule Baiting',
    summary: 'Use the in-game /report system or Discord tickets. Rule baiting or intentionally trying to get others banned is prohibited.',
    content: `You may eventually encounter a rulebreak in your RP. Please use the /report system in-game or submit a formal ticket on Discord with your video evidence.

Reporting Standards:
1. All players are expected to report any major rule break that they are aware of within 48 hours of occurrence.
2. Rule Baiting: Intentionally trying to bait, trick, or manipulate another player into breaking a rule so you can report them is strictly forbidden and carries the same penalty as the rule being baited.
3. Frivolous Reports: Reports submitted solely based on personal grievances, salt, or minor infractions that could be resolved amicably via conversation will be dismissed.
4. Independent Staff Review: Staff decisions are final. Reports involving staff members are investigated independently to ensure impartiality and fairness.`,
    aliases: ['reports', 'rule baiting', 'report system', 'reporting', 'staff tickets', 'ban appeal', 'tickets'],
    callouts: [
      {
        type: 'WARNING',
        title: 'No Rule Baiting',
        text: 'Trying to lure other players into RDM, VDM, or FearRP violations to file reports will result in punishment for rule baiting.'
      }
    ]
  },
];
