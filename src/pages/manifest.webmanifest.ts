/**
 * /manifest.webmanifest — the web app manifest: the name from product.name, the colours from the
 * brand preset (the page colour of the theme visitors see first, as in the theme-color meta), and
 * the icons `npm run icons` renders from public/favicon.svg.
 */
import type { APIRoute } from "astro";
import { initialTheme, palette } from "../lib/theme";
import { site } from "../site.config";

export const GET: APIRoute = () => {
  const page = palette(initialTheme).hex("--bg-main");
  const manifest = {
    name: site.product.name,
    short_name: site.product.name,
    description: site.product.description,
    start_url: "/",
    display: "browser",
    theme_color: page,
    background_color: page,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
  return new Response(`${JSON.stringify(manifest, null, 2)}\n`, { headers: { "Content-Type": "application/manifest+json; charset=utf-8" } });
};
