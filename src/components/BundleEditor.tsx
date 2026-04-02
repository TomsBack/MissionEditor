import type { MissionBundle } from "../types/mission";
import { useTranslation } from "react-i18next";

interface BundleEditorProps {
  bundle: MissionBundle;
  onChange: (bundle: MissionBundle) => void;
}

export function BundleEditor({ bundle, onChange }: BundleEditorProps) {
  const { t } = useTranslation();

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
      <div className="editor-section-header">{t("bundle.title")}</div>
      <div className="field-grid">
        <div className="field-group">
          <label className="field-label">{t("bundle.name")}</label>
          <input value={bundle.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div className="field-group">
          <label className="field-label">{t("bundle.version")}</label>
          <input value={bundle.version} onChange={(e) => update("version", e.target.value)} />
        </div>
        <div className="field-group">
          <label className="field-label">{t("bundle.authors")}</label>
          <input value={bundle.authors} onChange={(e) => update("authors", e.target.value)} />
        </div>
        <div className="field-group">
          <label className="field-label">{t("bundle.mods")}</label>
          <input value={bundle.mods} onChange={(e) => update("mods", e.target.value)} />
        </div>
        <div className="field-group full-width">
          <label className="field-label">{t("bundle.description")}</label>
          <textarea
            value={bundle.desc}
            onChange={(e) => update("desc", e.target.value)}
            rows={2}
          />
        </div>
        <div className="field-group">
          <label className="field-label">{t("bundle.repeat")}</label>
          <input
            value={bundle.settings.repeat}
            onChange={(e) => updateSettings("repeat", e.target.value)}
            placeholder={t("bundle.repeatPlaceholder")}
          />
        </div>
        <div className="field-group">
          <label className="field-label">{t("bundle.unlock")}</label>
          <input
            value={bundle.settings.unlock}
            onChange={(e) => updateSettings("unlock", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
