# Vital RP Landing Page

A premium, high-performance landing page for the Vital RP FiveM community, focused on storytelling and immersion.

## Created By
**Damon**

## Project Overview
This project is built using:
- React 19
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React

## Development

To start the development server:

```bash
npm install
npm run dev
```

## Deployment

This project is configured for **GitHub Pages** deployment using the `docs/` folder on the `main` branch.

### How to Deploy

1. **Build the Project**
   Run the build command to generate the production files in the `docs` folder. This also ensures the `CNAME` file is correctly placed for the custom domain.
   ```bash
   npm run build
   ```

2. **Push to GitHub**
   Commit the changes, specifically ensuring the `docs` folder is included, and push to the `main` branch.
   ```bash
   git add .
   git commit -m "Deploy update"
   git push origin main
   ```

3. **GitHub Settings**
   - Go to your repository on GitHub.
   - Navigate to **Settings** > **Pages**.
   - Under **Build and deployment**, select **Source** as "Deploy from a branch".
   - Under **Branch**, select `main` and the `/docs` folder.
   - Click **Save**.

The site will be live at `https://vitalrp.net` (once DNS propagates).
