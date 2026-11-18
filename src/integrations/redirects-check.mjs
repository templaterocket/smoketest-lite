/**
 * Redirects have one source of truth, `redirects` in astro.config.mjs, and two copies the hosts
 * read: public/_redirects (Cloudflare Workers static assets and Netlify) and vercel.json (Vercel).
 * Astro writes no redirect pages (`build.redirects: false`), so a rule missing from a copy simply
 * does not exist on that host. This integration warns at the start of every build when a copy
 * lacks a rule — both the `/old` and the `/old/` form — or sends it somewhere else.
 * `npm run validate` reports the same drift as V24 (it imports `redirectDrift` from here).
 * No dependencies: plain text and JSON parsing.
 */
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** `/old` and `/old/` for a path; a pattern (`*`, `:param`) or the root stays as written. */
const forms = (from) => (/[*:]/u.test(from) || from === "/" ? [from] : [from.replace(/\/$/u, ""), from.replace(/\/?$/u, "/")]);

/** public/_redirects: one `<from> <to> [status]` rule per line, `#` starts a comment. */
export function parseRedirectsFile(text) {
  const rules = new Map();
  for (const line of text.split("\n")) {
    const [from, to] = line.replace(/#.*$/u, "").trim().split(/\s+/u);
    if (from && to) rules.set(from, to);
  }
  return rules;
}

/** vercel.json: `redirects[].source` → `redirects[].destination`. */
export function parseVercelJson(text) {
  const rules = new Map();
  for (const rule of JSON.parse(text).redirects ?? []) if (rule?.source && rule?.destination) rules.set(rule.source, rule.destination);
  return rules;
}

/**
 * Every way the two host files differ from the config's `redirects`, as readable lines.
 * `root` is the project folder (a URL or a path).
 */
export function redirectDrift(redirects, root) {
  const dir = typeof root === "string" ? root : fileURLToPath(root);
  const copies = [
    { file: "public/_redirects", parse: parseRedirectsFile },
    { file: "vercel.json", parse: parseVercelJson },
  ];
  const problems = [];
  const entries = Object.entries(redirects ?? {});
  if (entries.length === 0) return problems;
  for (const { file, parse } of copies) {
    const path = `${dir.replace(/\/?$/u, "/")}${file}`;
    if (!existsSync(path)) {
      problems.push(`${file} is missing: the ${entries.length} redirect(s) in astro.config.mjs won't work on its hosts`);
      continue;
    }
    let rules;
    try {
      rules = parse(readFileSync(path, "utf8"));
    } catch (error) {
      problems.push(`${file} could not be read: ${error.message}`);
      continue;
    }
    for (const [from, target] of entries) {
      const to = typeof target === "string" ? target : target.destination;
      for (const form of forms(from)) {
        if (!rules.has(form)) problems.push(`${file}: no rule for ${form} (astro.config.mjs sends it to ${to})`);
        else if (rules.get(form) !== to) problems.push(`${file}: ${form} goes to ${rules.get(form)}, astro.config.mjs says ${to}`);
      }
    }
  }
  return problems;
}

/** The Astro integration: a warning per difference, before the build starts. */
export default function redirectsCheck() {
  let config;
  return {
    name: "smoketest:redirects-check",
    hooks: {
      "astro:config:done": ({ config: done }) => {
        config = done;
      },
      "astro:build:start": ({ logger }) => {
        for (const problem of redirectDrift(config.redirects, config.root)) logger.warn(problem);
      },
    },
  };
}
