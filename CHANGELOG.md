# Changelog

All notable changes to Smoketest Lite are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-11-18

First public release.

- A landing page for testing interest in a SaaS idea: a homepage with the signup form and an FAQ,
  a thank-you page, a privacy policy draft and a 404 page.
- One settings file (`src/site.config.ts`): product name and address, six colour presets, light
  and dark themes, three font pairs, the form's provider (Web3Forms or a webhook) and cookieless
  analytics.
- The form never fakes success: until a provider is connected it sends nothing and says so.
- Ready to launch on Cloudflare, Netlify or Vercel: one URL style with a trailing slash, a sitemap
  and `robots.txt` from your address, the icon set with a web manifest (`npm run icons` renders it
  from `public/favicon.svg`), a 404 page, and `_redirects` / `vercel.json` for your old URLs.
- `AGENTS.md`, `CLAUDE.md` and a `brand` skill so a coding agent can set it up with you.
