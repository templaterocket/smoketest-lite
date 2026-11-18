/**
 * `track(event, props)` — one call for every analytics provider in site.config.ts. Does nothing
 * when analytics is off, blocked by Do Not Track / Global Privacy Control, or not yet consented.
 *
 * Events the template sends: lead_submitted { cta }, plan_intent { plan }, cta_click { type }.
 */
type Props = Record<string, string | number | boolean>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Props }) => void;
    umami?: { track: (event: string, data?: Props) => void };
    fathom?: { trackEvent: (event: string) => void };
    gtag?: (...args: unknown[]) => void;
  }
}

export function track(event: string, props: Props = {}): void {
  try {
    if (window.plausible) window.plausible(event, { props });
    else if (window.umami) window.umami.track(event, props);
    else if (window.fathom) window.fathom.trackEvent(event);
    else if (window.gtag) window.gtag("event", event, props);
  } catch {
    // Analytics must never break the page.
  }
}

/** Do Not Track or Global Privacy Control is on in this browser. */
export function optedOut(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.doNotTrack === "1" || nav.globalPrivacyControl === true;
}
