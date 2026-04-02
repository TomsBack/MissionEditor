import { useState } from "react";
import type { Mission } from "../types/mission";
import { translate, keysWithPrefix, onLanguageChange } from "../utils/translations";
import { useTranslation } from "react-i18next";
import { Autocomplete } from "./Autocomplete";
import { ObjectiveEditor } from "./ObjectiveEditor";
import { RewardEditor } from "./RewardEditor";

interface MissionEditorProps {
  mission: Mission;
  onChange: (mission: Mission) => void;
  showHints?: boolean;
  showAdvancedFields?: boolean;
}

// Invalidate cached key lists when language changes
function clearKeysCaches() {
  _titleKeys = null;
  _descKeys = null;
  _subtitleKeys = null;
}
onLanguageChange(clearKeysCaches);

// Cached translation key lists for autocomplete
let _titleKeys: string[] | null = null;
function getTitleKeys(): string[] {
  if (!_titleKeys) {
    _titleKeys = [
      ...keysWithPrefix("dbc.sagasdb.").filter((k) => k.endsWith(".title")),
      ...keysWithPrefix("nc.sagasystem.").filter((k) => k.endsWith(".title")),
    ];
  }
  return _titleKeys;
}

let _descKeys: string[] | null = null;
function getDescKeys(): string[] {
  if (!_descKeys) {
    _descKeys = [
      ...keysWithPrefix("dbc.sagasdb.").filter((k) => k.endsWith(".desc")),
      ...keysWithPrefix("nc.sagasystem.").filter((k) => k.endsWith(".desc")),
    ];
  }
  return _descKeys;
}

let _subtitleKeys: string[] | null = null;
function getSubtitleKeys(): string[] {
  if (!_subtitleKeys) {
    _subtitleKeys = [
      ...keysWithPrefix("dbc.sagasdb.").filter((k) => k.endsWith(".desc")),
      ...keysWithPrefix("nc.sagasystem.").filter((k) => k.endsWith(".desc")),
      ...keysWithPrefix("dbc.sagasdb.").filter((k) => k.endsWith(".title")),
      ...keysWithPrefix("nc.sagasystem.").filter((k) => k.endsWith(".title")),
    ];
  }
  return _subtitleKeys;
}

export function MissionEditor({ mission, onChange, showHints = true, showAdvancedFields = true }: MissionEditorProps) {
  const { t } = useTranslation();
  const [propIndex, setPropIndex] = useState(0);

  // Clamp propIndex if it goes out of range
  const safePropIndex = Math.min(propIndex, mission.props.length - 1);
  if (safePropIndex !== propIndex) setPropIndex(safePropIndex);

  function updateField<K extends keyof Mission>(key: K, value: Mission[K]) {
    onChange({ ...mission, [key]: value });
  }

  function updatePropField(key: "title" | "subtitle" | "description" | "align" | "props", index: number, value: string) {
    const arr = [...(mission[key] ?? [])];
    arr[index] = value;
    updateField(key, arr);
  }

  function updateObjectives(index: number, objectives: string[]) {
    const arr = [...mission.objectives];
    arr[index] = objectives;
    updateField("objectives", arr);
  }

  function updateRewards(index: number, rewards: string[]) {
    const arr = [...mission.rewards];
    arr[index] = rewards;
    updateField("rewards", arr);
  }

  function addVariant() {
    const n = mission.props.length;
    onChange({
      ...mission,
      props: [...mission.props, `variant_${n}`],
      align: [...mission.align, "neutral"],
      title: [...mission.title, ""],
      subtitle: [...mission.subtitle, ""],
      description: [...mission.description, ""],
      objectives: [...mission.objectives, ["start"]],
      rewards: [...mission.rewards, ["nothing;;0"]],
    });
    setPropIndex(n);
  }

  function removeVariant(index: number) {
    if (mission.props.length <= 1) return;
    const remove = <T,>(arr: T[]) => arr.filter((_, i) => i !== index);
    onChange({
      ...mission,
      props: remove(mission.props),
      align: remove(mission.align),
      title: remove(mission.title),
      subtitle: remove(mission.subtitle),
      description: remove(mission.description),
      objectives: remove(mission.objectives),
      rewards: remove(mission.rewards),
    });
    if (propIndex >= mission.props.length - 1) {
      setPropIndex(Math.max(0, mission.props.length - 2));
    }
  }

  return (
    <>
      {/* Mission Metadata */}
      <div className="editor-section">
        <div className="editor-section-header">{t("mission.title")} #{mission.id}</div>
        <div className="field-grid">
          <div className="field-group">
            <label className="field-label">{t("mission.id")}</label>
            <input
              type="number"
              value={mission.id}
              onChange={(e) => updateField("id", parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <div className="field-group">
            <label className="field-label">{t("mission.translated")}</label>
            <div style={{ paddingTop: 4 }}>
              <input
                type="checkbox"
                checked={mission.translated}
                onChange={(e) => updateField("translated", e.target.checked)}
              />
              <span style={{ marginLeft: 6, fontSize: 12, color: "var(--text-secondary)" }}>
                {t("mission.translatedHint")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Property Variant Tabs */}
      <div className="editor-section">
        <div className="prop-tabs">
          {mission.props.map((p, i) => (
            <div
              key={i}
              className={`prop-tab ${i === safePropIndex ? "active" : ""}`}
              onClick={() => setPropIndex(i)}
            >
              {p || `${t("mission.variant")} ${i}`}
              {mission.props.length > 1 && (
                <span
                  className="prop-tab-close"
                  onClick={(e) => { e.stopPropagation(); removeVariant(i); }}
                >
                  x
                </span>
              )}
            </div>
          ))}
          <button className="small" onClick={addVariant}>{t("mission.addVariant")}</button>
        </div>
      </div>

      {/* Per-variant fields */}
      <div className="editor-section">
        <div className="editor-section-header">
          {t("mission.content")} ({t("mission.variant")}: {mission.props[safePropIndex] || t("mission.default")})
        </div>
        <div className="field-grid">
          <div className="field-group">
            <label className="field-label">{t("mission.property")}</label>
            <input
              value={mission.props[safePropIndex] ?? ""}
              onChange={(e) => updatePropField("props", safePropIndex, e.target.value)}
            />
          </div>
          <div className="field-group">
            <label className="field-label">{t("mission.alignment")}</label>
            <select
              value={mission.align[safePropIndex]?.toLowerCase() ?? "neutral"}
              onChange={(e) => updatePropField("align", safePropIndex, e.target.value)}
            >
              <option value="good">{t("align.good")}</option>
              <option value="neutral">{t("align.neutral")}</option>
              <option value="evil">{t("align.evil")}</option>
            </select>
          </div>
          <div className="field-group full-width">
            <label className="field-label">{t("mission.fieldTitle")}</label>
            {mission.translated ? (
              <Autocomplete
                value={mission.title[safePropIndex] ?? ""}
                onChange={(v) => updatePropField("title", safePropIndex, v)}
                suggestions={getTitleKeys()}
                placeholder="Translation key (e.g. dbc.sagasdb.0.title)"
              />
            ) : (
              <input
                value={mission.title[safePropIndex] ?? ""}
                onChange={(e) => updatePropField("title", safePropIndex, e.target.value)}
              />
            )}
            {showHints && <TranslationHint translated={mission.translated} value={mission.title[safePropIndex]} />}
          </div>
          <div className="field-group full-width">
            <label className="field-label">{t("mission.subtitle")}</label>
            {mission.translated ? (
              <Autocomplete
                value={mission.subtitle[safePropIndex] ?? ""}
                onChange={(v) => updatePropField("subtitle", safePropIndex, v)}
                suggestions={getSubtitleKeys()}
                placeholder="Translation key"
              />
            ) : (
              <input
                value={mission.subtitle[safePropIndex] ?? ""}
                onChange={(e) => updatePropField("subtitle", safePropIndex, e.target.value)}
              />
            )}
            {showHints && <TranslationHint translated={mission.translated} value={mission.subtitle[safePropIndex]} />}
          </div>
          <div className="field-group full-width">
            <label className="field-label">{t("mission.description")}</label>
            {mission.translated ? (
              <Autocomplete
                value={mission.description[safePropIndex] ?? ""}
                onChange={(v) => updatePropField("description", safePropIndex, v)}
                suggestions={getDescKeys()}
                placeholder="Translation key (e.g. dbc.sagasdb.0.desc)"
              />
            ) : (
              <textarea
                value={mission.description[safePropIndex] ?? ""}
                onChange={(e) => updatePropField("description", safePropIndex, e.target.value)}
                rows={3}
              />
            )}
            {showHints && <TranslationHint translated={mission.translated} value={mission.description[safePropIndex]} />}
          </div>
        </div>
      </div>

      {/* Objectives */}
      <ObjectiveEditor
        objectives={mission.objectives[safePropIndex] ?? []}
        onChange={(objs) => updateObjectives(safePropIndex, objs)}
        translated={mission.translated}
        showHints={showHints}
        showAdvancedFields={showAdvancedFields}
      />

      {/* Rewards */}
      <RewardEditor
        rewards={mission.rewards[safePropIndex] ?? []}
        onChange={(rwds) => updateRewards(safePropIndex, rwds)}
        missionId={mission.id}
        translated={mission.translated}
        showHints={showHints}
      />
    </>
  );
}

function TranslationHint({ translated, value }: { translated: boolean; value?: string }) {
  const { t } = useTranslation();
  if (!translated || !value?.trim()) return null;
  const resolved = translate(value);
  if (resolved !== undefined) {
    const display = resolved.replace(/\/n/g, "\n");
    return (
      <span className="translation-hint resolved">
        {display}
      </span>
    );
  }
  return (
    <span className="translation-hint unresolved">
      {t("mission.noTranslation", { value })}
    </span>
  );
}
