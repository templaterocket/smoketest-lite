/**
 * Site effects for the craft layer, after the Nodity reference: the ASCII pointer background,
 * ASCII wave panels, pointer tilt on the mockups, a pointer light on buttons, scramble-in
 * labels and the scroll reveal. All of it is decoration: the page reads the same without it,
 * and the motion is skipped for prefers-reduced-motion. The ASCII colours come from the active
 * preset and theme (tokens.css) and follow the light/dark switch.
 */
import { t as createAscii, c as withDefaults } from "./ascii-engine.js";

const root = document.documentElement;
root.classList.add("fx-ready");

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ------------------------------------------------------------- navbar */

const navbar = document.querySelector(".navbar-2");
const onScroll = () => navbar?.classList.toggle("is-scrolled", scrollY > 8);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ------------------------------------------------ button pointer light */

document.addEventListener("pointermove", (event) => {
  const button = event.target instanceof Element ? event.target.closest(".button") : null;
  if (!button) return;
  const box = button.getBoundingClientRect();
  button.style.setProperty("--mx", `${event.clientX - box.left}px`);
  button.style.setProperty("--my", `${event.clientY - box.top}px`);
}, { passive: true });

/* -------------------------------------------------------- scroll reveal */

/** Keep in step with the reveal list in craft.css. */
const REVEAL = [
  ".hero-header-82__column", ".hero-header-82__image", ".feature-459__card", ".stats-section-2__container",
  ".stats-section-2__stat", ".feature-155__title", ".feature-155__feature", ".feature-155__actions",
  ".feature-4__content", ".feature-4__media", ".pricing-34__head", ".pricing-34__card", ".faq-2__title",
  ".faq-2__item", ".cta-3__container",
];

const revealed = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add("is-revealed");
    revealed.unobserve(entry.target);
  }
}, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

for (const selector of REVEAL) {
  const seen = new Map();
  for (const el of document.querySelectorAll(selector)) {
    // Siblings of one kind step in one after another; a block alone waits for nothing.
    const index = seen.get(el.parentElement) ?? 0;
    seen.set(el.parentElement, index + 1);
    const delay = selector === ".hero-header-82__image" ? 160 : Math.min(index * 80, 400);
    el.style.setProperty("--reveal-delay", `${delay}ms`);
    revealed.observe(el);
  }
}

/* ------------------------------------------------------------ scramble */

const NOISE = "$%&#@*+=-~/\\|[]{}()<>?!:;^0123456789";
const DIGITS = "0123456789";

/** Settles the element's text from random glyphs, left to right; the real text stays in the DOM. */
function scramble(el, glyphs) {
  const node = [...el.childNodes].find((child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim());
  if (!node) return;
  const text = node.textContent;
  const wrap = document.createElement("span");
  wrap.className = "fx-scramble";
  const ghost = document.createElement("span");
  ghost.className = "fx-scramble__text";
  ghost.textContent = text;
  const overlay = document.createElement("span");
  overlay.className = "fx-scramble__overlay";
  overlay.setAttribute("aria-hidden", "true");
  wrap.append(ghost, overlay);
  node.replaceWith(wrap);

  const chars = [...text];
  const step = Math.min(26, 620 / chars.length);
  const settleAt = chars.map((_, i) => 120 + i * step + Math.random() * 200);
  const shown = chars.map(() => "");
  const changed = chars.map(() => -Infinity);
  const start = performance.now();
  const frame = (now) => {
    const t = now - start;
    let pending = false;
    overlay.textContent = chars.map((char, i) => {
      if (char === " " || t >= settleAt[i]) return char;
      pending = true;
      if (t - changed[i] > 55) {
        shown[i] = glyphs[Math.floor(Math.random() * glyphs.length)];
        changed[i] = t;
      }
      return shown[i];
    }).join("");
    if (pending) requestAnimationFrame(frame);
    else wrap.replaceWith(document.createTextNode(text));
  };
  requestAnimationFrame(frame);
}

if (!reduced) {
  const targets = [
    [".feature-155__tagline, .feature-4__tagline, .pricing-34__tagline", NOISE],
    [".stats-section-2__value", DIGITS],
  ];
  const glyphsFor = new Map();
  const scrambled = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      scrambled.unobserve(entry.target);
      scramble(entry.target, glyphsFor.get(entry.target));
    }
  }, { threshold: 0.6 });
  for (const [selector, glyphs] of targets) {
    for (const el of document.querySelectorAll(selector)) {
      glyphsFor.set(el, glyphs);
      scrambled.observe(el);
    }
  }
}

/* --------------------------------------------------------------- tilt */

/** Turns the element a few degrees towards the pointer, easing back on leave. */
function tilt(el, max) {
  let target = { x: 0, y: 0 };
  let current = { x: 0, y: 0 };
  let raf = 0;
  const loop = () => {
    current = { x: current.x + (target.x - current.x) * 0.12, y: current.y + (target.y - current.y) * 0.12 };
    const settled = Math.abs(target.x - current.x) < 0.01 && Math.abs(target.y - current.y) < 0.01;
    el.style.transform = settled && target.x === 0 && target.y === 0
      ? ""
      : `perspective(1200px) rotateX(${current.x.toFixed(3)}deg) rotateY(${current.y.toFixed(3)}deg)`;
    raf = settled ? 0 : requestAnimationFrame(loop);
  };
  const kick = () => { raf ||= requestAnimationFrame(loop); };
  el.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    const box = el.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    target = { x: -y * 2 * max, y: x * 2 * max };
    kick();
  });
  el.addEventListener("pointerleave", () => { target = { x: 0, y: 0 }; kick(); });
}

if (!reduced && finePointer) {
  for (const [selector, max] of [[".hero-header-82__image", 2], [".feature-4__media", 4]]) {
    for (const el of document.querySelectorAll(selector)) tilt(el, max);
  }
}

/* ---------------------------------------------------- ASCII: shared bits */

const MONO = "\"JetBrains Mono\", monospace";
const RAMP = ".:-~+<>()[]{}|/\\?1lIjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
const LAYERS = [
  { amplitude: 1, frequency: 1.1, angle: 0, speed: 1, phase: 0 },
  { amplitude: 0.6, frequency: 2.1, angle: 24, speed: -0.7, phase: 0.31 },
  { amplitude: 0.35, frequency: 3.7, angle: -38, speed: 1.3, phase: 0.62 },
];

/* ------------------------------------------------ ASCII: theme colours */

// The engine takes hex colours: read the preset's tokens and blend them here.
const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
const toHex = (css) => {
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = "#000000";
  probe.fillStyle = css;
  probe.fillRect(0, 0, 1, 1);
  return `#${[...probe.getImageData(0, 0, 1, 1).data.slice(0, 3)].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
};
const token = (name) => toHex(getComputedStyle(root).getPropertyValue(name).trim() || "#000000");
/** `a` mixed with `b`, p = share of `a`. */
const blend = (a, b, p) => `#${[1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * p + parseInt(b.slice(i, i + 2), 16) * (1 - p)).toString(16).padStart(2, "0")).join("")}`;

function palette() {
  const dark = root.dataset.theme === "dark";
  const accent = token("--color-yellow-alpha-100");
  const reverse = token("--bg-reverse");
  return {
    pointer: dark ? { ink: token("--text-accent"), inkLight: blend(accent, token("--bg-main"), 0.5) } : { ink: accent, inkLight: blend(accent, "#ffffff", 0.35) },
    // The panels are dark in both themes (stats) or accent-coloured (call to action).
    stats: { ink: blend(accent, "#ffffff", 0.55), inkLight: blend(accent, reverse, 0.4), dots: blend(accent, "#ffffff", 0.35) },
    cta: { ink: "#ffffff", inkLight: blend(accent, "#ffffff", 0.45), dots: "#ffffff" },
  };
}

/** Engines to recolour on a theme switch: each pairs a field with the config it was made from. */
const themed = [];
new MutationObserver(() => {
  const colors = palette();
  for (const { field, config } of themed) field.update(config(colors));
}).observe(root, { attributes: true, attributeFilter: ["data-theme", "data-preset"] });

/* ---------------------------------------- ASCII pointer background (fixed) */

const pointerCanvas = document.querySelector("canvas.fx-pointer");
if (pointerCanvas && finePointer && !reduced) {
  const config = (colors) => withDefaults({
    name: "Pointer background",
    mode: "pointer",
    ascii: {
      ramp: RAMP, rampPreset: "symbols", glyphVariety: 0.5, shimmer: 0,
      fontFamily: MONO, fontSize: 12, cellWidth: 12, cellHeight: 22,
      dots: { enabled: false },
      colors: { background: "#FFFFFF", transparentBackground: true, ...colors.pointer },
      tone: { contrast: 1, brightness: 0, gamma: 1, threshold: 0, maxOpacity: 0.34 },
    },
    waves: {
      layers: LAYERS,
      mouse: { enabled: true, mode: "wake", strength: 1.1, radius: 200, falloff: 3.45, smoothing: 0.5, tail: 1.05, reveal: true, speedInfluence: 0.8, waveSpeed: 0.4, damping: 0.045, touch: false },
    },
    image: { src: "", underlay: { enabled: false } },
  });
  const field = createAscii(pointerCanvas, config(palette()), { autoplay: false, stopWhenIdle: true, pauseOffscreen: false, maxDpr: 1.5 });
  themed.push({ field, config });

  // Glyphs stay off the panels and cards: the engine skips the masked boxes.
  let boxes = [];
  const transparent = (color) => color === "rgba(0, 0, 0, 0)" || color === "transparent";
  const measure = () => {
    const found = [];
    for (const el of document.body.querySelectorAll("*")) {
      if (el instanceof HTMLCanvasElement || el.closest(".fx-waves")) continue;
      const box = el.getBoundingClientRect();
      if (box.width < 90 || box.height < 50) continue;
      const style = getComputedStyle(el);
      const filled = !transparent(style.backgroundColor) || style.backgroundImage !== "none";
      if (!filled || style.visibility === "hidden") continue;
      const fixed = style.position === "fixed" || style.position === "sticky";
      const rect = { l: box.left + (fixed ? 0 : scrollX), t: box.top + (fixed ? 0 : scrollY), r: box.right + (fixed ? 0 : scrollX), b: box.bottom + (fixed ? 0 : scrollY), fixed };
      if (!found.some((o) => o.fixed === rect.fixed && rect.l >= o.l - 1 && rect.r <= o.r + 1 && rect.t >= o.t - 1 && rect.b <= o.b + 1)) found.push(rect);
    }
    boxes = found;
    mask();
  };
  let maskFrame = 0;
  const mask = () => {
    maskFrame = 0;
    field.setMask(boxes.map((o) => ({
      l: o.l - (o.fixed ? 0 : scrollX), t: o.t - (o.fixed ? 0 : scrollY),
      r: o.r - (o.fixed ? 0 : scrollX), b: o.b - (o.fixed ? 0 : scrollY),
    })).filter((o) => o.r > 0 && o.b > 0 && o.l < innerWidth && o.t < innerHeight));
  };
  let measureTimer = 0;
  const remeasure = () => { clearTimeout(measureTimer); measureTimer = setTimeout(measure, 250); };
  addEventListener("scroll", () => { maskFrame ||= requestAnimationFrame(mask); }, { passive: true });
  addEventListener("resize", remeasure);
  addEventListener("load", remeasure);
  new ResizeObserver(remeasure).observe(document.body);

  // Hovering a button draws the glyphs towards it.
  let hovered = null;
  const attract = (el) => {
    hovered = el;
    if (!el) return field.setAttractor(null);
    const box = el.getBoundingClientRect();
    field.setAttractor({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
  };
  document.addEventListener("pointerover", (event) => {
    const el = event.target instanceof Element ? event.target.closest(".button") : null;
    if (el !== hovered) attract(el);
  }, { passive: true });
  document.addEventListener("pointerout", (event) => {
    if (hovered && !(event.relatedTarget instanceof Node && hovered.contains(event.relatedTarget))) attract(null);
  }, { passive: true });
}

/* ------------------------------------------------- ASCII wave panels */

const PANELS = [
  { selector: ".stats-section-2__container", colors: "stats", maxOpacity: 0.55 },
  { selector: ".cta-3__container", colors: "cta", maxOpacity: 0.3 },
];

for (const panel of PANELS) {
  const host = document.querySelector(panel.selector);
  if (!host) continue;
  const layer = document.createElement("div");
  layer.className = "fx-waves";
  layer.setAttribute("aria-hidden", "true");
  const canvas = document.createElement("canvas");
  layer.append(canvas);
  host.prepend(layer);
  const config = (colors) => {
    const { ink, inkLight, dots } = colors[panel.colors];
    return withDefaults({
      name: "Panel waves",
      mode: "waves",
      ascii: {
        ramp: RAMP, rampPreset: "symbols", glyphVariety: 0, shimmer: 1.88,
        fontFamily: MONO, fontSize: 10, cellWidth: 9, cellHeight: 19.25,
        dots: { enabled: true, char: ".", color: dots, opacity: 0.12 },
        colors: { background: "#000000", transparentBackground: true, ink, inkLight },
        tone: { contrast: 1.25, brightness: 0, gamma: 1.2, threshold: 0.5, maxOpacity: panel.maxOpacity },
      },
      waves: {
        layers: LAYERS,
        mouse: { enabled: true, mode: "ripple", strength: 0.98, radius: 220, falloff: 3.45, smoothing: 0.85, tail: 1.05, reveal: true, speedInfluence: 0.8, waveSpeed: 0.35, damping: 0.06, touch: true },
      },
      image: { src: "", underlay: { enabled: false } },
    });
  };
  themed.push({ field: createAscii(canvas, config(palette()), { reducedMotion: reduced, maxDpr: 1.5 }), config });
}
