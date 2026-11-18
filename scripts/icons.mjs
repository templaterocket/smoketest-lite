// npm run icons — renders the icon set from public/favicon.svg (replace that file with your own
// square icon first): favicon.ico (16 and 32 px), apple-touch-icon.png (180 px on an opaque
// background, the page colour of the brand preset, with ~15% padding: iOS fills transparency with
// black), and icon-192.png / icon-512.png for the web manifest (/manifest.webmanifest).
// The ICO is written here — a 6-byte header, a 16-byte entry per size, then the PNGs — so it
// needs nothing beyond @resvg/resvg-js, which `npm run og` uses too.
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadModule, loadSiteConfig, root } from "./lib/config.mjs";

const site = await loadSiteConfig();
const { Palette } = await loadModule("src/lib/palette.ts");
const page = Palette.of(["tokens.css", "presets.css"].map((file) => readFileSync(join(root, "src", "styles", file), "utf8")), site.brand.preset, "light").hex("--bg-main");
const svg = readFileSync(join(root, "public/favicon.svg"), "utf8");

const render = (source, size) => new Resvg(source, { fitTo: { mode: "width", value: size }, font: { loadSystemFonts: false } }).render().asPng();

/** The icon inset by `padding` (a share of each side) on a square of `background`. */
function onBackground(size, background, padding) {
  const inset = Math.round(size * padding);
  const href = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${background}"/><image href="${href}" x="${inset}" y="${inset}" width="${size - 2 * inset}" height="${size - 2 * inset}"/></svg>`;
}

/** An ICO container holding PNG images (supported by every current browser). */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, entry); // width (0 means 256)
    header.writeUInt8(size >= 256 ? 0 : size, entry + 1); // height
    header.writeUInt8(0, entry + 2); // palette colours: none
    header.writeUInt8(0, entry + 3); // reserved
    header.writeUInt16LE(1, entry + 4); // colour planes
    header.writeUInt16LE(32, entry + 6); // bits per pixel
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map(({ png }) => png)]);
}

const files = [
  ["favicon.ico", ico([16, 32].map((size) => ({ size, png: render(svg, size) }))), "16+32"],
  ["apple-touch-icon.png", render(onBackground(180, page, 0.15), 180), `180, on ${page}`],
  ["icon-192.png", render(svg, 192), "192"],
  ["icon-512.png", render(svg, 512), "512"],
];
for (const [name, data, note] of files) {
  writeFileSync(join(root, "public", name), data);
  console.log(`public/${name.padEnd(22)}${note.padEnd(18)}${(data.length / 1024).toFixed(1)} KB`);
}
