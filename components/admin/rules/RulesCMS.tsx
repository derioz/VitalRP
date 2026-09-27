'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Layers,
  History,
  UploadCloud,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  Trash2,
  Copy,
  Eye,
  Smartphone,
  Monitor,
  Save,
  X,
  ChevronRight,
  FolderPlus,
  Sparkles,
  ArrowUpDown,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  AlertTriangle,
  Info,
  Clock,
  ExternalLink,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { DbRule, DbRuleCategory, DbRuleDraft, StagedChangeSummary, DbRuleVersion } from '@/lib/rules/supabase-rules';
import { RuleCallout } from '@/data/rules';
import {
  getClientRulesData,
  syncExistingRulesToSupabase,
  saveClientRuleDraft,
  discardClientRuleDraft,
  deleteClientRule,
  getClientStagedChanges,
  publishClientStagedChanges,
  getClientVersions,
  rollbackClientToVersion,
  saveClientCategory,
} from '@/lib/rules/client-rules-service';

export const RulesCMS: React.FC = () => {
  const { user, isSuperAdmin, hasPermission } = useAuth();
  const canEdit = hasPermission('rules.edit');
  const canPublish = hasPermission('rules.publish');
  const canViewHistory = hasPermission('rules.history');

  // Core CMS state
  const [categories, setCategories] = useState<DbRuleCategory[]>([]);
  const [rules, setRules] = useState<DbRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Metadata stats
  const [stats, setStats] = useState({
    draftsCount: 0,
    publishedCount: 0,
    currentVersion: 1,
    lastPublishedAt: '',
    lastPublishedBy: '',
  });

  // Navigation & Filtering
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'modified' | 'draft' | 'archived'>('all');
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);

  // Editor Drawer State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<DbRule> | null>(null);
  const [editorTab, setEditorTab] = useState<'write' | 'preview'>('write');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Modals
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isRuleHistoryModalOpen, setIsRuleHistoryModalOpen] = useState(false);
  const [inspectingRuleId, setInspectingRuleId] = useState<string | null>(null);

  // Staged changes & version state
  const [stagedChanges, setStagedChanges] = useState<StagedChangeSummary[]>([]);
  const [publishNote, setPublishNote] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [versions, setVersions] = useState<DbRuleVersion[]>([]);
  const [rollingBack, setRollingBack] = useState(false);
  const [ruleChangelog, setRuleChangelog] = useState<any[]>([]);

  // Category Edit state
  const [categoryForm, setCategoryForm] = useState<{ id: string; title: string; description: string; icon: string }>({
    id: '',
    title: '',
    description: '',
    icon: 'ShieldAlert',
  });

  // Fetch initial data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getClientRulesData();
      setCategories(data.categories || []);
      setRules(data.rules || []);
      setStats({
        draftsCount: data.draftsCount || 0,
        publishedCount: data.publishedCount || 0,
        currentVersion: data.currentVersion || 1,
        lastPublishedAt: data.lastPublishedAt || '',
        lastPublishedBy: data.lastPublishedBy || 'Staff',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load rules CMS data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Keyboard shortcut listener (Ctrl+S to save, Ctrl+K to search)
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isEditorOpen && editingRule) {
          handleSaveDraft();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditorOpen, editingRule]);

  // Filtered Rules computation
  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      // Category filter
      if (selectedCategoryId !== 'all' && r.category_id !== selectedCategoryId) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'archived' && !r.deleted_at) return false;
        if (statusFilter === 'published' && (r.has_draft || !r.enabled || r.deleted_at)) return false;
        if (statusFilter === 'modified' && (!r.has_draft || r.draft_action === 'delete')) return false;
        if (statusFilter === 'draft' && (!r.has_draft || r.draft_action !== 'create')) return false;
      } else {
        // By default in 'all', hide soft-deleted unless statusFilter === 'archived'
        if (r.deleted_at) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesNumber = r.rule_number?.toString().includes(q);
        const matchesContent = r.content.toLowerCase().includes(q);
        const matchesSummary = r.short_description?.toLowerCase().includes(q);
        const matchesAlias = r.aliases?.some((a) => a.toLowerCase().includes(q));
        if (!matchesTitle && !matchesNumber && !matchesContent && !matchesSummary && !matchesAlias) {
          return false;
        }
      }
      return true;
    });
  }, [rules, selectedCategoryId, statusFilter, searchQuery]);

  // Open Editor for Creating a New Rule
  const handleCreateNewRule = () => {
    const defaultCat = selectedCategoryId !== 'all' ? selectedCategoryId : categories[0]?.id || 'general';
    setEditingRule({
      id: `rule-${Date.now()}`,
      category_id: defaultCat,
      rule_number: rules.length + 1,
      title: '',
      short_title: '',
      short_description: '',
      content: '',
      aliases: [],
      featured: false,
      severity: 'standard',
      callouts: [],
      sort_order: rules.length + 1,
      enabled: true,
      has_draft: true,
      draft_action: 'create',
    });
    setEditorTab('write');
    setSaveStatus('unsaved');
    setHasUnsavedChanges(false);
    setIsEditorOpen(true);
  };

  // Open Editor for Editing an Existing Rule
  const handleEditRule = (rule: DbRule) => {
    setEditingRule({ ...rule });
    setEditorTab('write');
    setSaveStatus('saved');
    setHasUnsavedChanges(false);
    setIsEditorOpen(true);
  };

  // Duplicate an Existing Rule
  const handleDuplicateRule = (rule: DbRule) => {
    setEditingRule({
      ...rule,
      id: `${rule.id}-copy-${Date.now()}`,
      title: `${rule.title} (Copy)`,
      short_title: `${rule.short_title || rule.title} (Copy)`,
      rule_number: (rule.rule_number || 0) + 1,
      has_draft: true,
      draft_action: 'create',
    });
    setEditorTab('write');
    setSaveStatus('unsaved');
    setHasUnsavedChanges(true);
    setIsEditorOpen(true);
  };

  // Quick reorder rules inside current category
  const handleQuickReorder = async (rule: DbRule, direction: 'up' | 'down') => {
    if (!canEdit) return;
    const catRules = rules
      .filter((r) => r.category_id === rule.category_id && !r.deleted_at)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const currentIndex = catRules.findIndex((r) => r.id === rule.id);
    if (currentIndex < 0) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= catRules.length) return;

    const targetRule = catRules[targetIndex];
    const currentOrder = rule.sort_order || currentIndex + 1;
    const targetOrder = targetRule.sort_order || targetIndex + 1;

    try {
      await Promise.all([
        saveClientRuleDraft(
          {
            rule_id: rule.id,
            category_id: rule.category_id,
            rule_number: rule.rule_number,
            title: rule.title,
            content: rule.content,
            sort_order: targetOrder === currentOrder ? (direction === 'up' ? currentOrder - 1 : currentOrder + 1) : targetOrder,
            action: 'update',
          },
          { discordId: user?.discordId || '150580708144840704', displayName: user?.displayName || 'Damon' }
        ),
        saveClientRuleDraft(
          {
            rule_id: targetRule.id,
            category_id: targetRule.category_id,
            rule_number: targetRule.rule_number,
            title: targetRule.title,
            content: targetRule.content,
            sort_order: currentOrder,
            action: 'update',
          },
          { discordId: user?.discordId || '150580708144840704', displayName: user?.displayName || 'Damon' }
        ),
      ]);
      await fetchData();
    } catch (err: any) {
      alert(`Reordering failed: ${err.message}`);
    }
  };

  // Manually trigger idempotent Supabase seed / sync
  const [isSyncing, setIsSyncing] = useState(false);
  const handleSyncRules = async (force = false) => {
    if (!canEdit) return;
    if (force && !confirm('Syncing will import all 31 website rules and 9 categories into Supabase. Existing drafts will be preserved. Proceed?')) {
      return;
    }
    setIsSyncing(true);
    try {
      const res = await syncExistingRulesToSupabase(
        { discordId: user?.discordId || '150580708144840704', displayName: user?.displayName || 'Damon' },
        force
      );
      alert(res.message || 'Rules successfully imported/synchronized with Supabase!');
      await fetchData();
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Autosave / Manual Save Draft handler
  const handleSaveDraft = async () => {
    if (!editingRule || !editingRule.title || !editingRule.content) {
      alert('Please fill out both the Rule Title and Content.');
      return;
    }
    setSaveStatus('saving');
    try {
      await saveClientRuleDraft(
        {
          rule_id: editingRule.id || `rule-${Date.now()}`,
          category_id: editingRule.category_id || 'general',
          rule_number: editingRule.rule_number,
          title: editingRule.title,
          short_title: editingRule.short_title || editingRule.title,
          short_description: editingRule.short_description || '',
          content: editingRule.content,
          aliases: editingRule.aliases || [],
          featured: Boolean(editingRule.featured),
          core_rule_number: editingRule.core_rule_number,
          severity: editingRule.severity || 'standard',
          callouts: editingRule.callouts || [],
          sort_order: editingRule.sort_order || 0,
          enabled: editingRule.enabled ?? true,
          action: editingRule.draft_action || 'update',
        },
        { discordId: user?.discordId || '150580708144840704', displayName: user?.displayName || 'Damon' }
      );

      setSaveStatus('saved');
      setHasUnsavedChanges(false);
      await fetchData();
    } catch (err: any) {
      setSaveStatus('unsaved');
      alert(`Error saving draft: ${err.message}`);
    }
  };

  // Discard draft
  const handleDiscardDraft = async (ruleId: string) => {
    if (!confirm('Are you sure you want to discard unstaged changes for this rule?')) return;
    try {
      await discardClientRuleDraft(ruleId);
      if (isEditorOpen && editingRule?.id === ruleId) {
        setIsEditorOpen(false);
      }
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Soft delete / Stage deletion
  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to mark this rule for deletion upon publishing?')) return;
    try {
      await deleteClientRule(ruleId, {
        discordId: user?.discordId || '150580708144840704',
        displayName: user?.displayName || 'Damon',
      });
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Open Publish Changes Center
  const handleOpenPublishCenter = async () => {
    try {
      const summary = await getClientStagedChanges();
      setStagedChanges(summary);
    } catch {
      setStagedChanges([]);
    }
    setPublishNote('');
    setIsPublishModalOpen(true);
  };

  // Execute Publishing
  const handlePublishLive = async () => {
    if (!canPublish) {
      alert('You do not have permission to publish rules.');
      return;
    }
    setPublishing(true);
    try {
      const res = await publishClientStagedChanges(publishNote, {
        discordId: user?.discordId || '150580708144840704',
        displayName: user?.displayName || 'Damon',
      });
      setIsPublishModalOpen(false);
      await fetchData();
      alert(`Version ${res.versionNumber} successfully published to production!`);
    } catch (err: any) {
      alert(`Publish error: ${err.message}`);
    } finally {
      setPublishing(false);
    }
  };

  // Open Version History Modal
  const handleOpenVersionHistory = async () => {
    try {
      const versions = await getClientVersions();
      setVersions(versions);
    } catch {
      setVersions([]);
    }
    setIsHistoryModalOpen(true);
  };

  // Rollback to specific version
  const handleRollback = async (versionNumber: number) => {
    if (!confirm(`Warning: You are about to restore Rules Version ${versionNumber}. A new published version will be created from this snapshot. Continue?`)) {
      return;
    }
    setRollingBack(true);
    try {
      const res = await rollbackClientToVersion(versionNumber, {
        discordId: user?.discordId || '150580708144840704',
        displayName: user?.displayName || 'Damon',
      });
      setIsHistoryModalOpen(false);
      await fetchData();
      alert(`Successfully restored Version ${versionNumber}! Created new active Version ${res.newVersionNumber}.`);
    } catch (err: any) {
      alert(`Rollback error: ${err.message}`);
    } finally {
      setRollingBack(false);
    }
  };

  // View rule-level changelog
  const handleOpenRuleHistory = async (ruleId: string) => {
    setInspectingRuleId(ruleId);
    try {
      const res = await fetch(`/api/admin/rules/history?ruleId=${ruleId}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setRuleChangelog(data.history || []);
      } else {
        setRuleChangelog([]);
      }
    } catch {
      setRuleChangelog([]);
    }
    setIsRuleHistoryModalOpen(true);
  };

  // Category save
  const handleSaveCategory = async () => {
    if (!categoryForm.title) {
      alert('Please enter a category title.');
      return;
    }
    const catId = categoryForm.id || categoryForm.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    try {
      await saveClientCategory({
        id: catId,
        title: categoryForm.title,
        description: categoryForm.description,
        icon: categoryForm.icon,
      });
      setIsCategoryModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Add Callout item in Editor
  const handleAddCallout = (type: RuleCallout['type']) => {
    if (!editingRule) return;
    const current = editingRule.callouts || [];
    const newCallout: RuleCallout = {
      type,
      title: type === 'WARNING' ? 'Important Warning' : type === 'EXAMPLE' ? 'Roleplay Example' : 'Note',
      text: '',
    };
    setEditingRule({ ...editingRule, callouts: [...current, newCallout] });
    setHasUnsavedChanges(true);
  };

  // Formatting helpers for text area
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('rule-content-textarea') as HTMLTextAreaElement;
    if (!textarea || !editingRule) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editingRule.content || '';
    const selected = text.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setEditingRule({ ...editingRule, content: newContent });
    setHasUnsavedChanges(true);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 4));
    }, 50);
  };

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* CMS Dashboard Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-900 via-dark-900 to-dark-950 border border-white/5 p-6 lg:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-vital-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-vital-500/15 border border-vital-500/30 flex items-center justify-center text-vital-500 shadow-[0_0_25px_rgba(249,115,22,0.2)] shrink-0">
              <BookOpen size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl lg:text-3xl font-black text-white font-display tracking-wide">
                  Rules CMS
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-vital-500/10 border border-vital-500/30 text-vital-400 text-xs font-bold font-tech uppercase">
                  Version {stats.currentVersion}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1 max-w-xl">
                Live Supabase-backed rules administration with version snapshots, staging drafts, and zero-downtime publishing.
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            {canViewHistory && (
              <button
                onClick={handleOpenVersionHistory}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all text-xs font-bold"
              >
                <History size={16} />
                <span>Versions</span>
              </button>
            )}

            {canPublish && (
              <button
                onClick={handleOpenPublishCenter}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-vital-500 to-vital-600 hover:from-vital-400 hover:to-vital-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all relative overflow-hidden"
              >
                <UploadCloud size={16} />
                <span>Publish Changes</span>
                {stats.draftsCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-dark-950 text-vital-400 text-[10px] font-black flex items-center justify-center ml-1">
                    {stats.draftsCount}
                  </span>
                )}
              </button>
            )}

            {canEdit && (
              <button
                onClick={() => handleSyncRules(true)}
                disabled={isSyncing}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all text-xs font-bold disabled:opacity-50"
                title="Verify and import all existing website rules into Supabase"
              >
                <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Supabase'}</span>
              </button>
            )}

            {canEdit && (
              <button
                onClick={handleCreateNewRule}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all"
              >
                <Plus size={16} />
                <span>New Rule</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/5">
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
            <span className="text-xs text-gray-400 font-medium">Published Rules</span>
            <div className="text-xl font-bold text-white mt-1">{stats.publishedCount}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
            <span className="text-xs text-gray-400 font-medium">Rule Categories</span>
            <div className="text-xl font-bold text-white mt-1">{categories.length}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
            <span className="text-xs text-gray-400 font-medium">Unpublished Edits</span>
            <div className="text-xl font-bold text-vital-400 mt-1 flex items-center gap-2">
              {stats.draftsCount}
              {stats.draftsCount > 0 && <span className="w-2 h-2 rounded-full bg-vital-500 animate-pulse" />}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
            <span className="text-xs text-gray-400 font-medium">Last Published By</span>
            <div className="text-sm font-bold text-white mt-1 truncate">
              {stats.lastPublishedBy || 'Space'}
            </div>
          </div>
        </div>
      </div>

      {/* Main CMS Multi-Panel Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Panel: Categories & Filtering */}
        <div className="lg:col-span-4 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search rules, aliases, keywords... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-900 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-vital-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex gap-1.5 p-1 bg-dark-900 border border-white/5 rounded-2xl overflow-x-auto custom-scrollbar">
            {(['all', 'published', 'modified', 'draft', 'archived'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                  statusFilter === tab
                    ? 'bg-vital-500 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab === 'all' ? 'All' : tab}
              </button>
            ))}
          </div>

          {/* Categories Selector Box */}
          <div className="bg-dark-900 border border-white/5 rounded-3xl p-4 space-y-2">
            <div className="flex items-center justify-between px-2 pb-2 border-b border-white/5">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-tech">
                Categories
              </span>
              {canEdit && (
                <button
                  onClick={() => {
                    setCategoryForm({ id: '', title: '', description: '', icon: 'ShieldAlert' });
                    setIsCategoryModalOpen(true);
                  }}
                  className="text-xs text-vital-400 hover:text-vital-300 font-bold flex items-center gap-1"
                >
                  <Plus size={12} />
                  <span>Add</span>
                </button>
              )}
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategoryId('all')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  selectedCategoryId === 'all'
                    ? 'bg-white/10 text-white font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers size={14} className="text-vital-500" />
                  <span>All Categories</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                  {rules.length}
                </span>
              </button>

              {categories.map((cat) => {
                const count = rules.filter((r) => r.category_id === cat.id && !r.deleted_at).length;
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-vital-500/15 border border-vital-500/30 text-white font-bold'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <span className="truncate">{cat.title}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 ml-2">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center Panel: Rules List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {selectedCategoryId === 'all'
                  ? 'All Rules'
                  : categories.find((c) => c.id === selectedCategoryId)?.title || 'Selected Category'}
              </span>
              <span className="text-xs text-gray-500">({filteredRules.length} rules)</span>
            </div>

            {canEdit && (
              <button
                onClick={handleCreateNewRule}
                className="text-xs font-bold text-vital-400 hover:text-vital-300 flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Add Rule</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 bg-dark-900 border border-white/5 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-dark-900 border border-white/5 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 text-gray-500 flex items-center justify-center mx-auto">
                <BookOpen size={24} />
              </div>
              <h3 className="text-base font-bold text-white">No rules found</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                {searchQuery
                  ? `No rules matched your search query "${searchQuery}".`
                  : 'There are no rules in this category yet.'}
              </p>
              {canEdit && (
                <button
                  onClick={handleCreateNewRule}
                  className="px-4 py-2 rounded-xl bg-vital-500 hover:bg-vital-400 text-white font-bold text-xs transition-colors mt-2"
                >
                  Create Rule
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRules.map((rule) => {
                const categoryObj = categories.find((c) => c.id === rule.category_id);
                return (
                  <div
                    key={rule.id}
                    className={`group p-4 rounded-2xl bg-dark-900/90 border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      rule.has_draft
                        ? 'border-vital-500/40 bg-vital-500/[0.02] shadow-[0_0_15px_rgba(249,115,22,0.05)]'
                        : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center font-tech font-bold text-xs text-gray-300 shrink-0 mt-0.5">
                        #{rule.rule_number || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white group-hover:text-vital-400 transition-colors truncate">
                            {rule.title}
                          </h4>

                          {/* Status Badge */}
                          {rule.deleted_at ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase">
                              Deleted
                            </span>
                          ) : rule.has_draft ? (
                            <span className="px-2 py-0.5 rounded-full bg-vital-500/20 text-vital-400 border border-vital-500/30 text-[10px] font-bold uppercase flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-vital-400 animate-pulse" />
                              {rule.draft_action === 'create' ? 'Draft' : 'Modified'}
                            </span>
                          ) : rule.enabled ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
                              Live
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30 text-[10px] font-bold uppercase">
                              Disabled
                            </span>
                          )}

                          {rule.featured && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase">
                              Core
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                          {rule.short_description || rule.content}
                        </p>

                        <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
                          <span>{categoryObj?.title || rule.category_id}</span>
                          {rule.aliases && rule.aliases.length > 0 && (
                            <>
                              <span>•</span>
                              <span>Aliases: {rule.aliases.slice(0, 3).join(', ')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      {rule.has_draft && (
                        <button
                          onClick={() => handleDiscardDraft(rule.id)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-gray-400 transition-colors"
                          title="Discard Staged Draft"
                        >
                          <RotateCcw size={15} />
                        </button>
                      )}

                      {canViewHistory && (
                        <button
                          onClick={() => handleOpenRuleHistory(rule.id)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          title="Rule History"
                        >
                          <History size={15} />
                        </button>
                      )}

                      {canEdit && (
                        <>
                          <div className="flex flex-col gap-0.5 mr-1">
                            <button
                              onClick={() => handleQuickReorder(rule, 'up')}
                              className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                              title="Move Rule Up in Order"
                            >
                              <ChevronUp size={13} />
                            </button>
                            <button
                              onClick={() => handleQuickReorder(rule, 'down')}
                              className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                              title="Move Rule Down in Order"
                            >
                              <ChevronDown size={13} />
                            </button>
                          </div>

                          <button
                            onClick={() => handleDuplicateRule(rule)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            title="Duplicate Rule"
                          >
                            <Copy size={15} />
                          </button>

                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-gray-400 transition-colors"
                            title="Delete Rule"
                          >
                            <Trash2 size={15} />
                          </button>

                          <button
                            onClick={() => handleEditRule(rule)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-vital-500/15 hover:bg-vital-500 text-vital-400 hover:text-dark-950 font-bold text-xs transition-colors border border-vital-500/30 ml-1"
                          >
                            <FileEdit size={14} />
                            <span>Edit</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EXPANSIVE RULE EDITOR DRAWER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isEditorOpen && editingRule && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (hasUnsavedChanges) {
                  if (!confirm('You have unsaved changes. Discard and close?')) return;
                }
                setIsEditorOpen(false);
              }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full max-w-2xl bg-dark-900 border-l border-white/10 shadow-2xl flex flex-col h-full z-10 overflow-hidden"
            >
              {/* Editor Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-dark-950/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-vital-500/15 border border-vital-500/30 text-vital-500 flex items-center justify-center">
                    <FileEdit size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {editingRule.title ? editingRule.title : 'New Server Rule'}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                      <span className="font-tech font-bold uppercase text-vital-400">
                        {editingRule.draft_action === 'create' ? 'Creating New Rule' : 'Editing Draft'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {saveStatus === 'saving' && <span className="text-vital-400 animate-pulse">Saving...</span>}
                        {saveStatus === 'saved' && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12} /> Staged</span>}
                        {saveStatus === 'unsaved' && <span className="text-amber-400">Unsaved changes</span>}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveDraft}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-vital-500 hover:bg-vital-400 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    <Save size={14} />
                    <span>Save Draft</span>
                  </button>
                  <button
                    onClick={() => {
                      if (hasUnsavedChanges && !confirm('You have unsaved changes. Discard and close?')) return;
                      setIsEditorOpen(false);
                    }}
                    className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Editor Tabs & Device Preview Controls */}
              <div className="px-6 py-2.5 bg-dark-900 border-b border-white/5 flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditorTab('write')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      editorTab === 'write' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Write & Format
                  </button>
                  <button
                    onClick={() => setEditorTab('preview')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                      editorTab === 'preview' ? 'bg-vital-500/20 text-vital-400 border border-vital-500/30' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Eye size={13} />
                    <span>Live Preview</span>
                  </button>
                </div>

                {editorTab === 'preview' && (
                  <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg">
                    <button
                      onClick={() => setPreviewDevice('desktop')}
                      className={`p-1.5 rounded text-xs ${previewDevice === 'desktop' ? 'bg-white/10 text-white' : 'text-gray-400'}`}
                      title="Desktop View"
                    >
                      <Monitor size={14} />
                    </button>
                    <button
                      onClick={() => setPreviewDevice('mobile')}
                      className={`p-1.5 rounded text-xs ${previewDevice === 'mobile' ? 'bg-white/10 text-white' : 'text-gray-400'}`}
                      title="Mobile View"
                    >
                      <Smartphone size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Editor Form Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                {editorTab === 'write' ? (
                  <>
                    {/* Basic Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                          Rule Title *
                        </label>
                        <input
                          type="text"
                          value={editingRule.title || ''}
                          onChange={(e) => {
                            setEditingRule({ ...editingRule, title: e.target.value });
                            setHasUnsavedChanges(true);
                          }}
                          placeholder="e.g. Value of Life (FearRP)"
                          className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-vital-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                          Rule Number
                        </label>
                        <input
                          type="number"
                          value={editingRule.rule_number || ''}
                          onChange={(e) => {
                            setEditingRule({ ...editingRule, rule_number: Number(e.target.value) });
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-vital-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                          Category
                        </label>
                        <select
                          value={editingRule.category_id}
                          onChange={(e) => {
                            setEditingRule({ ...editingRule, category_id: e.target.value });
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-vital-500"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                          Severity / Core Status
                        </label>
                        <div className="flex items-center gap-3 h-[42px]">
                          <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(editingRule.featured)}
                              onChange={(e) => {
                                setEditingRule({ ...editingRule, featured: e.target.checked });
                                setHasUnsavedChanges(true);
                              }}
                              className="rounded border-white/20 text-vital-500 focus:ring-vital-500"
                            />
                            <span>Featured Core Rule</span>
                          </label>

                          <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editingRule.enabled ?? true}
                              onChange={(e) => {
                                setEditingRule({ ...editingRule, enabled: e.target.checked });
                                setHasUnsavedChanges(true);
                              }}
                              className="rounded border-white/20 text-vital-500 focus:ring-vital-500"
                            />
                            <span>Active</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Short Summary */}
                    <div>
                      <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                        Short Summary (Shown in card headers & search)
                      </label>
                      <input
                        type="text"
                        value={editingRule.short_description || ''}
                        onChange={(e) => {
                          setEditingRule({ ...editingRule, short_description: e.target.value });
                          setHasUnsavedChanges(true);
                        }}
                        placeholder="Concise 1-sentence synopsis of this rule"
                        className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-vital-500"
                      />
                    </div>

                    {/* Content Editor with Formatting Toolbar */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                          Full Rule Legislation Content *
                        </label>
                        <span className="text-[11px] text-gray-500">Supports markdown formatting</span>
                      </div>

                      {/* Toolbar */}
                      <div className="flex items-center gap-1 p-1.5 bg-dark-950 border border-b-0 border-white/10 rounded-t-xl overflow-x-auto custom-scrollbar">
                        <button
                          type="button"
                          onClick={() => insertFormatting('**', '**')}
                          className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/5"
                          title="Bold"
                        >
                          <Bold size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting('*', '*')}
                          className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/5"
                          title="Italic"
                        >
                          <Italic size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting('\n- ')}
                          className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/5"
                          title="Bullet List"
                        >
                          <List size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting('\n1. ')}
                          className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/5"
                          title="Numbered List"
                        >
                          <ListOrdered size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting('\n> ')}
                          className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/5"
                          title="Quote Block"
                        >
                          <Quote size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting('`', '`')}
                          className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/5"
                          title="Code"
                        >
                          <Code size={14} />
                        </button>
                        <div className="h-4 w-px bg-white/10 mx-1" />
                        <button
                          type="button"
                          onClick={() => handleAddCallout('WARNING')}
                          className="px-2 py-1 text-[11px] font-bold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 rounded flex items-center gap-1"
                        >
                          <AlertTriangle size={12} />
                          <span>+ Warning</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddCallout('EXAMPLE')}
                          className="px-2 py-1 text-[11px] font-bold text-blue-400 bg-blue-400/10 hover:bg-blue-400/20 rounded flex items-center gap-1"
                        >
                          <Info size={12} />
                          <span>+ Example</span>
                        </button>
                      </div>

                      <textarea
                        id="rule-content-textarea"
                        rows={10}
                        value={editingRule.content || ''}
                        onChange={(e) => {
                          setEditingRule({ ...editingRule, content: e.target.value });
                          setHasUnsavedChanges(true);
                        }}
                        placeholder="Write official rule text..."
                        className="w-full bg-dark-950 border border-white/10 rounded-b-xl p-3.5 text-sm text-white font-mono focus:outline-none focus:border-vital-500 leading-relaxed"
                      />
                    </div>

                    {/* Callouts Section */}
                    {editingRule.callouts && editingRule.callouts.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                          Structured Callout Cards ({editingRule.callouts.length})
                        </label>
                        {editingRule.callouts.map((callout, cIdx) => (
                          <div
                            key={cIdx}
                            className="p-3.5 rounded-xl bg-dark-950 border border-white/10 space-y-2 relative"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-vital-400">
                                {callout.type}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...(editingRule.callouts || [])];
                                  updated.splice(cIdx, 1);
                                  setEditingRule({ ...editingRule, callouts: updated });
                                  setHasUnsavedChanges(true);
                                }}
                                className="text-gray-500 hover:text-red-400 text-xs"
                              >
                                Remove
                              </button>
                            </div>
                            <input
                              type="text"
                              placeholder="Callout title (e.g. Zero Tolerance)"
                              value={callout.title || ''}
                              onChange={(e) => {
                                const updated = [...(editingRule.callouts || [])];
                                updated[cIdx].title = e.target.value;
                                setEditingRule({ ...editingRule, callouts: updated });
                                setHasUnsavedChanges(true);
                              }}
                              className="w-full bg-dark-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            />
                            <textarea
                              rows={2}
                              placeholder="Callout description or rule breakdown..."
                              value={callout.text}
                              onChange={(e) => {
                                const updated = [...(editingRule.callouts || [])];
                                updated[cIdx].text = e.target.value;
                                setEditingRule({ ...editingRule, callouts: updated });
                                setHasUnsavedChanges(true);
                              }}
                              className="w-full bg-dark-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  /* Live Preview Tab */
                  <div className={`mx-auto transition-all ${previewDevice === 'mobile' ? 'max-w-sm' : 'w-full'}`}>
                    <div className="p-1 rounded-2xl bg-dark-950 border border-white/10">
                      <div className="p-6 rounded-xl border border-white/5 bg-dark-900 shadow-xl relative overflow-hidden">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-vital-500/15 border border-vital-500/30 text-vital-500 flex items-center justify-center font-tech font-bold text-sm">
                              #{editingRule.rule_number || 1}
                            </div>
                            <div>
                              <h4 className="text-base font-bold text-white">
                                {editingRule.title || 'Untitled Rule'}
                              </h4>
                              {editingRule.short_description && (
                                <p className="text-xs text-gray-400 mt-0.5">{editingRule.short_description}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/5 text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                          {editingRule.content || 'No content written yet.'}
                        </div>

                        {editingRule.callouts && editingRule.callouts.length > 0 && (
                          <div className="mt-4 space-y-2">
                            {editingRule.callouts.map((c, i) => (
                              <div
                                key={i}
                                className={`p-3 rounded-xl border text-xs ${
                                  c.type === 'WARNING'
                                    ? 'bg-red-500/10 border-red-500/30 text-red-300'
                                    : 'bg-vital-500/10 border-vital-500/30 text-vital-300'
                                }`}
                              >
                                {c.title && <div className="font-bold mb-1">{c.title}</div>}
                                <div>{c.text}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* PUBLISH CENTER MODAL WITH BEFORE & AFTER DIFF VIEWER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isPublishModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPublishModalOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-3xl bg-dark-900 border border-vital-500/30 rounded-3xl p-6 lg:p-8 shadow-2xl flex flex-col max-h-[88vh] z-10 text-white overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-vital-500/20 text-vital-500 flex items-center justify-center">
                    <UploadCloud size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Publish Live Legislation</h3>
                    <p className="text-xs text-gray-400">
                      Review diff changes before committing new version snapshot to production.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPublishModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-5 space-y-4 custom-scrollbar">
                {stagedChanges.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    No unpublished draft changes found.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-vital-400 font-tech">
                      Staged Modifications ({stagedChanges.length})
                    </span>

                    {stagedChanges.map((change) => (
                      <div
                        key={change.rule_id}
                        className="p-4 rounded-2xl bg-dark-950 border border-white/10 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white">{change.title}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              change.action === 'create'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : change.action === 'delete'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-vital-500/20 text-vital-400'
                            }`}
                          >
                            {change.action}
                          </span>
                        </div>

                        {/* Diff Box: Before vs After */}
                        {change.action === 'update' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-gray-400">
                              <span className="font-bold text-red-400 block mb-1">Before:</span>
                              <p className="line-clamp-4 font-mono text-[11px]">{change.before?.content || 'Empty'}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-gray-300">
                              <span className="font-bold text-emerald-400 block mb-1">After:</span>
                              <p className="line-clamp-4 font-mono text-[11px] text-emerald-200">
                                {change.after?.content || 'Empty'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Publish Note Input */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Publish Release Note (e.g. Updated robbery rules and reorganized gang conflict)
                  </label>
                  <input
                    type="text"
                    value={publishNote}
                    onChange={(e) => setPublishNote(e.target.value)}
                    placeholder="Enter change summary for server changelog..."
                    className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-vital-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsPublishModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublishLive}
                  disabled={publishing || stagedChanges.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-vital-500 hover:bg-vital-400 disabled:opacity-50 text-white font-bold text-xs shadow-lg flex items-center gap-2"
                >
                  {publishing ? (
                    <span>Publishing Live...</span>
                  ) : (
                    <>
                      <UploadCloud size={16} />
                      <span>Confirm & Publish Version {stats.currentVersion + 1}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* VERSION HISTORY & ROLLBACK MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isHistoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryModalOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-dark-900 border border-white/10 rounded-3xl p-6 lg:p-8 shadow-2xl flex flex-col max-h-[85vh] z-10 text-white overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 text-vital-500 flex items-center justify-center">
                    <History size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Version History & Snapshots</h3>
                    <p className="text-xs text-gray-400">
                      Inspect past constitutional releases or restore an earlier version.
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsHistoryModalOpen(false)} className="p-1.5 text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-5 space-y-3 custom-scrollbar">
                {versions.map((ver) => (
                  <div
                    key={ver.id}
                    className="p-4 rounded-2xl bg-dark-950 border border-white/10 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-white text-base">
                          Version {ver.version_number}
                        </span>
                        {ver.version_number === stats.currentVersion && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-300 mt-1">{ver.publish_note || 'Official release'}</p>
                      <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-2">
                        <span>By {ver.published_by_display_name}</span>
                        <span>•</span>
                        <span>{new Date(ver.published_at).toLocaleString()}</span>
                      </div>
                    </div>

                    {canPublish && ver.version_number !== stats.currentVersion && (
                      <button
                        onClick={() => handleRollback(ver.version_number)}
                        disabled={rollingBack}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-vital-500 text-gray-300 hover:text-dark-950 font-bold text-xs transition-colors shrink-0"
                      >
                        <RotateCcw size={13} />
                        <span>Rollback</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* CATEGORY MANAGEMENT MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCategoryModalOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-dark-900 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col z-10 text-white"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <h3 className="text-base font-bold text-white">Create Rule Category</h3>
                <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Title *</label>
                  <input
                    type="text"
                    value={categoryForm.title}
                    onChange={(e) => setCategoryForm({ ...categoryForm, title: e.target.value })}
                    placeholder="e.g. Criminal Operations"
                    className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Description</label>
                  <input
                    type="text"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    placeholder="Brief description of rules in this category"
                    className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Icon Name</label>
                  <input
                    type="text"
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                    placeholder="Lucide Icon (e.g. ShieldAlert, Crosshair, Users)"
                    className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="px-4 py-2 text-xs text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCategory}
                    className="px-5 py-2 rounded-xl bg-vital-500 hover:bg-vital-400 text-white font-bold text-xs"
                  >
                    Save Category
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* RULE HISTORY CHANGELOG MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isRuleHistoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRuleHistoryModalOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-dark-900 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col z-10 text-white max-h-[80vh] overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <h3 className="text-base font-bold text-white">Rule Changelog</h3>
                <button onClick={() => setIsRuleHistoryModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                {ruleChangelog.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-xs">No edit history recorded yet.</div>
                ) : (
                  ruleChangelog.map((entry, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-dark-950 border border-white/5 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-vital-400 capitalize">{entry.action}</span>
                        <span className="text-gray-500">{new Date(entry.changed_at).toLocaleString()}</span>
                      </div>
                      <div className="text-gray-300">Edited by {entry.changed_by_display_name}</div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
