<div align="center">

# ⚡ VITAL ROLEPLAY

### The Next Generation FiveM Immersion Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.2-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FiveM](https://img.shields.io/badge/FiveM-Server%20Status-orange?style=for-the-badge&logo=gtav&logoColor=white)](https://cfx.re/)

<br />

**[🌐 Official Website](https://vitalrp.net)** • **[💬 Discord Community](https://discord.gg/vitalrp)** • **[🛒 Tebex Store](https://vitalrp.tebex.io)** • **[👕 Merch Shop](https://merch.vitalrp.net)**

<br />

> *"Live the story you choose. Experience unmatched roleplay, high-octane emergencies, and thriving criminal syndicates in Los Santos."*

<br />

---

### 👑 Built & Engineered by **Damon**

---

</div>

<br />

## 📖 About Vital RP

**Vital Roleplay** is a premier, serious GTA V FiveM community focused on authentic storytelling, deep character development, and adrenaline-fueled roleplay. Whether upholding the law as a San Andreas State Trooper, saving lives with Emergency Medical Services, running legitimate businesses, or dominating the city’s underground cartels, Vital RP delivers an unrivaled community-driven experience.

<br />

## ✨ Key Website Features

### 🎮 Live Server Status & CFX Engine
* **Real-Time Population Counter**: Direct integration with CFX API querying active server population and capacity with smart 30-second stale-while-revalidate ISR edge caching.
* **One-Click Connect**: Deep-linked `fivem://connect/` launch buttons for instant city entry.

### 🛡️ Discord-Native Authentication & Supabase Backend
* **Strictly Discord OAuth 2.0**: Completely eliminates legacy credentials and passwords.
* **Supabase Session Management**: PKCE verification, JWT session handling, and real-time frontend listener synchronization.
* **Auto-Profile Provisioning**: Automatic account creation syncing Discord avatars, global names, and IDs directly to PostgreSQL `public.profiles`.
* **Row Level Security (RLS)**: Enforced database-level policies ensuring secure access controls.

### 🔐 Centralized Role-Based Access Control (RBAC)
* **Tiered Hierarchy**: Distinct authorization levels (`owner` > `admin` > `staff` > `user`).
* **Protected Admin Dashboard**: Full admin portal (`/admin`) for staff roster coordination, gallery curation, and server settings.
* **Discreet Easter Egg Access**: Integrated secret lock trigger in footer for rapid staff portal authentication.

### 📸 FiveManage Secure Media Proxy
* **Zero Client Leakage**: API secrets are strictly isolated server-side.
* **Protected Upload Endpoint**: Validates staff permissions, enforces strict image MIME types (`JPEG`, `PNG`, `WEBP`, `GIF`), and prevents oversized payloads.

### 🛍️ Tebex Store & Merch Integrations
* **In-Game Store**: Priority queue perks, custom vehicle imports, and community supporter tiers.
* **Fourthwall Merch Showcase**: Embedded merchandise showcase highlighting apparel, hoodies, and accessories.

### 🎨 Visual & Motion Design
* **Cyber-Luxe Aesthetics**: Dark theme infused with signature Vital Neon Orange (`#f97316`) accents.
* **Horizontal Scroll Showcase**: High-performance Framer Motion transitions showcasing city mechanics, legal jobs, and criminal syndicates.
* **Adaptive Glassmorphism**: Tailored backdrop filters, custom orange scrollbars, and tactile micro-animations.

<br />

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15 (App Router)** | Hybrid SSG/SSR, Server Actions & edge API routes |
| **Language** | **TypeScript 5.8** | End-to-end type safety & strict interface typing |
| **Styling** | **Tailwind CSS + Lucide** | Curated design system, responsive utilities & iconography |
| **Animations** | **Framer Motion** | Physics-based spring animations & interactive reveals |
| **Auth & DB** | **Supabase (PostgreSQL)** | Discord OAuth, session tokens, RLS & auto-sync trigger |
| **Media Host** | **FiveManage API v3** | High-speed CDN asset delivery for user and staff media |
| **Deployment**| **Vercel** | Edge-deployed serverless Next.js runtime |

<br />

## 🚀 Getting Started Locally

### 1. Clone the Repository
```bash
git clone https://github.com/derioz/VitalRP.git
cd VitalRP
git checkout rebuild-v2
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Discord OAuth 2.0 Credentials
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/discord/callback

# FiveM / CFX Server
CFX_SERVER_ID=ogpvmv

# FiveManage Media Upload (Server-only)
FIVEMANAGE_API_KEY=your_fivemanage_api_key
```

### 4. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

<br />

## 📂 Project Structure

```text
vitalrp/
├── app/                        # Next.js 15 App Router
│   ├── admin/                  # Protected admin portal (staff, gallery, settings)
│   ├── api/                    # Server-side API routes (auth, upload, cfx population)
│   ├── auth/callback/          # Supabase OAuth PKCE callback exchange
│   ├── layout.tsx              # Root HTML layout & fonts
│   └── page.tsx                # High-immersion homepage
├── components/                 # Modular UI Components
│   ├── admin/                  # Admin layout & management shells
│   ├── AuthProvider.tsx        # Client authentication context
│   ├── Hero.tsx                # Horizontal scroll cinematic showcase
│   ├── Navbar.tsx              # Dynamic navigation & mobile drawer
│   ├── Gallery.tsx             # Community media showcase
│   └── Footer.tsx              # Brand footer & secret admin lock trigger
├── lib/                        # Shared Utilities & Clients
│   ├── auth/                   # RBAC permissions & session handlers
│   └── supabase/               # Browser, server, and admin Supabase instances
└── supabase_schema.sql         # PostgreSQL schema, RLS policies & triggers
```

<br />

## 📜 License & Acknowledgements

* **Creator**: Designed, architected, and built with care by **Damon**.
* **Community**: Dedicated to the players, staff, and creators of **Vital Roleplay**.
* *Disclaimer: Vital RP is not affiliated with, endorsed by, or associated with Rockstar Games or Take-Two Interactive.*

<br />

<div align="center">
  <sub>Made with ❤️ by <b>Damon</b> for <b>Vital Roleplay</b> • All rights reserved.</sub>
</div>
