import type { MissionBundle } from "../types/mission";

interface BundleEditorProps {
  bundle: MissionBundle;
  onChange: (bundle: MissionBundle) => void;
}

export function BundleEditor({ bundle, onChange }: BundleEditorProps) {
  function update<K extends keyof MissionBundle>(key: K, value: MissionBundle[K]) {
    onChange({ ...bundle, [key]: value });
  }

  function updateSettings<K extends keyof MissionBundle["settings"]>(
    key: K,
    value: MissionBundle["settings"][K]
  ) {
    onChange({ ...bundle, settings: { ...bundle.settings, [key]: value } });
  }

  return (
    <div className="editor-section">
      <div className="editor-section-header">Bundle Settings</div>
      <div className="field-grid">
        <div className="field-group">
          <label className="field-label">Name</label>
          <input value={bundle.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div className="field-group">
          <label className="field-label">Version</label>
          <input value={bundle.version} onChange={(e) => update("version", e.target.value)} />
        </div>
        <div className="field-group">
          <label className="field-label">Authors</label>
          <input value={bundle.authors} onChange={(e) => update("authors", e.target.value)} />
        </div>
        <div className="field-group">
          <label className="field-label">Required Mods</label>
          <input value={bundle.mods} onChange={(e) => update("mods", e.target.value)} />
        </div>
        <div className="field-group full-width">
          <label className="field-label">Description</label>
          <textarea
            value={bundle.desc}
            onChange={(e) => update("desc", e.target.value)}
            rows={2}
          />
        </div>
        <div className="field-group">
          <label className="field-label">Repeat Interval</label>
          <input
            value={bundle.settings.repeat}
            onChange={(e) => updateSettings("repeat", e.target.value)}
            placeholder="-1 for infinite, or number of game days"
          />
        </div>
        <div className="field-group">
          <label className="field-label">Unlock Condition</label>
          <input
            value={bundle.settings.unlock}
            onChange={(e) => updateSettings("unlock", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
