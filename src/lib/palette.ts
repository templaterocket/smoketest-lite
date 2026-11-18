/**
 * The colour tokens as data: reads tokens.css and presets.css, works out what every colour
 * variable resolves to for a preset and theme (the cascade of `:root[data-…]` blocks, `var()`
 * and `color-mix(in srgb, …)`), and measures contrast. Used by the mockup images
 * (src/pages/images/), the layout's theme-color and `npm run validate` (V22). It has no imports,
 * so the Node scripts can bundle it as they bundle site.config.ts.
 */

export type Rgba = [number, number, number, number];
export type Theme = "light" | "dark";
type Vars = Record<string, string>;

interface Block {
  /** Attribute conditions per selector, e.g. [{ "data-preset": "ocean", "data-theme": "dark" }]. */
  selectors: Record<string, string>[];
  vars: Vars;
}

/** The `:root…` blocks of a stylesheet; blocks inside @media (spacing, type scale) are skipped. */
export function parseBlocks(css: string): Block[] {
  const flat = css.replace(/\/\*[\s\S]*?\*\//gu, "").replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/gu, "");
  const blocks: Block[] = [];
  for (const [, selectorText, body] of flat.matchAll(/([^{}]+)\{([^{}]*)\}/gu)) {
    const selectors = selectorText.split(",").map((s) => s.trim());
    if (!selectors.every((s) => /^:root(\[[a-z-]+="[^"]*"\])*$/u.test(s))) continue;
    const vars: Vars = {};
    for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/gu)) vars[name] = value.trim();
    blocks.push({ selectors: selectors.map((s) => Object.fromEntries([...s.matchAll(/\[([a-z-]+)="([^"]*)"\]/gu)].map((m) => [m[1], m[2]]))), vars });
  }
  return blocks;
}

/** The variables on <html> with these attributes: matching blocks by specificity, then order. */
export function rootVars(blocks: Block[], attrs: Record<string, string>): Vars {
  const matched: { specificity: number; order: number; vars: Vars }[] = [];
  blocks.forEach((block, order) => {
    const hits = block.selectors.filter((conds) => Object.entries(conds).every(([k, v]) => attrs[k] === v));
    if (hits.length > 0) matched.push({ specificity: Math.max(...hits.map((conds) => Object.keys(conds).length)), order, vars: block.vars });
  });
  matched.sort((a, b) => a.specificity - b.specificity || a.order - b.order);
  return Object.assign({}, ...matched.map((m) => m.vars));
}

const NAMED: Record<string, Rgba> = { transparent: [0, 0, 0, 0], white: [255, 255, 255, 1], black: [0, 0, 0, 1] };

/** Splits on top-level commas: "a, f(b, c), d" → ["a", "f(b, c)", "d"]. */
function args(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")") depth--;
    else if (text[i] === "," && depth === 0) {
      out.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(text.slice(start).trim());
  return out;
}

/** Evaluates a colour value: hex, rgb()/rgba(), a few names, var() and color-mix(in srgb, …). */
export function evalColor(value: string, vars: Vars, seen: string[] = []): Rgba {
  const v = value.trim();
  const fn = /^([a-z-]+)\(([\s\S]*)\)$/u.exec(v);
  if (fn?.[1] === "var") {
    const [name, fallback] = args(fn[2]);
    if (seen.includes(name)) throw new Error(`palette: ${name} refers to itself`);
    if (vars[name] !== undefined) return evalColor(vars[name], vars, [...seen, name]);
    if (fallback !== undefined) return evalColor(fallback, vars, seen);
    throw new Error(`palette: ${name} is not set`);
  }
  if (fn?.[1] === "color-mix") {
    const [space, ...parts] = args(fn[2]);
    if (space !== "in srgb" || parts.length !== 2) throw new Error(`palette: only color-mix(in srgb, a, b) is supported: ${v}`);
    const items = parts.map((part) => {
      const m = /^(.*?)\s+([\d.]+)%$/u.exec(part);
      return { color: evalColor(m ? m[1] : part, vars, seen), pct: m ? Number(m[2]) / 100 : null };
    });
    const [p1, p2] = [items[0].pct ?? 1 - (items[1].pct ?? 0.5), items[1].pct ?? 1 - (items[0].pct ?? 0.5)];
    const sum = p1 + p2;
    const [a, b] = [items[0].color, items[1].color];
    const w1 = p1 / sum;
    const w2 = p2 / sum;
    const alpha = a[3] * w1 + b[3] * w2;
    const channel = (i: number): number => (alpha === 0 ? 0 : (a[i] * a[3] * w1 + b[i] * b[3] * w2) / alpha);
    return [channel(0), channel(1), channel(2), alpha * Math.min(sum, 1)];
  }
  if (fn?.[1] === "rgb" || fn?.[1] === "rgba") {
    const nums = fn[2].split(/[\s,/]+/u).filter(Boolean).map((n) => (n.endsWith("%") ? Number(n.slice(0, -1)) / 100 : Number(n)));
    return [nums[0], nums[1], nums[2], nums[3] ?? 1];
  }
  const hex = /^#([0-9a-f]{3,8})$/iu.exec(v)?.[1];
  if (hex) {
    const full = hex.length <= 4 ? [...hex].map((c) => c + c).join("") : hex;
    const n = (i: number): number => parseInt(full.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), full.length === 8 ? n(6) / 255 : 1];
  }
  const named = NAMED[v.toLowerCase()];
  if (named) return named;
  throw new Error(`palette: cannot read the colour ${v}`);
}

/** `top` painted over `bottom` (normal alpha blending); the result is opaque when `bottom` is. */
export function over(top: Rgba, bottom: Rgba): Rgba {
  const alpha = top[3] + bottom[3] * (1 - top[3]);
  const channel = (i: number): number => (alpha === 0 ? 0 : (top[i] * top[3] + bottom[i] * bottom[3] * (1 - top[3])) / alpha);
  return [channel(0), channel(1), channel(2), alpha];
}

/** `a` mixed with `b` in sRGB, p = share of `a` (as color-mix(in srgb, a p%, b)). */
export const mix = (a: Rgba, b: Rgba, p: number): Rgba => [0, 1, 2, 3].map((i) => a[i] * p + b[i] * (1 - p)) as Rgba;

export const hex = (c: Rgba): string => `#${c.slice(0, 3).map((x) => Math.round(Math.min(255, Math.max(0, x))).toString(16).padStart(2, "0")).join("").toUpperCase()}`;

/** WCAG 2 contrast ratio of two opaque colours. */
export function contrast(a: Rgba, b: Rgba): number {
  const lum = (c: Rgba): number => {
    const [r, g, bl] = c.slice(0, 3).map((x) => {
      const s = x / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** A palette: the resolved colour variables of one preset in one theme. */
export class Palette {
  constructor(readonly vars: Vars) {}

  static of(css: string[], preset: string, theme: Theme): Palette {
    return new Palette(rootVars(css.flatMap(parseBlocks), { "data-preset": preset, "data-theme": theme }));
  }

  /** A token as an opaque colour (translucent ones are painted over --bg-main). */
  color(name: string): Rgba {
    const c = evalColor(`var(${name})`, this.vars);
    return c[3] >= 1 ? c : over(c, evalColor("var(--bg-main)", this.vars));
  }

  hex(name: string): string {
    return hex(this.color(name));
  }
}

/** Text and the surfaces it sits on: each pair must reach 4.5:1 (WCAG AA for body text). */
export const CONTRAST_PAIRS: [text: string, background: string][] = [
  ["--text-main", "--bg-main"],
  ["--text-main", "--bg-secondary"],
  ["--text-main", "--bg-tertiary"],
  ["--text-secondary", "--bg-main"],
  ["--text-secondary", "--bg-secondary"],
  ["--text-tertiary", "--bg-main"],
  ["--text-accent", "--bg-main"],
  ["--text-accent", "--bg-secondary"],
  ["--text-accent", "--bg-tertiary"],
  ["--text-danger", "--bg-main"],
  ["--text-reverse", "--bg-accent"],
  ["--text-reverse", "--bg-reverse"],
  ["--text-reverse-secondary", "--bg-reverse"],
];

/** The pairs of a palette below `min`, with their ratios. */
export function contrastProblems(palette: Palette, min = 4.5): string[] {
  return CONTRAST_PAIRS.flatMap(([text, background]) => {
    const bg = palette.color(background);
    const ratio = contrast(over(evalColor(`var(${text})`, palette.vars), bg), bg);
    return ratio < min ? [`${text} on ${background}: ${ratio.toFixed(2)}:1 (${palette.hex(text)} on ${hex(bg)})`] : [];
  });
}
