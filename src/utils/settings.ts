const SETTINGS_KEY = "mission-editor-settings";

export interface EditorSettings {
  autoSaveEnabled: boolean;
  autoSaveInterval: number; // seconds
  jsonIndent: number;
  defaultTranslated: boolean;
  defaultAlignment: string;
  showAdvancedObjectiveFields: boolean;
}

const DEFAULTS: EditorSettings = {
  autoSaveEnabled: true,
  autoSaveInterval: 30,
  jsonIndent: 2,
  defaultTranslated: false,
  defaultAlignment: "50",
  showAdvancedObjectiveFields: false,
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
