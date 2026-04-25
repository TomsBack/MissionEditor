import { useState } from "react";
import type { Mission } from "../types/mission";
import { translate, keysWithPrefix, onLanguageChange } from "../utils/translations";
import { useTranslation } from "react-i18next";
import type { PLConfig } from "../utils/powerLevel";
import { Autocomplete } from "./Autocomplete";
import { NumberInput } from "./NumberInput";
import { ObjectiveEditor } from "./ObjectiveEditor";
import { RewardEditor } from "./RewardEditor";
import { PROPERTY_SUGGESTIONS, DBC_RACES, DBC_CLASSES } from "../utils/raceClass";
import { findMatchingVariant, computeCoverage, describeProp } from "../utils/variantMatcher";

interface MissionEditorProps {
  mission: Mission;
  onChange: (mission: Mission) => void;
  showHints?: boolean;
  showAdvancedFields?: boolean;
  showVariantSimulator?: boolean;
  plConfig?: PLConfig | null;
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

export function MissionEditor({ mission, onChange, showHints = true, showAdvancedFields = true, showVariantSimulator = false, plConfig }: MissionEditorProps) {
  const { t } = useTranslation();
  const [propIndex, setPropIndex] = useState(0);

  // Clamp propIndex if it goes out of range
  const safePropIndex = Math.min(propIndex, mission.props.length - 1);
  if (safePropIndex !== propIndex) setPropIndex(safePropIndex);

  // Resolve the mission's first-variant title for the section header so users
  // keep their bearings when scrolled or with a narrow sidebar.
  const rawTitle = mission.title?.[0] ?? "";
  const resolvedTitle = rawTitle
    ? (mission.translated ? (translate(rawTitle) ?? rawTitle) : rawTitle)
    : "";

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
      props: [...mission.props, ""],
      align: [...mission.align, "neutral"],
      title: [...mission.title, ""],
      subtitle: [...mission.subtitle, ""],
      description: [...mission.description, ""],
      objectives: [...mission.objectives, ["start"]],
      rewards: [...mission.rewards, ["nothing;;0"]],
    });
    setPropIndex(n);
  }

  function duplicateVariant() {
    const i = safePropIndex;
    const suffix = t("mission.duplicateSuffix");
    onChange({
      ...mission,
      props: [...mission.props, `${mission.props[i] ?? ""}${suffix}`],
      align: [...mission.align, mission.align[i] ?? "neutral"],
      title: [...mission.title, mission.title[i] ?? ""],
      subtitle: [...mission.subtitle, mission.subtitle[i] ?? ""],
      description: [...mission.description, mission.description[i] ?? ""],
      objectives: [...mission.objectives, [...(mission.objectives[i] ?? ["start"])]],
      rewards: [...mission.rewards, [...(mission.rewards[i] ?? ["nothing;;0"])]],
    });
    setPropIndex(mission.props.length);
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
        <div className="editor-section-header">
          <span>
            {t("mission.title")} #{mission.id}
            {resolvedTitle && <span className="mission-header-title">: {resolvedTitle}</span>}
          </span>
        </div>
        <div className="field-grid">
          <div className="field-group">
            <label className="field-label">{t("mission.id")}</label>
            <NumberInput
              value={mission.id}
              onChange={(v) => updateField("id", v)}
            />
          </div>
          <div className="field-group">
            <label className="field-label">{t("mission.translated")}</label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={mission.translated}
                onChange={(e) => updateField("translated", e.target.checked)}
              />
              <span>{t("mission.translatedHint")}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Property Variant Tabs */}
      <div className="editor-section">
        <VariantTabStrip
          props={mission.props}
          activeIndex={safePropIndex}
          showSimulator={showVariantSimulator}
          onSelect={setPropIndex}
          onRename={(i, v) => updatePropField("props", i, v)}
          onDuplicate={duplicateVariant}
          onAdd={addVariant}
          onRemove={removeVariant}
        />
        <VariantContextHint propValue={mission.props[safePropIndex] ?? ""} isFallback={safePropIndex === 0} />
      </div>

      {/* Per-variant fields */}
      <div className="editor-section">
        <div className="editor-section-header">
          {t("mission.content")} ({t("mission.variant")}: {mission.props[safePropIndex] || t("mission.default")})
        </div>
        <div className="field-grid">
          <div className="field-group full-width">
            <label className="field-label">{t("mission.alignment")}</label>
            <select
              value={mission.align[safePropIndex]?.toLowerCase() ?? "neutral"}
              onChange={(e) => updatePropField("align", safePropIndex, e.target.value)}
              style={{ maxWidth: 240 }}
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
        plConfig={plConfig}
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

// #region Variant Tab Strip

interface VariantTabStripProps {
  props: string[];
  activeIndex: number;
  showSimulator: boolean;
  onSelect: (index: number) => void;
  onRename: (index: number, value: string) => void;
  onDuplicate: () => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

function VariantTabStrip({ props, activeIndex, showSimulator, onSelect, onRename, onDuplicate, onAdd, onRemove }: VariantTabStripProps) {
  const { t } = useTranslation();
  // Player simulator state. Defaults pick a Saiyan MartialArtist, the most
  // common DBC archetype, so the highlight does something useful out of the
  // box on multi-variant missions.
  const [simRace, setSimRace] = useState<string>(DBC_RACES[1]);
  const [simClass, setSimClass] = useState<string>(DBC_CLASSES[0]);

  // Simulator panel only renders when explicitly enabled in settings AND
  // there's more than one variant to disambiguate between.
  const showSim = showSimulator && props.length > 1;
  const matchedIndex = showSim ? findMatchingVariant(props, simRace, simClass) : -1;

  const coverage = props.length > 1 ? computeCoverage(props) : null;
  // Build a "Catches: ..." string by listing each non-default variant's
  // resolved label. Skip variant 0 since "everything else" goes there anyway.
  let coverageLine: string | null = null;
  if (coverage) {
    const catchNames = new Set<string>();
    for (const idx of coverage.keys()) {
      if (idx === 0) continue;
      const semantics = describeProp(props[idx] ?? "");
      if (semantics.races.length) catchNames.add(semantics.races[0]);
      else if (semantics.classes.length) catchNames.add(`${semantics.classes[0]} class`);
      else catchNames.add(props[idx] || `#${idx}`);
    }
    if (catchNames.size > 0) {
      coverageLine = t("mission.coverageOnly", { names: [...catchNames].join(", ") }) + " " + t("mission.coverageRest");
    }
  }

  return (
    <>
      {showSim && (
        <div className="variant-simulator">
          <span className="variant-simulator-label">{t("mission.simulator")}:</span>
          <select value={simRace} onChange={(e) => setSimRace(e.target.value)} aria-label={t("mission.simulatorRace")}>
            {DBC_RACES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={simClass} onChange={(e) => setSimClass(e.target.value)} aria-label={t("mission.simulatorClass")}>
            {DBC_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="variant-simulator-result">
            {t("mission.simulatorResult", { index: matchedIndex })}
          </span>
        </div>
      )}

      <div className="prop-tabs">
        {props.map((p, i) => (
          <VariantTab
            key={i}
            value={p}
            index={i}
            isActive={i === activeIndex}
            isFallback={i === 0}
            isSimulatorMatch={i === matchedIndex}
            canRemove={props.length > 1}
            onSelect={() => onSelect(i)}
            onRemove={() => onRemove(i)}
          />
        ))}
        <button className="small" onClick={onDuplicate} title={t("mission.duplicateVariant")}>
          {t("mission.duplicateVariant")}
        </button>
        <button className="small" onClick={onAdd}>{t("mission.addVariant")}</button>
      </div>

      {/* Always-visible rename field for the active variant. The tab strip is
          a navigator (single-click selects); this field is the editor. They're
          synchronized so the user sees that typing here renames the active tab. */}
      <div className="variant-rename">
        <label className="field-label" htmlFor="variant-rename-input">
          {t("mission.property")}
        </label>
        <Autocomplete
          value={props[activeIndex] ?? ""}
          onChange={(v) => onRename(activeIndex, v)}
          suggestions={PROPERTY_SUGGESTIONS}
          placeholder={t("mission.propertyPlaceholder")}
        />
      </div>

      {coverageLine && <div className="variant-coverage">{coverageLine}</div>}
    </>
  );
}

interface VariantTabProps {
  value: string;
  index: number;
  isActive: boolean;
  isFallback: boolean;
  isSimulatorMatch: boolean;
  canRemove: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

function VariantTab({ value, index, isActive, isFallback, isSimulatorMatch, canRemove, onSelect, onRemove }: VariantTabProps) {
  const { t } = useTranslation();

  const classes = [
    "prop-tab",
    isActive && "active",
    isSimulatorMatch && !isActive && "sim-match",
    isFallback && "fallback",
  ].filter(Boolean).join(" ");

  return (
    <div className={classes} onClick={onSelect}>
      <span className="prop-tab-name">
        {value || `${t("mission.variant")} ${index}`}
      </span>
      {isFallback && (
        <span className="prop-tab-fallback" title={t("mission.variantFallbackTooltip")}>
          {t("mission.variantFallback")}
        </span>
      )}
      {canRemove && (
        <span
          className="prop-tab-close"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
        >
          x
        </span>
      )}
    </div>
  );
}

// #endregion

// #region Variant Context Hint

function VariantContextHint({ propValue, isFallback }: { propValue: string; isFallback: boolean }) {
  const { t } = useTranslation();
  // Variant 0 is the fallback regardless of its prop value; show the fallback
  // explanation rather than the more detailed prop semantics.
  if (isFallback) {
    return (
      <div className="variant-hint variant-hint-info">
        {t("mission.variantFallbackTooltip")}
      </div>
    );
  }

  const semantics = describeProp(propValue);

  if (semantics.isUnreachableHalfSaiyan) {
    return (
      <div className="variant-hint variant-hint-warn">
        {t("mission.variantUnreachableHalfSaiyan")}
      </div>
    );
  }

  if (semantics.isUnknown && propValue.trim()) {
    return (
      <div className="variant-hint variant-hint-warn">
        {t("mission.variantUnknownProp", { value: propValue })}
      </div>
    );
  }

  if (semantics.races.length > 0) {
    return (
      <div className="variant-hint variant-hint-info">
        {t("mission.variantMatchesRace", { race: semantics.races[0] })}
        {semantics.catchesHalfSaiyan && " " + t("mission.variantCatchesHalfSaiyan")}
      </div>
    );
  }

  if (semantics.classes.length > 0) {
    return (
      <div className="variant-hint variant-hint-info">
        {t("mission.variantMatchesClass", { class: semantics.classes[0] })}
      </div>
    );
  }

  return null;
}

// #endregion
