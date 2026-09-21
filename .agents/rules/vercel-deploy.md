# Post-Code Change Deployment Rule

## Trigger
Active after completing code modifications, bug fixes, component updates, or refactoring in Vital RP.

## Mandatory Build Sequence
1. Always run `npm run build` to verify the Next.js bundle compiles with zero errors.
2. Always run `npm run build:docs` to compile the Vite SPA bundle into `docs/` (which serves the live `vitalrp.net` website).

## Instructions
- Always ask the user if they would like to commit, push to GitHub (`origin main`), and deploy to Vercel and GitHub Pages.
- Formulate the question clearly at the end of the response.
- Do not push to GitHub or deploy without explicit user confirmation.
