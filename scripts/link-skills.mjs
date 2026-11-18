// npm run link-skills — makes agent/skills/* available to coding agents:
//   Claude Code  .claude/skills/<name>  → a symlink to agent/skills/<name>
//   Cursor       .cursor/rules/<name>.mdc, generated from SKILL.md (re-run after editing a skill)
//   Codex and other agents read AGENTS.md, which points to agent/skills/.
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { root } from "./lib/config.mjs";

const skills = join(root, "agent", "skills");
const claude = join(root, ".claude", "skills");
const cursor = join(root, ".cursor", "rules");
mkdirSync(claude, { recursive: true });
mkdirSync(cursor, { recursive: true });

for (const name of readdirSync(skills).filter((n) => existsSync(join(skills, n, "SKILL.md"))).sort()) {
  const link = join(claude, name);
  if (existsSync(link) || (() => { try { return lstatSync(link).isSymbolicLink(); } catch { return false; } })()) rmSync(link, { recursive: true, force: true });
  symlinkSync(relative(claude, join(skills, name)), link, "dir");

  const text = readFileSync(join(skills, name, "SKILL.md"), "utf8");
  const description = /^description:\s*(.+)$/mu.exec(text)?.[1] ?? name;
  const body = text.replace(/^---[\s\S]*?---\s*/u, "");
  writeFileSync(join(cursor, `${name}.mdc`), `---\ndescription: ${description}\nalwaysApply: false\n---\n\n<!-- Generated from agent/skills/${name}/SKILL.md by npm run link-skills. Edit that file instead. -->\n\n${body}`);
  console.log(`✓ ${name}`);
}
console.log("\nClaude Code: .claude/skills/   Cursor: .cursor/rules/   Others: AGENTS.md");
