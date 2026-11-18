/**
 * Smoketest Lite — the one file to edit: product, look, the call to action, where leads go,
 * analytics, SEO and the details that fill the privacy policy.
 * Checked at build time against src/config/schema.ts; an invalid value fails with E_CONFIG.
 * Values in {{DOUBLE_BRACES}} are placeholders to replace before launch (see README → Before you launch).
 */
import { loadConfig } from "./config/schema";

export const site = loadConfig({
  product: {
    name: "Smoketest",
    description: "An Astro template for testing demand for a SaaS idea before you build it.",
    // Your domain. While it is example.com the build leaves out canonical links and the sitemap's pages.
    url: "https://example.com",
  },

  // preset: "forma" (violet) | "ocean" | "forest" | "ember" | "rose" | "graphite" · theme: "light" | "dark" | "system"
  // fonts: "geometric" (Manrope + DM Sans) | "editorial" (Fraunces + Inter) | "technical" (Space Grotesk + IBM Plex Sans)
  // themeToggle: a light/dark switch in the navbar; the visitor's choice is then saved in their browser.
  brand: { preset: "forma", theme: "system", themeToggle: true, fonts: "geometric" },

  cta: {
    // Other kinds: { type: "access", label, title, questions: [ … ] } (a short form with qualifying questions) ·
    // { type: "demo", provider: "cal", url: "https://cal.com/you/demo", label: "Book a demo" } ·
    // { type: "preorder", checkoutUrl: "https://…", label: "Pre-order" } (a hosted checkout) ·
    // { type: "contact", label, title } (name, email and message) · { type: "link", label, href }.
    primary: { type: "waitlist", label: "Get early access", placeholder: "you@company.com" },
  },

  leads: {
    // The form posts from the visitor's browser, so it works on any host. Other services:
    // { id: "webhook", url } (Zapier, Make, n8n, your API) · { id: "formspree", formId } · { id: "loops", formId } ·
    // { id: "supabase", url, anonKey } · { id: "google-sheets", scriptUrl } ·
    // { id: "embed", service: "mailchimp" | "kit" | "mailerlite" | "brevo" | "buttondown", action }.
    // Until the key is real (or with { id: "none" }) the form sends nothing and says it isn't connected yet.
    provider: { id: "web3forms", accessKey: "{{WEB3FORMS_ACCESS_KEY}}" },
    // "notice": a line under the form; "checkbox": an unticked box the visitor must tick.
    consent: "notice",
    consentText: "No spam: joining means one email at launch. Unsubscribe anytime.",
    // UTM tags and ?ref= are read from the URL at submit ("url-only"), or kept for the tab ("session") or 30 days ("persistent").
    attribution: "url-only",
  },

  // Cookieless options: plausible, umami, fathom, cloudflare. ga4 sets cookies and brings a consent banner.
  analytics: { provider: { id: "none" }, respectDoNotTrack: true },

  seo: { ogImage: "/og-default.png", locale: "en" },

  // Fills the privacy policy draft (src/content/legal/privacy.md); have a person check it before launch.
  legal: {
    companyName: "{{COMPANY_NAME}}",
    contactEmail: "privacy@example.com",
    address: "{{COMPANY_ADDRESS}}",
    country: "{{COUNTRY}}",
    effectiveDate: "2026-10-30",
    hosting: "cloudflare", // or "netlify", "vercel", "other": named in the privacy policy
  },
});
