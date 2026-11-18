// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import redirectsCheck from "./src/integrations/redirects-check.mjs";

// Scoped styles use :where() so they add no specificity: the craft layer (src/styles/craft.css)
// can then restyle sections with plain `body.craft …` selectors.
// Tailwind 4 runs as a Vite plugin; its theme maps onto tokens.css (src/styles/tailwind.css).
// `astro dev` forwards /api to the Worker started by `npm run dev:api` (port 8787).
export default defineConfig({
  scopedStyleStrategy: "where",
  // One URL style: every page is a folder (pricing/index.html) served at /pricing/, and every
  // link, canonical and sitemap entry ends with a slash. Files keep theirs: /robots.txt, /api/…
  trailingSlash: "always",
  // Redirects: list them here — the source of truth — and copy each rule into public/_redirects
  // (Cloudflare, Netlify) and vercel.json (Vercel), which the hosts read. Astro writes no
  // meta-refresh pages for them (`build.redirects: false`); the build warns when a copy is missing
  // a rule (src/integrations/redirects-check.mjs). Write targets with the trailing slash, e.g.
  //   redirects: { "/waitlist": "/", "/old-pricing": { status: 301, destination: "/pricing/" } },
  redirects: {},
  build: { format: "directory", redirects: false },
  integrations: [redirectsCheck()],
  vite: {
    plugins: [tailwindcss()],
    server: { proxy: { "/api": "http://localhost:8787" } },
  },
});
