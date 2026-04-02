/** Runtime translation system. Loads lang JSON files from public/lang/. */

import { DEFAULT_LANGUAGE } from "./languages";

let currentLang = DEFAULT_LANGUAGE;
let translations: Record<string, string> = {};
let loaded = false;
let loadPromise: Promise<void> | null = null;
const listeners: Array<() => void> = [];

/** Subscribe to language changes. Returns an unsubscribe function. */
export function onLanguageChange(fn: () => void): () => void {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}

/** Load translations for a given language code. */
export async function loadLanguage(langCode: string): Promise<void> {
  currentLang = langCode;
  loadPromise = (async () => {
    try {
      const resp = await fetch(`/lang/${langCode}.json`);
      if (!resp.ok) throw new Error(`Failed to load ${langCode}`);
      translations = await resp.json();
      loaded = true;
    } catch {
      // Fall back to en_US if requested language fails
      if (langCode !== DEFAULT_LANGUAGE) {
        const resp = await fetch(`/lang/${DEFAULT_LANGUAGE}.json`);
        if (resp.ok) translations = await resp.json();
      }
      loaded = true;
    }
    listeners.forEach((fn) => fn());
  })();
  return loadPromise;
}

/** Ensure translations are loaded. Call this before using translate(). */
export async function ensureLoaded(): Promise<void> {
  if (loaded) return;
  if (loadPromise) return loadPromise;
  return loadLanguage(currentLang);
}

/** Get the current language code. */
export function getCurrentLanguage(): string {
  return currentLang;
}

/** Look up a translation key. Returns undefined if not found. */
export function translate(key: string): string | undefined {
  return translations[key];
}

/** Check if a translation key exists. */
export function hasTranslation(key: string): boolean {
  return key in translations;
}

/** Get the display name for an entity ID like "jinryuudragonblockc.Vegeta". */
export function entityDisplayName(entityId: string): string | undefined {
  return translations[`entity.${entityId}.name`];
}

/**
 * Get the display name for an item ID like "jinryuudragonblockc:ItemMedMoss" or "diamond".
 * Items without a modid: prefix auto-resolve to minecraft:.
 */
export function itemDisplayName(itemId: string): string | undefined {
  // Extract the unlocalized name (part after the colon, or the whole thing if no colon)
  const colonIdx = itemId.indexOf(":");
  const unlocalizedName = colonIdx >= 0 ? itemId.substring(colonIdx + 1) : itemId;
  // Strip metadata (::meta) and count (,count) if present
  const clean = unlocalizedName.split("::")[0].split(",")[0];
  return translations[`item.${clean}.name`];
}

/** Get all keys that start with a given prefix. */
export function keysWithPrefix(prefix: string): string[] {
  return Object.keys(translations).filter((k) => k.startsWith(prefix));
}

/** Get all translation keys (for autocomplete). */
export function allTranslationKeys(): string[] {
  return Object.keys(translations);
}
