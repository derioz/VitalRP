'use client';

import React, { useState } from 'react';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { supplyChain } from '@/lib/gta6/content';

/** Interactive example: one meal, five players. */
export function SupplyChain() {
  const [active, setActive] = useState(0);
  const step = supplyChain[active];

  return (
    <div>
      {/* Five columns need about 1280px before the longest role names fit */}
      <ol className="grid gap-px overflow-hidden rounded-[6px] border border-white/10 bg-white/10 xl:grid-cols-5">
        {supplyChain.map((s, i) => {
          const selected = i === active;
          return (
            <li key={s.role} className="relative bg-[#0a0a0a]">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={selected}
                className={`flex h-full w-full items-baseline gap-4 py-4 pl-5 pr-12 text-left transition-colors xl:min-h-[140px] xl:flex-col xl:items-start xl:gap-6 xl:p-5 ${
                  selected ? 'bg-[#1a1613]' : 'hover:bg-[#141211]'
                }`}
              >
                <span
                  className={`g6-mono text-sm ${selected ? 'text-[#f97316]' : 'text-[#a39b90]'}`}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="g6-display g6-sm text-xl text-white xl:text-2xl">{s.role}</span>
              </button>
              {i < supplyChain.length - 1 && (
                <>
                  <ArrowRight
                    size={16}
                    strokeWidth={1.5}
                    aria-hidden
                    className="absolute right-3 top-5 z-10 hidden text-[#a39b90] xl:block"
                  />
                  <ArrowDown
                    size={16}
                    strokeWidth={1.5}
                    aria-hidden
                    className="absolute right-5 top-5 z-10 text-[#a39b90] xl:hidden"
                  />
                </>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-px grid gap-8 border border-t-0 border-white/10 p-6 sm:grid-cols-2 sm:p-8" aria-live="polite">
        <div>
          <p className="g6-mono text-sm text-[#a39b90]">What the {step.role.toLowerCase()} does</p>
          <p className="mt-3 text-lg leading-relaxed text-[#f4efe8]">{step.does}</p>
        </div>
        <div>
          <p className="g6-mono text-sm text-[#a39b90]">Roleplay it creates</p>
          <p className="mt-3 text-lg leading-relaxed text-[#f4efe8]">{step.roleplay}</p>
        </div>
      </div>
    </div>
  );
}
