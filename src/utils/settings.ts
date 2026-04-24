const SETTINGS_KEY = "mission-editor-settings";
const SETTINGS_VERSION = 2;

interface StoredSettings extends Partial<EditorSettings> {
  __version?: number;
}

export interface EditorSettings {
  // Appearance
  theme: "dark" | "light";
  fontSize: number; // px, for editor content
  compactMode: boolean;

  // Language
  language: string;
  showTranslationHints: boolean;
  resolveTranslatedTitles: boolean;

  // Auto-save
  autoSaveEnabled: boolean;
  autoSaveInterval: number; // seconds

  // New mission defaults
  defaultTranslated: boolean;
  defaultAlignment: "good" | "neutral" | "evil";

  // Editor
  showAdvancedObjectiveFields: boolean;
  showMissionIds: boolean;
  confirmBeforeDelete: boolean;
  jsonIndent: number;

  // Power level preview
  showPowerLevelHint: boolean;
  plConStatInc: number;
  plBPModeSquared: boolean;
}

const DEFAULTS: EditorSettings = {
  theme: "dark",
  fontSize: 13,
  compactMode: false,
  language: "en_US",
  showTranslationHints: true,
  resolveTranslatedTitles: true,
  autoSaveEnabled: true,
  autoSaveInterval: 30,
  defaultTranslated: false,
  defaultAlignment: "neutral",
  showAdvancedObjectiveFields: false,
  showMissionIds: true,
  confirmBeforeDelete: true,
  jsonIndent: 2,
  showPowerLevelHint: true,
  plConStatInc: 0.5,
  plBPModeSquared: false,
};

export function loadSettings(): EditorSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return { ...DEFAULTS };
    const parsed = JSON.parse(stored) as StoredSettings;
    return migrate(parsed);
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings: EditorSettings) {
  try {
    const payload: StoredSettings = { ...settings, __version: SETTINGS_VERSION };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
  } catch {}
}

function migrate(stored: StoredSettings): EditorSettings {
  const { __version, ...rest } = stored;
  const merged: EditorSettings = { ...DEFAULTS, ...rest };
  // v2: BPMode squared was true by default, but the in-game scouter defaults
  // to Normal mode (unsquared). Reset stale values once.
  if ((__version ?? 1) < 2) {
    merged.plBPModeSquared = DEFAULTS.plBPModeSquared;
  }
  return merged;
}
