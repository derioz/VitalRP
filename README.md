# Vital RP Website (Vite + React + Tailwind) - GitHub Pages Ready

## 1) Edit your settings
Open `src/config.ts` and set:
- `discordInvite`
- `connectUrl` (your `https://cfx.re/join/XXXXXX`)
- `serverAddress` (optional, for the status widget)
- `rulesFullUrl` (your public rules doc link)

## 2) Run locally
```bash
npm install
npm run dev
```

## 3) Deploy to GitHub Pages
1. Push this repo to GitHub (branch: `main`).
2. In GitHub repo settings:
   - Settings → Pages
   - Build and deployment → Source: **GitHub Actions**
3. Push to `main` again if needed. The workflow will build and deploy.

### Notes
- The FiveM status lookup is “best effort”. If your server is private or blocks the public endpoint, it will show Unavailable.
- `vite.config.ts` uses `base: "./"` so it works on GitHub Pages without needing your repo name.
