// Loads src/site.config.ts for the Node scripts: compiled with esbuild, so the scripts see exactly
// what the site and the Worker see — including the E_CONFIG checks. loadModule does the same for
// another TypeScript module of the site (e.g. src/lib/palette.ts).
import { build } from "esbuild";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = fileURLToPath(new URL("../..", import.meta.url));

export async function loadModule(path) {
  const result = await build({
    entryPoints: [join(root, path)],
    bundle: true,
    format: "esm",
    platform: "node",
    write: false,
    logLevel: "silent",
  });
  const code = result.outputFiles[0].text;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
}

export async function loadSiteConfig() {
  return (await loadModule("src/site.config.ts")).site;
}
