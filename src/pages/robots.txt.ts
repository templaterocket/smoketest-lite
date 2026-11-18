/**
 * /robots.txt — everything public is crawlable; the API and private pages are not. The Sitemap
 * line needs the real address, so it is left out while product.url is a placeholder.
 */
import type { APIRoute } from "astro";
import { absolute, siteUrl } from "../lib/url";
import { site } from "../site.config";

export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: ${site.leads.successPath}\nDisallow: /examples/\n${siteUrl ? `\nSitemap: ${absolute("/sitemap.xml")}\n` : ""}`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
