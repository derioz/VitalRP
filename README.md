# Vital RP - Official Website (v2 Rebuild)

A modern, high-performance web platform for the **Vital RP** FiveM community, built with Next.js 15, Supabase Auth, and Tailwind CSS.

## Technology Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Frontend**: React 19, Tailwind CSS, Framer Motion, Lucide Icons
- **Authentication**: [Supabase Auth](https://supabase.com/) with Discord OAuth 2.0
- **Database / RBAC**: Supabase PostgreSQL (`public.profiles`) with Row Level Security (RLS)
- **Media Uploads**: Server-side FiveManage API v3 Proxy (`/api/upload`)
- **Live Server Status**: CFX / FiveM Server Population API (`/api/cfx/population`)
- **Deployment**: [Vercel](https://vercel.com/)

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and provide your credentials:
```bash
cp .env.example .env.local
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment on Vercel

1. Import the repository in Vercel with framework preset **Next.js**.
2. Configure **Environment Variables** in Vercel project settings.
3. Deploy the `rebuild-v2` branch.
