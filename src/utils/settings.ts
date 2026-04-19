const SETTINGS_KEY = "mission-editor-settings";

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
  plBPModeSquared: true,
};

export function loadSettings(): EditorSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(stored) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings: EditorSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}
