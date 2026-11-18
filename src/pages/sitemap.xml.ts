/**
 * /sitemap.xml — every public page, with its trailing slash; thank-you, example and 404 pages stay
 * out. `lastmod` comes only from dates the content carries: the newest changelog entry for
 * /changelog/, `legal.effectiveDate` for the legal drafts that show it ("Last updated"). Pages
 * without a date get none — never the build time. While product.url is a placeholder the sitemap
 * lists no pages (it needs absolute URLs) and the build says so.
 */
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { legalDocs } from "../lib/legal";
import { hasPage } from "../lib/pages";
import { absolute, siteUrl } from "../lib/url";
import { site } from "../site.config";

export const GET: APIRoute = async () => {
  const day = (date: Date): string => date.toISOString().slice(0, 10);
  const changelog = hasPage("/changelog/") ? await getCollection("changelog") : [];
  const newest = changelog.map((entry) => entry.data.date).sort((a, b) => b.getTime() - a.getTime())[0];
  const dated = new Set((await getCollection("legal")).filter((entry) => entry.body?.includes("{{EFFECTIVE_DATE}}")).map((entry) => entry.id));

  const pages: { path: string; lastmod?: string }[] = [
    { path: "/" },
    ...[...(site.pricing.mode !== "off" ? [{ path: "/pricing/" }] : []), { path: "/changelog/", lastmod: newest && day(newest) }].filter((page) => hasPage(page.path)),
    // legalDocs lists only the drafts present (src/pages/legal/[doc].astro builds one page each).
    ...legalDocs.map((doc) => ({ path: `/legal/${doc.slug}/`, lastmod: dated.has(doc.slug) ? site.legal.effectiveDate : undefined })),
    ...(hasPage("/legal/data-request/") ? [{ path: "/legal/data-request/" }] : []),
  ];

  if (!siteUrl) console.warn("\n[smoketest] product.url is a placeholder (example.com): sitemap.xml lists no pages and canonical links are left out until you set it in src/site.config.ts.");
  const urls = siteUrl ? pages.map((page) => `  <url><loc>${absolute(page.path)}</loc>${page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : ""}</url>`) : ["  <!-- product.url in src/site.config.ts is still a placeholder: set the real address to list the pages. -->"];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
