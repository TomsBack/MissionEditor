import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en, { type Translation } from "../locales/en";
import { loadSettings } from "./settings";

// English is bundled synchronously as the fallback; every other locale lives
// in src/locales/{code}.ts and is fetched on demand. This keeps roughly two
// thirds of the per-locale strings out of the initial chunk for the typical
// user (one language, picked at boot).

const localeLoaders = import.meta.glob<{ default: Partial<Translation> }>([
  "../locales/*.ts",
  "!../locales/en.ts",
]);

const loaded = new Set<string>(["en_US"]);

/** Resolve "es_ES" -> "../locales/es.ts" for the lazy loader map. */
function loaderKey(code: string): string {
  return `../locales/${code.split("_")[0]}.ts`;
}

async function ensureLocale(code: string): Promise<void> {
  if (loaded.has(code)) return;
  const loader = localeLoaders[loaderKey(code)];
  if (!loader) {
    // No file for this locale; fall back to en_US silently.
    loaded.add(code);
    return;
  }
  const mod = await loader();
  i18next.addResourceBundle(code, "translation", mod.default, true, true);
  loaded.add(code);
}

/**
 * Switch the active language. Loads the locale chunk first if necessary, then
 * delegates to i18next's standard changeLanguage so subscribed components
 * re-render once the bundle is registered.
 */
export async function setLanguage(code: string): Promise<void> {
  await ensureLocale(code);
  await i18next.changeLanguage(code);
}

const settings = loadSettings();

i18next.use(initReactI18next).init({
  resources: { en_US: { translation: en } },
  lng: "en_US",
  fallbackLng: "en_US",
  interpolation: { escapeValue: false },
});

// If the saved language isn't English, kick off the load. React-i18next will
// re-render the tree when the bundle arrives; the brief English flash is
// acceptable for a desktop app loading from local disk.
if (settings.language !== "en_US") {
  void setLanguage(settings.language);
}

export default i18next;
