'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Loader2,
  Search,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import { uploadWikiImageWithProgress } from '../../lib/wiki/fivemanage';
import { AutocompleteSkeleton } from './WikiSkeletons';
import { WikiSearchResult } from '../../lib/wiki/types';
import { getFallbackSearchResults } from '../../data/wiki-fallback';
import { getApiUrl } from '../../lib/api-config';
import { getLocalCharacters } from '../../lib/wiki/storage';

interface WikiRichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  pageId?: string;
}

export const WikiRichEditor: React.FC<WikiRichEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write content here... Type @ to mention a character, or / for commands...',
  className = '',
  pageId,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);

  // Mention Autocomplete state
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState<WikiSearchResult[]>([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionCoords, setMentionCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const mentionRangeRef = useRef<Range | null>(null);

  // Slash Command Palette state
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashIndex, setSlashIndex] = useState(0);

  // Initialize innerHTML safely
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      // Only set if completely out of sync to prevent cursor jump
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCmd = (command: string, val: string | undefined = undefined) => {
    document.execCommand(command, false, val);
    handleInput();
    editorRef.current?.focus();
  };

  // Debounced search for @ mentions
  useEffect(() => {
    if (!mentionOpen) return;
    setMentionLoading(true);

    const timer = setTimeout(async () => {
      try {
        let apiResults: WikiSearchResult[] = [];
        try {
          const res = await fetch(getApiUrl(`/api/wiki/search?q=${encodeURIComponent(mentionQuery)}&limit=8`));
          const ct = res.headers.get('content-type') || '';
          if (res.ok && ct.includes('application/json')) {
            const data = await res.json();
            apiResults = data.results || [];
          }
        } catch {}

        // Search local characters
        const q = mentionQuery.toLowerCase().trim();
        const localMatches: WikiSearchResult[] = getLocalCharacters()
          .filter((c) => {
            const nameMatch = (c.character?.full_name || c.title).toLowerCase().includes(q);
            const aliasMatch = (c.character?.aliases || []).some((a) => a.toLowerCase().includes(q));
            return nameMatch || aliasMatch;
          })
          .map((c) => ({
            id: c.id,
            slug: c.slug,
            title: c.title,
            full_name: c.character?.full_name || c.title,
            aliases: c.character?.aliases || [],
            avatar_url: c.character?.avatar_url,
            status: c.status,
            occupation: c.character?.occupation,
            gang: c.character?.gang,
            business: c.character?.business,
            summary: c.summary,
            categories: c.categories.map((cat) => cat.name),
          }));

        const map = new Map<string, WikiSearchResult>();
        for (const r of apiResults) map.set(r.slug.toLowerCase(), r);
        for (const r of localMatches) map.set(r.slug.toLowerCase(), r);
        setMentionResults(Array.from(map.values()).slice(0, 8));
      } catch {
        setMentionResults([]);
      } finally {
        setMentionLoading(false);
        setSelectedIndex(0);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [mentionQuery, mentionOpen]);

  // Handle keydown for @ mention trigger & slash commands
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // 1. If Mention Autocomplete is open
    if (mentionOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (mentionResults.length ? (prev + 1) % mentionResults.length : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          mentionResults.length ? (prev - 1 + mentionResults.length) % mentionResults.length : 0
        );
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (mentionResults[selectedIndex]) {
          insertMention(mentionResults[selectedIndex]);
        }
        return;
      }
      if (e.key === 'Escape') {
        setMentionOpen(false);
        return;
      }
    }

    // 2. If Slash Command palette is open
    if (slashOpen) {
      const commands = [
        { label: 'Heading 2', action: () => executeCmd('formatBlock', '<h2>') },
        { label: 'Heading 3', action: () => executeCmd('formatBlock', '<h3>') },
        { label: 'Bullet List', action: () => executeCmd('insertUnorderedList') },
        { label: 'Numbered List', action: () => executeCmd('insertOrderedList') },
        { label: 'Quote', action: () => executeCmd('formatBlock', '<blockquote>') },
      ];

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashIndex((prev) => (prev + 1) % commands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashIndex((prev) => (prev - 1 + commands.length) % commands.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        commands[slashIndex]?.action();
        setSlashOpen(false);
        return;
      }
      if (e.key === 'Escape') {
        setSlashOpen(false);
        return;
      }
    }

    // 3. Trigger @ menu on '@'
    if (e.key === '@') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0).cloneRange();
        mentionRangeRef.current = range;
        const rect = range.getBoundingClientRect();
        setMentionCoords({
          top: rect.bottom + window.scrollY + 6,
          left: Math.max(16, rect.left + window.scrollX - 40),
        });
        setMentionOpen(true);
        setMentionQuery('');
      }
    }

    // 4. Trigger / menu on '/' at start or after space
    if (e.key === '/') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0).cloneRange();
        const rect = range.getBoundingClientRect();
        setMentionCoords({
          top: rect.bottom + window.scrollY + 6,
          left: Math.max(16, rect.left + window.scrollX - 20),
        });
        setSlashOpen(true);
        setSlashIndex(0);
      }
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!mentionOpen) return;

    // Detect backspace or characters typed after @
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const anchorNode = selection.anchorNode;
    if (anchorNode && anchorNode.textContent) {
      const text = anchorNode.textContent;
      const atIndex = text.lastIndexOf('@');
      if (atIndex !== -1 && atIndex <= selection.anchorOffset) {
        const query = text.slice(atIndex + 1, selection.anchorOffset);
        // If query has spaces greater than 20 chars, close mention
        if (query.includes('\n') || query.length > 25) {
          setMentionOpen(false);
        } else {
          setMentionQuery(query);
        }
      } else {
        setMentionOpen(false);
      }
    }
  };

  const insertMention = (char: WikiSearchResult) => {
    setMentionOpen(false);
    editorRef.current?.focus();

    const selection = window.getSelection();
    if (!selection || !mentionRangeRef.current) return;

    // Select the text including the @ and typed query
    const range = selection.getRangeAt(0);
    const node = range.startContainer;
    if (node && node.textContent) {
      const atIdx = node.textContent.lastIndexOf('@');
      if (atIdx !== -1) {
        range.setStart(node, atIdx);
        range.setEnd(node, range.endOffset);
      }
    }

    // Insert clean persistent mention node
    const span = document.createElement('span');
    span.setAttribute('data-character-id', char.id);
    span.setAttribute('data-character-name', char.full_name);
    span.setAttribute('data-character-slug', char.slug);
    span.className = 'vital-mention inline-flex items-center text-vital-400 font-semibold bg-vital-500/10 px-1 py-0.5 rounded cursor-pointer mx-0.5';
    span.contentEditable = 'false';
    span.textContent = `@${char.full_name}`;

    range.deleteContents();
    range.insertNode(span);

    // Insert space after mention
    const space = document.createTextNode('\u00A0');
    span.parentNode?.insertBefore(space, span.nextSibling);

    // Move cursor after the space
    const newRange = document.createRange();
    newRange.setStartAfter(space);
    newRange.setEndAfter(space);
    selection.removeAllRanges();
    selection.addRange(newRange);

    handleInput();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadPercent(0);

      const res = await uploadWikiImageWithProgress(file, pageId, (pct) => {
        setUploadPercent(pct);
      });

      if (res.url) {
        executeCmd('insertHTML', `<img src="${res.url}" alt="${file.name}" class="rounded-xl my-4 max-h-96 w-auto border border-white/10" />`);
      }
    } catch (err: any) {
      alert(`Image upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className={`relative flex flex-col bg-dark-900/80 border border-white/10 rounded-2xl overflow-hidden focus-within:border-vital-500/50 transition-colors ${className}`}>
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-dark-950/60 border-b border-white/5 text-gray-400">
        <button
          type="button"
          onClick={() => executeCmd('bold')}
          className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
          title="Bold (Ctrl+B)"
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          onClick={() => executeCmd('italic')}
          className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
          title="Italic (Ctrl+I)"
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          onClick={() => executeCmd('underline')}
          className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
          title="Underline (Ctrl+U)"
        >
          <Underline size={15} />
        </button>

        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        <button
          type="button"
          onClick={() => executeCmd('formatBlock', '<h2>')}
          className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
          title="Heading 2"
        >
          <Heading2 size={15} />
        </button>
        <button
          type="button"
          onClick={() => executeCmd('formatBlock', '<h3>')}
          className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
          title="Heading 3"
        >
          <Heading3 size={15} />
        </button>

        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        <button
          type="button"
          onClick={() => executeCmd('insertUnorderedList')}
          className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
          title="Bullet List"
        >
          <List size={15} />
        </button>
        <button
          type="button"
          onClick={() => executeCmd('insertOrderedList')}
          className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
          title="Numbered List"
        >
          <ListOrdered size={15} />
        </button>
        <button
          type="button"
          onClick={() => executeCmd('formatBlock', '<blockquote>')}
          className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
          title="Quote Block"
        >
          <Quote size={15} />
        </button>

        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        {/* FiveManage Image Upload Button */}
        <label
          className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white cursor-pointer transition-colors flex items-center gap-1.5"
          title="Upload Photo (FiveManage)"
        >
          {isUploading ? (
            <span className="flex items-center gap-1 text-xs text-vital-400">
              <Loader2 size={14} className="animate-spin" />
              <span>{uploadPercent}%</span>
            </span>
          ) : (
            <ImageIcon size={15} />
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleImageUpload}
            disabled={isUploading}
          />
        </label>

        {/* Mention Button */}
        <button
          type="button"
          onClick={() => {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0).cloneRange();
              mentionRangeRef.current = range;
              const rect = range.getBoundingClientRect();
              setMentionCoords({
                top: rect.bottom + window.scrollY + 6,
                left: Math.max(16, rect.left + window.scrollX - 40),
              });
              setMentionOpen(true);
              setMentionQuery('');
            }
          }}
          className="p-1.5 rounded-lg hover:bg-vital-500/10 hover:text-vital-400 text-vital-500/80 font-tech font-bold text-xs flex items-center gap-1 transition-colors"
          title="Mention Character (@)"
        >
          <span>@ Mention</span>
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => executeCmd('undo')}
            className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => executeCmd('redo')}
            className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={15} />
          </button>
        </div>
      </div>

      {/* Editable Canvas */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        data-placeholder={placeholder}
        className="min-h-[160px] p-5 text-gray-200 text-sm leading-relaxed focus:outline-none focus:ring-0 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500 empty:before:pointer-events-none prose prose-invert max-w-none"
      />

      {/* Floating @ Mention Autocomplete Menu */}
      {mentionOpen && (
        <div
          style={{ top: `${mentionCoords.top}px`, left: `${mentionCoords.left}px` }}
          className="fixed z-50 w-72 bg-dark-900/98 backdrop-blur-2xl border border-white/20 rounded-2xl p-2 shadow-2xl shadow-black/90 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center gap-2 px-2.5 py-1.5 border-b border-white/5 mb-1.5 text-xs text-gray-400">
            <Search size={12} className="text-vital-400" />
            <span className="font-tech uppercase tracking-wider text-[10px]">Mention Character:</span>
            <span className="font-bold text-white truncate">@{mentionQuery || '...'}</span>
          </div>

          {mentionLoading ? (
            <AutocompleteSkeleton />
          ) : mentionResults.length > 0 ? (
            <div className="max-h-60 overflow-y-auto space-y-1">
              {mentionResults.map((char, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={char.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertMention(char);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-vital-500/20 text-white border border-vital-500/30'
                        : 'hover:bg-white/5 text-gray-300'
                    }`}
                  >
                    <img
                      src={
                        char.avatar_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          char.full_name
                        )}&background=f97316&color=fff`
                      }
                      alt={char.full_name}
                      className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold font-display truncate">
                        {char.full_name}
                      </div>
                      {char.gang ? (
                        <div className="text-[10px] text-vital-400 truncate">
                          {char.gang}
                        </div>
                      ) : char.occupation ? (
                        <div className="text-[10px] text-gray-400 truncate">
                          {char.occupation}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-gray-400">
              No matching character found.
            </div>
          )}
        </div>
      )}

      {/* Slash Command Palette */}
      {slashOpen && (
        <div
          style={{ top: `${mentionCoords.top}px`, left: `${mentionCoords.left}px` }}
          className="fixed z-50 w-64 bg-dark-900/98 backdrop-blur-2xl border border-white/20 rounded-2xl p-2 shadow-2xl shadow-black/90 space-y-1"
        >
          <div className="px-2.5 py-1 text-[10px] font-tech uppercase tracking-wider text-gray-400 border-b border-white/5 mb-1">
            Commands
          </div>
          {[
            { label: 'Heading 2', icon: Heading2, action: () => executeCmd('formatBlock', '<h2>') },
            { label: 'Heading 3', icon: Heading3, action: () => executeCmd('formatBlock', '<h3>') },
            { label: 'Bullet List', icon: List, action: () => executeCmd('insertUnorderedList') },
            { label: 'Numbered List', icon: ListOrdered, action: () => executeCmd('insertOrderedList') },
            { label: 'Quote', icon: Quote, action: () => executeCmd('formatBlock', '<blockquote>') },
          ].map((cmd, idx) => {
            const isSelected = idx === slashIndex;
            const Icon = cmd.icon;
            return (
              <div
                key={cmd.label}
                onMouseDown={(e) => {
                  e.preventDefault();
                  cmd.action();
                  setSlashOpen(false);
                }}
                className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  isSelected ? 'bg-vital-500/20 text-white' : 'hover:bg-white/5 text-gray-300'
                }`}
              >
                <Icon size={14} className="text-vital-400" />
                <span>{cmd.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
