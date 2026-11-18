/**
 * /llms.txt — a plain summary for language models (llmstxt.org): what the product is and where to
 * read more. Links are absolute once product.url is the real address, relative until then.
 */
import type { APIRoute } from "astro";
import { legalDocs } from "../lib/legal";
import { hasPage } from "../lib/pages";
import { absolute as url } from "../lib/url";
import { site } from "../site.config";

export const GET: APIRoute = () => {
  const plans = site.pricing.mode === "off" ? "" : `\n## Pricing\n\n${site.pricing.mode === "fake-door" ? "The plans below are a test of interest: they are not on sale yet and no payment is taken.\n\n" : ""}${site.pricing.plans.map((p) => `- ${p.name}: ${p.price}${p.period ? ` ${p.period}` : ""} — ${p.description}`).join("\n")}\n`;
  const body = `# ${site.product.name}

> ${site.product.description}

## Pages

- [Home](${url("/")})${site.pricing.mode !== "off" && hasPage("/pricing/") ? `\n- [Pricing](${url("/pricing/")})` : ""}${hasPage("/changelog/") ? `\n- [Changelog](${url("/changelog/")})` : ""}
${plans}
## Legal

${[...legalDocs.map((doc) => `- [${doc.title}](${url(`/legal/${doc.slug}/`)})`), ...(hasPage("/legal/data-request/") ? [`- [Data requests](${url("/legal/data-request/")})`] : [])].join("\n")}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
