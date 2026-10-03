'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';
import { WikiRichEditor } from './WikiRichEditor';
import { CharacterInfobox } from './CharacterInfobox';
import { WikiCharacterDetail, WikiRelationship, WikiSection } from '../../lib/wiki/types';
import { uploadWikiImageWithProgress } from '../../lib/wiki/fivemanage';
import { useAuth } from '../AuthProvider';
import {
  Save,
  Eye,
  ArrowLeft,
  Upload,
  Trash2,
  Plus,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Clock,
  Layers,
  Heart,
  Image as ImageIcon,
  User,
  Shield,
  FileText,
} from 'lucide-react';
import { getFallbackCharacterBySlug } from '../../data/wiki-fallback';

interface CharacterEditorViewProps {
  initialSlug?: string;
  isNew?: boolean;
}

export const CharacterEditorView: React.FC<CharacterEditorViewProps> = ({
  initialSlug,
  isNew = false,
}) => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'relationships' | 'gallery'>('basic');
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'unsaved'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<string[]>([]);

  // Character State
  const [fullName, setFullName] = useState('');
  const [aliases, setAliases] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'deceased'>('active');
  const [summary, setSummary] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [gender, setGender] = useState('');
  const [nationality, setNationality] = useState('');
  const [occupation, setOccupation] = useState('');
  const [employer, setEmployer] = useState('');
  const [gang, setGang] = useState('');
  const [business, setBusiness] = useState('');
  const [residence, setResidence] = useState('');
  const [relationshipStatus, setRelationshipStatus] = useState('');
  const [playerName, setPlayerName] = useState('');

  // Sections State
  const [sections, setSections] = useState<WikiSection[]>([
    {
      section_key: 'overview',
      title: 'Overview',
      content_html: '<p>Write a brief summary of the character...</p>',
      sort_order: 1,
    },
    {
      section_key: 'biography',
      title: 'Biography & History',
      content_html: '<p>Character history and background...</p>',
      sort_order: 2,
    },
  ]);

  // Relationships State
  const [relationships, setRelationships] = useState<WikiRelationship[]>([]);
  const [newRelName, setNewRelName] = useState('');
  const [newRelType, setNewRelType] = useState('Friend');
  const [newRelDesc, setNewRelDesc] = useState('');
  const [relSearchResults, setRelSearchResults] = useState<any[]>([]);

  // Gallery State
  const [gallery, setGallery] = useState<any[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Edit summary for revision history
  const [editSummary, setEditSummary] = useState('');

  // Load existing character if in edit mode
  useEffect(() => {
    if (!isNew && initialSlug) {
      fetch(`/api/wiki/characters/${initialSlug}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const charData: WikiCharacterDetail = data || getFallbackCharacterBySlug(initialSlug);
          if (charData) {
            setFullName(charData.character.full_name || charData.title);
            setAliases((charData.character.aliases || []).join(', '));
            setStatus((charData.status as any) || 'active');
            setSummary(charData.summary || '');
            setAvatarUrl(charData.character.avatar_url || '');
            setDateOfBirth(charData.character.date_of_birth || '');
            setPronouns(charData.character.pronouns || '');
            setGender(charData.character.gender || '');
            setNationality(charData.character.nationality || '');
            setOccupation(charData.character.occupation || '');
            setEmployer(charData.character.employer || '');
            setGang(charData.character.gang || '');
            setBusiness(charData.character.business || '');
            setResidence(charData.character.residence || '');
            setRelationshipStatus(charData.character.relationship_status || '');
            setPlayerName(charData.character.player_name || '');
            if (charData.sections?.length) setSections(charData.sections);
            if (charData.relationships?.length) setRelationships(charData.relationships);
            if (charData.gallery?.length) setGallery(charData.gallery);
          }
        })
        .catch(() => {});
    } else if (isNew && user) {
      setPlayerName(user.displayName || user.username);
    }
  }, [isNew, initialSlug, user]);

  // Check for duplicate names on creation
  useEffect(() => {
    if (!isNew || !fullName.trim() || fullName.length < 3) {
      setDuplicateWarning([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/wiki/characters?check_duplicates_only=true&full_name=${encodeURIComponent(
            fullName.trim()
          )}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name: fullName.trim(), check_duplicates_only: true }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.duplicates && data.duplicates.length > 0) {
            setDuplicateWarning(data.duplicates.map((d: any) => d.title));
          } else {
            setDuplicateWarning([]);
          }
        }
      } catch {
        // Ignore duplicate check error
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [fullName, isNew]);

  // Unsaved changes safety protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'unsaved') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  const markUnsaved = () => {
    if (saveStatus !== 'unsaved') setSaveStatus('unsaved');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      const res = await uploadWikiImageWithProgress(file);
      if (res.url) {
        setAvatarUrl(res.url);
        markUnsaved();
      }
    } catch (err: any) {
      alert(`Avatar upload failed: ${err.message}`);
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      try {
        const res = await uploadWikiImageWithProgress(files[i]);
        if (res.url) {
          setGallery((prev) => [
            ...prev,
            {
              url: res.url,
              caption: '',
              date_taken: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            },
          ]);
          markUnsaved();
        }
      } catch (err: any) {
        console.error('Gallery image upload failed:', err);
      }
    }
    e.target.value = '';
  };

  // Autocomplete for relationships
  const searchRelationshipTargets = async (query: string) => {
    setNewRelName(query);
    if (!query.trim()) {
      setRelSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/wiki/search?q=${encodeURIComponent(query.trim())}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        setRelSearchResults(data.results || []);
      }
    } catch {
      setRelSearchResults([]);
    }
  };

  const handleAddRelationship = (targetChar?: any) => {
    if (!newRelName.trim()) return;

    const newRel: WikiRelationship = {
      target_page_id: targetChar?.id || `temp-${Date.now()}`,
      relationship_type: newRelType,
      description: newRelDesc.trim(),
      target: targetChar
        ? {
            id: targetChar.id,
            slug: targetChar.slug,
            full_name: targetChar.full_name,
            avatar_url: targetChar.avatar_url,
            status: targetChar.status,
            gang: targetChar.gang,
          }
        : {
            id: `temp-${Date.now()}`,
            slug: newRelName.toLowerCase().replace(/\s+/g, '-'),
            full_name: newRelName.trim(),
          },
    };

    setRelationships((prev) => [...prev, newRel]);
    setNewRelName('');
    setNewRelDesc('');
    setRelSearchResults([]);
    markUnsaved();
  };

  const handleSave = async (isDraft = false) => {
    if (!fullName.trim()) {
      setErrorMsg('Character name is required.');
      return;
    }

    setSaving(true);
    setSaveStatus('saving');
    setErrorMsg('');

    const payload = {
      full_name: fullName.trim(),
      aliases: aliases.split(',').map((a) => a.trim()).filter(Boolean),
      status,
      summary,
      avatar_url: avatarUrl,
      date_of_birth: dateOfBirth,
      pronouns,
      gender,
      nationality,
      occupation,
      employer,
      gang,
      business,
      residence,
      relationship_status: relationshipStatus,
      player_name: playerName,
      sections,
      relationships,
      gallery,
      edit_summary: editSummary || (isNew ? 'Initial character creation' : 'Updated character details'),
      is_draft: isDraft,
    };

    try {
      const endpoint = isNew ? '/api/wiki/characters' : `/api/wiki/characters/${initialSlug}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save character.');
      }

      setSaveStatus('saved');
      if (data.slug) {
        window.location.href = `/wiki/characters/${data.slug}`;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving character.');
      setSaveStatus('unsaved');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 text-white selection:bg-vital-500 selection:text-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 pb-20">
        {/* Editor Top Navigation & Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-8 border-b border-white/5">
          <div className="flex items-center gap-3">
            <a
              href={isNew ? '/wiki/characters' : `/wiki/characters/${initialSlug}`}
              className="p-2 rounded-xl bg-dark-900 border border-white/10 text-gray-400 hover:text-white transition-colors"
              title="Go Back"
            >
              <ArrowLeft size={16} />
            </a>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
                {isNew ? 'Create New Character' : `Edit: ${fullName || 'Character'}`}
              </h1>
              <div className="flex items-center gap-2 mt-0.5 text-xs font-tech text-gray-400">
                <span>Status:</span>
                {saveStatus === 'saving' && (
                  <span className="flex items-center gap-1 text-vital-400">
                    <Loader2 size={12} className="animate-spin" />
                    <span>Saving...</span>
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 size={12} />
                    <span>Saved</span>
                  </span>
                )}
                {saveStatus === 'unsaved' && (
                  <span className="text-amber-400">Unsaved changes</span>
                )}
                {saveStatus === 'idle' && <span>Ready</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-dark-900 hover:bg-dark-800 text-gray-300 hover:text-white border border-white/10 text-xs font-tech font-bold uppercase tracking-wider transition-colors"
            >
              <Eye size={14} />
              <span>{previewMode ? 'Exit Preview' : 'Live Preview'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-vital-500 hover:bg-vital-600 text-white font-tech font-bold text-xs uppercase tracking-wider shadow-lg shadow-vital-500/25 transition-all hover:scale-105 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>{isNew ? 'Publish Character' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Live Preview Mode Toggle */}
        {previewMode ? (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-vital-500/10 border border-vital-500/20 text-xs text-vital-300 text-center font-tech uppercase tracking-wider">
              Preview Mode Active — Showing how the character page will appear when published
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-dark-900/60 border border-white/5 rounded-3xl p-6 sm:p-8">
                  <h1 className="text-3xl font-display font-bold text-white">
                    {fullName || 'Unnamed Character'}
                  </h1>
                  {aliases && (
                    <div className="text-xs text-vital-400 font-tech font-bold mt-1">
                      a.k.a. {aliases}
                    </div>
                  )}
                  {summary && <p className="mt-4 text-sm text-gray-300">{summary}</p>}
                </div>

                {sections.map((s) => (
                  <div key={s.section_key} className="bg-dark-900/40 border border-white/5 rounded-3xl p-6 space-y-3">
                    <h2 className="text-xl font-display font-bold text-white border-b border-white/5 pb-2">
                      {s.title}
                    </h2>
                    <div
                      className="text-sm text-gray-300 prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: s.content_html }}
                    />
                  </div>
                ))}
              </div>

              <div className="lg:col-span-4">
                <CharacterInfobox
                  character={{
                    page_id: 'preview',
                    full_name: fullName || 'Character',
                    aliases: aliases.split(',').map((a) => a.trim()).filter(Boolean),
                    avatar_url: avatarUrl,
                    date_of_birth: dateOfBirth,
                    pronouns,
                    gender,
                    nationality,
                    occupation,
                    employer,
                    gang,
                    business,
                    residence,
                    relationship_status: relationshipStatus,
                    player_name: playerName,
                  }}
                  status={status}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Editor Tabbed Navigation */
          <div className="space-y-8">
            <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto scrollbar-none">
              {[
                { id: 'basic', label: 'Basic Info & Identity', icon: User },
                { id: 'content', label: 'Biography & Sections', icon: FileText },
                { id: 'relationships', label: 'Relationships', icon: Heart },
                { id: 'gallery', label: 'Photo Gallery', icon: ImageIcon },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-tech font-bold text-xs uppercase tracking-wider transition-all shrink-0 ${
                      isActive
                        ? 'bg-vital-500/20 text-vital-400 border border-vital-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: BASIC INFO & PROFILE PHOTO */}
            {activeTab === 'basic' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Fields (8 Cols) */}
                <div className="lg:col-span-8 bg-dark-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
                  {/* Full Name & Duplicate Warning */}
                  <div>
                    <label className="block text-xs font-tech font-bold uppercase tracking-wider text-gray-300 mb-2">
                      Full Character Name <span className="text-vital-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        markUnsaved();
                      }}
                      placeholder="e.g. Damon Vox"
                      className="w-full h-12 px-4 rounded-xl bg-dark-800 border border-white/10 text-white text-sm focus:outline-none focus:border-vital-500"
                    />
                    {duplicateWarning.length > 0 && (
                      <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                        <AlertTriangle size={14} className="shrink-0" />
                        <span>
                          Notice: Similar existing characters found:{' '}
                          <strong>{duplicateWarning.join(', ')}</strong>. You can still proceed if
                          this is an intentional different character.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Nicknames / Aliases */}
                  <div>
                    <label className="block text-xs font-tech font-bold uppercase tracking-wider text-gray-300 mb-2">
                      Aliases / Nicknames (Comma Separated)
                    </label>
                    <input
                      type="text"
                      value={aliases}
                      onChange={(e) => {
                        setAliases(e.target.value);
                        markUnsaved();
                      }}
                      placeholder="e.g. The Ghost, Space, Vox"
                      className="w-full h-11 px-4 rounded-xl bg-dark-800 border border-white/10 text-white text-xs focus:outline-none focus:border-vital-500"
                    />
                  </div>

                  {/* Status & Pronouns / Gender */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-tech font-bold uppercase tracking-wider text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        value={status}
                        onChange={(e) => {
                          setStatus(e.target.value as any);
                          markUnsaved();
                        }}
                        className="w-full h-11 px-3 rounded-xl bg-dark-800 border border-white/10 text-white text-xs focus:outline-none focus:border-vital-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="deceased">Deceased (CK)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-tech font-bold uppercase tracking-wider text-gray-300 mb-2">
                        Pronouns
                      </label>
                      <input
                        type="text"
                        value={pronouns}
                        onChange={(e) => {
                          setPronouns(e.target.value);
                          markUnsaved();
                        }}
                        placeholder="e.g. He/Him"
                        className="w-full h-11 px-3 rounded-xl bg-dark-800 border border-white/10 text-white text-xs focus:outline-none focus:border-vital-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-tech font-bold uppercase tracking-wider text-gray-300 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="text"
                        value={dateOfBirth}
                        onChange={(e) => {
                          setDateOfBirth(e.target.value);
                          markUnsaved();
                        }}
                        placeholder="e.g. 1990-05-14"
                        className="w-full h-11 px-3 rounded-xl bg-dark-800 border border-white/10 text-white text-xs focus:outline-none focus:border-vital-500"
                      />
                    </div>
                  </div>

                  {/* Faction / Gang & Occupation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-tech font-bold uppercase tracking-wider text-gray-300 mb-2">
                        Gang / Faction (if applicable)
                      </label>
                      <input
                        type="text"
                        value={gang}
                        onChange={(e) => {
                          setGang(e.target.value);
                          markUnsaved();
                        }}
                        placeholder="e.g. Redacted, Southside Kings, LSPD"
                        className="w-full h-11 px-3 rounded-xl bg-dark-800 border border-white/10 text-white text-xs focus:outline-none focus:border-vital-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-tech font-bold uppercase tracking-wider text-gray-300 mb-2">
                        Occupation / Job
                      </label>
                      <input
                        type="text"
                        value={occupation}
                        onChange={(e) => {
                          setOccupation(e.target.value);
                          markUnsaved();
                        }}
                        placeholder="e.g. Club Owner, Detective, Tuner"
                        className="w-full h-11 px-3 rounded-xl bg-dark-800 border border-white/10 text-white text-xs focus:outline-none focus:border-vital-500"
                      />
                    </div>
                  </div>

                  {/* Business & Residence */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-tech font-bold uppercase tracking-wider text-gray-300 mb-2">
                        Businesses Owned / Operated
                      </label>
                      <input
                        type="text"
                        value={business}
                        onChange={(e) => {
                          setBusiness(e.target.value);
                          markUnsaved();
                        }}
                        placeholder="e.g. Eclipse Lounge"
                        className="w-full h-11 px-3 rounded-xl bg-dark-800 border border-white/10 text-white text-xs focus:outline-none focus:border-vital-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-tech font-bold uppercase tracking-wider text-gray-300 mb-2">
                        Residence / Neighborhood
                      </label>
                      <input
                        type="text"
                        value={residence}
                        onChange={(e) => {
                          setResidence(e.target.value);
                          markUnsaved();
                        }}
                        placeholder="e.g. Vinewood Hills"
                        className="w-full h-11 px-3 rounded-xl bg-dark-800 border border-white/10 text-white text-xs focus:outline-none focus:border-vital-500"
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div>
                    <label className="block text-xs font-tech font-bold uppercase tracking-wider text-gray-300 mb-2">
                      Brief Character Summary
                    </label>
                    <textarea
                      rows={3}
                      value={summary}
                      onChange={(e) => {
                        setSummary(e.target.value);
                        markUnsaved();
                      }}
                      placeholder="A short 1-2 sentence overview of the character for search results and previews..."
                      className="w-full p-3 rounded-xl bg-dark-800 border border-white/10 text-white text-xs focus:outline-none focus:border-vital-500"
                    />
                  </div>
                </div>

                {/* Profile Photo Uploader (4 Cols) */}
                <div className="lg:col-span-4 bg-dark-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 flex flex-col items-center text-center">
                  <div className="text-xs font-tech font-bold uppercase tracking-wider text-gray-300">
                    Character Portrait (FiveManage)
                  </div>

                  <div className="relative aspect-[3/4] w-full max-w-[240px] rounded-2xl overflow-hidden bg-dark-800 border border-white/10 shadow-lg">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={fullName || 'Avatar'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-gray-500">
                        <User size={48} className="mb-2 opacity-50" />
                        <span className="text-xs">No image uploaded</span>
                      </div>
                    )}

                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                        <Loader2 size={24} className="animate-spin text-vital-500" />
                        <span className="text-xs text-vital-400 font-tech">Uploading...</span>
                      </div>
                    )}
                  </div>

                  <div className="w-full space-y-2">
                    <label className="w-full py-2.5 px-4 rounded-xl bg-vital-500/20 hover:bg-vital-500/30 text-vital-400 border border-vital-500/40 text-xs font-tech font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors">
                      <Upload size={14} />
                      <span>{avatarUrl ? 'Replace Photo' : 'Upload Photo'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                      />
                    </label>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarUrl('');
                          markUnsaved();
                        }}
                        className="w-full py-2 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-tech font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                      >
                        <Trash2 size={13} />
                        <span>Remove Photo</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-500 leading-normal">
                    Supported: JPG, PNG, WebP up to 10MB. Images are hosted securely on FiveManage CDN.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: RICH TEXT SECTIONS & @ MENTIONS */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-dark-900/60 border border-white/5 text-xs text-gray-400 flex items-center justify-between">
                  <span>
                    Type <strong className="text-vital-400">@</strong> to mention any Vital Wiki
                    character. Type <strong className="text-vital-400">/</strong> for commands.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const newKey = `section_${Date.now()}`;
                      setSections((prev) => [
                        ...prev,
                        {
                          section_key: newKey,
                          title: 'New Section',
                          content_html: '<p>Write section content here...</p>',
                          sort_order: prev.length + 1,
                        },
                      ]);
                      markUnsaved();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-vital-500/10 text-vital-400 border border-vital-500/30 text-xs font-tech font-bold uppercase tracking-wider hover:bg-vital-500/20"
                  >
                    <Plus size={13} />
                    <span>Add Custom Section</span>
                  </button>
                </div>

                {sections.map((sec, idx) => (
                  <div
                    key={sec.section_key}
                    className="bg-dark-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4"
                  >
                    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3">
                      <input
                        type="text"
                        value={sec.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSections((prev) =>
                            prev.map((s, i) => (i === idx ? { ...s, title: val } : s))
                          );
                          markUnsaved();
                        }}
                        className="text-lg sm:text-xl font-display font-bold text-white bg-transparent border-b border-dashed border-white/20 focus:border-vital-500 focus:outline-none"
                      />

                      {sections.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSections((prev) => prev.filter((_, i) => i !== idx));
                            markUnsaved();
                          }}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete Section"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <WikiRichEditor
                      value={sec.content_html}
                      onChange={(newHtml) => {
                        setSections((prev) =>
                          prev.map((s, i) => (i === idx ? { ...s, content_html: newHtml } : s))
                        );
                        markUnsaved();
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: RELATIONSHIPS */}
            {activeTab === 'relationships' && (
              <div className="bg-dark-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-8">
                {/* Add Relationship Form */}
                <div className="p-5 rounded-2xl bg-dark-800/60 border border-white/5 space-y-4">
                  <h3 className="text-sm font-tech font-bold uppercase tracking-wider text-vital-400">
                    Add Character Relationship
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-5 relative">
                      <input
                        type="text"
                        value={newRelName}
                        onChange={(e) => searchRelationshipTargets(e.target.value)}
                        placeholder="Search existing character name..."
                        className="w-full h-11 px-3.5 rounded-xl bg-dark-900 border border-white/10 text-white text-xs focus:outline-none focus:border-vital-500"
                      />

                      {relSearchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-dark-900 border border-white/15 rounded-xl p-1 shadow-2xl space-y-1">
                          {relSearchResults.map((char) => (
                            <div
                              key={char.id}
                              onClick={() => {
                                handleAddRelationship(char);
                              }}
                              className="p-2 flex items-center gap-2 hover:bg-white/5 rounded-lg cursor-pointer text-xs"
                            >
                              <img
                                src={char.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(char.full_name)}`}
                                alt=""
                                className="w-6 h-6 rounded-md object-cover"
                              />
                              <span className="font-bold text-white">{char.full_name}</span>
                              {char.gang && <span className="text-[10px] text-vital-400">({char.gang})</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-3">
                      <select
                        value={newRelType}
                        onChange={(e) => setNewRelType(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl bg-dark-900 border border-white/10 text-white text-xs focus:outline-none focus:border-vital-500"
                      >
                        <option value="Partner">Partner</option>
                        <option value="Family">Family</option>
                        <option value="Close Friend">Close Friend</option>
                        <option value="Friend">Friend</option>
                        <option value="Associate">Associate</option>
                        <option value="Gang Member">Gang Member</option>
                        <option value="Enemy">Enemy</option>
                        <option value="Rival">Rival</option>
                        <option value="Former Partner">Former Partner</option>
                      </select>
                    </div>

                    <div className="sm:col-span-4 flex gap-2">
                      <input
                        type="text"
                        value={newRelDesc}
                        onChange={(e) => setNewRelDesc(e.target.value)}
                        placeholder="Context (optional)..."
                        className="flex-1 h-11 px-3 rounded-xl bg-dark-900 border border-white/10 text-white text-xs focus:outline-none focus:border-vital-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddRelationship()}
                        className="px-4 h-11 rounded-xl bg-vital-500 text-white text-xs font-tech font-bold uppercase tracking-wider shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Existing Relationships List */}
                <div className="space-y-3">
                  <div className="text-xs font-tech font-bold uppercase tracking-wider text-gray-400">
                    Existing Character Connections ({relationships.length})
                  </div>

                  {relationships.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-500">
                      No relationships added yet.
                    </div>
                  ) : (
                    relationships.map((rel, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-dark-800/60 border border-white/5"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              {rel.target?.full_name || 'Character'}
                            </span>
                            <span className="text-[10px] font-tech text-vital-400 px-2 py-0.5 rounded-full bg-vital-500/10">
                              {rel.relationship_type}
                            </span>
                          </div>
                          {rel.description && (
                            <p className="text-xs text-gray-400 mt-1">{rel.description}</p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setRelationships((prev) => prev.filter((_, i) => i !== idx));
                            markUnsaved();
                          }}
                          className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: PHOTO GALLERY */}
            {activeTab === 'gallery' && (
              <div className="bg-dark-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                  <div>
                    <h3 className="text-base font-display font-bold text-white">Character Gallery</h3>
                    <p className="text-xs text-gray-400">
                      Upload high quality action shots or roleplay moments via FiveManage CDN
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-vital-500 hover:bg-vital-600 text-white font-tech font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md transition-colors">
                    <Upload size={14} />
                    <span>Upload Images</span>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleGalleryUpload}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {gallery.map((img, idx) => (
                    <div
                      key={idx}
                      className="group relative aspect-video rounded-2xl overflow-hidden bg-dark-800 border border-white/10"
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setGallery((prev) => prev.filter((_, i) => i !== idx));
                          markUnsaved();
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-red-500 text-white transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revision Note / Edit Summary Box */}
            <div className="bg-dark-900/40 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex-1 w-full">
                <label className="block text-[11px] font-tech font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Optional Edit Summary (recorded in revision history)
                </label>
                <input
                  type="text"
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  placeholder="e.g. Added Pacific Standard heist details, updated relationship with Karen"
                  className="w-full h-9 px-3 rounded-lg bg-dark-800 border border-white/10 text-white text-xs focus:outline-none focus:border-vital-500"
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-vital-500 hover:bg-vital-600 text-white font-tech font-bold text-xs uppercase tracking-wider shadow-lg shadow-vital-500/25 transition-all hover:scale-105 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : isNew ? 'Publish Character' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
