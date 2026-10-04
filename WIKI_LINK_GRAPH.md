# Universal Wiki links

The active Wiki database is Firestore. `wiki_pages/{permanentId}` is the universal entity catalog; existing character records in `wiki_characters/{slug}` are retained for compatibility and updated in the same transaction. New characters receive UUIDs. Legacy permanent IDs remain valid. Supabase remains the authentication provider; old Supabase Wiki reads remain a compatibility fallback, but writes never report success after saving only part of a profile there.

`wiki_links/{referenceId}` is the sole mention/backlink graph. It stores source ID, section key/title, context, displayed and normalized names, expected type (nullable), original mention text, timestamps, target ID (nullable), status, visibility, and resolution metadata. Section `content_json.wiki_link_ids` and sanitized HTML markers identify occurrences. Targets, Wanted Pages, and backlinks use persisted graph records, never a search of rendered page text. Structured relationships are unchanged and never inferred from mentions.

`lib/wiki/link-core.ts` centralizes normalization, exact candidate selection, ingestion, and safe rendering. Names use Unicode NFKC, whitespace normalization, and lowercase while preserving punctuation. Matching uses whole current names and registered aliases; it requires one published exact candidate after filtering by expected type. No fuzzy or prefix matching is used for automatic resolution. Search can show partial matches for explicit human selection.

`lib/wiki/graph-store.ts` saves page content, source references, resolution changes, and immutable `wiki_link_audit` entries transactionally. A graph state document serializes concurrent catalog/name changes. Deleted or archived targets keep their permanent IDs and become broken; publishing the same entity again restores the link. Renaming retains previous names as aliases and never changes a resolved target ID or custom display text. A stale unresolved marker cannot undo an automatic resolution. Reference IDs supplied by a different source are regenerated.

Public Wanted Pages/backlinks exclude draft/archived source pages and hidden sections. All mutations require a verified session; source owners, explicitly registered editors, or Wiki moderators may repair links. Editable display names are never an authorization credential. Firestore's existing default-deny rule protects these collections; access goes through server Admin SDK routes.

## Existing data

Each save imports legacy character mention markers, including non-UUID IDs. In Wiki Admin → Reference Health & Graph, **Index existing Wiki mentions** calls the idempotent, moderator-only importer. This indexes unsaved legacy pages and their backlinks without rewriting paragraphs manually. It is an explicit database operation and should run after deploying the backend. The importer does not create missing pages.

## Verification

`npm run test:wiki` executes actual Next.js API handlers and the graph store against a deterministic Firestore transaction double. It covers future character resolution, Wanted Pages, backlink creation/removal, duplicate/similar names, manual retargeting/custom text, renames/aliases, every supported type plus a future type, cross-type ambiguity, repeated mentions, authorization, hidden sections/drafts, archive/delete/restoration, legacy markers, HTML sanitization, forged reference IDs, concurrency, and rollback. It does not access production or verify Firestore emulator/network behavior.

`npx tsc --noEmit`, `npm run build`, and `npm run build:docs` must pass before publishing. Code and database imports have separate deployment authorization. Transactions reject changes exceeding their safe write budget instead of publishing a partial graph; large-scale maintenance should use a dedicated batch migration.
