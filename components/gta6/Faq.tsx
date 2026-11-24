'use client';

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { faqs } from '@/lib/gta6/content';

export function Faq() {
  return (
    <section id="faq" aria-labelledby="g6-faq-title" className="g6-section g6-rule">
      <div className="g6-wrap grid gap-x-12 gap-y-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-40">
            <p className="g6-mono pb-6 text-sm text-[#a39b90]">06</p>
            <h2
              id="g6-faq-title"
              className="g6-display text-[clamp(2.75rem,5.5vw,5rem)] text-white"
            >
              Questions
            </h2>
            <p className="g6-body mt-6 max-w-[32ch]">
              Where an answer is &ldquo;we do not know yet&rdquo;, we say so.
            </p>
          </div>
        </div>

        <div className="lg:col-span-8">
          <Accordion type="single" collapsible defaultValue="item-0" className="border-t border-white/10">
            {faqs.map((f, i) => (
              <AccordionItem key={f.question} value={`item-${i}`} className="border-white/10">
                <AccordionTrigger className="g6-display g6-sm text-2xl text-white hover:text-[#fdba74] data-[state=open]:text-white sm:text-3xl">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent className="g6-body max-w-[62ch] text-lg">{f.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
