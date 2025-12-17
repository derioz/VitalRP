import React, { useEffect, useMemo, useRef, useState } from "react";

type Photo = {
  id: string;
  url: string;
  title?: string;
  description?: string;
  categories?: string[];
};

type Props = {
  photos: Photo[];
};

export default function GalleryCarousel({ photos }: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const items = useMemo(() => photos ?? [], [photos]);

  const updateButtons = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft < maxScroll - 2);
  };

  useEffect(() => {
    updateButtons();
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => updateButtons();
    const onResize = () => updateButtons();

    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    const t = window.setTimeout(updateButtons, 250);

    return () => {
      el.removeEventListener("scroll", onScroll as any);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(t);
    };
  }, [items.length]);

  const scrollByCards = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(280, Math.floor(el.clientWidth * 0.8));
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 p-6 text-sm text-zinc-600 dark:text-zinc-400">
        No photos yet.
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scrollByCards(-1)}
        disabled={!canLeft}
        aria-label="Scroll left"
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full border backdrop-blur bg-white/80 dark:bg-zinc-900/80 border-zinc-200/70 dark:border-zinc-800 p-2 shadow-sm transition"
      >
        ‹
      </button>

      <button
        type="button"
        onClick={() => scrollByCards(1)}
        disabled={!canRight}
        aria-label="Scroll right"
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full border backdrop-blur bg-white/80 dark:bg-zinc-900/80 border-zinc-200/70 dark:border-zinc-800 p-2 shadow-sm transition"
      >
        ›
      </button>

      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory px-2 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((p) => (
          <div
            key={p.id}
            className="snap-start shrink-0 w-[78%] sm:w-[48%] lg:w-[32%] xl:w-[28%]"
          >
            <article className="overflow-hidden rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={p.url}
                  alt={p.title ?? "Photo"}
                  loading="lazy"
                  className="peer h-full w-full object-cover transition-transform duration-500 peer-hover:scale-[1.05]"
                  onLoad={updateButtons}
                />

                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 peer-hover:opacity-100 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

                <div className="absolute right-3 top-3 translate-y-[-4px] opacity-0 transition-all duration-300 peer-hover:opacity-100 peer-hover:translate-y-0">
                  <div className="rounded-full border border-white/20 bg-black/35 backdrop-blur px-3 py-1 text-xs text-white">
                    View
                  </div>
                </div>

                {(p.title || p.description) && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
                    <div className="translate-y-3 opacity-0 transition-all duration-300 peer-hover:opacity-100 peer-hover:translate-y-0">
                      {p.title && (
                        <div className="text-sm font-semibold text-white drop-shadow">
                          {p.title}
                        </div>
                      )}
                      {p.description && (
                        <div className="mt-1 text-sm text-white/85 line-clamp-2 drop-shadow">
                          {p.description}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </article>
          </div>
        ))}
      </div>
    </div>
  );
}
