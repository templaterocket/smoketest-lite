/**
 * The site's address, `product.url`, for everything that needs an absolute URL: canonical and
 * og:url, og:image, JSON-LD, the sitemap, robots.txt, RSS and llms.txt. While it is still a
 * placeholder (example.com, .org or .net — `npm run validate` V04), `siteUrl` is null and the
 * build emits no URL on that domain: the sitemap lists no pages, robots.txt names no sitemap,
 * canonical and og:url are left out, and the other links stay relative.
 */
import { site } from "../site.config";

/** example.com, example.org, example.net or a subdomain of them: the template's placeholder. */
export const isPlaceholderUrl = (url: string): boolean => /(^|\.)example\.(com|org|net)$/u.test(new URL(url).hostname);

/** The real address, or null while product.url is a placeholder. */
export const siteUrl: URL | null = isPlaceholderUrl(site.product.url) ? null : new URL(site.product.url);

/** `path` on the site's address; the path itself, relative, while the address is a placeholder. */
export const absolute = (path: string): string => (siteUrl ? new URL(path, siteUrl).toString() : path);
