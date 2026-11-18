# Smoketest Lite

**A landing page with a working signup form, set up by your coding agent.** Smoketest Lite is a
free, MIT-licensed Astro 7 + Tailwind 4 template for testing interest in a SaaS idea before you
build it: a homepage with the form, a thank-you page, a privacy policy draft, light and dark
themes in six colour presets and three font pairs, and cookieless analytics. Your agent reads
`AGENTS.md` / `CLAUDE.md`, and the `brand` skill changes the look.

## Quick start

```bash
npm install
npm run dev            # http://localhost:4321
```

Then edit **`src/site.config.ts`** — the one file with every setting — or ask your agent
(`npm run link-skills` once makes the `brand` skill available to Claude Code and Cursor).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Site with hot reload |
| `npm run build` | Static site into `dist/` |
| `npm run preview` | Serves `dist/` locally |
| `npm run icons` | Renders `favicon.ico`, `apple-touch-icon.png`, `icon-192.png` and `icon-512.png` from `public/favicon.svg` |
| `npm run link-skills` | Links `agent/skills` for Claude Code (`.claude/skills`) and Cursor (`.cursor/rules`) |
| `npx astro check` | Type check |

## What's in `site.config.ts`

| Key | Sets |
|---|---|
| `product` | Name, one-line description, the site's address (`url`: canonical links, sitemap, social image) |
| `brand` | `preset` (`forma`, `ocean`, `forest`, `ember`, `rose`, `graphite`), `theme` (`light` · `dark` · `system`), `themeToggle`, `fonts` (`geometric`, `editorial`, `technical`) |
| `cta.primary`, `cta.secondary` | The call to action: `waitlist`, `access` (with questions), `demo`, `preorder` (hosted checkout), `contact` or `link` |
| `leads` | Where signups go (below), consent as a notice or a checkbox, attribution mode |
| `analytics` | `none` · `plausible` · `umami` · `fathom` · `cloudflare` (all cookieless) · `ga4` (cookies → consent banner) |
| `seo` | Title, OG image, locale, Twitter handle |
| `legal` | Company details that fill the privacy draft; `hosting` (`cloudflare`, `netlify`, `vercel`: named in the policy) |

The homepage copy is in `src/pages/index.astro`; colours in `src/styles/presets.css` (see the
`brand` skill).

## Where leads go — `leads.provider`

The form posts straight from the visitor's browser to a form service, so it works on any static
host. Lite ships set to **Web3Forms** with a placeholder key:

```ts
provider: { id: "web3forms", accessKey: "{{WEB3FORMS_ACCESS_KEY}}" },
```

Get a free access key at web3forms.com and put it there; each signup is then emailed to you.
**Until you do, the form is not connected**: it sends nothing anywhere, and a visitor who submits
it stays on the page and reads "This form isn't connected yet, so nothing was sent." — never a
thank-you. To send signups to Zapier, Make, n8n or your own API instead, use
`{ id: "webhook", url: "https://…" }` (add `opaque: true` if the endpoint sends no CORS headers).
Formspree, Loops, Supabase, Google Sheets and Mailchimp-style embed forms work the same way; the
comments in `site.config.ts` show their settings. `{ id: "none" }` leaves the form unconnected on
purpose — for a demo that must collect no emails.

Only public identifiers go in the config: the form posts from the browser.

## Before you launch

- **Your address.** Set `product.url` to the real domain. While it is `example.com` (or `.org`,
  `.net`) the build writes no URL on that domain: pages have no canonical link or `og:url`, the
  sitemap lists no pages, `robots.txt` names no sitemap, and the privacy draft says "this website".
  The build prints a reminder.
- **Your icon.** Replace `public/favicon.svg` with your own square icon (it is also drawn at 16 px,
  so keep it simple) and run `npm run icons`: `favicon.ico` (16 and 32 px), `apple-touch-icon.png`
  (180 px on your preset's page colour, as iOS wants no transparency) and `icon-192.png` /
  `icon-512.png`, listed in `/manifest.webmanifest` with your product name and preset colours.
  Replace `public/og-default.png` (1200×630), the image shown when your page is shared.
- **The form.** A real Web3Forms key or webhook URL (above) — until then it tells visitors it isn't
  connected; send yourself one signup on the live site.
- **The privacy draft.** Fill `legal` in the config (`{{COMPANY_NAME}}` and the other values in
  braces show on the page until you do) and have a person check the text: it is a starting-point
  draft, not legal advice.
- **One URL style.** Pages end with a slash: `/legal/privacy/`, `/thanks/` (home is `/`); files
  don't (`/robots.txt`, `/sitemap.xml`). Link to pages that way; hosts redirect `/legal/privacy`
  to `/legal/privacy/`.
- **Redirects.** When you move or rename a page, add the old address to `redirects` in
  `astro.config.mjs` — the source of truth — and copy the rule into `public/_redirects` (Cloudflare,
  Netlify) and `vercel.json` (Vercel), with and without the trailing slash. Astro writes no redirect
  pages, so a rule missing from a file does not exist on that host; the build warns about it.
- **A staging copy stays out of Google** with an `X-Robots-Tag: noindex` response header on the
  staging host, not with `robots.txt`: a page blocked there can still be listed from links, and
  crawlers never see its `noindex`. Preview URLs of Vercel and Netlify usually send the header
  already (check the response headers); for a staging domain of your own, add it in the host's
  header settings (Cloudflare: a response header Transform Rule for that hostname). Never put it in
  a file the production build ships.
- **Search Console.** After the first deploy, add the domain in Google Search Console and submit
  `https://yourdomain/sitemap.xml` (`robots.txt` points to it as well). The sitemap lists the
  homepage and the privacy policy, the latter with `legal.effectiveDate` as its date; the thank-you
  and 404 pages stay out.

## Hosting

Lite is a static site: `npm run build` writes `dist/`, and the form talks to your form service from
the browser, so all three hosts below run all of it.

- **Cloudflare Workers** (static assets): `wrangler.jsonc` serves `dist/`, applies `_redirects`,
  adds the trailing slash to page addresses and answers unknown paths with `404.html`. Run
  `npm run build && npx wrangler deploy`, or connect the repository in the Cloudflare dashboard
  (build command `npm run build`, deploy command `npx wrangler deploy`).
- **Netlify**: build command `npm run build`, publish directory `dist`. It reads `dist/_redirects`
  and serves `404.html` for unknown paths.
- **Vercel**: it detects Astro (output `dist`) and reads `vercel.json`: `"trailingSlash": true` and
  your `redirects`. It serves `404.html` for unknown paths.

## Pages

`/` · `/thanks/` (where a signup lands; not indexed) · `/legal/privacy/` · 404 (not indexed) ·
`/sitemap.xml` · `/robots.txt` · `/llms.txt` · `/manifest.webmanifest`.

## Honest by design

No invented testimonials, logos or numbers; no "GDPR-compliant" or "lawyer-approved" claims; the
privacy policy is a starting-point draft; secrets never go into the config. Nothing is stored in a
visitor's browser unless you turn on attribution or GA4 (which brings a consent banner), or the
visitor uses the theme switch, which keeps only their light/dark choice. `AGENTS.md` holds these rules for coding agents.

## Project map

```
src/site.config.ts        every setting (schema: src/config/schema.ts)
src/pages/                pages and endpoints (index.astro holds the homepage copy)
src/components/           cta/, sections/, site/ (header, footer, analytics), ui/, library/
src/content/legal/        the privacy policy draft (Markdown)
src/lib/                  leads sending and attribution, analytics, legal tokens, page list, palette and theme
src/styles/               presets.css (colours), tokens.css (theme), fonts.css, tailwind.css, craft.css (polish)
src/integrations/         redirects-check (warns when public/_redirects or vercel.json miss a redirect)
public/                   favicon.svg and the icons rendered from it, og-default.png, _redirects, fonts
scripts/                  icons, link-skills
agent/skills/brand/       the brand skill for coding agents
```

## License

MIT (see `LICENSE`). Fonts: DM Sans, Manrope, Inter, Fraunces, IBM Plex Sans, Space Grotesk,
JetBrains Mono — all under the SIL Open Font License (texts in `public/fonts/`).
