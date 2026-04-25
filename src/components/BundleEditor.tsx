import { useState } from "react";
import type { MissionBundle } from "../types/mission";
import { useTranslation } from "react-i18next";
import { IconChevronDown, IconChevronRight } from "./Icons";

interface BundleEditorProps {
  bundle: MissionBundle;
  onChange: (bundle: MissionBundle) => void;
}

export function BundleEditor({ bundle, onChange }: BundleEditorProps) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  function update<K extends keyof MissionBundle>(key: K, value: MissionBundle[K]) {
    onChange({ ...bundle, [key]: value });
  }

  function updateSettings<K extends keyof MissionBundle["settings"]>(
    key: K,
    value: MissionBundle["settings"][K]
  ) {
    onChange({ ...bundle, settings: { ...bundle.settings, [key]: value } });
  }

  const summary = `${bundle.name || t("sidebar.untitled")}${bundle.version ? ` · v${bundle.version}` : ""}`;

  return (
    <div className="editor-section bundle-section">
      <button
        type="button"
        className="bundle-section-toggle"
        onClick={() => setCollapsed((c) => !c)}
        title={collapsed ? t("bundle.expand") : t("bundle.collapse")}
        aria-expanded={!collapsed}
      >
        {collapsed ? <IconChevronRight size={14} /> : <IconChevronDown size={14} />}
        <span className="bundle-section-title">{t("bundle.title")}</span>
        {collapsed && <span className="bundle-section-summary">{summary}</span>}
      </button>

      {!collapsed && (
        <>
          <div className="field-grid bundle-subgroup">
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
          </div>

          <div className="bundle-subgroup-header">{t("bundle.behavior")}</div>
          <div className="field-grid bundle-subgroup">
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
            <div className="field-group full-width">
              <button
                type="button"
                className="small bundle-advanced-toggle"
                onClick={() => setShowAdvanced((s) => !s)}
              >
                {showAdvanced ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                {t("bundle.advanced")}
              </button>
            </div>
            {showAdvanced && (
              <div className="field-group full-width">
                <label className="field-label">{t("bundle.vars")}</label>
                <textarea
                  value={bundle.settings.vars ?? ""}
                  onChange={(e) => updateSettings("vars", e.target.value)}
                  placeholder={t("bundle.varsPlaceholder")}
                  rows={2}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
