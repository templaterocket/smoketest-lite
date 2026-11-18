/**
 * Sends a lead from the browser to the configured provider. Only providers whose response the
 * browser may read report errors; google-sheets and an opaque webhook are fire and forget.
 * The embed provider never comes here: its form posts natively to the service.
 * A provider that is not connected yet — "none", or a {{PLACEHOLDER}} left in its settings — gets
 * nothing: the visitor's data stays in the browser and the form says it isn't connected.
 */
import type { Provider } from "../../config/schema";

export interface Lead {
  email: string;
  name?: string;
  message?: string;
  /** Answers to qualifying questions, by question id. */
  answers: Record<string, string>;
  /** The CTA kind that produced the lead: waitlist, access or contact. */
  cta: string;
  /** Attribution from the current URL only; nothing is stored in the browser. */
  utm: Record<string, string>;
  page: string;
  referrer: string;
  /** Cloudflare Turnstile's token, when the bot check is on. */
  turnstileToken?: string;
  /** The consent text the visitor saw. */
  consent?: string;
}

/** `query` is added to the success page's URL (the Worker's next step, the referral code). */
export type SendResult = { ok: true; query?: Record<string, string> } | { ok: false; message: string };

const GENERIC_ERROR = "Something went wrong. Please try again in a moment.";

/** What a visitor sees when the form has nowhere to send to. */
export const NOT_CONNECTED = "This form isn’t connected yet, so nothing was sent.";

/** Whether the form may send at all: a provider other than "none", with no {{PLACEHOLDER}} left. */
export const leadsConnected = (provider: Provider): boolean => provider.id !== "none" && !JSON.stringify(provider).includes("{{");

/** The lead as flat fields, for providers that take form posts. */
function flat(lead: Lead): Record<string, string> {
  const fields: Record<string, string> = { email: lead.email, cta: lead.cta, page: lead.page };
  if (lead.name) fields.name = lead.name;
  if (lead.message) fields.message = lead.message;
  if (lead.referrer) fields.referrer = lead.referrer;
  for (const [key, value] of Object.entries(lead.answers)) fields[key] = value;
  for (const [key, value] of Object.entries(lead.utm)) fields[key] = value;
  return fields;
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function sendLead(provider: Exclude<Provider, { id: "embed" }>, lead: Lead): Promise<SendResult> {
  if (!leadsConnected(provider)) return { ok: false, message: NOT_CONNECTED };
  try {
    switch (provider.id) {
      case "cloudflare": {
        const response = await fetch(provider.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...lead, ref: lead.utm.ref }),
        });
        const body = await readJson(response);
        if (response.status === 429) return { ok: false, message: "Too many tries. Please wait a few minutes and try again." };
        if (!response.ok || body.ok !== true) {
          return { ok: false, message: body.error === "verification-failed" ? "Please complete the check below and try again." : body.error === "invalid-email" ? "That email address doesn’t look right." : GENERIC_ERROR };
        }
        const query: Record<string, string> = { state: body.next === "confirm-email" ? "check-email" : "confirmed" };
        if (typeof body.code === "string") query.code = body.code;
        return { ok: true, query };
      }
      case "none":
        return { ok: false, message: NOT_CONNECTED };
      case "web3forms": {
        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ access_key: provider.accessKey, subject: `New ${lead.cta} signup`, botcheck: "", ...flat(lead) }),
        });
        const body = await readJson(response);
        return response.ok && body.success !== false ? { ok: true } : { ok: false, message: GENERIC_ERROR };
      }
      case "formspree": {
        const response = await fetch(`https://formspree.io/f/${encodeURIComponent(provider.formId)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(flat(lead)),
        });
        if (response.status === 429) return { ok: false, message: "Too many tries. Please wait a minute and try again." };
        return response.ok ? { ok: true } : { ok: false, message: GENERIC_ERROR };
      }
      case "loops": {
        const fields = new URLSearchParams({ email: lead.email, source: lead.utm.utm_source ?? lead.cta });
        if (lead.name) fields.set("firstName", lead.name);
        if (provider.userGroup) fields.set("userGroup", provider.userGroup);
        const response = await fetch(`https://app.loops.so/api/newsletter-form/${encodeURIComponent(provider.formId)}`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: fields,
        });
        if (response.status === 429) return { ok: false, message: "Too many tries. Please wait a minute and try again." };
        const body = await readJson(response);
        return response.ok && body.success !== false ? { ok: true } : { ok: false, message: GENERIC_ERROR };
      }
      case "supabase": {
        // Insert-only: no `return=representation`, so the anon role needs INSERT and nothing else.
        const response = await fetch(`${provider.url.replace(/\/$/u, "")}/rest/v1/${encodeURIComponent(provider.table)}`, {
          method: "POST",
          headers: {
            apikey: provider.anonKey,
            Authorization: `Bearer ${provider.anonKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ email: lead.email, name: lead.name ?? null, message: lead.message ?? null, cta: lead.cta, answers: lead.answers, utm: lead.utm, page: lead.page, referrer: lead.referrer || null }),
        });
        // 409: the email is already in the table (unique constraint). For a waitlist that is a success.
        return response.ok || response.status === 409 ? { ok: true } : { ok: false, message: GENERIC_ERROR };
      }
      case "google-sheets": {
        // Apps Script answers with a redirect the browser may not read: send and assume it landed.
        await fetch(provider.scriptUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(flat(lead)) });
        return { ok: true };
      }
      case "webhook": {
        const response = await fetch(provider.url, {
          method: "POST",
          mode: provider.opaque ? "no-cors" : "cors",
          headers: { "Content-Type": provider.opaque ? "text/plain;charset=utf-8" : "application/json" },
          body: JSON.stringify(lead),
        });
        return provider.opaque || response.ok ? { ok: true } : { ok: false, message: GENERIC_ERROR };
      }
    }
  } catch {
    return { ok: false, message: "We couldn't reach the server. Check your connection and try again." };
  }
}
