/**
 * The shape of src/site.config.ts: everything a site owner (or their coding agent) sets in one
 * place. `loadConfig` checks it at build time and fails with E_CONFIG and the exact paths.
 */
import { z } from "astro/zod";

/** A qualifying question asked with an "access" CTA (stored with the lead). */
export const questionSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]*$/u, "lowercase letters, digits and _"),
  label: z.string().min(1),
  type: z.enum(["text", "select", "radio"]).default("text"),
  options: z.array(z.string().min(1)).optional(),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
}).refine((q) => q.type === "text" || (q.options?.length ?? 0) >= 2, { message: "select and radio questions need at least 2 options" });

const label = z.string().min(1);

/**
 * One call to action. `type` picks the behaviour:
 * waitlist — an email field and a button, sent to the leads provider;
 * access — a button opening a short form: email plus qualifying questions;
 * demo — books a call (Cal.com or Calendly popup, or a plain link);
 * preorder — a link to a hosted checkout (Stripe, Polar, Lemon Squeezy…);
 * contact — a button opening a name, email and message form;
 * link — a plain link (docs, GitHub, an anchor on the page).
 */
export const ctaSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("waitlist"), label, placeholder: z.string().default("you@company.com"), note: z.string().optional() }),
  z.object({ type: z.literal("access"), label, title: label, description: z.string().optional(), submitLabel: label.default("Request access"), questions: z.array(questionSchema).min(1).max(5) }),
  z.object({ type: z.literal("demo"), label, provider: z.enum(["cal", "calendly", "link"]), url: z.url() }),
  z.object({ type: z.literal("preorder"), label, checkoutUrl: z.url(), note: z.string().optional() }),
  z.object({ type: z.literal("contact"), label, title: label, description: z.string().optional(), submitLabel: label.default("Send message") }),
  z.object({ type: z.literal("link"), label, href: z.string().min(1) }),
]);
export type Cta = z.infer<typeof ctaSchema>;
export type Question = z.infer<typeof questionSchema>;

/** Email services whose embed form we post to; their embed code gives the action URL. */
export const EMBED_SERVICES = ["mailchimp", "kit", "mailerlite", "brevo", "buttondown", "other"] as const;

/**
 * Where leads go. Each provider takes only public identifiers: nothing here is a secret,
 * because the form posts from the visitor's browser. Secret-key services (Resend, the
 * Mailchimp API…) need a server and run in the Worker instead.
 *
 * none — not connected: the form sends nothing and tells the visitor so (the same happens while
 *   a provider still has a {{PLACEHOLDER}} in its settings);
 * cloudflare — the template's Worker and D1 database (default for launch; see worker/);
 * web3forms, formspree — form inboxes, emailed to you (fetch, response read);
 * loops — a Loops form endpoint, straight into your audience (fetch, response read);
 * supabase — a row in your own table, insert-only via RLS (fetch, response read);
 * google-sheets — a row in a sheet via an Apps Script web app (fire and forget: the response is opaque);
 * webhook — JSON to Zapier, Make, n8n or your own endpoint;
 * embed — a plain form POST to Mailchimp, Kit, MailerLite, Brevo or Buttondown, which then show
 *   their own confirmation page (that is the route these services document for embedded forms).
 */
export const providerSchema = z.discriminatedUnion("id", [
  z.object({ id: z.literal("none") }),
  /** Your own Worker + D1 (worker/): double opt-in, queue, referrals, the honest counter. */
  z.object({ id: z.literal("cloudflare"), endpoint: z.string().startsWith("/").default("/api/leads"), turnstileSiteKey: z.string().optional() }),
  z.object({ id: z.literal("web3forms"), accessKey: z.string().min(1) }),
  z.object({ id: z.literal("formspree"), formId: z.string().min(1) }),
  z.object({ id: z.literal("loops"), formId: z.string().min(1), userGroup: z.string().optional() }),
  z.object({ id: z.literal("supabase"), url: z.url(), anonKey: z.string().min(1), table: z.string().default("leads") }),
  z.object({ id: z.literal("google-sheets"), scriptUrl: z.url() }),
  z.object({ id: z.literal("webhook"), url: z.url(), opaque: z.boolean().default(false) }),
  z.object({
    id: z.literal("embed"),
    service: z.enum(EMBED_SERVICES),
    /** The `action` of the form in your service's embed code. */
    action: z.url(),
    /** The email input's `name` in that embed code; each service has a default. */
    emailField: z.string().optional(),
    /** Hidden inputs from the embed code to send along (list IDs, tags, the honeypot…). */
    hiddenFields: z.record(z.string(), z.string()).default({}),
  }),
]);

/** The email field name each embed service uses by default (check against your embed code). */
export const EMBED_EMAIL_FIELD: Record<(typeof EMBED_SERVICES)[number], string> = {
  mailchimp: "EMAIL",
  kit: "email_address",
  mailerlite: "fields[email]",
  brevo: "EMAIL",
  buttondown: "email",
  other: "email",
};
export type Provider = z.infer<typeof providerSchema>;

/** The colour presets in src/styles/presets.css. */
export const PRESETS = ["forma", "ocean", "forest", "ember", "rose", "graphite"] as const;
/** The heading/body font pairs in src/styles/fonts.css. */
export const FONT_PAIRS = ["geometric", "editorial", "technical"] as const;
/** The homepage arrangements in src/pages/index.astro. */
export const LAYOUTS = ["minimal"] as const;
export type Layout = (typeof LAYOUTS)[number];

export const configSchema = z.object({
  product: z.object({
    name: label,
    description: label,
    /** The deployed site's address, used for canonical URLs, sitemap and legal pages. */
    url: z.url(),
  }),
  /**
   * The look. preset: one of six palettes, each with a light and a dark variant
   * (src/styles/presets.css); theme: what visitors see first — "system" follows their device;
   * themeToggle: a light/dark switch in the navbar that saves the visitor's choice in their
   * browser (the only thing the template stores there unasked; the cookie policy lists it);
   * fonts: a heading/body pair (src/styles/fonts.css).
   */
  brand: z.object({
    preset: z.enum(PRESETS).default("forma"),
    theme: z.enum(["light", "dark", "system"]).default("light"),
    themeToggle: z.boolean().default(true),
    fonts: z.enum(FONT_PAIRS).default("geometric"),
  }).prefault({}),
  /**
   * The homepage (src/pages/index.astro): the hero with the form, then the FAQ.
   */
  layout: z.enum(LAYOUTS).default("minimal"),
  cta: z.object({
    primary: ctaSchema,
    secondary: ctaSchema.optional(),
  }),
  leads: z.object({
    provider: providerSchema,
    /** "notice": a line under the form; "checkbox": an unticked box the visitor must tick. */
    consent: z.enum(["notice", "checkbox"]).default("notice"),
    consentText: label,
    /** Where a successful signup lands; the page receives ?cta=<type>. Pages end with a slash. */
    successPath: z.string().regex(/^\/(.*\/)?$/u, "a page path with the trailing slash, like \"/thanks/\"").default("/thanks/"),
    /** cloudflare: ask new signups to confirm by email before they count. */
    doubleOptIn: z.boolean().default(true),
    /**
     * Where UTM tags and ?ref= live between pages. url-only (default): read at submit, nothing
     * stored; session: kept for the tab (sessionStorage); persistent: kept 30 days (localStorage).
     */
    attribution: z.enum(["url-only", "session", "persistent"]).default("url-only"),
    /** cloudflare: a real queue — each credited referral moves a signup up this many places. */
    referrals: z.object({
      enabled: z.boolean().default(true),
      positionsPerReferral: z.number().int().min(1).max(100).default(5),
      maxCredited: z.number().int().min(0).max(100).default(10),
    }).prefault({}),
    /** cloudflare: the honest counter — the real number of confirmed signups, hidden below the threshold. */
    counter: z.object({
      enabled: z.boolean().default(true),
      threshold: z.number().int().min(1).default(25),
      label: z.string().default("people on the waitlist"),
    }).prefault({}),
  }),
  /** The plans on /pricing/ and the homepage. Left out, there is no pricing (mode "off"). */
  pricing: z.object({
    /**
     * fake-door: plans are shown and "Choose plan" counts interest, always with a disclosure,
     * never a payment; checkout: each paid plan links to a hosted checkout; off: no pricing page.
     */
    mode: z.enum(["fake-door", "checkout", "off"]).default("fake-door"),
    disclosure: z.object({
      dialogTitle: label.default("Thanks — this plan isn’t available yet"),
      dialogText: label.default("We’re measuring interest before we build it. Your click was counted and no payment was taken. Leave your email to hear when it launches."),
    }).prefault({}),
    plans: z.array(z.object({
      id: z.string().regex(/^[a-z0-9-]+$/u),
      name: label,
      description: z.string().default(""),
      price: label,
      period: z.string().default(""),
      note: z.string().default(""),
      features: z.array(label).default([]),
      cta: label.default("Choose plan"),
      highlighted: z.boolean().default(false),
      badge: z.string().optional(),
      /** checkout mode only: the hosted checkout for this plan (Stripe, Polar, Lemon Squeezy…). */
      checkoutUrl: z.url().optional(),
    })).default([]),
  }).prefault({ mode: "off" }),
  /** What you are testing; `npm run report` compares the results with it. */
  hypothesis: z.object({
    statement: z.string().default(""),
    /** Share of unique /pricing/ visitors who click "Choose plan", 0–1. */
    intentRateTarget: z.number().min(0).max(1).default(0.1),
    /** Confirmed signups you need to call the test a success. */
    signupTarget: z.number().int().min(0).default(100),
  }).prefault({}),
  /** Cookieless by default; the visitor's Do Not Track / Global Privacy Control turns it off. */
  analytics: z.object({
    provider: z.discriminatedUnion("id", [
      z.object({ id: z.literal("none") }),
      z.object({ id: z.literal("plausible"), domain: label, src: z.url().default("https://plausible.io/js/script.js") }),
      z.object({ id: z.literal("umami"), websiteId: label, src: z.url().default("https://cloud.umami.is/script.js") }),
      z.object({ id: z.literal("fathom"), siteId: label, src: z.url().default("https://cdn.usefathom.com/script.js") }),
      z.object({ id: z.literal("cloudflare"), token: label }),
      /** Sets cookies: the template shows a consent banner and loads it only after "Accept". */
      z.object({ id: z.literal("ga4"), measurementId: z.string().regex(/^G-[A-Z0-9]+$/u) }),
    ]).prefault({ id: "none" }),
    respectDoNotTrack: z.boolean().default(true),
  }).prefault({}),
  seo: z.object({
    title: z.string().optional(),
    ogImage: z.string().default("/og-default.png"),
    locale: z.string().default("en"),
    twitter: z.string().optional(),
  }).prefault({}),
  legal: z.object({
    companyName: label,
    contactEmail: z.email(),
    address: z.string().default(""),
    country: label,
    /** Where the site is hosted, named in the privacy policy's list of services. */
    hosting: z.enum(["cloudflare", "netlify", "vercel", "other"]).default("cloudflare"),
    /** The law the terms are governed by, e.g. "the laws of Germany". */
    governingLaw: z.string().default("{{GOVERNING_LAW}}"),
    effectiveDate: z.iso.date(),
    /** Show /legal/imprint (required in Germany and Austria). */
    imprint: z.boolean().default(false),
    registration: z.string().default(""),
    vatId: z.string().default(""),
    /** Pre-orders: days within which a pre-order is refunded on request. */
    refundDays: z.number().int().min(0).default(14),
    /** Only a person sets this, after reading the drafts. While false, legal pages show a draft banner. */
    reviewed: z.boolean().default(false),
  }),
}).superRefine((config, ctx) => {
  if (config.pricing.mode !== "off" && config.pricing.plans.length === 0) {
    ctx.addIssue({ code: "custom", path: ["pricing", "plans"], message: "add at least one plan, or set pricing.mode to \"off\"" });
  }
  // E_CHECKOUT_IN_FAKE_DOOR: a fake door must never be able to take money.
  config.pricing.plans.forEach((plan, i) => {
    if (config.pricing.mode === "fake-door" && plan.checkoutUrl) {
      ctx.addIssue({ code: "custom", path: ["pricing", "plans", i, "checkoutUrl"], message: "E_CHECKOUT_IN_FAKE_DOOR: a fake-door plan cannot link to a checkout; set pricing.mode to \"checkout\" or remove the URL" });
    }
    if (config.pricing.mode === "checkout" && !plan.checkoutUrl && !/^(free|\$?0)$/iu.test(plan.price.trim())) {
      ctx.addIssue({ code: "custom", path: ["pricing", "plans", i, "checkoutUrl"], message: "checkout mode needs a checkoutUrl for every paid plan" });
    }
  });
  // An embed form only carries the email to the service: answers and messages would be lost.
  if (config.leads.provider.id !== "embed") return;
  for (const slot of ["primary", "secondary"] as const) {
    const type = config.cta[slot]?.type;
    if (type === "access" || type === "contact") {
      ctx.addIssue({ code: "custom", path: ["cta", slot, "type"], message: `"${type}" needs a provider that stores extra fields; the embed provider sends the email only` });
    }
  }
});
export type SiteConfig = z.infer<typeof configSchema>;
export type SiteConfigInput = z.input<typeof configSchema>;

/** Checks the owner's config; a failing check names every bad path at once. */
export function loadConfig(input: SiteConfigInput): SiteConfig {
  const parsed = configSchema.safeParse(input);
  if (parsed.success) return parsed.data;
  const lines = parsed.error.issues.map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`);
  throw new Error(`E_CONFIG: src/site.config.ts is invalid\n${lines.join("\n")}`);
}
