'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';

interface FormattedRuleTextProps {
  content: string;
  className?: string;
}

/**
 * Parses inline markdown:
 * - Links: [Label](url)
 * - Bold: **bold**
 * - Italic: *italic*
 * - Code: `code`
 */
export function renderFormattedInline(text: string): React.ReactNode[] {
  if (!text) return [];

  // Match markdown tokens: links [label](url), bold **text**, italic *text*, code `text`
  const regex = /(\[[^\]]+\]\([^\s)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    // 1. Link token: [label](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, url] = linkMatch;
      const isExternal = url.startsWith('http://') || url.startsWith('https://');

      return (
        <a
          key={index}
          href={url}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          onClick={(e) => {
            // If it is an in-page anchor e.g. #vdm or /rules#vdm, handle smooth scroll if on same page
            if (url.startsWith('#')) {
              e.preventDefault();
              const el = document.getElementById(url.replace('#', ''));
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          }}
          className="text-vital-400 hover:text-vital-300 underline underline-offset-2 decoration-vital-500/40 hover:decoration-vital-400 font-semibold inline-flex items-center gap-0.5 transition-colors cursor-pointer"
        >
          <span>{label}</span>
          {isExternal && <ExternalLink className="w-3 h-3 inline-block ml-0.5 opacity-80 shrink-0" />}
        </a>
      );
    }

    // 2. Bold token: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // 3. Code token: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-white/10 text-vital-300 font-mono text-xs border border-white/5"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // 4. Italic token: *text*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={index} className="italic text-gray-200">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Plain text
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

/**
 * High-performance, clean markdown block parser for official rule text.
 * Renders paragraphs, lists, blockquotes, code, and inline links seamlessly.
 */
export const FormattedRuleText: React.FC<FormattedRuleTextProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split into paragraphs / lines
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushList = () => {
    if (!currentList) return;
    const ListTag = currentList.type;
    const listIndex = elements.length;
    elements.push(
      <ListTag
        key={`list-${listIndex}`}
        className={`my-2 space-y-1 pl-5 ${
          currentList.type === 'ul' ? 'list-disc marker:text-vital-500' : 'list-decimal marker:text-vital-400 font-mono'
        }`}
      >
        {currentList.items.map((item, i) => (
          <li key={i} className="text-gray-300 leading-relaxed text-sm font-sans">
            {renderFormattedInline(item)}
          </li>
        ))}
      </ListTag>
    );
    currentList = null;
  };

  lines.forEach((rawLine, idx) => {
    const trimmed = rawLine.trim();

    // Check for empty line
    if (!trimmed) {
      flushList();
      elements.push(<div key={`spacer-${idx}`} className="h-2" />);
      return;
    }

    // Check for blockquote: > Quote
    if (trimmed.startsWith('>')) {
      flushList();
      const quoteText = trimmed.replace(/^>\s*/, '');
      elements.push(
        <blockquote
          key={`quote-${idx}`}
          className="my-2 border-l-2 border-vital-500/60 pl-3.5 py-1.5 text-gray-300 italic bg-white/[0.02] rounded-r-lg font-sans text-sm"
        >
          {renderFormattedInline(quoteText)}
        </blockquote>
      );
      return;
    }

    // Check for unordered list item: - item or * item
    if (/^[-*]\s+/.test(trimmed)) {
      const itemText = trimmed.replace(/^[-*]\s+/, '');
      if (currentList && currentList.type === 'ul') {
        currentList.items.push(itemText);
      } else {
        flushList();
        currentList = { type: 'ul', items: [itemText] };
      }
      return;
    }

    // Check for ordered list item: 1. item
    if (/^\d+\.\s+/.test(trimmed)) {
      const itemText = trimmed.replace(/^\d+\.\s+/, '');
      if (currentList && currentList.type === 'ol') {
        currentList.items.push(itemText);
      } else {
        flushList();
        currentList = { type: 'ol', items: [itemText] };
      }
      return;
    }

    // Standard paragraph line
    flushList();
    elements.push(
      <p key={`p-${idx}`} className="leading-relaxed font-sans text-gray-300 text-sm">
        {renderFormattedInline(rawLine)}
      </p>
    );
  });

  flushList();

  return <div className={`space-y-1 text-sm leading-relaxed ${className}`}>{elements}</div>;
};
