/**
 * Which pages and files (rss.xml, llms.txt…) this build has, from src/pages. Navigation, the footer, the sitemap and
 * llms.txt link only to pages that exist, so removing a page (the Lite edition drops several)
 * never leaves a broken link. Pages are linked with a trailing slash (`/pricing/`, see
 * astro.config.mjs); `hasPage` takes either form.
 */
const routes = new Set(
  Object.keys(import.meta.glob("../pages/**/*.{astro,ts}"))
    .map((file) => file.replace(/^\.\.\/pages/u, "").replace(/\.(astro|ts)$/u, "").replace(/\/index$/u, "") || "/"),
);

export const hasPage = (path: string): boolean => routes.has(path.length > 1 ? path.replace(/\/$/u, "") : path);
