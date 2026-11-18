# AGENTS.md — working on a Smoketest Lite site

Smoketest Lite is an Astro 7 + Tailwind 4 template for testing interest in a SaaS idea before
building it: a homepage with a signup form and an FAQ, a thank-you page, a privacy policy draft and
a 404 page, with cookieless analytics. The form sends leads from the visitor's browser to a form
service. You are helping the owner set it up and change it.

## Where things live

| What | Where |
|---|---|
| Every setting: product, look (`brand`), the call to action, leads provider, analytics, SEO, legal details | `src/site.config.ts` (checked by `src/config/schema.ts`) |
| Homepage copy (hero and FAQ) | `src/pages/index.astro` (the constants at the top) |
| Colour presets, light and dark | `src/styles/presets.css` (`brand.preset`) |
| Derived colours, type scale, radii | `src/styles/tokens.css` — Tailwind maps onto it (`src/styles/tailwind.css`) |
| Font pairs | `src/styles/fonts.css` (`brand.fonts`), files in `public/fonts/` |
| Visual polish, effects | `src/styles/craft.css`, `src/scripts/fx/` |
| The privacy policy draft | `src/content/legal/privacy.md` with `{{TOKENS}}` filled from the config |
| The hero's product shot | `design/mockups/hero-product.svg`, drawn in the preset's colours (light and `-dark`) by `src/pages/images/[mockup].svg.ts` |
| Icons and the web manifest | `public/favicon.svg` → `npm run icons` renders the PNGs and `favicon.ico`; `/manifest.webmanifest` comes from `src/pages/manifest.webmanifest.ts` |
| Redirects | `redirects` in `astro.config.mjs`, copied into `public/_redirects` and `vercel.json` (the build warns when they differ) |
| Going live: address, icons, form, hosts, staging, Search Console | `README.md` → "Before you launch" |
| The brand skill | `agent/skills/brand/` (`npm run link-skills` links it for Claude Code and Cursor) |

## Commands

```bash
npm run dev            # site with hot reload
npm run build          # static site into dist/
npm run preview        # serve dist/
npm run icons          # render favicon.ico, apple-touch-icon.png, icon-192/512.png from public/favicon.svg
npx astro check        # types
```

Before you say a change is done: `npm run build` must pass and `npx astro check` must show 0 errors.

## Rules — these are product promises, not style preferences

1. **No invented proof.** Never add testimonials, customer logos, user counts, ratings or results the
   owner did not give you.
2. **No compliance claims.** Do not write "GDPR-compliant", "lawyer-approved" or similar anywhere.
   The privacy policy is a "starting-point draft" that a person checks before launch.
3. **Secrets never in the site.** The config holds public identifiers only (the form posts from the
   browser); no secret key goes into `site.config.ts`, the code or the build.
4. **No promises about outcomes.** Copy may describe what the page collects; it must not promise
   that an idea will be validated or a number of signups.
5. **Never fake a signup.** With `leads.provider: { id: "none" }`, or a `{{PLACEHOLDER}}` left in the
   provider, the form sends nothing and tells visitors it isn't connected yet. Keep it that way.
6. **Privacy by default.** Nothing is stored in the visitor's browser unless the owner chose
   `leads.attribution` "session"/"persistent" or GA4 (which brings the consent banner), or the
   visitor uses the theme switch (`brand.themeToggle`), which keeps only their light/dark choice
   (`smoketest:theme`; the privacy policy lists it).

## How to change things

- **Switch the call to action**: edit `cta.primary` (and optionally `cta.secondary`): `waitlist`,
  `access` (a short form with qualifying questions), `demo` (Cal.com, Calendly or a link),
  `preorder` (a link to a hosted checkout), `contact` or `link`. Forms send to `leads.provider`.
- **Switch where leads go**: `leads.provider` — `web3forms`, `webhook`, `formspree`, `loops`,
  `supabase`, `google-sheets` or `embed` (Mailchimp, Kit, MailerLite, Brevo, Buttondown). `embed`
  carries the email only, so it cannot be combined with `access` or `contact` CTAs (the config
  refuses it).
- **Change the look**: `brand` in the config — `preset` (forma, ocean, forest, ember, rose,
  graphite), `theme` (light, dark, system), `themeToggle`, `fonts` (geometric, editorial,
  technical). For the owner's own colours, change the values of their preset in `presets.css` (both
  the light and the dark block), not names, and keep text at 4.5:1 contrast. Use the Tailwind
  theme classes (`bg-surface`, `text-ink`, `text-ink-secondary`, `border-line`, `bg-accent`,
  `font-display`, `text-h2`) in new components rather than raw colours, so they work in every
  preset and in dark.
- **New section**: put it in `src/components/sections/`, read settings from `site` (the config), use
  the `Button` and `Cta` components so links and forms keep working.
- **Links**: pages end with a slash (`/legal/privacy/`, home is `/`); files don't (`/robots.txt`).
  Absolute URLs come from `src/lib/url.ts` (`absolute`, `siteUrl`), which leaves them out while
  `product.url` is a placeholder — never build them from `product.url` directly.
