import { useState } from "react";
import type { EditorSettings } from "../utils/settings";
import { clearRecentFiles } from "../utils/files";
import { AVAILABLE_LANGUAGES } from "../utils/languages";
import { THEMES, type ThemeName } from "../utils/theme";
import { useTranslation } from "react-i18next";
import { IconTrash } from "./Icons";
import { NumberInput } from "./NumberInput";
import { Palette, Globe, Pencil } from "lucide-react";

type SettingsTab = "appearance" | "general" | "editor";

interface SettingsDialogProps {
  settings: EditorSettings;
  onChange: (settings: EditorSettings) => void;
  onClose: () => void;
}

export function SettingsDialog({ settings, onChange, onClose }: SettingsDialogProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<SettingsTab>("appearance");

  function update<K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) {
    onChange({ ...settings, [key]: value });
  }

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: "appearance", label: t("settings.appearance"), icon: <Palette size={16} /> },
    { id: "general", label: t("settings.general"), icon: <Globe size={16} /> },
    { id: "editor", label: t("settings.editor"), icon: <Pencil size={16} /> },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-settings" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>{t("settings.title")}</span>
          <button className="small" onClick={onClose}>{t("settings.close")}</button>
        </div>
        <div className="settings-layout">
          <nav className="settings-nav">
            {tabs.map((item) => (
              <button
                key={item.id}
                className={`settings-nav-item ${tab === item.id ? "active" : ""}`}
                onClick={() => setTab(item.id)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
          <div className="settings-content">
            <div className="settings-body">
              {tab === "appearance" && (
                <>
                  <div className="settings-section">
                    <div className="settings-section-title">{t("settings.theme")}</div>
                    <div className="theme-grid" role="radiogroup" aria-label={t("settings.colorTheme")}>
                      {(Object.keys(THEMES) as ThemeName[]).map((id) => {
                        const theme = THEMES[id];
                        const selected = settings.theme === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            className={`theme-card ${selected ? "selected" : ""}`}
                            onClick={() => update("theme", id)}
                          >
                            <div className="theme-card-swatch" aria-hidden="true">
                              <span style={{ background: theme.palette["bg-primary"] }} />
                              <span style={{ background: theme.palette["bg-panel"] }} />
                              <span style={{ background: theme.palette.accent }} />
                              <span style={{ background: theme.palette["text-primary"] }} />
                            </div>
                            <div className="theme-card-name">{t(`settings.themes.${id}`, theme.name)}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="settings-section">
                    <div className="settings-section-title">{t("settings.display")}</div>
                    <div className="settings-row">
                      <label className="settings-label">{t("settings.fontSize")}</label>
                      <NumberInput
                        min={10}
                        max={20}
                        value={settings.fontSize}
                        onChange={(v) => update("fontSize", v)}
                        style={{ width: 80 }}
                      />
                    </div>
                    <div className="settings-row">
                      <label className="settings-label">
                        <input
                          type="checkbox"
                          checked={settings.compactMode}
                          onChange={(e) => update("compactMode", e.target.checked)}
                        />
                        {t("settings.compactMode")}
                      </label>
                    </div>
                  </div>
                </>
              )}

              {tab === "general" && (
                <>
                  <div className="settings-section">
                    <div className="settings-section-title">{t("settings.language")}</div>
                    <div className="settings-row">
                      <label className="settings-label">{t("settings.displayLanguage")}</label>
                      <select
                        value={settings.language}
                        onChange={(e) => update("language", e.target.value)}
                        style={{ width: 160 }}
                      >
                        {Object.entries(AVAILABLE_LANGUAGES).map(([code, name]) => (
                          <option key={code} value={code}>{name} ({code})</option>
                        ))}
                      </select>
                    </div>
                    <div className="settings-row">
                      <label className="settings-label">
                        <input
                          type="checkbox"
                          checked={settings.showTranslationHints}
                          onChange={(e) => update("showTranslationHints", e.target.checked)}
                        />
                        {t("settings.showHints")}
                      </label>
                    </div>
                    <div className="settings-row">
                      <label className="settings-label">
                        <input
                          type="checkbox"
                          checked={settings.resolveTranslatedTitles}
                          onChange={(e) => update("resolveTranslatedTitles", e.target.checked)}
                        />
                        {t("settings.resolveTitles")}
                      </label>
                    </div>
                  </div>

                  <div className="settings-section">
                    <div className="settings-section-title">{t("settings.autoSave")}</div>
                    <div className="settings-row">
                      <label className="settings-label">
                        <input
                          type="checkbox"
                          checked={settings.autoSaveEnabled}
                          onChange={(e) => update("autoSaveEnabled", e.target.checked)}
                        />
                        {t("settings.enableAutoSave")}
                      </label>
                    </div>
                    <div className="settings-row">
                      <label className="settings-label">{t("settings.interval")}</label>
                      <NumberInput
                        min={5}
                        max={300}
                        value={settings.autoSaveInterval}
                        onChange={(v) => update("autoSaveInterval", v)}
                        style={{ width: 80 }}
                        disabled={!settings.autoSaveEnabled}
                      />
                    </div>
                  </div>

                  <div className="settings-section">
                    <div className="settings-section-title">{t("settings.defaults")}</div>
                    <div className="settings-row">
                      <label className="settings-label">
                        <input
                          type="checkbox"
                          checked={settings.defaultTranslated}
                          onChange={(e) => update("defaultTranslated", e.target.checked)}
                        />
                        {t("settings.defaultTranslated")}
                      </label>
                    </div>
                    <div className="settings-row">
                      <label className="settings-label">{t("settings.defaultAlignment")}</label>
                      <select
                        value={settings.defaultAlignment}
                        onChange={(e) => update("defaultAlignment", e.target.value as "good" | "neutral" | "evil")}
                        style={{ width: 100 }}
                      >
                        <option value="good">{t("align.good")}</option>
                        <option value="neutral">{t("align.neutral")}</option>
                        <option value="evil">{t("align.evil")}</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {tab === "editor" && (
                <>
                  <div className="settings-section">
                    <div className="settings-section-title">{t("settings.behavior")}</div>
                    <div className="settings-row">
                      <label className="settings-label">
                        <input
                          type="checkbox"
                          checked={settings.showAdvancedObjectiveFields}
                          onChange={(e) => update("showAdvancedObjectiveFields", e.target.checked)}
                        />
                        {t("settings.advancedFields")}
                      </label>
                    </div>
                    <div className="settings-row">
                      <label className="settings-label">
                        <input
                          type="checkbox"
                          checked={settings.showMissionIds}
                          onChange={(e) => update("showMissionIds", e.target.checked)}
                        />
                        {t("settings.showMissionIds")}
                      </label>
                    </div>
                    <div className="settings-row">
                      <label className="settings-label">
                        <input
                          type="checkbox"
                          checked={settings.confirmBeforeDelete}
                          onChange={(e) => update("confirmBeforeDelete", e.target.checked)}
                        />
                        {t("settings.confirmDelete")}
                      </label>
                    </div>
                  </div>

                  <div className="settings-section">
                    <div className="settings-section-title">{t("settings.powerLevel.title")}</div>
                    <div className="settings-row">
                      <label className="settings-label">
                        <input
                          type="checkbox"
                          checked={settings.showPowerLevelHint}
                          onChange={(e) => update("showPowerLevelHint", e.target.checked)}
                        />
                        {t("settings.powerLevel.show")}
                      </label>
                    </div>
                    <div className="settings-row">
                      <label className="settings-label">{t("settings.powerLevel.conStatInc")}</label>
                      <NumberInput
                        min={0.01}
                        step={0.1}
                        float
                        value={settings.plConStatInc}
                        onChange={(v) => update("plConStatInc", v)}
                        style={{ width: 80 }}
                        disabled={!settings.showPowerLevelHint}
                      />
                    </div>
                    <div className="settings-hint">{t("settings.powerLevel.hint")}</div>
                    <div className="settings-row">
                      <label className="settings-label">
                        <input
                          type="checkbox"
                          checked={settings.plBPModeSquared}
                          onChange={(e) => update("plBPModeSquared", e.target.checked)}
                          disabled={!settings.showPowerLevelHint}
                        />
                        {t("settings.powerLevel.bpMode")}
                      </label>
                    </div>
                  </div>

                  <div className="settings-section">
                    <div className="settings-section-title">{t("settings.export")}</div>
                    <div className="settings-row">
                      <label className="settings-label">{t("settings.jsonIndent")}</label>
                      <NumberInput
                        min={1}
                        max={8}
                        value={settings.jsonIndent}
                        onChange={(v) => update("jsonIndent", v)}
                        style={{ width: 80 }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="settings-footer">
              <button className="small danger" onClick={() => {
                clearRecentFiles();
                window.location.reload();
              }}>
                <IconTrash size={14} />
                {t("settings.clearRecent")}
              </button>
              <button className="small danger" onClick={() => {
                localStorage.removeItem("mission-editor-autosave");
              }}>
                <IconTrash size={14} />
                {t("settings.clearAutoSave")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
