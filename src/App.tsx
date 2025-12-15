import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import logo from "./assets/logo.png";
import featured from "./assets/featured.png";
import { siteConfig } from "./config";
import { classifyStaff, cn } from "./lib";

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
      { key: "owner", label: "Ownership" },
      { key: "lead", label: "Leadership" },
      { key: "admin", label: "Administration" },
    ] as const;
  }, []);

  const [staffFilter, setStaffFilter] = useState<(typeof staffTabs)[number]["key"]>("all");
  const staffFiltered = useMemo(() => {
    return siteConfig.staff.filter((s) => (staffFilter === "all" ? true : classifyStaff(s.badge) === staffFilter));
  }, [staffFilter]);

  const fadeUp = (id: string, delay = 0) => ({
    initial: prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
    animate: reveal.has(id) ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 0.7, ease: "easeOut", delay },
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
          <div className="hidden items-center gap-4 md:flex">
            <a className="text-sm font-semibold text-white/80 hover:text-white" href="#features">Features</a>
            <a className="text-sm font-semibold text-white/80 hover:text-white" href="#jobs">Jobs</a>
            <a className="text-sm font-semibold text-white/80 hover:text-white" href="#rules">Rules</a>
            <a className="text-sm font-semibold text-white/80 hover:text-white" href="#staff">Staff</a>
            <a className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-extrabold text-white hover:bg-white/10"
               href={siteConfig.storeUrl} target="_blank" rel="noreferrer">Store</a>
            <a className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-extrabold text-white hover:bg-white/10"
               href={siteConfig.discordInvite} target="_blank" rel="noreferrer">Discord</a>
            <a className="rounded-xl border border-white/10 bg-gradient-to-r from-vital-amber to-vital-orange px-4 py-2 text-sm font-extrabold text-black hover:brightness-105"
               href={siteConfig.connectUrl} target="_blank" rel="noreferrer">Connect</a>
          </div>
        </div>
      </div>

      {/* Hero */}
      <header id="top" className="mx-auto max-w-6xl px-5 pb-8 pt-14">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <motion.div data-reveal-id="heroLeft" {...fadeUp("heroLeft")}>
            <div className="inline-flex items-center gap-2 rounded-full border border-vital-line bg-white/5 px-3 py-2 text-xs font-extrabold text-white/80">
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
          </motion.div>

          <motion.div data-reveal-id="heroRight" {...fadeUp("heroRight", 0.05)} className="rounded-xl2 border border-vital-line bg-white/5 p-5 shadow-glow">
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
                <div className="text-xs font-extrabold text-vital-muted">Ping</div>
                <div className="mt-2 text-xl font-black">{server.pingText}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                <div className="text-xs font-extrabold text-vital-muted">Discord</div>
                <div className="mt-2 text-xl font-black">Open</div>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-vital-muted">
              If the live widget shows “Unavailable”, your server may be private or blocking the public endpoint. That’s normal.
            </p>
          </motion.div>
        </div>

        {/* Featured image */}
        <motion.div data-reveal-id="featured" {...fadeUp("featured")} className="mt-8 overflow-hidden rounded-xl2 border border-white/10 bg-black/25 shadow-glow">
          <div className="relative">
            <motion.img
              src={featured}
              alt="Vital RP featured"
              className="h-[360px] w-full object-cover md:h-[420px]"
              style={{ objectPosition: "center 35%" }}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.04 }}
              transition={{ duration: 0.9, ease: [0.2, 0.9, 0.2, 1] }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
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
        </motion.div>
      </header>


{/* Features */}
<section id="features" className="mx-auto max-w-6xl px-5 py-12">
  <motion.div data-reveal-id="featuresHead" {...fadeUp("featuresHead")} className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
    <div>
      <h2 className="text-2xl font-black">Server features</h2>
      <p className="mt-2 max-w-2xl text-vital-muted">
        Modern systems, balanced progression, and RP-first design choices.
      </p>
    </div>
    <a
      href={siteConfig.discordInvite}
      target="_blank"
      rel="noreferrer"
      className="mt-3 inline-flex w-fit rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-extrabold text-white hover:bg-white/10 md:mt-0"
    >
      See updates in Discord
    </a>
  </motion.div>

  {/* Bento layout */}
  <div className="mt-7 grid gap-4 md:grid-cols-12">
    <BentoCard
      revealId="bento0"
      className="md:col-span-7 md:row-span-2"
      eyebrow="Conflict"
      title="Serious RP, not sweaty RP"
      desc="Conflict is allowed, but it has to make sense and it has to lead somewhere. The story comes first."
      bullets={["Escalation and consequences", "Readable scenes", "No win-at-all-costs energy"]}
    />
    <BentoCard
      revealId="bento1"
      className="md:col-span-5"
      eyebrow="Progression"
      title="Jobs and growth"
      desc="Build a path, grow connections, and create your own lane in the city."
      bullets={["Structured roles", "Player-driven economy", "Organic story hooks"]}
    />
    <BentoCard
      revealId="bento2"
      className="md:col-span-5"
      eyebrow="Support"
      title="Staff that actually answers"
      desc="Clear expectations, fair decisions, and less chaos in tickets."
      bullets={["Consistent outcomes", "Common sense focus", "Faster resolution"]}
    />
  </div>
</section>

<div className="mx-auto max-w-6xl px-5">
  <div className="vital-divider" />
</div>

{/* Why */}
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
      {/* Rules */}
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
      <section id="staff" className="mx-auto max-w-6xl px-5 py-12">
        <motion.h2 data-reveal-id="staffH" {...fadeUp("staffH")} className="text-2xl font-black">Staff</motion.h2>
        <motion.p data-reveal-id="staffP" {...fadeUp("staffP", 0.05)} className="mt-2 max-w-3xl text-vital-muted">
          The crew keeping the city running smoothly (and occasionally yelling at tickets).
        </motion.p>

        <motion.div data-reveal-id="staffTabs" {...fadeUp("staffTabs", 0.05)} className="mt-4 flex flex-wrap gap-2">
          {staffTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setStaffFilter(t.key)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-extrabold",
                staffFilter === t.key
                  ? "border-vital-orange/40 bg-vital-orange/15 text-white"
                  : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
              )}
            >
              {t.label}
            </button>
          ))}
        </motion.div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {staffFiltered.map((s, idx) => (
            <motion.div
              key={s.name}
              data-reveal-id={`staff${idx}`}
              {...fadeUp(`staff${idx}`, 0.02)}
              className="rounded-xl2 border border-white/10 bg-white/5 p-5 shadow-glow"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-base font-black">{s.name}</div>
                <div className="rounded-full border border-vital-orange/30 bg-vital-orange/15 px-3 py-2 text-xs font-extrabold text-white/90">
                  {s.badge}
                </div>
              </div>
              <div className="mt-3 text-sm font-semibold text-vital-muted">{s.title}</div>
              {s.discord ? <div className="mt-3 text-sm font-extrabold text-white/85">{s.discord}</div> : null}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-vital-line py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 text-sm text-vital-muted">
          <div>© {new Date().getFullYear()} {siteConfig.serverName}</div>
          <div className="flex flex-wrap gap-3">
            <a className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-extrabold text-white hover:bg-white/10"
               href={siteConfig.discordInvite} target="_blank" rel="noreferrer">Discord</a>
            <a className="rounded-xl border border-white/10 bg-gradient-to-r from-vital-amber to-vital-orange px-4 py-2 font-extrabold text-black hover:brightness-105"
               href={siteConfig.connectUrl} target="_blank" rel="noreferrer">Connect</a>
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
  return (
    <motion.div
      data-reveal-id={revealId}
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
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
