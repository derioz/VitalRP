import React from 'react';
import { Button } from './Button';

const DISCORD_URL = 'https://discord.gg/vitalrp';
const CONNECT_URL = 'https://connect.vitalrp.net';

const steps = [
  {
    title: 'Join the Discord',
    body: 'Everything starts in the Vital RP Discord.',
    action: { label: 'Join the Discord', href: DISCORD_URL, variant: 'primary' as const },
  },
  {
    title: 'Apply in the whitelist channel',
    body: 'Submit your application in the dedicated whitelist channel. Review takes 24–48 hours.',
  },
  {
    title: 'Connect and play',
    body: 'Once your application is approved, connect to the server and step into Los Santos.',
    action: { label: 'Already whitelisted? Connect', href: CONNECT_URL, variant: 'outline' as const },
  },
];

/** The route from visitor to player, in order. */
export const HowToJoin: React.FC = () => (
  <section id="how-to-join" aria-labelledby="how-to-join-title" className="relative scroll-mt-16 border-t border-white/10 bg-dark-900 py-20 md:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <h2 id="how-to-join-title" className="mb-5 text-3xl font-display font-black tracking-tight text-white md:text-5xl">
          How to get in
        </h2>
        <p className="text-lg leading-relaxed text-gray-300">
          Vital RP is whitelisted. You need to be 18 or older and have a working microphone.
        </p>
      </div>

      <ol className="mt-12 grid gap-10 lg:grid-cols-3 lg:gap-8">
        {steps.map((step, i) => (
          <li key={step.title} className="flex flex-col border-t border-white/15 pt-6">
            <span className="font-tech tabular-nums text-vital-500" aria-hidden="true">
              {i + 1}
            </span>
            <h3 className="mt-3 text-2xl font-display font-bold text-white">{step.title}</h3>
            <p className="mt-3 max-w-[44ch] flex-1 leading-relaxed text-gray-300">{step.body}</p>
            {step.action && (
              <div className="mt-6">
                <Button href={step.action.href} variant={step.action.variant} target="_blank" rel="noopener noreferrer">
                  {step.action.label}
                </Button>
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  </section>
);
