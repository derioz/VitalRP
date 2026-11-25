import React from 'react';

/**
 * A run of short items separated by slashes. Each item is kept on one line so
 * names such as "One-Eyed Willie's" never break across a line.
 */
export function InlineList({ items, className = '' }: { items: string[]; className?: string }) {
  return (
    <p className={className}>
      {items.map((item, i) => (
        <React.Fragment key={item}>
          <span className="whitespace-nowrap">{item}</span>
          {i < items.length - 1 && (
            <span aria-hidden className="px-[0.45em] opacity-45">
              /
            </span>
          )}{' '}
        </React.Fragment>
      ))}
    </p>
  );
}
