import { WikiPage } from './types';
type WikiViewer = { id?: string; discordId?: string; isAdmin?: boolean; isSuperAdmin?: boolean; effectivePermissions?: string[] };
export function isWikiModerator(viewer?: WikiViewer | null): boolean {
  return Boolean(viewer && (viewer.isAdmin || viewer.isSuperAdmin || viewer.effectivePermissions?.includes('wiki.moderate')));
}
export function canEditWikiPage(viewer: WikiViewer | null | undefined, page: WikiPage): boolean {
  return Boolean(viewer && (isWikiModerator(viewer) || (viewer.id && page.created_by_user_id === viewer.id) || (viewer.discordId && page.created_by_discord_id === viewer.discordId) || (viewer.id && page.editor_user_ids?.includes(viewer.id))));
}
