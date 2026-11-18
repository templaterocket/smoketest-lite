/**
 * The legal pack: which documents the site shows, the {{TOKENS}} filled from site.config.ts, and
 * the processor and browser-storage tables generated from the providers and features in use.
 * The documents themselves are src/content/legal/*.md — starting-point drafts, not legal advice.
 */
import { THEME_STORAGE_KEY } from "./theme";
import { siteUrl } from "./url";
import { site } from "../site.config";

export interface LegalDoc {
  slug: string;
  title: string;
}

const usesPreorders = site.pricing.mode === "checkout" || site.cta.primary.type === "preorder" || site.cta.secondary?.type === "preorder";

/** The drafts present in src/content/legal (the Lite export ships the privacy policy only). */
const present = new Set(Object.keys(import.meta.glob("../content/legal/*.md")).map((path) => path.replace(/^.*\/|\.md$/gu, "")));

/** The documents in use, in footer order. */
export const legalDocs: LegalDoc[] = [
  { slug: "privacy", title: "Privacy policy" },
  { slug: "cookies", title: "Cookie policy" },
  { slug: "terms", title: "Terms of use" },
  ...(usesPreorders ? [{ slug: "preorder", title: "Pre-order and refund terms" }] : []),
  ...(site.legal.imprint ? [{ slug: "imprint", title: "Imprint" }] : []),
].filter((doc) => present.has(doc.slug));

interface Processor {
  name: string;
  purpose: string;
  site: string;
}

/** The services that handle visitors' data, from the providers chosen in site.config.ts. */
export function processors(): Processor[] {
  const hosts: Record<typeof site.legal.hosting, Processor> = {
    cloudflare: { name: "Cloudflare", purpose: "Hosting and delivering this website", site: "cloudflare.com" },
    netlify: { name: "Netlify", purpose: "Hosting and delivering this website", site: "netlify.com" },
    vercel: { name: "Vercel", purpose: "Hosting and delivering this website", site: "vercel.com" },
    other: { name: "Our hosting provider", purpose: "Hosting and delivering this website", site: "" },
  };
  const list: Processor[] = [hosts[site.legal.hosting]];
  const provider = site.leads.provider;
  const embed = provider.id === "embed" ? provider.service : null;
  const leads: Record<string, Processor> = {
    cloudflare: { name: "Cloudflare D1", purpose: "Storing signups and requests in our own database", site: "cloudflare.com" },
    web3forms: { name: "Web3Forms", purpose: "Receiving form submissions and emailing them to us", site: "web3forms.com" },
    formspree: { name: "Formspree", purpose: "Receiving and storing form submissions", site: "formspree.io" },
    loops: { name: "Loops", purpose: "Storing the email list and sending launch emails", site: "loops.so" },
    supabase: { name: "Supabase", purpose: "Storing signups in our database", site: "supabase.com" },
    "google-sheets": { name: "Google (Sheets)", purpose: "Storing signups in a spreadsheet", site: "google.com" },
    webhook: { name: "Our automation service", purpose: "Passing signups to our tools", site: "" },
  };
  const embeds: Record<string, Processor> = {
    mailchimp: { name: "Mailchimp (Intuit)", purpose: "Storing the email list and sending emails", site: "mailchimp.com" },
    kit: { name: "Kit", purpose: "Storing the email list and sending emails", site: "kit.com" },
    mailerlite: { name: "MailerLite", purpose: "Storing the email list and sending emails", site: "mailerlite.com" },
    brevo: { name: "Brevo", purpose: "Storing the email list and sending emails", site: "brevo.com" },
    buttondown: { name: "Buttondown", purpose: "Storing the email list and sending emails", site: "buttondown.com" },
    other: { name: "Our email service", purpose: "Storing the email list and sending emails", site: "" },
  };
  const lead = embed ? embeds[embed] : leads[provider.id];
  if (lead) list.push(lead);
  if (provider.id === "cloudflare") {
    list.push({ name: "Resend", purpose: "Sending confirmation and service emails", site: "resend.com" });
    if (provider.turnstileSiteKey) list.push({ name: "Cloudflare Turnstile", purpose: "Telling people from bots on our forms", site: "cloudflare.com" });
  }
  const analytics: Record<string, Processor> = {
    plausible: { name: "Plausible Analytics", purpose: "Cookieless visit statistics", site: "plausible.io" },
    umami: { name: "Umami", purpose: "Cookieless visit statistics", site: "umami.is" },
    fathom: { name: "Fathom Analytics", purpose: "Cookieless visit statistics", site: "usefathom.com" },
    cloudflare: { name: "Cloudflare Web Analytics", purpose: "Cookieless visit statistics", site: "cloudflare.com" },
    ga4: { name: "Google Analytics", purpose: "Visit statistics (only after you accept cookies)", site: "google.com" },
  };
  const stats = analytics[site.analytics.provider.id];
  if (stats) list.push(stats);
  return list;
}

interface Stored {
  name: string;
  kind: string;
  purpose: string;
  lasts: string;
}

/** What this site keeps in the visitor's browser, from the settings in use. */
export function browserStorage(): Stored[] {
  const list: Stored[] = [];
  if (site.brand.themeToggle) list.push({ name: THEME_STORAGE_KEY, kind: "Local storage", purpose: "Remembers the light or dark theme you picked with the switch in the menu; set only when you use it", lasts: "Until you clear it" });
  if (site.leads.attribution === "session") list.push({ name: "smoketest:attribution", kind: "Session storage", purpose: "Remembers which link brought you here, so a signup is credited to it", lasts: "Until you close the tab" });
  if (site.leads.attribution === "persistent") list.push({ name: "smoketest:attribution", kind: "Local storage", purpose: "Remembers which link first brought you here, so a signup is credited to it", lasts: "30 days" });
  if (site.analytics.provider.id === "ga4") {
    list.push({ name: "smoketest:consent", kind: "Local storage", purpose: "Remembers your cookie choice", lasts: "Until you clear it" });
    list.push({ name: "_ga, _ga_*", kind: "Cookie (Google Analytics)", purpose: "Counts visits, only after you accept", lasts: "Up to 2 years" });
  }
  return list;
}

const escape = (value: string): string => value.replace(/[&<>"']/gu, (c) => `&#${c.charCodeAt(0)};`);

function table(head: string[], rows: string[][]): string {
  return `<div class="legal-table"><table><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

/** Token values for the drafts. Values still in {{BRACES}} in the config stay visible on purpose. */
export function legalTokens(): Record<string, string> {
  const { legal, product } = site;
  const stored = browserStorage();
  return {
    PRODUCT_NAME: escape(product.name),
    // While product.url is a placeholder the drafts say "this website" rather than example.com.
    SITE_URL: siteUrl ? escape(product.url) : "this website",
    COMPANY_NAME: escape(legal.companyName),
    CONTACT_EMAIL: `<a href="mailto:${escape(legal.contactEmail)}">${escape(legal.contactEmail)}</a>`,
    ADDRESS: escape(legal.address || "{{COMPANY_ADDRESS}}"),
    COUNTRY: escape(legal.country),
    GOVERNING_LAW: escape(legal.governingLaw),
    EFFECTIVE_DATE: escape(new Date(`${legal.effectiveDate}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })),
    REFUND_DAYS: String(legal.refundDays),
    REGISTRATION: escape(legal.registration || "{{REGISTRATION}}"),
    VAT_ID: escape(legal.vatId || "{{VAT_ID}}"),
    IP_RETENTION_DAYS: "30",
    PROCESSORS: table(["Service", "What it does for us", "Their policy"], processors().map((p) => [escape(p.name), escape(p.purpose), p.site ? `<a href="https://${p.site}" rel="noopener">${p.site}</a>` : "Named on request"])),
    BROWSER_STORAGE: stored.length > 0
      ? table(["Name", "Type", "Why", "How long"], stored.map((s) => [`<code>${escape(s.name)}</code>`, escape(s.kind), escape(s.purpose), escape(s.lasts)]))
      : "<p><strong>Nothing.</strong> With the current settings this site sets no cookies and stores nothing in your browser.</p>",
  };
}

/** Replaces {{TOKEN}} in rendered HTML; a token alone in a paragraph is replaced with its block. */
export function fillTokens(html: string): string {
  const tokens = legalTokens();
  return html
    .replace(/<p>\s*\{\{([A-Z_]+)\}\}\s*<\/p>/gu, (whole, key: string) => tokens[key] ?? whole)
    .replace(/\{\{([A-Z_]+)\}\}/gu, (whole, key: string) => tokens[key] ?? whole);
}
