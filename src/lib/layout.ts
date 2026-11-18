/**
 * The homepage layout (`layout` in site.config.ts) as data: the anchors each one has, so the
 * navbar, the footer and in-page calls to action only point at sections that exist.
 */
import type { Cta, Layout } from "../config/schema";
import { site } from "../site.config";

const ANCHORS: Record<Layout, string[]> = {
  minimal: ["get-started", "faq"],
};

/** Whether the homepage has this section (`how-it-works`, `faq`…) with the current settings. */
export const homeHas = (anchor: string): boolean => ANCHORS[site.layout].includes(anchor) && (anchor !== "pricing" || site.pricing.mode !== "off");

/** False for a link call to action that points at a homepage section this layout leaves out. */
export function ctaFits(cta: Cta | undefined): cta is Cta {
  if (!cta) return false;
  const anchor = cta.type === "link" ? /^\/?#(.+)$/u.exec(cta.href)?.[1] : undefined;
  return anchor === undefined || homeHas(anchor);
}
