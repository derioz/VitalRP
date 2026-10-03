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
  Sparkles,
  Briefcase,
  Link2,
  ExternalLink,
  Check,
  Copy,
  RefreshCw,
  X,
  Zap,
  BookOpen,
} from 'lucide-react';
import { getFallbackCharacterBySlug } from '../../data/wiki-fallback';
import { getApiUrl } from '../../lib/api-config';
import { supabase } from '../../lib/supabase/client';
import { saveLocalCharacter, getLocalCharacterBySlug } from '../../lib/wiki/storage';

interface CharacterEditorViewProps {
  initialSlug?: string;
  isNew?: boolean;
}

// Starter Archetype Templates for New Characters
const ARCHETYPES = [
  {
    id: 'criminal',
    name: 'Criminal / Street Gang',
    icon: Shield,
    badge: 'Underworld',
    color: 'border-red-500/30 text-red-400 bg-red-500/10 hover:border-red-500/50',
    description: 'Gang member, hustler, heist specialist, or syndicate operative.',
    defaults: {
      occupation: 'Street Operative',
      gang: 'Underground Crew',
      summary: 'An active figure operating within the Los Santos underworld.',
      sections: [
        {
          section_key: 'overview',
          title: 'Overview',
          content_html: '<p>A recognized player in local street operations and underground commerce.</p>',
          sort_order: 1,
        },
        {
          section_key: 'criminal_record',
          title: 'Street Record & Heists',
          content_html: '<p>Notable heists, bank robberies, and active rivalries across the city.</p>',
          sort_order: 2,
        },
        {
          section_key: 'known_crew',
          title: 'Crew & Territory',
          content_html: '<p>Frequently sighted holding down turf in Southside and industrial docks.</p>',
          sort_order: 3,
        },
      ],
    },
  },
  {
    id: 'police',
    name: 'Law Enforcement / LSPD',
    icon: Shield,
    badge: 'LSPD / BCSO',
    color: 'border-blue-500/30 text-blue-400 bg-blue-500/10 hover:border-blue-500/50',
    description: 'Sworn patrol officer, investigator, or tactical division operator.',
    defaults: {
      occupation: 'Police Officer',
      employer: 'Los Santos Police Department',
      gang: 'LSPD',
      summary: 'A sworn peacekeeper dedicated to protecting the citizens of Los Santos.',
      sections: [
        {
          section_key: 'overview',
          title: 'Overview',
          content_html: '<p>Sworn officer dedicated to active patrol, pursuit response, and crime deterrence.</p>',
          sort_order: 1,
        },
        {
          section_key: 'service_history',
          title: 'Service History & Badges',
          content_html: '<p>Police Academy graduate with division commendations and duty history.</p>',
          sort_order: 2,
        },
      ],
    },
  },
  {
    id: 'civilian',
    name: 'Civilian / Entrepreneur',
    icon: Briefcase,
    badge: 'Civ / Business',
    color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:border-emerald-500/50',
    description: 'Business owner, lawyer, tuner mechanic, club promoter, or everyday citizen.',
    defaults: {
      occupation: 'Business Owner',
      business: 'Downtown Enterprise',
      summary: 'A prominent civilian entrepreneur and property owner in Los Santos.',
      sections: [
        {
          section_key: 'overview',
          title: 'Overview',
          content_html: '<p>Active entrepreneur contributing to San Andreas commerce and community life.</p>',
          sort_order: 1,
        },
        {
          section_key: 'business_ventures',
          title: 'Ventures & Assets',
          content_html: '<p>Properties owned, commercial licenses, and notable business partnerships.</p>',
          sort_order: 2,
        },
      ],
    },
  },
  {
    id: 'ems',
    name: 'Medical / EMS / Fire',
    icon: Heart,
    badge: 'Pillbox EMS',
    color: 'border-pink-500/30 text-pink-400 bg-pink-500/10 hover:border-pink-500/50',
    description: 'Paramedic, ER physician, surgeon, or trauma response unit.',
    defaults: {
      occupation: 'Paramedic',
      employer: 'Pillbox Hill Medical Center',
      summary: 'First responder serving on the front lines of emergency medical care.',
      sections: [
        {
          section_key: 'overview',
          title: 'Overview',
          content_html: '<p>Dedicated emergency medic responding to trauma, dispatch calls, and field triage.</p>',
          sort_order: 1,
        },
        {
          section_key: 'certifications',
          title: 'Certifications & Medical Standing',
          content_html: '<p>Advanced life support certifications and field response records.</p>',
          sort_order: 2,
        },
      ],
    },
  },
];

export const CharacterEditorView: React.FC<CharacterEditorViewProps> = ({
  initialSlug,
  isNew = false,
}) => {
  const { user } = useAuth();

  // Try to load any previously saved character synchronously from local storage
  const cachedCharacter =
    !isNew && initialSlug ? getLocalCharacterBySlug(initialSlug) : null;

  // Mode: 'quick' for streamlined 1-page creation, 'full' for full dossier with tabs
  const [editorMode, setEditorMode] = useState<'quick' | 'full'>(isNew ? 'quick' : 'full');
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'relationships' | 'gallery'>('basic');
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'unsaved'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<string[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(!isNew && !cachedCharacter);
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);

  // URL Image Input toggle
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');

  // Character State - Auto-filled synchronously from local storage if available
  const [fullName, setFullName] = useState(() => {
    if (cachedCharacter) {
      const c = cachedCharacter.character || (cachedCharacter as any);
      return c.full_name || cachedCharacter.title || (cachedCharacter as any).full_name || '';
    }
    return '';
  });

  const [aliases, setAliases] = useState(() => {
    if (cachedCharacter) {
      const c = cachedCharacter.character || (cachedCharacter as any);
      const a = c.aliases || (cachedCharacter as any).aliases || [];
      return Array.isArray(a) ? a.join(', ') : String(a || '');
    }
    return '';
  });

  const [status, setStatus] = useState<'active' | 'inactive' | 'deceased'>(() => {
    if (cachedCharacter) {
      return (cachedCharacter.status as any) || 'active';
    }
    return 'active';
  });

  const [summary, setSummary] = useState(() => cachedCharacter?.summary || '');

  const [avatarUrl, setAvatarUrl] = useState(() => {
    if (cachedCharacter) {
      const c = cachedCharacter.character || (cachedCharacter as any);
      return c.avatar_url || (cachedCharacter as any).avatar_url || '';
    }
    return '';
  });

  const [dateOfBirth, setDateOfBirth] = useState(() => {
    const c = cachedCharacter?.character || (cachedCharacter as any);
    return c?.date_of_birth || '';
  });

  const [pronouns, setPronouns] = useState(() => {
    const c = cachedCharacter?.character || (cachedCharacter as any);
    return c?.pronouns || '';
  });

  const [gender, setGender] = useState(() => {
    const c = cachedCharacter?.character || (cachedCharacter as any);
    return c?.gender || '';
  });

  const [nationality, setNationality] = useState(() => {
    const c = cachedCharacter?.character || (cachedCharacter as any);
    return c?.nationality || '';
  });

  const [occupation, setOccupation] = useState(() => {
    const c = cachedCharacter?.character || (cachedCharacter as any);
    return c?.occupation || '';
  });

  const [employer, setEmployer] = useState(() => {
    const c = cachedCharacter?.character || (cachedCharacter as any);
    return c?.employer || '';
  });

  const [gang, setGang] = useState(() => {
    const c = cachedCharacter?.character || (cachedCharacter as any);
    return c?.gang || '';
  });

  const [business, setBusiness] = useState(() => {
    const c = cachedCharacter?.character || (cachedCharacter as any);
    return c?.business || '';
  });

  const [residence, setResidence] = useState(() => {
    const c = cachedCharacter?.character || (cachedCharacter as any);
    return c?.residence || '';
  });

  const [relationshipStatus, setRelationshipStatus] = useState(() => {
    const c = cachedCharacter?.character || (cachedCharacter as any);
    return c?.relationship_status || '';
  });

  const [playerName, setPlayerName] = useState(() => {
    const c = cachedCharacter?.character || (cachedCharacter as any);
    return c?.player_name || user?.displayName || user?.username || '';
  });

  // Sections State
  const [sections, setSections] = useState<WikiSection[]>(() => {
    if (cachedCharacter?.sections && Array.isArray(cachedCharacter.sections) && cachedCharacter.sections.length > 0) {
      return cachedCharacter.sections.map((s: any, idx: number) => ({
        id: s.id || `sec-${idx}`,
        page_id: s.page_id,
        section_key: s.section_key || `sec_${idx}`,
        title: s.title || `Section ${idx + 1}`,
        content_html: s.content_html || s.content || '',
        sort_order: s.sort_order || idx + 1,
        is_hidden: Boolean(s.is_hidden),
      }));
    }
    return [
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
    ];
  });

  // Relationships State
  const [relationships, setRelationships] = useState<WikiRelationship[]>(() => {
    return cachedCharacter?.relationships || [];
  });
  const [newRelName, setNewRelName] = useState('');
  const [newRelType, setNewRelType] = useState('Friend');
  const [newRelDesc, setNewRelDesc] = useState('');
  const [relSearchResults, setRelSearchResults] = useState<any[]>([]);

  // Gallery State
  const [gallery, setGallery] = useState<any[]>(() => {
    return cachedCharacter?.gallery || [];
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Edit summary for revision history
  const [editSummary, setEditSummary] = useState('');

  // Auto-fill existing character data reliably
  useEffect(() => {
    if (!isNew && initialSlug) {
      const localChar = getLocalCharacterBySlug(initialSlug);

      const applyData = (charData: WikiCharacterDetail) => {
        if (!charData) return;
        const char = charData.character || (charData as any);
        const name = char.full_name || charData.title || (charData as any).full_name;

        // Safety check: Never apply empty dummy data
        if (!name || typeof name !== 'string') return;

        setFullName(name);
        const aliasList = char.aliases || (charData as any).aliases || [];
        setAliases(Array.isArray(aliasList) ? aliasList.join(', ') : String(aliasList || ''));
        setStatus((charData.status as any) || (char as any).status || 'active');
        setSummary(charData.summary || (char as any).summary || '');
        setAvatarUrl(char.avatar_url || (charData as any).avatar_url || '');
        setDateOfBirth(char.date_of_birth || (charData as any).date_of_birth || '');
        setPronouns(char.pronouns || (charData as any).pronouns || '');
        setGender(char.gender || (charData as any).gender || '');
        setNationality(char.nationality || (charData as any).nationality || '');
        setOccupation(char.occupation || (charData as any).occupation || '');
        setEmployer(char.employer || (charData as any).employer || '');
        setGang(char.gang || (charData as any).gang || '');
        setBusiness(char.business || (charData as any).business || '');
        setResidence(char.residence || (charData as any).residence || '');
        setRelationshipStatus(char.relationship_status || (charData as any).relationship_status || '');
        setPlayerName(char.player_name || (charData as any).player_name || '');

        if (Array.isArray(charData.sections) && charData.sections.length > 0) {
          setSections(
            charData.sections.map((s: any, idx: number) => ({
              id: s.id || `sec-${idx}`,
              page_id: s.page_id,
              section_key: s.section_key || `sec_${idx}`,
              title: s.title || `Section ${idx + 1}`,
              content_html: s.content_html || s.content || '',
              sort_order: s.sort_order || idx + 1,
              is_hidden: Boolean(s.is_hidden),
            }))
          );
        }

        if (Array.isArray(charData.relationships) && charData.relationships.length > 0) {
          setRelationships(charData.relationships);
        }

        if (Array.isArray(charData.gallery) && charData.gallery.length > 0) {
          setGallery(
            charData.gallery.map((g: any) => ({
              id: g.id,
              url: g.url || g.image_url || '',
              caption: g.caption || '',
              date_taken: g.date_taken || '',
            }))
          );
        }
      };

      if (localChar) {
        applyData(localChar);
      }

      fetch(getApiUrl(`/api/wiki/characters/${encodeURIComponent(initialSlug)}`))
        .then((res) => {
          if (!res.ok) return null;
          const ct = res.headers.get('content-type') || '';
          return ct.includes('application/json') ? res.json() : null;
        })
        .then((data) => {
          if (data && !data.error && (data.character?.full_name || data.title)) {
            applyData(data);
          } else if (!localChar) {
            const fallback = getFallbackCharacterBySlug(initialSlug);
            if (fallback) applyData(fallback);
          }
        })
        .catch(() => {})
        .finally(() => {
          setLoadingInitial(false);
        });
    } else if (isNew && user) {
      setPlayerName(user.displayName || user.username || '');
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
          getApiUrl(
            `/api/wiki/characters?check_duplicates_only=true&full_name=${encodeURIComponent(
              fullName.trim()
            )}`
          ),
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name: fullName.trim(), check_duplicates_only: true }),
          }
        );
        const ct = res.headers.get('content-type') || '';
        if (res.ok && ct.includes('application/json')) {
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

  // 1-Click Archetype Template Application
  const handleApplyArchetype = (archId: string) => {
    const arch = ARCHETYPES.find((a) => a.id === archId);
    if (!arch) return;

    setSelectedArchetype(arch.id);
    if (arch.defaults.occupation) setOccupation(arch.defaults.occupation);
    if (arch.defaults.gang) setGang(arch.defaults.gang);
    if (arch.defaults.employer) setEmployer(arch.defaults.employer);
    if (arch.defaults.business) setBusiness(arch.defaults.business);
    if (!summary.trim() && arch.defaults.summary) setSummary(arch.defaults.summary);

    if (arch.defaults.sections) {
      setSections(arch.defaults.sections);
    }
    markUnsaved();
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

  const handleApplyDirectImageUrl = () => {
    if (!customImageUrl.trim()) return;
    setAvatarUrl(customImageUrl.trim());
    setCustomImageUrl('');
    setShowUrlInput(false);
    markUnsaved();
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
      const res = await fetch(getApiUrl(`/api/wiki/search?q=${encodeURIComponent(query.trim())}&limit=5`));
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
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

  // Quick Section Adder
  const handleAddQuickSection = (title: string, starterHtml: string) => {
    const key = `section_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
    setSections((prev) => [
      ...prev,
      {
        section_key: key,
        title,
        content_html: starterHtml,
        sort_order: prev.length + 1,
      },
    ]);
    setActiveTab('content');
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
      summary: summary.trim() || `${fullName.trim()} is a resident of Los Santos.`,
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
      player_name: playerName || user?.displayName || user?.username || '',
      sections,
      relationships,
      gallery,
      edit_summary: editSummary || (isNew ? 'Initial character creation' : 'Updated character details'),
      is_draft: isDraft,
    };

    const targetSlug = isNew
      ? payload.full_name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
      : initialSlug || 'character';

    // Construct local character model to guarantee no work is ever lost
    const localCharDetail: WikiCharacterDetail = {
      id: isNew ? `char-${Date.now()}` : initialSlug || `char-${Date.now()}`,
      slug: targetSlug,
      title: payload.full_name,
      entity_type: 'character',
      summary: payload.summary,
      status: payload.status,
      is_archived: false,
      page_views: 1,
      created_by_discord_id: user?.discordId || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      character: {
        page_id: isNew ? `char-${Date.now()}` : initialSlug || `char-${Date.now()}`,
        full_name: payload.full_name,
        aliases: payload.aliases,
        avatar_url: payload.avatar_url,
        date_of_birth: payload.date_of_birth,
        pronouns: payload.pronouns,
        gender: payload.gender,
        nationality: payload.nationality,
        occupation: payload.occupation,
        employer: payload.employer,
        gang: payload.gang,
        business: payload.business,
        residence: payload.residence,
        relationship_status: payload.relationship_status,
        player_name: payload.player_name,
      },
      categories: [],
      sections: payload.sections.map((s, idx) => ({
        id: `sec-${idx}`,
        page_id: isNew ? `char-${Date.now()}` : initialSlug || `char-${Date.now()}`,
        section_key: s.section_key,
        title: s.title,
        content_html: s.content_html,
        sort_order: s.sort_order,
        is_hidden: s.is_hidden,
      })),
      relationships: payload.relationships,
      gallery: payload.gallery,
      backlinks: [],
      related_characters: [],
    };

    try {
      const endpoint = isNew ? '/api/wiki/characters' : `/api/wiki/characters/${encodeURIComponent(initialSlug || '')}`;
      const method = isNew ? 'POST' : 'PUT';

      const { data: authData } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authData?.session?.access_token) {
        headers['Authorization'] = `Bearer ${authData.session.access_token}`;
      }

      const res = await fetch(getApiUrl(endpoint), {
        method,
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        data = await res.json();
      }

      if (!res.ok) {
        if (
          data?.error &&
          (data.error.includes('Unauthorized') ||
            data.error.includes('Forbidden') ||
            data.error.includes('whitelist'))
        ) {
          throw new Error(data.error);
        }
        // Save locally if server database is not yet migrated or offline
        saveLocalCharacter(localCharDetail);
        setSaveStatus('saved');
        window.location.href = `/wiki/characters/${targetSlug}`;
        return;
      }

      if (data?.slug) {
        localCharDetail.slug = data.slug;
        localCharDetail.id = data.id || localCharDetail.id;
      }
      saveLocalCharacter(localCharDetail);
      setSaveStatus('saved');
      window.location.href = `/wiki/characters/${data?.slug || targetSlug}`;
    } catch (err: any) {
      if (
        err.message &&
        (err.message.includes('Unauthorized') ||
          err.message.includes('Forbidden') ||
          err.message.includes('whitelist'))
      ) {
        setErrorMsg(err.message);
        setSaveStatus('unsaved');
      } else {
        // Zero-data-loss fallback: preserve user input locally
        saveLocalCharacter(localCharDetail);
        setSaveStatus('saved');
        window.location.href = `/wiki/characters/${targetSlug}`;
      }
    } finally {
      setSaving(false);
    }
  };

  const previewSlug = (fullName || 'character-name')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-dark-950 text-white flex flex-col justify-between">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-4 pt-40 pb-20 flex flex-col items-center justify-center text-center">
          <Loader2 size={36} className="text-vital-500 animate-spin mb-4" />
          <h2 className="text-xl font-display font-bold text-white mb-2">Loading Character Dossier...</h2>
          <p className="text-sm text-gray-400 font-tech">Retrieving saved information and character history</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white selection:bg-vital-500 selection:text-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 pb-20">
        {/* Editor Top Navigation & Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-8 border-b border-white/5">
          <div className="flex items-center gap-3">
            <a
              href={isNew ? '/wiki/characters' : `/wiki/characters/${initialSlug}`}
              className="p-2.5 rounded-xl bg-dark-900 border border-white/10 text-gray-400 hover:text-white transition-colors"
              title="Go Back"
            >
              <ArrowLeft size={16} />
            </a>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
                  {isNew ? 'Create Character' : `Edit: ${fullName || 'Character'}`}
                </h1>
                <span className="text-[11px] font-tech font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-vital-500/10 text-vital-400 border border-vital-500/20">
                  {isNew ? 'New Entry' : 'Auto-Filled'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs font-tech text-gray-400">
                <span>Save Status:</span>
                {saveStatus === 'saving' && (
                  <span className="flex items-center gap-1 text-vital-400 font-bold">
                    <Loader2 size={12} className="animate-spin" />
                    <span>Saving...</span>
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle2 size={12} />
                    <span>Saved</span>
                  </span>
                )}
                {saveStatus === 'unsaved' && (
                  <span className="text-amber-400 font-bold">Unsaved changes</span>
                )}
                {saveStatus === 'idle' && <span className="text-gray-400">Ready</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick vs Full Dossier Mode Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-dark-900/90 border border-white/10 text-xs font-tech font-bold">
              <button
                type="button"
                onClick={() => setEditorMode('quick')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  editorMode === 'quick'
                    ? 'bg-vital-500 text-dark-950 shadow-md font-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Zap size={13} />
                <span>Quick Start</span>
              </button>
              <button
                type="button"
                onClick={() => setEditorMode('full')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  editorMode === 'full'
                    ? 'bg-vital-500 text-dark-950 shadow-md font-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <BookOpen size={13} />
                <span>Full Dossier</span>
              </button>
            </div>

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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-vital-500 hover:bg-vital-400 text-dark-950 font-display font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all hover:scale-105 disabled:opacity-50"
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

        {/* 1-Click Archetype Templates Bar for New Characters */}
        {isNew && !cachedCharacter && (
          <div className="mb-8 p-5 rounded-3xl bg-gradient-to-r from-dark-900/90 via-dark-850 to-dark-900/90 border border-white/10 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 text-vital-400 text-xs font-tech font-bold uppercase tracking-wider">
                  <Sparkles size={14} />
                  <span>Choose A Roleplay Starter (Optional)</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Click any archetype below to auto-fill common sections, affiliations, and job presets:
                </p>
              </div>
              {selectedArchetype && (
                <button
                  type="button"
                  onClick={() => setSelectedArchetype(null)}
                  className="text-[11px] font-tech text-gray-400 hover:text-white underline self-start sm:self-auto"
                >
                  Clear Starter
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {ARCHETYPES.map((arch) => {
                const Icon = arch.icon;
                const isSelected = selectedArchetype === arch.id;
                return (
                  <button
                    key={arch.id}
                    type="button"
                    onClick={() => handleApplyArchetype(arch.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${arch.color} ${
                      isSelected ? 'ring-2 ring-vital-500 shadow-lg' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-display font-bold text-white flex items-center gap-1.5">
                        <Icon size={14} />
                        <span>{arch.name}</span>
                      </span>
                      <span className="text-[9px] font-tech font-bold uppercase px-1.5 py-0.5 rounded bg-black/40 text-gray-300">
                        {arch.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-snug line-clamp-2">
                      {arch.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Preview Mode Toggle */}
        {previewMode ? (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-vital-500/10 border border-vital-500/20 text-xs text-vital-300 text-center font-tech uppercase tracking-wider flex items-center justify-center gap-2">
              <Eye size={14} />
              <span>Preview Mode Active — Live render of published wiki appearance</span>
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
                  {summary && <p className="mt-4 text-sm text-gray-300 leading-relaxed">{summary}</p>}
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
        ) : editorMode === 'quick' ? (
          /* ========================================================================= */
          /* QUICK START MODE: Streamlined, Frictionless Single-Screen Creation        */
          /* ========================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 8 Cols: Core Character Identity Fields */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-dark-900/70 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div>
                    <h2 className="text-lg font-display font-bold text-white">Character Identity</h2>
                    <p className="text-xs text-gray-400">Fill in the essentials to place your character in the directory.</p>
                  </div>
                  <span className="text-[10px] font-tech text-vital-400 bg-vital-500/10 px-2.5 py-1 rounded-full border border-vital-500/20">
                    Step 1 of 1 (Quick Mode)
                  </span>
                </div>

                {/* Character Name */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-tech font-bold uppercase tracking-wider text-gray-200">
                      Full Character Name <span className="text-vital-500 font-black">*</span>
                    </label>
                    <span className="text-[11px] font-tech text-gray-400">First & Last Name</span>
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      markUnsaved();
                    }}
                    placeholder="e.g. Damon Vox"
                    className="w-full h-12 px-4 rounded-xl bg-dark-800 border border-white/15 text-white text-base font-medium placeholder-gray-500 focus:outline-none focus:border-vital-500 focus:ring-1 focus:ring-vital-500 transition-all"
                  />
                  {duplicateWarning.length > 0 && (
                    <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>
                        Notice: Similar existing characters found: <strong>{duplicateWarning.join(', ')}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Status & Aliases */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-tech font-bold uppercase tracking-wider text-gray-300 mb-2">
                      Roleplay Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value as any);
                        markUnsaved();
                      }}
                      className="w-full h-11 px-3.5 rounded-xl bg-dark-800 border border-white/10 text-white text-xs font-tech focus:outline-none focus:border-vital-500"
                    >
                      <option value="active">Active (Currently in Los Santos)</option>
                      <option value="inactive">Inactive (Taking a break)</option>
                      <option value="deceased">Deceased / CK (Permanently dead)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-tech font-bold uppercase tracking-wider text-gray-300 mb-2">
                      Aliases / Nicknames (Optional)
                    </label>
                    <input
                      type="text"
                      value={aliases}
                      onChange={(e) => {
                        setAliases(e.target.value);
                        markUnsaved();
                      }}
                      placeholder="e.g. The Ghost, Vox"
                      className="w-full h-11 px-3.5 rounded-xl bg-dark-800 border border-white/10 text-white text-xs focus:outline-none focus:border-vital-500"
                    />
                  </div>
                </div>

                {/* Gang & Occupation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-tech font-bold uppercase tracking-wider text-gray-300 mb-2">
                      Gang / Faction / Department
                    </label>
                    <input
                      type="text"
                      value={gang}
                      onChange={(e) => {
                        setGang(e.target.value);
                        markUnsaved();
                      }}
                      placeholder="e.g. Redacted, LSPD, Southside, BCSO"
                      className="w-full h-11 px-3.5 rounded-xl bg-dark-800 border border-white/10 text-white text-xs focus:outline-none focus:border-vital-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-tech font-bold uppercase tracking-wider text-gray-300 mb-2">
                      Occupation / Title
                    </label>
                    <input
                      type="text"
                      value={occupation}
                      onChange={(e) => {
                        setOccupation(e.target.value);
                        markUnsaved();
                      }}
                      placeholder="e.g. Senior Detective, Mechanic, Hustler"
                      className="w-full h-11 px-3.5 rounded-xl bg-dark-800 border border-white/10 text-white text-xs focus:outline-none focus:border-vital-500"
                    />
                  </div>
                </div>

                {/* Short Bio / Summary */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-tech font-bold uppercase tracking-wider text-gray-300">
                      Short Overview & Bio
                    </label>
                    <span className="text-[11px] font-tech text-gray-500">1-2 sentences for search cards</span>
                  </div>
                  <textarea
                    rows={3}
                    value={summary}
                    onChange={(e) => {
                      setSummary(e.target.value);
                      markUnsaved();
                    }}
                    placeholder="Describe your character's roleplay background, reputation, or general demeanor..."
                    className="w-full p-3.5 rounded-xl bg-dark-800 border border-white/10 text-white text-xs leading-relaxed focus:outline-none focus:border-vital-500 placeholder-gray-500"
                  />
                </div>

                {/* Upgrade prompt to In-Depth Dossier */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-display font-bold text-white">Want to add backstory chapters or photos?</h4>
                    <p className="text-[11px] text-gray-400">
                      Switch to Full Dossier to write chapters with @mentions, link character relationships, and upload photo galleries.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditorMode('full')}
                    className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-tech font-bold uppercase tracking-wider transition-colors shrink-0"
                  >
                    Open Full Dossier
                  </button>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Live Card Preview & Portrait Uploader */}
            <div className="lg:col-span-4 space-y-6">
              {/* Photo Box */}
              <div className="bg-dark-900/70 border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center shadow-xl">
                <div className="text-xs font-tech font-bold uppercase tracking-wider text-gray-300 mb-3">
                  Character Portrait
                </div>

                <div className="relative aspect-[3/4] w-full max-w-[200px] rounded-2xl overflow-hidden bg-dark-800 border border-white/10 shadow-lg mb-4">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={fullName || 'Avatar'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-gray-500">
                      <User size={40} className="mb-2 opacity-40 text-vital-500" />
                      <span className="text-[11px] font-tech text-gray-400">No Photo Uploaded</span>
                    </div>
                  )}

                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-2">
                      <Loader2 size={24} className="animate-spin text-vital-500" />
                      <span className="text-xs text-vital-400 font-tech font-bold">Uploading...</span>
                    </div>
                  )}
                </div>

                <div className="w-full space-y-2">
                  <label className="w-full py-2.5 px-4 rounded-xl bg-vital-500/20 hover:bg-vital-500/30 text-vital-400 border border-vital-500/40 text-xs font-tech font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm">
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

                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="w-full py-1.5 text-[11px] font-tech text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1"
                  >
                    <Link2 size={12} />
                    <span>{showUrlInput ? 'Cancel Image Link' : 'Or Paste Direct Image URL'}</span>
                  </button>

                  {showUrlInput && (
                    <div className="p-2.5 rounded-xl bg-dark-800 border border-white/10 space-y-2">
                      <input
                        type="url"
                        value={customImageUrl}
                        onChange={(e) => setCustomImageUrl(e.target.value)}
                        placeholder="https://... image link"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-dark-900 border border-white/10 text-white focus:outline-none focus:border-vital-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyDirectImageUrl}
                        className="w-full py-1 rounded-lg bg-vital-500 text-dark-950 font-tech font-bold text-xs uppercase"
                      >
                        Apply Image URL
                      </button>
                    </div>
                  )}

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarUrl('');
                        markUnsaved();
                      }}
                      className="w-full py-1.5 text-[11px] font-tech text-red-400 hover:text-red-300 transition-colors"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>

              {/* Live Directory Card Preview */}
              <div className="bg-dark-900/70 border border-white/10 rounded-3xl p-6 space-y-3 shadow-xl">
                <div className="flex items-center justify-between text-xs font-tech font-bold uppercase tracking-wider text-gray-400">
                  <span>Directory Card Preview</span>
                  <span className="text-[10px] text-vital-400">Live</span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-dark-800/80 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        avatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          fullName || 'Character'
                        )}&background=f97316&color=fff&size=256`
                      }
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-display font-bold text-white truncate">
                        {fullName || 'Character Name'}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[9px] font-tech font-bold uppercase px-1.5 py-0.2 rounded ${
                            status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : status === 'deceased'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {status}
                        </span>
                        {(gang || occupation) && (
                          <span className="text-[10px] text-gray-400 truncate">
                            {gang || occupation}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                    {summary || 'No summary entered yet.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-tech text-gray-500">
                  <span>Slug Preview:</span>
                  <span className="text-vital-400 font-mono text-[10px] truncate max-w-[160px]">
                    /wiki/characters/{previewSlug}
                  </span>
                </div>
              </div>

              {/* Ready to Publish Button */}
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="w-full py-3.5 rounded-2xl bg-vital-500 hover:bg-vital-400 text-dark-950 font-display font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(249,115,22,0.4)] transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>{isNew ? 'Publish Character Now' : 'Save Character Changes'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* FULL DOSSIER MODE: Rich Tabs for Demographics, Sections, Relations, Photos */
          /* ========================================================================= */
          <div className="space-y-8">
            <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto scrollbar-none">
              {[
                { id: 'basic', label: 'Identity & Details', icon: User },
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
                        ? 'bg-vital-500 text-dark-950 shadow-md font-black'
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
                      Full Character Name <span className="text-vital-500 font-bold">*</span>
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

                  {/* Status & Pronouns / DOB */}
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
                        placeholder="e.g. He/Him, She/Her"
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
                        placeholder="e.g. 1994-08-12"
                        className="w-full h-11 px-3 rounded-xl bg-dark-800 border border-white/10 text-white text-xs focus:outline-none focus:border-vital-500"
                      />
                    </div>
                  </div>

                  {/* Gender & Nationality */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-tech font-bold uppercase tracking-wider text-gray-300 mb-2">
                        Gender Identity
                      </label>
                      <input
                        type="text"
                        value={gender}
                        onChange={(e) => {
                          setGender(e.target.value);
                          markUnsaved();
                        }}
                        placeholder="e.g. Male, Female, Non-Binary"
                        className="w-full h-11 px-3 rounded-xl bg-dark-800 border border-white/10 text-white text-xs focus:outline-none focus:border-vital-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-tech font-bold uppercase tracking-wider text-gray-300 mb-2">
                        Nationality / Origin
                      </label>
                      <input
                        type="text"
                        value={nationality}
                        onChange={(e) => {
                          setNationality(e.target.value);
                          markUnsaved();
                        }}
                        placeholder="e.g. American, Irish, Italian, Japanese"
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
                        Occupation / Role
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

                  {/* Employer & Business */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-tech font-bold uppercase tracking-wider text-gray-300 mb-2">
                        Primary Employer
                      </label>
                      <input
                        type="text"
                        value={employer}
                        onChange={(e) => {
                          setEmployer(e.target.value);
                          markUnsaved();
                        }}
                        placeholder="e.g. Benny's Original Motorworks"
                        className="w-full h-11 px-3 rounded-xl bg-dark-800 border border-white/10 text-white text-xs focus:outline-none focus:border-vital-500"
                      />
                    </div>

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
                        placeholder="e.g. Eclipse Lounge, Vox Automotive"
                        className="w-full h-11 px-3 rounded-xl bg-dark-800 border border-white/10 text-white text-xs focus:outline-none focus:border-vital-500"
                      />
                    </div>
                  </div>

                  {/* Residence & Relationship Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        placeholder="e.g. Vinewood Hills, Mirror Park"
                        className="w-full h-11 px-3 rounded-xl bg-dark-800 border border-white/10 text-white text-xs focus:outline-none focus:border-vital-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-tech font-bold uppercase tracking-wider text-gray-300 mb-2">
                        Relationship Status
                      </label>
                      <input
                        type="text"
                        value={relationshipStatus}
                        onChange={(e) => {
                          setRelationshipStatus(e.target.value);
                          markUnsaved();
                        }}
                        placeholder="e.g. Single, Married, Complicated"
                        className="w-full h-11 px-3 rounded-xl bg-dark-800 border border-white/10 text-white text-xs focus:outline-none focus:border-vital-500"
                      />
                    </div>
                  </div>

                  {/* Player Name */}
                  <div>
                    <label className="block text-xs font-tech font-bold uppercase tracking-wider text-gray-300 mb-2">
                      Played By (Discord / Streamer Name)
                    </label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => {
                        setPlayerName(e.target.value);
                        markUnsaved();
                      }}
                      placeholder="e.g. Discord username or Twitch handle"
                      className="w-full h-11 px-3 rounded-xl bg-dark-800 border border-white/10 text-white text-xs focus:outline-none focus:border-vital-500"
                    />
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

                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="w-full py-1 text-[11px] font-tech text-gray-400 hover:text-white transition-colors"
                    >
                      {showUrlInput ? 'Hide URL Input' : 'Or Paste Direct Image URL'}
                    </button>

                    {showUrlInput && (
                      <div className="p-2.5 rounded-xl bg-dark-800 border border-white/10 space-y-2 text-left">
                        <input
                          type="url"
                          value={customImageUrl}
                          onChange={(e) => setCustomImageUrl(e.target.value)}
                          placeholder="https://... image link"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-dark-900 border border-white/10 text-white focus:outline-none focus:border-vital-500"
                        />
                        <button
                          type="button"
                          onClick={handleApplyDirectImageUrl}
                          className="w-full py-1 rounded-lg bg-vital-500 text-dark-950 font-tech font-bold text-xs uppercase"
                        >
                          Apply URL
                        </button>
                      </div>
                    )}

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
                    JPG, PNG, WebP up to 10MB. Images hosted on FiveManage CDN.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: RICH TEXT SECTIONS & @ MENTIONS */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                {/* Helpful Section Quick Adder */}
                <div className="p-5 rounded-3xl bg-dark-900/60 border border-white/10 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <span className="text-xs font-tech font-bold uppercase tracking-wider text-vital-400">
                        Add Quick Pre-Made Section
                      </span>
                      <p className="text-[11px] text-gray-400">
                        Click any section type to add formatted structure to your character story:
                      </p>
                    </div>
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-vital-500/10 text-vital-400 border border-vital-500/30 text-xs font-tech font-bold uppercase tracking-wider hover:bg-vital-500/20 self-start sm:self-auto"
                    >
                      <Plus size={13} />
                      <span>Custom Section</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {[
                      {
                        title: 'Origin & Early Life',
                        html: '<p>Where they grew up, formative events, and how they first arrived in Los Santos.</p>',
                      },
                      {
                        title: 'Criminal Record & Major Heists',
                        html: '<p>Documented arrests, charges, bank robberies, and active street conflicts.</p>',
                      },
                      {
                        title: 'Career & Department Record',
                        html: '<p>Employment history, promotions, certifications, and service commendations.</p>',
                      },
                      {
                        title: 'Vehicles & Real Estate Assets',
                        html: '<p>Owned vehicles, garage inventory, apartments, and commercial real estate.</p>',
                      },
                      {
                        title: 'Quotes & Notable Moments',
                        html: '<p>Famous quotes, iconic radio calls, and memorable roleplay interactions.</p>',
                      },
                    ].map((sec) => (
                      <button
                        key={sec.title}
                        type="button"
                        onClick={() => handleAddQuickSection(sec.title, sec.html)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-vital-500/20 text-gray-300 hover:text-vital-400 border border-white/10 hover:border-vital-500/30 text-xs font-tech transition-colors"
                      >
                        + {sec.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-dark-900/40 border border-white/5 text-xs text-gray-400 flex items-center justify-between">
                  <span>
                    Tip: Type <strong className="text-vital-400">@</strong> to mention any Vital Wiki
                    character. Type <strong className="text-vital-400">/</strong> for rich-text commands.
                  </span>
                  <span className="text-[10px] font-tech text-gray-500">{sections.length} Sections</span>
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
                  placeholder="e.g. Added Pacific Standard heist details, updated relationship"
                  className="w-full h-9 px-3 rounded-lg bg-dark-800 border border-white/10 text-white text-xs focus:outline-none focus:border-vital-500"
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-vital-500 hover:bg-vital-400 text-dark-950 font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-vital-500/25 transition-all hover:scale-105 disabled:opacity-50"
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
