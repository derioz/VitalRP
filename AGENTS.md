# Agent Instructions & Directives

## Mandatory Build & Deployment Rule
Whenever you make or complete code changes in this project (e.g., adding features, updating components, fixing bugs, or refactoring):
- **Always build both Next.js and the SPA docs bundle**:
  1. `npm run build` (Next.js production build)
  2. `npm run build:docs` (Vite production build into `docs/` which serves the live `vitalrp.net` domain)
- **Always ask the user** if they want to push and deploy the changes to Vercel and GitHub.
- Formulate the question clearly at the end of your response so the user can easily confirm with "yes" or provide deployment preferences.
- Do not push to GitHub or deploy without user confirmation.
