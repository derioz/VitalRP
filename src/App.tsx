import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import logo from "./assets/logo.png";
import featured from "./assets/featured.png";
import { siteConfig } from "./config";
import { classifyStaff, cn } from "./lib";
import nightlifeImg from "./assets/gallery/nightlife.png";
import streetImg from "./assets/gallery/street.png";
import criminalImg from "./assets/gallery/criminal.png";
import racingImg from "./assets/gallery/racing.png";
import damonMark from "./assets/damon-mark.png";

type ServerData = {
  status: "checking" | "online" | "unavailable";
  playersText: string;
  pingText: string;
};

function useScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const sc = h.scrollTop || document.body.scrollTop;
      const max = (h.scrollHeight - h.clientHeight) || 1;
      setP(Math.min(1, Math.max(0, sc / max)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return p;
}

function useRevealOnScroll() {
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        setVisibleIds((prev) => {
          const next = new Set(prev);
          entries.forEach((e) => {
            const id = (e.target as HTMLElement).dataset.revealId;
            if (e.isIntersecting && id) next.add(id);
          });
          return next;
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll("[data-reveal-id]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return visibleIds;
}

async function fetchFromServersFrontend(serverCodeOrAddress: string): Promise<{ players?: number; max?: number; ping?: number } | null> {
  try {
    const code = serverCodeOrAddress.trim().toLowerCase();
    const url = `https://servers-frontend.fivem.net/api/servers/single/${encodeURIComponent(code)}`;

    // In practice, the servers-live endpoint is huge and often slow or blocked by CORS.
    // Swisser-Web-01 uses the servers-frontend single endpoint directly.
    const ctrl = new AbortController();
    const timeout = window.setTimeout(() => ctrl.abort(), 6500);

    const res = await fetch(url, {
      cache: "no-store",
      signal: ctrl.signal,
      headers: {
        accept: "application/json",
      },
    });
    window.clearTimeout(timeout);
    if (!res.ok) return null;
    const json = await res.json();
    const d = json?.Data;
    if (!d) return null;
    return { players: Number(d.clients ?? 0), max: Number(d.sv_maxclients ?? 0), ping: Number(d.ping ?? 0) };
  } catch {
    return null;
  }
}

async function fetchFiveM(serverCodeOrAddress: string): Promise<{ players?: number; max?: number; ping?: number } | null> {
  return await fetchFromServersFrontend(serverCodeOrAddress);
}

export default function App() {

const [rpFocus, setRpFocus] = useState<string | null>(null);
const [soundOn, setSoundOn] = useState(() => {
  try {
    return localStorage.getItem("vital_sound") === "1";
  } catch {
    return false;
  }
});

const playTick = useCallback(() => {
  if (!soundOn) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 520;
    g.gain.value = 0.04;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.03);
    setTimeout(() => ctx.close(), 120);
  } catch {
    // ignore
  }
}, [soundOn]);

useEffect(() => {
  // Scroll accents (cards/dividers glow when visible)
  const els = Array.from(document.querySelectorAll<HTMLElement>(".scroll-accent"));
  if (!("IntersectionObserver" in window) || els.length === 0) {
    els.forEach((el) => el.setAttribute("data-visible", "true"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) (e.target as HTMLElement).setAttribute("data-visible", "true");
      });
    },
    { threshold: 0.15 }
  );
  els.forEach((el) => io.observe(el));
  return () => io.disconnect();
}, []);

const gallery = [
  { src: nightlifeImg, label: "Nightlife & social RP" },
  { src: streetImg, label: "Street RP & daily life" },
  { src: criminalImg, label: "Criminal & gang RP" },
  { src: racingImg, label: "Racing & car culture" },
];

const jumpTo = (hash: string) => {
  const el = document.querySelector(hash);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

  const prefersReducedMotion = useReducedMotion();
  const progress = useScrollProgress();
  const reveal = useRevealOnScroll();

  const rulesRef = useRef<HTMLElement | null>(null);
  const [showCta, setShowCta] = useState(false);

  const [server, setServer] = useState<ServerData>({
    status: "checking",
    playersText: "—",
    pingText: "—",
  });

  useEffect(() => {
    // CTA appears after leaving the Rules section
    const el = document.getElementById("rules");
    if (!el) return;
    rulesRef.current = el;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          // show when rules section is not in view
          setShowCta(!e.isIntersecting);
        });
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!siteConfig.serverAddress) {
        setServer({ status: "online", playersText: "—", pingText: "—" });
        return;
      }
      setServer((s) => ({ ...s, status: "checking" }));
      const d = await fetchFiveM(siteConfig.serverAddress);
      if (!d) {
        setServer({ status: "unavailable", playersText: "—", pingText: "—" });
        return;
      }
      const playersText = d.max ? `${d.players ?? 0} / ${d.max}` : `${d.players ?? 0}`;
      const pingText = (Number.isFinite(d.ping) ? `${Math.max(0, d.ping ?? 0)}ms` : "—");
      setServer({ status: "online", playersText, pingText });
    };
    run();
    const t = window.setInterval(run, 30000);
    return () => window.clearInterval(t);
  }, []);

  const staffTabs = useMemo(() => {
    return [
      { key: "all", label: "All" },
      { key: "owners", label: "Owners" },
      { key: "admins", label: "Admins" },
      { key: "subgroups", label: "Subgroup Leaders" },
      { key: "developers", label: "Developers" },
    ] as const;
  }, []);

  const [staffFilter, setStaffFilter] = useState<(typeof staffTabs)[number]["key"]>("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const normalizedStaff = useMemo(() => {
    const map = new Map<string, { name: string; discord?: string; roles: Array<{ badge: string; title: string }> }>();
    for (const s of siteConfig.staff) {
      const key = (s.discord || s.name).toLowerCase();
      const existing = map.get(key);
      const role = { badge: s.badge, title: s.title };
      if (!existing) {
        map.set(key, { name: s.name, discord: s.discord, roles: [role] });
      } else {
        // keep the first seen name/discord, append roles if unique
        if (!existing.discord && s.discord) existing.discord = s.discord;
        if (!existing.roles.some((r) => r.badge === role.badge && r.title === role.title)) existing.roles.push(role);
      }
    }
    return Array.from(map.values());
  }, []);

  const staffFiltered = useMemo(() => {
    const hasRole = (p: any, test: (badge: string) => boolean) => p.roles.some((r: any) => test(r.badge));
    if (staffFilter === "owners") return normalizedStaff.filter((p) => hasRole(p, (b) => /owner/i.test(b)));
    if (staffFilter === "admins") return normalizedStaff.filter((p) => hasRole(p, (b) => /administrator/i.test(b)));
    if (staffFilter === "subgroups") return normalizedStaff.filter((p) => hasRole(p, (b) => /head of subgroups/i.test(b)));
    if (staffFilter === "developers") return normalizedStaff.filter((p) => hasRole(p, (b) => /developer/i.test(b)));
    return normalizedStaff;
  }, [staffFilter, normalizedStaff]);

  
  const staffRank = (badge: string) => {
    const b = (badge || "").toLowerCase();
    if (b.includes("server owner")) return 100;
    if (b.includes("community manager")) return 90;
    if (b.includes("head administrator")) return 80;
    if (b.includes("administrator")) return 70;
    if (b.includes("head of subgroups")) return 60;
    if (b.includes("developer")) return 50;
    return 10;
  };

  const pickPrimaryRole = (roles: Array<{ badge: string; title: string }>) => {
    return [...roles].sort((a, b) => staffRank(b.badge) - staffRank(a.badge))[0] || roles[0];
  };

  const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));

  const normalizeAreaBits = (raw: string) => {
    let t = (raw || "").trim();
    if (!t) return [] as string[];

    // remove obvious role words so subtitle doesn't repeat badges
    t = t.replace(/\bowner\b/ig, "").replace(/\badministrator\b/ig, "").replace(/\bcommunity manager\b/ig, "");
    t = t.replace(/\bhead\s+administrator\b/ig, "").replace(/\bhead\s+of\b/ig, "");
    t = t.replace(/\bstaff\b/ig, "");

    t = t.replace(/\s*&\s*/g, ", ").replace(/\s+and\s+/ig, ", ");
    t = t.replace(/\s{2,}/g, " ").trim();
    if (!t) return [] as string[];

    // split on commas
    const parts = t.split(",").map((p) => p.trim()).filter(Boolean);
    return parts;
  };

  const personAreasText = (p: { roles: Array<{ badge: string; title: string }> }) => {
    const primary = pickPrimaryRole(p.roles);
    const areaParts = uniq(p.roles.flatMap((r) => normalizeAreaBits(r.title)));

    // If nothing meaningful, use a gentle fallback based on primary badge
    if (areaParts.length === 0) {
      const b = (primary?.badge || "").toLowerCase();
      if (b.includes("server owner")) return "Server Ownership";
      if (b.includes("community manager")) return "Community";
      if (b.includes("head administrator")) return "Staff Leadership";
      if (b.includes("administrator")) return "Administration";
      if (b.includes("head of subgroups")) return "Subgroup Leadership";
      if (b.includes("developer")) return "Development";
      return "";
    }

    return areaParts.join(", ");
  };

  const secondaryBadges = (p: { roles: Array<{ badge: string; title: string }> }) => {
    const primary = pickPrimaryRole(p.roles)?.badge;
    return uniq(p.roles.map((r) => r.badge).filter((b) => b && b !== primary));
  };


  
  const accentFor = (badge: string) => {
    const b = (badge || "").toLowerCase();
    if (b.includes("server owner")) return "rgba(255,122,0,0.95)";
    if (b.includes("community manager")) return "rgba(255,200,0,0.9)";
    if (b.includes("head administrator")) return "rgba(255,90,0,0.9)";
    if (b.includes("administrator")) return "rgba(120,170,255,0.9)";
    if (b.includes("head of subgroups")) return "rgba(180,120,255,0.9)";
    if (b.includes("developer")) return "rgba(120,255,180,0.9)";
    return "rgba(255,255,255,0.5)";
  };


  const fadeUp = (id: string, delay = 0) => ({
    initial: prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
    animate: reveal.has(id) ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 0.7, ease: "easeOut", delay },
  });


// Staggered reveal helpers (Option 2)
const staggerContainer = (id: string, delayChildren = 0.05, staggerChildren = 0.08) => ({
  initial: prefersReducedMotion ? { opacity: 1 } : { opacity: 0 },
  animate: reveal.has(id) ? { opacity: 1, transition: { delayChildren, staggerChildren } } : undefined,
});

const staggerItem = (id: string, delay = 0) => ({
  initial: prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
  animate: reveal.has(id) ? { opacity: 1, y: 0, transition: { delay, duration: 0.55, ease: [0.2, 0.9, 0.2, 1] } } : undefined,
});

  return (
    <div className="min-h-screen vital-ambient">
      {/* Scroll progress */}
      <div
        className="fixed left-0 top-0 z-50 h-[3px]"
        style={{
          width: `${(progress * 100).toFixed(2)}%`,
          background: "linear-gradient(90deg, #ffb300, #ff7a00, #ff4d00)",
        }}
      />

      {/* Nav */}
      <div className="sticky top-0 z-40 border-b border-vital-line bg-vital-bg/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <a href="#top" className="flex items-center gap-3 font-extrabold tracking-wide">
            <img src={logo} alt="Vital RP logo" className="h-9 w-9" />
            <span>VITAL RP</span>
          </a>
          <div className="hidden items-center gap-4 md:flex hidden sm:flex">
            <a className="text-sm font-semibold text-white/80 hover:text-white" href="#features"><span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M3 13h8V3H3v10zm10 8h8V11h-8v10zM3 21h8v-6H3v6zm10-8h8V3h-8v10z"/></svg>
      Features
    </span></a>
            <a className="text-sm font-semibold text-white/80 hover:text-white" href="#jobs"><span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M4 7h16v10H4V7zm2-3h12v2H6V4zm0 14h12v2H6v-2z"/></svg>
      Jobs
    </span></a>
            <a className="text-sm font-semibold text-white/80 hover:text-white" href="#rules"><span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm8 1.5V8h4.5"/></svg>
      Rules
    </span></a>
            <a className="text-sm font-semibold text-white/80 hover:text-white" href="#staff"><span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.4 0-8 2.2-8 5v3h16v-3c0-2.8-3.6-5-8-5z"/></svg>
      Staff
    </span></a>
            
            <button
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-white/85 hover:bg-white/10 sm:hidden"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"/>
              </svg>
            </button>
<a className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-extrabold text-white hover:bg-white/10"
               href={siteConfig.storeUrl} target="_blank" rel="noreferrer">Tebex</a>
            <a className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-extrabold text-white hover:bg-[#41c4c3]/20 hover:border-[#41c4c3]/40 hover:text-white"
               href={siteConfig.discordInvite} target="_blank" rel="noreferrer">Discord</a>

<button
  onClick={() => {
    const next = !soundOn;
    setSoundOn(next);
    try { localStorage.setItem("vital_sound", next ? "1" : "0"); } catch {}
    // Play a tick only when turning on
    if (!soundOn) setTimeout(() => { try { (document.activeElement as any)?.blur?.(); } catch {} playTick(); }, 0);
  }}
  className="rounded-xl border border-[#5865F2]/40 bg-[#5865F2]/20 px-4 py-2 text-sm font-extrabold text-white hover:bg-[#5865F2]/30 hover:border-[#5865F2]/60"
  aria-label="Toggle UI sound"
>
  {soundOn ? "Sound: On" : "Sound: Off"}
</button>
            <a className="rounded-xl border border-white/10 bg-gradient-to-r from-vital-amber to-vital-orange px-4 py-2 text-sm font-extrabold text-black hover:brightness-105"
               href={siteConfig.connectUrl} target="_blank" rel="noreferrer">Connect</a>
          </div>
        </div>
      </div>

      {/* Hero */}
<header id="top" className="mx-auto max-w-6xl px-5 pb-6 pt-14">
  <div className="grid items-start gap-6 lg:grid-cols-12">
    <motion.div data-reveal-id="heroLeft" {...fadeUp("heroLeft")} className="lg:col-span-7">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-extrabold text-white/80">
        <span className="h-2 w-2 rounded-full bg-gradient-to-r from-vital-amber to-vital-orange" />
        Welcome to Vital
      </div>
      <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl">{siteConfig.tagline}</h1>
      <p className="mt-3 max-w-xl text-base leading-relaxed text-vital-muted">
        Vital RP is built for immersive scenes, fair conflict, and the kind of RP you remember later. Win or lose,
        the goal is always the story.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a className="rounded-xl border border-white/10 bg-gradient-to-r from-vital-amber to-vital-orange px-5 py-3 text-sm font-extrabold text-black hover:brightness-105"
           href={siteConfig.connectUrl} target="_blank" rel="noreferrer">Join the City</a>
        <a className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/10"
           href={siteConfig.discordInvite} target="_blank" rel="noreferrer">Join Discord</a>
        <a className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/10"
           href="#rules">Quick Rules</a>
      </div>

<motion.div
  initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 } }
  whileInView={ { opacity: 1, y: 0 } }
  viewport={ { once: true, amount: 0.25 } }
  transition={ { duration: 0.6, ease: [0.2, 0.9, 0.2, 1] } }
  className="mt-8 overflow-hidden rounded-xl2 border border-white/10 bg-black/25 shadow-glow"
>
  <div className="relative w-full" style={ { paddingTop: "56.25%" } }>
    <iframe
      className="absolute inset-0 h-full w-full"
      src="https://www.youtube.com/embed/M60NXyAGulo?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=M60NXyAGulo"
      title="Vital RP Trailer"
      frameBorder="0"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
    />
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
  </div>
</motion.div>

  <div className="mt-4">
    <SocialsCard />
  </div>

    </motion.div>

    <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Featured + Live Status (merged) */}
<motion.div data-reveal-id="heroRightMerged" {...fadeUp("heroRightMerged", 0.1)} className="overflow-hidden rounded-xl2 border border-white/10 bg-black/25 shadow-glow">
  {/* Featured image */}
  <div className="relative w-full overflow-hidden h-[420px] sm:h-[520px] lg:h-[560px]" style={{ aspectRatio: "9 / 16" }}>
    <motion.img
      src={featured}
      alt="Vital RP featured"
      className="absolute inset-0 h-full w-full object-cover"
      style={{ objectPosition: "center 35%" }}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
      transition={{ duration: 0.9, ease: [0.2, 0.9, 0.2, 1] }}
    />
    {/* Gradient edge between text and image (desktop) */}
    <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-black/70 to-transparent lg:block" />
    {/* General image overlay for readability */}
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
    <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
      <div>
        <div className="text-sm font-black">{siteConfig.featuredCaptionTitle}</div>
        <div className="mt-1 text-sm font-semibold text-white/75">{siteConfig.featuredCaptionSub}</div>
      </div>
      <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-extrabold text-white/85">
        City Spotlight
      </div>
    </div>
  </div>

  {/* Divider */}
  <div className="h-px w-full bg-white/10" />

  {/* Live Status */}
  <div className="p-5 bg-white/[0.03]">
    <div className="inline-flex items-center gap-2 rounded-full border border-vital-line bg-white/5 px-3 py-2 text-xs font-extrabold text-white/80">
      Live Status
    </div>

    <div className="mt-4 grid grid-cols-2 gap-3">
      <div className="rounded-xl border border-white/10 bg-black/25 p-4">
        <div className="text-xs font-extrabold text-vital-muted">Status</div>
        <div className="mt-2 text-xl font-black">
          {server.status === "checking" ? "Checking..." : server.status === "online" ? "Online" : "Unavailable"}
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/25 p-4">
        <div className="text-xs font-extrabold text-vital-muted">Players</div>
        <div className="mt-2 text-xl font-black">{server.playersText}</div>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/25 p-4">
        <div className="text-xs font-extrabold text-vital-muted">Whitelist</div>
        <div className="mt-2 text-xl font-black">
          <span className={prefersReducedMotion ? "text-emerald-400 font-extrabold" : "text-emerald-400 font-extrabold animate-pulse"}>
            Open
          </span>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/25 p-4">
        <div className="text-xs font-extrabold text-vital-muted">Discord</div>
        <div className="mt-2 text-xl font-black">Open</div>
      </div>
    </div>

    <p className="mt-4 text-sm leading-relaxed text-vital-muted">
      
    </p>
  </div>
</motion.div>
</div>
  </div>
</header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen ? (
          <motion.div
            className="fixed inset-0 z-[60] sm:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/70"
            />
            <motion.div
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 24, opacity: 0 }}
              transition={{ type: "spring", stiffness: 520, damping: 38 }}
              className="absolute right-3 top-3 w-[92vw] max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <div className="text-sm font-black text-white/90">Jump to</div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/85 hover:bg-white/10"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3 1.4 1.4z"/>
                  </svg>
                </button>
              </div>

              <div className="p-4 space-y-2">
                {[
                  { href: "#top", label: "Top" },
                  { href: "#features", label: "Features" },
                  { href: "#jobs", label: "Jobs" },
                  { href: "#rules", label: "Rules" },
                  { href: "#staff", label: "Staff" },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-extrabold text-white/85 hover:bg-white/10"
                  >
                    {item.label}
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/60" fill="currentColor" aria-hidden="true">
                      <path d="M9 6l6 6-6 6-1.4-1.4L12.2 12 7.6 7.4 9 6z"/>
                    </svg>
                  </a>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

{/* Features */}

<section id="why" className="mx-auto max-w-6xl px-5 py-12">
  <div className="grid gap-8 md:grid-cols-12 md:items-start">
    <motion.div data-reveal-id="whyLeft" {...fadeUp("whyLeft")} className="md:col-span-5">
      <h2 className="text-2xl font-black">Why Vital RP?</h2>
      <p className="mt-3 text-vital-muted leading-relaxed">
        We aim for a welcoming, inclusive environment where common sense wins, and good RP is rewarded.
        The best scenes come from collaboration, consequences, and characters who feel real.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <a
          className="rounded-xl border border-white/10 bg-gradient-to-r from-vital-amber to-vital-orange px-5 py-3 text-sm font-extrabold text-black hover:brightness-105"
          href={siteConfig.connectUrl}
          target="_blank"
          rel="noreferrer"
        >
          Connect now
        </a>
        <a
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/10"
          href={siteConfig.discordInvite}
          target="_blank"
          rel="noreferrer"
        >
          Join Discord
        </a>
      </div>
    </motion.div>

    <div className="md:col-span-7">
      <TimelineItem
        revealId="whyT0"
        title="Fair conflict"
        desc="Escalation and stakes are part of RP, but we keep it grounded and readable."
      />
      <TimelineItem
        revealId="whyT1"
        title="Community first"
        desc="No cliques required. New people can actually break in and build stories."
      />
      <TimelineItem
        revealId="whyT2"
        title="The story is the win"
        desc="Chases, arrests, and L’s are all fuel for better scenes."
      />
      <TimelineItem
        revealId="whyT3"
        title="Common sense always"
        desc="If you're unsure, choose the option that keeps the scene fun, fair, and believable."
      />
    </div>
  </div>
</section>

{/* Jobs */}
<section id="jobs" className="mx-auto max-w-6xl px-5 py-12">
  <div className="grid gap-8 md:grid-cols-12 md:items-start">
    <motion.div data-reveal-id="jobsIntro" {...fadeUp("jobsIntro")} className="md:col-span-4">
      <h2 className="text-2xl font-black">Server jobs</h2>
      <p className="mt-3 text-vital-muted leading-relaxed">
        Vital has structured departments and plenty of player-driven lanes. Pick a path, meet people,
        then build a story that sticks.
      </p>

      <div className="mt-5 rounded-xl2 border border-white/10 bg-white/5 p-4 shadow-glow">
        <div className="text-sm font-black">Quick tip</div>
        <div className="mt-2 text-sm text-vital-muted leading-relaxed">
          Want PD, EMS, Fire, or a business? Ask in Discord and we’ll point you to the right onboarding.
        </div>
        <a
          className="mt-4 inline-flex rounded-xl border border-white/10 bg-gradient-to-r from-vital-amber to-vital-orange px-4 py-2 text-sm font-extrabold text-black hover:brightness-105"
          href={siteConfig.discordInvite}
          target="_blank"
          rel="noreferrer"
        >
          Ask in Discord
        </a>
      </div>
    </motion.div>

    {/* Featured big card */}
    <motion.div
      data-reveal-id="jobsFeature"
      {...fadeUp("jobsFeature", 0.05)}
      className="relative overflow-hidden rounded-xl2 border border-white/10 bg-white/5 p-6 shadow-glow md:col-span-8"
    >
      <div
        className="pointer-events-none absolute -inset-24 opacity-80"
        style={{
          background:
            "radial-gradient(420px 300px at 20% 20%, rgba(255,122,0,0.20), transparent 60%), radial-gradient(420px 300px at 85% 40%, rgba(255,77,0,0.14), transparent 60%)",
        }}
      />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xl">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-vital-orange/30 bg-vital-orange/15 px-3 py-2 text-xs font-extrabold text-white/90">
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-vital-amber to-vital-orange" />
            Popular lane
          </div>
          <div className="mt-4 text-xl font-black">Player-Owned Businesses</div>
          <div className="mt-2 text-sm leading-relaxed text-vital-muted">
            Own a spot, hire people, run events, and create daily RP. If you want consistent scenes, this is the move.
          </div>

          <div className="mt-4 grid gap-2">
            {siteConfig.jobs.find((j) => j.key === "player_owned")?.highlights.map((h) => (
              <div key={h} className="text-sm font-semibold text-white/80">
                • {h}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl2 border border-white/10 bg-black/25 p-4 md:min-w-[260px]">
          <div>
            <div className="text-sm font-black">Start here</div>
            <div className="mt-1 text-sm text-vital-muted">Join Discord, ask for onboarding.</div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 p-3">
            <JobIcon k="player_owned" className="h-7 w-7 text-white/90" />
          </div>
        </div>
      </div>
    </motion.div>
  </div>

  {/* Icon cards */}
  <div className="mt-7 grid gap-4 md:grid-cols-3">
    {siteConfig.jobs
      .filter((j) => j.key !== "player_owned")
      .map((j, idx) => (
        <JobCard key={j.key} job={j} revealId={`jobCard${idx}`} />
      ))}
  </div>
</section>

<div className="mx-auto max-w-6xl px-5">
  <div className="vital-divider" />
</div>

      {/* Rules */}
      
{/* Values */}
<section className="mx-auto max-w-6xl px-5 py-12">
  <div className="mb-6 text-center text-sm font-semibold uppercase tracking-wide text-white/40">
    What we value
  </div>
  <div className="grid gap-4 md:grid-cols-3">
    <ValueCard title="Story over winning" desc="The best RP comes from letting scenes breathe, even when you take the L." />
    <ValueCard title="Consequences matter" desc="Actions carry weight. That’s what makes stories memorable." />
    <ValueCard title="Common sense first" desc="If it feels right for the scene, it’s probably the right call." />
  </div>
</section>

<NarrativeLine text="Every city needs rules. Every rule needs context." />
<section id="rules" className="mx-auto max-w-6xl px-5 py-12">
        <motion.h2 data-reveal-id="rulesH" {...fadeUp("rulesH")} className="text-2xl font-black">Rules (quick, friendly version)</motion.h2>
        <motion.p data-reveal-id="rulesP" {...fadeUp("rulesP", 0.05)} className="mt-2 max-w-3xl text-vital-muted">
          This is the short version to help you start strong. If you’re unsure, choose the option that keeps the scene fun,
          fair, and believable.
        </motion.p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {siteConfig.rules.map((r, idx) => (
            <RuleCard key={r.title} revealId={`rule${idx}`} title={r.title} summary={r.summary} example={r.example} />
          ))}
        </div>

        <motion.div data-reveal-id="rulesBtns" {...fadeUp("rulesBtns", 0.05)} className="mt-6 flex flex-wrap gap-3">
          <a className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/10"
             href={siteConfig.rulesFullUrl} target="_blank" rel="noreferrer">View full rules</a>
          <a className="rounded-xl border border-white/10 bg-gradient-to-r from-vital-amber to-vital-orange px-5 py-3 text-sm font-extrabold text-black hover:brightness-105"
             href={siteConfig.discordInvite} target="_blank" rel="noreferrer">Ask in Discord</a>
        </motion.div>
      </section>


{/* CTA band */}
<section className="mx-auto max-w-6xl px-5 py-10">
  <motion.div data-reveal-id="ctaBand" {...fadeUp("ctaBand")} className="relative overflow-hidden rounded-xl2 border border-white/10 bg-gradient-to-r from-white/5 to-white/0 p-6 shadow-glow">
    <div className="pointer-events-none absolute -inset-24 opacity-80"
         style={{background:"radial-gradient(360px 240px at 20% 30%, rgba(255,122,0,0.20), transparent 60%), radial-gradient(320px 240px at 80% 40%, rgba(255,77,0,0.16), transparent 60%)"}} />
    <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="text-xl font-black">Ready to jump in?</div>
        <div className="mt-1 text-sm font-semibold text-white/75">
          Join Discord first, meet people, then connect when you’re ready.
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <a className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/10"
           href={siteConfig.discordInvite} target="_blank" rel="noreferrer">Join Discord</a>
        <a className="rounded-xl border border-white/10 bg-gradient-to-r from-vital-amber to-vital-orange px-5 py-3 text-sm font-extrabold text-black hover:brightness-105"
           href={siteConfig.connectUrl} target="_blank" rel="noreferrer">Connect</a>
      </div>
    </div>
  </motion.div>
</section>
      {/* Staff near bottom */}
      
{/* City Snapshot */}
<section className="mx-auto max-w-6xl px-5 py-12">
  <div className="mb-5 text-lg font-black">Life in the city</div>
  <div className="grid gap-4 md:grid-cols-4">
  {gallery.map((g) => (
    <div
      key={g.label}
      className="group relative aspect-[4/5] overflow-hidden rounded-xl2 border border-white/10 bg-black/40 shadow-glow scroll-accent"
    >
      <img
        src={g.src}
        alt={g.label}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        loading="lazy"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute bottom-3 left-3 rounded-full border border-white/10 bg-black/50 px-3 py-2 text-xs font-extrabold text-white/90 backdrop-blur">
        {g.label}
      </div>
    </div>
  ))}
</div>
</section>

<NarrativeLine text="Every scene adds to the city’s story." />

<section id="staff" className="mx-auto max-w-6xl px-5 py-12">
  <div className="staff-spotlight relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-6 md:p-8">
    <div className="pointer-events-none staff-spotlight__bg absolute inset-0" />

    <div className="relative">
      <motion.h2 data-reveal-id="staffH" {...fadeUp("staffH")} className="text-2xl font-black md:text-4xl">
        <span className="inline-flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
          </svg>
          Staff
        </span>
      </motion.h2>

      <motion.p data-reveal-id="staffP" {...fadeUp("staffP", 0.05)} className="mt-2 max-w-3xl text-vital-muted">
        The people behind the scenes who keep Vital moving forward.
      </motion.p>

      {/* Overview chips */}
      <motion.div data-reveal-id="staffOverview" {...fadeUp("staffOverview", 0.08)} className="mt-5 flex flex-wrap gap-2">
        {(() => {
          const total = normalizedStaff.length;
          const owners = normalizedStaff.filter((s) => s.roles.some((r) => /owner/i.test(r.badge))).length;
          const admins = normalizedStaff.filter((s) => s.roles.some((r) => /administrator/i.test(r.badge) || /head administrator/i.test(r.badge))).length;
          const leads = normalizedStaff.filter((s) => s.roles.some((r) => /head of subgroups/i.test(r.badge))).length;
          const devs = normalizedStaff.filter((s) => s.roles.some((r) => /developer/i.test(r.badge))).length;

          const items = [
            { label: "Total", value: total },
            { label: "Owners", value: owners },
            { label: "Admins", value: admins },
            { label: "Subgroup Leads", value: leads },
            { label: "Developers", value: devs },
          ];

          return items.map((it) => (
            <div key={it.label} className="staff-chip">
              <span className="staff-chip__label">{it.label}</span>
              <span className="staff-chip__value">{it.value}</span>
            </div>
          ));
        })()}
      </motion.div>

      {/* Tabs */}
      <motion.div data-reveal-id="staffTabs" {...fadeUp("staffTabs", 0.1)} className="mt-6 flex flex-wrap gap-2">
        {staffTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setStaffFilter(t.key)}
            className={cn("staff-tab", staffFilter === t.key && "is-active")}
          >
            <span className="relative inline-flex items-center gap-2">
              <span>{t.label}</span>
              {staffFilter === t.key ? (
                <motion.span
                  layoutId="staffTabActive"
                  className="staff-tab__underline"
                  transition={{ type: "spring", stiffness: 520, damping: 38 }}
                />
              ) : null}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Groups */}
      <div className="mt-8 space-y-10">
        {/* Owners */}
        {staffFiltered.some((s) => s.roles.some((r) => /owner/i.test(r.badge))) ? (
          <div>
            <div className="staff-group-title">Ownership</div>
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {staffFiltered
                .filter((s) => s.roles.some((r) => /owner/i.test(r.badge)))
                .map((s, idx) => {
                  const primary = pickPrimaryRole(s.roles);
                  const accent = accentFor(primary?.badge);
                  const extras = secondaryBadges(s);

                  return (
                    <motion.div
                      key={`${s.name}-${idx}`}
                      className="staff-card staff-card--featured min-w-[280px] snap-start"
                      style={{ ["--accent" as any]: accent }}
                      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.25 }}
                      transition={{ duration: 0.55, ease: [0.2, 0.9, 0.2, 1], delay: Math.min(idx, 10) * 0.06 }}
                    >
                      <div className="staff-card__top">
                        <div className="staff-avatar">{s.name.slice(0, 1).toUpperCase()}</div>
                        <div className="min-w-0">
                          <div className="staff-name">{s.name}</div>
                          <div className="staff-sub">{personAreasText(s)}</div>
                          {s.discord ? <div className="staff-handle">{s.discord}</div> : null}
                        </div>
                        <div className="staff-primary">{primary?.badge}</div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {extras.map((b) => (
                          <span key={b} className="staff-pill">
                            {b}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </div>
        ) : null}

        {/* Community Manager */}
        {staffFiltered.some((s) => s.roles.some((r) => /community manager/i.test(r.badge))) ? (
          <div>
            <div className="staff-group-title">Community</div>
            {staffFiltered
              .filter((s) => s.roles.some((r) => /community manager/i.test(r.badge)))
              .slice(0, 1)
              .map((s) => {
                const primary = pickPrimaryRole(s.roles);
                const accent = accentFor(primary?.badge);
                const extras = secondaryBadges(s);

                return (
                  <motion.div
                    key={s.name}
                    className="staff-card staff-card--spotlight"
                    style={{ ["--accent" as any]: accent }}
                    initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.55, ease: [0.2, 0.9, 0.2, 1] }}
                  >
                    <div className="staff-card__top">
                      <div className="staff-avatar">{s.name.slice(0, 1).toUpperCase()}</div>
                      <div className="min-w-0">
                        <div className="staff-name">{s.name}</div>
                        <div className="staff-sub">{personAreasText(s)}</div>
                        {s.discord ? <div className="staff-handle">{s.discord}</div> : null}
                      </div>
                      <div className="staff-primary">{primary?.badge}</div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {extras.map((b) => (
                        <span key={b} className="staff-pill">
                          {b}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
          </div>
        ) : null}

        {/* Administration */}
        {staffFiltered.some((s) => s.roles.some((r) => /administrator/i.test(r.badge) || /head administrator/i.test(r.badge))) ? (
          <div>
            <div className="staff-group-title">Administration</div>
            <div className="grid gap-4 md:grid-cols-2">
              {staffFiltered
                .filter((s) => s.roles.some((r) => /administrator/i.test(r.badge) || /head administrator/i.test(r.badge)))
                .map((s, idx) => {
                  const primary = pickPrimaryRole(s.roles);
                  const accent = accentFor(primary?.badge);
                  const extras = secondaryBadges(s);

                  return (
                    <motion.div
                      key={`${s.name}-${idx}`}
                      className="staff-card"
                      style={{ ["--accent" as any]: accent }}
                      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.5, ease: [0.2, 0.9, 0.2, 1], delay: Math.min(idx, 12) * 0.03 }}
                    >
                      <div className="staff-card__top">
                        <div className="staff-avatar">{s.name.slice(0, 1).toUpperCase()}</div>
                        <div className="min-w-0">
                          <div className="staff-name">{s.name}</div>
                          <div className="staff-sub">{personAreasText(s)}</div>
                          {s.discord ? <div className="staff-handle">{s.discord}</div> : null}
                        </div>
                        <div className="staff-primary">{primary?.badge}</div>
                      </div>

                      {extras.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {extras.map((b) => (
                            <span key={b} className="staff-pill">
                              {b}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </motion.div>
                  );
                })}
            </div>
          </div>
        ) : null}

        {/* Subgroup Leads */}
        {staffFiltered.some((s) => s.roles.some((r) => /head of subgroups/i.test(r.badge))) ? (
          <div>
            <div className="staff-group-title">Subgroup Leads</div>
            <div className="grid gap-4 md:grid-cols-2">
              {staffFiltered
                .filter((s) => s.roles.some((r) => /head of subgroups/i.test(r.badge)))
                .map((s, idx) => {
                  const primary = pickPrimaryRole(s.roles);
                  const accent = accentFor(primary?.badge);
                  const extras = secondaryBadges(s);

                  return (
                    <motion.div
                      key={`${s.name}-${idx}`}
                      className="staff-card"
                      style={{ ["--accent" as any]: accent }}
                      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.5, ease: [0.2, 0.9, 0.2, 1], delay: Math.min(idx, 12) * 0.03 }}
                    >
                      <div className="staff-card__top">
                        <div className="staff-avatar">{s.name.slice(0, 1).toUpperCase()}</div>
                        <div className="min-w-0">
                          <div className="staff-name">{s.name}</div>
                          <div className="staff-sub">{personAreasText(s)}</div>
                          {s.discord ? <div className="staff-handle">{s.discord}</div> : null}
                        </div>
                        <div className="staff-primary">{primary?.badge}</div>
                      </div>

                      {extras.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {extras.map((b) => (
                            <span key={b} className="staff-pill">
                              {b}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </motion.div>
                  );
                })}
            </div>
          </div>
        ) : null}

        {/* Developers */}
        {staffFiltered.some((s) => s.roles.some((r) => /developer/i.test(r.badge))) ? (
          <div>
            <div className="staff-group-title">Development</div>
            <div className="grid gap-4 md:grid-cols-2">
              {staffFiltered
                .filter((s) => s.roles.some((r) => /developer/i.test(r.badge)))
                .map((s, idx) => {
                  const primary = pickPrimaryRole(s.roles);
                  const accent = accentFor(primary?.badge);
                  const extras = secondaryBadges(s);

                  return (
                    <motion.div
                      key={`${s.name}-${idx}`}
                      className="staff-card"
                      style={{ ["--accent" as any]: accent }}
                      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.5, ease: [0.2, 0.9, 0.2, 1], delay: Math.min(idx, 12) * 0.03 }}
                    >
                      <div className="staff-card__top">
                        <div className="staff-avatar">{s.name.slice(0, 1).toUpperCase()}</div>
                        <div className="min-w-0">
                          <div className="staff-name">{s.name}</div>
                          <div className="staff-sub">{personAreasText(s)}</div>
                          {s.discord ? <div className="staff-handle">{s.discord}</div> : null}
                        </div>
                        <div className="staff-primary">{primary?.badge}</div>
                      </div>

                      {extras.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {extras.map((b) => (
                            <span key={b} className="staff-pill">
                              {b}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </motion.div>
                  );
                })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  </div>
</section>


      {/* Footer */}
      
<footer className="relative mt-20 overflow-hidden border-t border-white/10 bg-black/60">
  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
  <div className="relative mx-auto max-w-6xl px-5 py-14 text-center">
    <div className="text-2xl font-black">Vital RP</div>
    <div className="mt-3 text-sm text-white/60">
      Built by its players. Shaped by its stories.
    </div>
    <div className="mt-6 text-xs uppercase tracking-widest text-white/40">
      Serious roleplay, done right.
    </div>
    <div className="mt-8 flex items-center justify-center gap-2 text-xs text-white/50">
      <img src={damonMark} alt="Damon mark" className="h-6 w-6 rounded-full opacity-80" />
      <span>Created by Damon</span>
    </div>
  </div>
</footer>


      {/* Floating CTA */}
      <motion.div
        initial={false}
        animate={showCta ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="fixed bottom-5 right-5 z-50"
      >
        <a
          className="rounded-xl border border-white/10 bg-gradient-to-r from-vital-amber to-vital-orange px-5 py-3 text-sm font-extrabold text-black shadow-glow hover:brightness-105"
          href={siteConfig.discordInvite}
          target="_blank"
          rel="noreferrer"
        >
          Join Discord
        </a>
      </motion.div>
    </div>
  );
}


function BentoCard({
  eyebrow,
  title,
  desc,
  bullets,
  className,
  revealId,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  bullets: string[];
  className?: string;
  revealId: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  
  const idx = Number(String(revealId).replace(/\D+/g, "")) || 0;
  const delay = Math.min(idx, 12) * 0.06;
  return (
    <motion.div
      data-reveal-id={revealId}
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, ease: [0.2, 0.9, 0.2, 1], delay }}
      className={cn(
        "relative overflow-hidden rounded-xl2 border border-white/10 bg-white/5 p-6 shadow-glow",
        "transition-transform hover:-translate-y-0.5",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-24 opacity-70"
        style={{
          background:
            "radial-gradient(380px 260px at 20% 20%, rgba(255,179,0,0.14), transparent 60%), radial-gradient(380px 260px at 80% 40%, rgba(255,77,0,0.12), transparent 60%)",
        }}
      />
      <div className="relative">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-extrabold text-white/80">
          <span className="h-2 w-2 rounded-full bg-gradient-to-r from-vital-amber to-vital-orange" />
          {eyebrow}
        </div>
        <div className="mt-4 text-lg font-black">{title}</div>
        <div className="mt-2 text-sm leading-relaxed text-vital-muted">{desc}</div>
        <div className="mt-4 grid gap-2">
          {bullets.map((b) => (
            <div key={b} className="text-sm font-semibold text-white/80">
              • {b}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function TimelineItem({ title, desc, revealId }: { title: string; desc: string; revealId: string }) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      data-reveal-id={revealId}
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative ml-4 border-l border-white/10 pl-6 py-5"
    >
      <div className="absolute left-[-9px] top-7 h-4 w-4 rounded-full bg-gradient-to-r from-vital-amber to-vital-orange shadow-glow" />
      <div className="text-base font-black">{title}</div>
      <div className="mt-2 text-sm leading-relaxed text-vital-muted">{desc}</div>
    </motion.div>
  );
}

function JobDeckCard({
  title,
  summary,
  highlights,
  revealId,
}: {
  title: string;
  summary: string;
  highlights: string[];
  revealId: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      data-reveal-id={revealId}
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="min-w-[280px] max-w-[320px] snap-start rounded-xl2 border border-white/10 bg-white/5 p-5 shadow-glow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-base font-black">{title}</div>
        <div className="rounded-full border border-vital-orange/30 bg-vital-orange/15 px-3 py-2 text-[11px] font-extrabold text-white/90">
          Path
        </div>
      </div>
      <div className="mt-2 text-sm leading-relaxed text-vital-muted">{summary}</div>
      <div className="mt-4 grid gap-2">
        {highlights.map((h) => (
          <div key={h} className="text-sm font-semibold text-white/80">
            • {h}
          </div>
        ))}
      </div>
    </motion.div>
  );
}


function JobCard({ job, revealId }: { job: { key: string; title: string; summary: string; highlights: string[]; badge?: string }; revealId: string }) {
  const prefersReducedMotion = useReducedMotion();
  
  const idx = Number(String(revealId).replace(/\D+/g, "")) || 0;
  const delay = Math.min(idx, 12) * 0.06;
  return (
    <motion.div
      data-reveal-id={revealId}
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, ease: [0.2, 0.9, 0.2, 1], delay }}
      className="group relative overflow-hidden rounded-xl2 border border-white/10 bg-white/5 p-5 shadow-glow"
    >
      <div
        className="pointer-events-none absolute -inset-24 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(280px 220px at 20% 20%, rgba(255,179,0,0.12), transparent 60%), radial-gradient(280px 220px at 85% 40%, rgba(255,77,0,0.10), transparent 60%)",
        }}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          {job.badge ? (
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-extrabold text-white/80">
              {job.badge}
            </div>
          ) : null}
          <div className="mt-3 text-base font-black">{job.title}</div>
          <div className="mt-2 text-sm leading-relaxed text-vital-muted">{job.summary}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/25 p-3 transition-transform duration-200 group-hover:-translate-y-0.5">
          <JobIcon k={job.key as any} className="h-6 w-6 text-white/90" />
        </div>
      </div>

      <div className="relative mt-4 grid gap-2">
        {job.highlights.slice(0, 3).map((h) => (
          <div key={h} className="text-sm font-semibold text-white/80">
            • {h}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function JobIcon({ k, className }: { k: "pd" | "ems" | "fire" | "criminal" | "civilian" | "player_owned"; className?: string }) {
  // Simple inline icons (no extra deps)
  switch (k) {
    case "pd":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3 5 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1 3-5z" />
          <path d="M12 7v10" />
          <path d="M7.5 12H16.5" />
        </svg>
      );
    case "ems":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 8h-3l-2-3H9L7 8H4" />
          <path d="M4 8v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
          <path d="M12 10v8" />
          <path d="M8 14h8" />
        </svg>
      );
    case "fire":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22c4 0 7-3 7-7 0-3-2-5-4-7 0 3-2 4-3 5 0-3-1-5-4-7-1 4-4 6-4 10 0 4 3 6 8 6z" />
          <path d="M10 17c0 2 1 3 2 3s2-1 2-3-1-3-2-4c-1 1-2 2-2 4z" />
        </svg>
      );
    case "criminal":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 13l3 3 4-6 3 4 2-3 4 5" />
          <path d="M3 20h18" />
          <path d="M7 7c0 1.5 1 3 2.5 3S12 8.5 12 7s-1-3-2.5-3S7 5.5 7 7z" />
          <path d="M14 7c0 1.5 1 3 2.5 3S19 8.5 19 7s-1-3-2.5-3S14 5.5 14 7z" />
        </svg>
      );
    case "civilian":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20h16" />
          <path d="M6 20V9l6-4 6 4v11" />
          <path d="M10 20v-6h4v6" />
        </svg>
      );
    case "player_owned":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 9h16l-1 11H5L4 9z" />
          <path d="M7 9V7a5 5 0 0 1 10 0v2" />
          <path d="M9 13h6" />
        </svg>
      );
  }
}

function SpotlightCard({ title, desc, revealId }: { title: string; desc: string; revealId: string }) {
  const prefersReducedMotion = useReducedMotion();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  return (
    <motion.div
      data-reveal-id={revealId}
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      onPointerMove={(e) => {
        const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        setPos({ x, y });
      }}
      onPointerLeave={() => setPos(null)}
      className="relative overflow-hidden rounded-xl2 border border-white/10 bg-white/5 p-5 shadow-glow transition-transform hover:-translate-y-0.5"
      style={
        pos
          ? ({
              ["--mx" as any]: `${pos.x}%`,
              ["--my" as any]: `${pos.y}%`,
            } as any)
          : undefined
      }
    >
      {/* spotlight */}
      <div
        className={cn(
          "pointer-events-none absolute -inset-24 opacity-0 transition-opacity",
          pos ? "opacity-100" : "opacity-0"
        )}
        style={{
          background:
            "radial-gradient(180px 180px at var(--mx, 50%) var(--my, 50%), rgba(255,122,0,0.18), transparent 60%)",
        }}
      />
      <div className="relative">
        <div className="text-base font-black">{title}</div>
        <div className="mt-2 text-sm leading-relaxed text-vital-muted">{desc}</div>
      </div>
    </motion.div>
  );
}

function RuleCard({ title, summary, example, revealId }: { title: string; summary: string; example: string; revealId: string }) {
  const [open, setOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      data-reveal-id={revealId}
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="rounded-xl2 border border-white/10 bg-white/5 p-5 shadow-glow"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 text-left"
        aria-expanded={open}
      >
        <div>
          <div className="text-base font-black">{title}</div>
          <div className="mt-2 text-sm leading-relaxed text-vital-muted">{summary}</div>
        </div>
        <div className={cn("mt-1 text-white/80 transition-transform", open ? "rotate-180" : "")}>▾</div>
      </button>

      <motion.div
        initial={false}
        animate={open ? { height: "auto", opacity: 1, marginTop: 12 } : { height: 0, opacity: 0, marginTop: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="overflow-hidden"
      >
        <div className="text-sm font-semibold text-white/80">
          <span className="font-black">Example:</span> {example}
        </div>
      </motion.div>
    </motion.div>
  );
}

function NarrativeLine({ text }: { text: string }) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-6 text-center text-sm font-semibold text-white/40 scroll-accent">
      {text}
    </div>
  );
}



function BackgroundFX({ reduced }: { reduced: boolean }) {
  useEffect(() => {
    if (reduced) return;

    const root = document.documentElement;
    let raf = 0;
    let tx = 0;
    let ty = 0;

    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2; // -1..1
      const y = (e.clientY / window.innerHeight - 0.5) * 2; // -1..1
      tx = x;
      ty = y;
      if (!raf) {
        raf = window.requestAnimationFrame(() => {
          root.style.setProperty("--px", String(tx));
          root.style.setProperty("--py", String(ty));
          raf = 0;
        });
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove as any);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <div aria-hidden="true" className={cn("bgfx", reduced && "bgfx-reduced")}>
      {/* Base animated gradient */}
      <div className="bgfx-base" />

      {/* Parallax layers */}
      <div className="bgfx-layer bgfx-layer-1" />
      <div className="bgfx-layer bgfx-layer-2" />

      {/* Glow blobs */}
      <div className="bgfx-blob bgfx-blob-a" />
      <div className="bgfx-blob bgfx-blob-b" />
      <div className="bgfx-blob bgfx-blob-c" />

      {/* Subtle texture */}
      <div className="bgfx-noise" />
      <div className="bgfx-vignette" />
    </div>
  );
}


function RolePills({ roles }: { roles: Array<{ badge: string; title: string }> }) {
  const uniq = Array.from(new Map(roles.map((r) => [r.badge, r])).values());
  const iconFor = (badge: string) => {
    const b = (badge || "").toLowerCase();
    if (b.includes("server owner")) return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
        <path d="M12 2l4 7 8 1-6 5 2 8-8-4-8 4 2-8-6-5 8-1 4-7z"/>
      </svg>
    );
    if (b.includes("community manager")) return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
        <path d="M4 4h16v11H7l-3 3V4zm4 5h8v2H8V9zm0-3h8v2H8V6z"/>
      </svg>
    );
    if (b.includes("head administrator")) return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
        <path d="M5 8l2-3 5 4 5-4 2 3-7 6-7-6zm0 8h14v2H5v-2z"/>
      </svg>
    );
    if (b.includes("administrator")) return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
        <path d="M12 2l8 4v6c0 5-3.5 9.7-8 10-4.5-.3-8-5-8-10V6l8-4z"/>
      </svg>
    );
    if (b.includes("head of subgroups")) return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
        <path d="M12 2l3 5.5 6 .9-4.3 4.2 1 6-5.7-3-5.7 3 1-6L3 8.4l6-.9L12 2z"/>
      </svg>
    );
    if (b.includes("developer")) return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
        <path d="M8 17l-5-5 5-5 1.4 1.4L5.8 12l3.6 3.6L8 17zm8 0l-1.4-1.4L18.2 12l-3.6-3.6L16 7l5 5-5 5zM10 19l3-14h2l-3 14h-2z"/>
      </svg>
    );
    return null;
  };

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {uniq.map((r) => (
        <span
          key={r.badge}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-extrabold text-white/80"
          title={r.title}
        >
          {iconFor(r.badge)}
          {r.badge}
        </span>
      ))}
    </div>
  );
}


function StaffPersonCard({
  person,
  primaryTitle,
}: {
  person: { name: string; discord?: string; roles: Array<{ badge: string; title: string }> };
  primaryTitle?: string;
}) {
  const title =
    primaryTitle ||
    person.roles
      .map((r) => r.title)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(" · ");

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10">
      <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
        <div className="absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-vital-orange/10 blur-3xl" />
      </div>

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate text-lg font-black">{person.name}</div>
          <div className="mt-1 leading-snug text-sm font-semibold text-white/70">{title}</div>
          {person.discord ? <div className="mt-3 text-sm font-extrabold text-white/80">{person.discord}</div> : null}
          <RolePills roles={person.roles} />
        </div>

        <div className="hidden shrink-0 sm:block">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-extrabold text-white/80">
            {person.roles[0]?.badge}
          </div>
        </div>
      </div>
    </div>
  );
}


function SocialsCard() {
  const socials = (siteConfig as any).socials as Array<{ key: string; label: string; url: string }> | undefined;
  if (!socials || socials.length === 0) return null;

  const Icon = ({ k }: { k: string }) => {
    const key = (k || "").toLowerCase();
    if (key === "x" || key === "twitter") {
      // Simple X mark
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M18.9 2H22l-6.8 7.8L23 22h-6.8l-5.3-6.9L4.9 22H2l7.4-8.5L1 2h6.9l4.8 6.3L18.9 2zm-1.2 18h1.9L7.2 3.9H5.2L17.7 20z"/>
        </svg>
      );
    }
    if (key === "instagram") {
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm-5 4.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2zm0 2A1.8 1.8 0 1 0 13.8 12 1.8 1.8 0 0 0 12 10.2zM17.6 6.6a1 1 0 1 1-1-1 1 1 0 0 1 1 1z"/>
        </svg>
      );
    }
    if (key === "tiktok") {
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M16.5 3c.6 2.2 2.2 3.9 4.5 4.5v3.1c-1.8-.1-3.4-.7-4.8-1.7v7.1c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6c.4 0 .9.1 1.3.2v3.4c-.4-.2-.8-.3-1.3-.3-1.5 0-2.8 1.2-2.8 2.8S8.5 19 10 19s2.8-1.2 2.8-2.8V3h3.7z"/>
        </svg>
      );
    }
    if (key === "youtube") {
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.6 12 4.6 12 4.6s-5.7 0-7.5.5A3 3 0 0 0 2.4 7.2 31.8 31.8 0 0 0 2 12a31.8 31.8 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1A31.8 31.8 0 0 0 22 12a31.8 31.8 0 0 0-.4-4.8zM10 15.5v-7l6 3.5-6 3.5z"/>
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.5h-2V11h2v5.5zM12 9.5a1.25 1.25 0 1 1 1.25-1.25A1.25 1.25 0 0 1 12 9.5z"/>
      </svg>
    );
  };

  return (
    <div className="scroll-accent rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-base font-black text-white/90">Follow us</div>
          <div className="mt-1 text-sm font-semibold text-white/60">Clips, updates, and community chaos.</div>
        </div>
        <div className="hidden sm:block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-extrabold text-white/70">
          Socials
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {socials.map((s) => (
          <a
            key={s.key}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-extrabold text-white/80 transition hover:bg-white/10"
          >
            <span className="text-white/85 group-hover:text-white">
              <Icon k={s.key} />
            </span>
            <span className="truncate">{s.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}


function ValueCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="scroll-accent rounded-xl2 border border-white/10 bg-white/5 p-5">
      <div className="text-base font-black">{title}</div>
      <div className="mt-2 text-sm leading-relaxed text-vital-muted">{desc}</div>
    </div>
  );
}