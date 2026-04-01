import type { EditorSettings } from "../utils/settings";
import { clearRecentFiles } from "../utils/files";

interface SettingsDialogProps {
  settings: EditorSettings;
  onChange: (settings: EditorSettings) => void;
  onClose: () => void;
}

export function SettingsDialog({ settings, onChange, onClose }: SettingsDialogProps) {
  function update<K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) {
    onChange({ ...settings, [key]: value });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>Settings</span>
          <button className="small" onClick={onClose}>Close</button>
        </div>
        <div className="modal-body">
          <div className="settings-section">
            <div className="settings-section-title">Auto-save</div>
            <div className="settings-row">
              <label className="settings-label">
                <input
                  type="checkbox"
                  checked={settings.autoSaveEnabled}
                  onChange={(e) => update("autoSaveEnabled", e.target.checked)}
                />
                Enable auto-save
              </label>
            </div>
            <div className="settings-row">
              <label className="settings-label">Interval (seconds)</label>
              <input
                type="number"
                min={5}
                max={300}
                value={settings.autoSaveInterval}
                onChange={(e) => update("autoSaveInterval", Math.max(5, parseInt(e.target.value) || 30))}
                style={{ width: 80 }}
                disabled={!settings.autoSaveEnabled}
              />
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-title">Export</div>
            <div className="settings-row">
              <label className="settings-label">JSON indent spaces</label>
              <input
                type="number"
                min={1}
                max={8}
                value={settings.jsonIndent}
                onChange={(e) => update("jsonIndent", Math.max(1, Math.min(8, parseInt(e.target.value) || 2)))}
                style={{ width: 80 }}
              />
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-title">New Mission Defaults</div>
            <div className="settings-row">
              <label className="settings-label">
                <input
                  type="checkbox"
                  checked={settings.defaultTranslated}
                  onChange={(e) => update("defaultTranslated", e.target.checked)}
                />
                Translated by default
              </label>
            </div>
            <div className="settings-row">
              <label className="settings-label">Default alignment</label>
              <input
                value={settings.defaultAlignment}
                onChange={(e) => update("defaultAlignment", e.target.value)}
                style={{ width: 80 }}
                placeholder="50"
              />
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-title">Editor</div>
            <div className="settings-row">
              <label className="settings-label">
                <input
                  type="checkbox"
                  checked={settings.showAdvancedObjectiveFields}
                  onChange={(e) => update("showAdvancedObjectiveFields", e.target.checked)}
                />
                Show advanced objective fields (sounds, spawn/death messages)
              </label>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-title">Data</div>
            <div className="settings-row">
              <button className="small danger" onClick={() => {
                clearRecentFiles();
                window.location.reload();
              }}>
                Clear Recent Files
              </button>
              <button className="small danger" onClick={() => {
                localStorage.removeItem("mission-editor-autosave");
              }}>
                Clear Auto-save Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
