import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// For GitHub Pages, we use relative asset paths.
export default defineConfig({
  base: "/VitalRP/",
  plugins: [react()],
});
