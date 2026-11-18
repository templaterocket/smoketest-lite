/**
 * The product mockups, /images/<name>.svg and /images/<name>-dark.svg, drawn at build time from
 * design/mockups/<name>.svg in the colours of the configured preset (brand.preset) and theme.
 * A source names its colours by role (var(--m-surface), var(--m-accent)…); the roles below are
 * worked out from the preset's tokens, so the images follow a rebrand and the dark theme.
 * Fonts are embedded, because an SVG used as a CSS background cannot load the page's web fonts:
 * a source lists the faces it needs in a comment, <!--FONTS dm-400 dm-600 manrope-600 mono-400-->.
 */
import type { APIRoute, GetStaticPaths } from "astro";
import { hex, mix, over, type Rgba, type Theme } from "../../lib/palette";
import { palette } from "../../lib/theme";

const sources = import.meta.glob<string>("/design/mockups/*.svg", { query: "?raw", import: "default", eager: true });
const byName = new Map(Object.entries(sources).map(([path, svg]) => [path.replace(/^.*\/|\.svg$/gu, ""), svg]));
/** The font files as data: URLs. */
const fontData = import.meta.glob<string>("/public/fonts/*.woff2", { query: "?inline", import: "default", eager: true });

const FONTS: Record<string, [family: string, weight: number, file: string]> = {
  "dm-400": ["DM Sans", 400, "latin-400-normal.woff2"],
  "dm-600": ["DM Sans", 600, "latin-600-normal.woff2"],
  "manrope-600": ["Manrope", 600, "manrope-600.woff2"],
  "mono-400": ["JetBrains Mono", 400, "jetbrains-mono-400.woff2"],
};

const WHITE: Rgba = [255, 255, 255, 1];
const BLACK: Rgba = [0, 0, 0, 1];

/** The mockups' colour roles in one theme of the configured preset. */
function roles(theme: Theme): Record<string, string> {
  const p = palette(theme);
  const dark = theme === "dark";
  const accent = p.color("--bg-accent");
  const highlight = p.color("--color-highlight");
  const main = p.color("--bg-main");
  const secondary = p.color("--bg-secondary");
  const ink = p.color("--color-black-alpha-100");
  const colors: Record<string, Rgba> = {
    surface: main,
    "surface-2": secondary,
    line: over([...p.color("--text-main").slice(0, 3), dark ? 0.12 : 0.09] as Rgba, secondary),
    ink: p.color("--text-main"),
    "ink-2": p.color("--text-secondary"),
    "ink-3": mix(p.color("--text-secondary"), main, 0.6),
    tint: p.color("--bg-tertiary"),
    "tint-2": p.color("--bg-additional"),
    "tint-3": mix(accent, main, dark ? 0.4 : 0.25),
    accent,
    "accent-text": p.color("--text-accent"),
    "accent-2": mix(accent, highlight, 0.5),
    "accent-light": mix(accent, WHITE, 0.85),
    highlight,
    "grad-start": dark ? p.color("--text-accent") : accent,
    "terminal-accent": mix(accent, WHITE, 0.5),
    "btn-1": mix(accent, WHITE, 0.92),
    "btn-2": mix(accent, BLACK, 0.92),
    "frame-1": mix(accent, BLACK, 0.6),
    "frame-2": mix(accent, BLACK, 0.9),
    "frame-3": mix(accent, WHITE, 0.85),
    glow: mix(highlight, WHITE, 0.6),
    // Behind the how-it-works cards the glow is the page's own: light on light, accent on dark.
    "page-glow": dark ? accent : mix(highlight, WHITE, 0.6),
    reverse: p.color("--bg-reverse"),
    shadow: dark ? BLACK : ink,
    "shadow-tint": dark ? BLACK : mix(accent, ink, 0.3),
  };
  return Object.fromEntries(Object.entries(colors).map(([role, color]) => [role, hex(color)]));
}

function render(source: string, theme: Theme): string {
  const colors = roles(theme);
  return source
    .replace(/\s*<!--[^>]*-->\s*<style id="palette">[^<]*<\/style>/u, "")
    .replace(/var\(--m-([a-z0-9-]+)\)/gu, (_, role: string) => {
      const color = colors[role];
      if (!color) throw new Error(`E_MOCKUP: unknown colour role --m-${role} in design/mockups`);
      return color;
    })
    .replace(/<!--FONTS ([^>]*)-->/u, (_, list: string) => {
      const faces = list.trim().split(/\s+/u).map((key) => {
        const [family, weight, file] = FONTS[key] ?? [];
        if (!family) throw new Error(`E_MOCKUP: unknown font ${key} in design/mockups`);
        const data = fontData[`/public/fonts/${file}`]?.replace(/^data:[^;,]*/u, "data:font/woff2");
        if (!data) throw new Error(`E_MOCKUP: public/fonts/${file} is missing`);
        return `@font-face{font-family:"${family}";font-weight:${weight};src:url(${data}) format("woff2")}`;
      });
      return `<style>${faces.join("")}</style>`;
    });
}

export const getStaticPaths = (() => [...byName.keys()].flatMap((name) => [{ params: { mockup: name } }, { params: { mockup: `${name}-dark` } }])) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => {
  const id = params.mockup ?? "";
  const theme: Theme = id.endsWith("-dark") ? "dark" : "light";
  const source = byName.get(id.replace(/-dark$/u, ""));
  if (!source) return new Response("Not found", { status: 404 });
  return new Response(render(source, theme), { headers: { "Content-Type": "image/svg+xml; charset=utf-8" } });
};
