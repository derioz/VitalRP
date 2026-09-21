---
name: vercel-deploy
description: >-
  Use this skill when building and deploying or pushing changes to Vercel for the VitalRP website.
---

# Vercel Build and Deployment Runbook

This skill outlines the standard workflow for building and deploying the VitalRP website to Vercel.

## Workflow

1. **Pre-build Typecheck**:
   Ensure all TypeScript files compile cleanly without errors:
   ```bash
   npx tsc --noEmit
   ```

2. **Production Build**:
   Verify the Next.js production build:
   ```bash
   npm run build
   ```

3. **Vite SPA Build (Mandatory on every code change)**:
   The production domain `vitalrp.net` is served directly from the `docs/` folder:
   ```bash
   npm run build:docs
   ```

4. **Deploy to Vercel**:
   - If deploying via Git integration (GitHub -> Vercel):
     ```bash
     git add -A
     git commit -m "<descriptive message>"
     git push origin main
     ```
   - If deploying via Vercel CLI:
     ```bash
     npx vercel --prod
     ```
