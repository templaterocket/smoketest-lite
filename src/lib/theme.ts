/**
 * The look chosen in site.config.ts (`brand`), for the layout, the theme switch, the mockup images
 * and the cookie policy: the browser-storage key of the switch, the font files worth preloading
 * and the active preset's resolved colours.
 */
import tokensCss from "../styles/tokens.css?raw";
import presetsCss from "../styles/presets.css?raw";
import { Palette, type Theme } from "./palette";
import { site } from "../site.config";

/** Where the navbar switch keeps the visitor's choice ("light" or "dark"), only when it differs from the default. */
export const THEME_STORAGE_KEY = "smoketest:theme";

/** Per font pair, the faces above the fold: the heading at 500 and the body at 400. */
const FONT_PRELOADS: Record<typeof site.brand.fonts, string[]> = {
  geometric: ["/fonts/manrope-500.woff2", "/fonts/latin-400-normal.woff2"],
  editorial: ["/fonts/fraunces-500.woff2", "/fonts/inter-400.woff2"],
  technical: ["/fonts/space-grotesk-500.woff2", "/fonts/ibm-plex-sans-400.woff2"],
};
export const fontPreloads = FONT_PRELOADS[site.brand.fonts];

/** The configured preset in one theme, resolved from tokens.css and presets.css. */
export const palette = (theme: Theme): Palette => Palette.of([tokensCss, presetsCss], site.brand.preset, theme);

/** The theme a visitor sees without script, and before a "system" choice is resolved. */
export const initialTheme: Theme = site.brand.theme === "dark" ? "dark" : "light";
