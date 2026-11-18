/**
 * UTM tags and the referral code (?ref=) for a lead. leads.attribution in site.config.ts picks
 * where they live between pages:
 *   url-only   — read from the current URL at submit; nothing is stored (the default);
 *   session    — the first touch is kept for the tab in sessionStorage;
 *   persistent — the first touch is kept for 30 days in localStorage.
 */
export type AttributionMode = "url-only" | "session" | "persistent";

const KEY = "smoketest:attribution";
const PERSISTENT_DAYS = 30;

function fromUrl(): Record<string, string> {
  const found: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(location.search)) {
    if ((key.startsWith("utm_") || key === "ref") && value) found[key] = value.slice(0, 200);
  }
  return found;
}

function storage(mode: AttributionMode): Storage | null {
  try {
    return mode === "session" ? sessionStorage : mode === "persistent" ? localStorage : null;
  } catch {
    return null;
  }
}

/** Keeps the first touch (session / persistent modes); call once per page load. */
export function captureAttribution(mode: AttributionMode): void {
  const store = storage(mode);
  const current = fromUrl();
  if (!store || Object.keys(current).length === 0) return;
  if (readStored(store)) return;
  store.setItem(KEY, JSON.stringify({ at: Date.now(), tags: current }));
}

function readStored(store: Storage): Record<string, string> | null {
  try {
    const saved = JSON.parse(store.getItem(KEY) ?? "null") as { at: number; tags: Record<string, string> } | null;
    if (!saved) return null;
    if (Date.now() - saved.at > PERSISTENT_DAYS * 86_400_000) {
      store.removeItem(KEY);
      return null;
    }
    return saved.tags;
  } catch {
    return null;
  }
}

/** The tags for this submit: the current URL's, else the stored first touch. */
export function readAttribution(mode: AttributionMode): Record<string, string> {
  const current = fromUrl();
  if (Object.keys(current).length > 0) return current;
  const store = storage(mode);
  return (store && readStored(store)) ?? {};
}
