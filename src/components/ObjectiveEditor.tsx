import { OBJECTIVE_TYPES, type ObjectiveType, type Objective } from "../types/mission";
import { useTranslation } from "react-i18next";
import {
  parseObjective,
  serializeObjective,
  FIELDS_BY_TYPE,
  FIELD_LABELS,
  TYPE_LABELS,
} from "../utils/objectives";
import { ALL_ENTITIES, ALL_ITEMS } from "../utils/registry";
import { DBC_TRANSFORMATIONS, MC_SOUNDS } from "../utils/suggestions";
import { translate, entityDisplayName, itemDisplayName, keysWithPrefix, onLanguageChange } from "../utils/translations";
import { formatNumber } from "../utils/formatNumber";
import { computePowerLevel, type PLConfig } from "../utils/powerLevel";
import { Autocomplete } from "./Autocomplete";

/** Fields considered "advanced" - hidden unless showAdvancedFields is true. */
const ADVANCED_FIELDS: Set<keyof Objective> = new Set([
  "spawnMessage", "deathMessage", "protect", "transformations",
  "spawnSound", "deathSound",
]);

interface ObjectiveEditorProps {
  objectives: string[];
  onChange: (objectives: string[]) => void;
  translated?: boolean;
  showHints?: boolean;
  showAdvancedFields?: boolean;
  plConfig?: PLConfig | null;
}

export function ObjectiveEditor({ objectives, onChange, translated, showHints = true, showAdvancedFields = true, plConfig }: ObjectiveEditorProps) {
  const { t } = useTranslation();

  function updateObjective(index: number, raw: string) {
    const updated = [...objectives];
    updated[index] = raw;
    onChange(updated);
  }

  function addObjective() {
    onChange([...objectives, "kill;N;H100;A50"]);
  }

  function removeObjective(index: number) {
    if (index === 0) return;
    onChange(objectives.filter((_, i) => i !== index));
  }

  function moveObjective(index: number, direction: -1 | 1) {
    if (index === 0) return;
    const target = index + direction;
    if (target < 1 || target >= objectives.length) return;
    const updated = [...objectives];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    onChange(updated);
  }

  return (
    <div className="editor-section">
      <div className="editor-section-header">
        <span>{t("objectives.title")}</span>
        <button className="small" onClick={addObjective}>{t("objectives.add")}</button>
      </div>
      <div className="card-list">
        {objectives.map((raw, i) => (
          <ObjectiveCard
            key={i}
            index={i}
            raw={raw}
            isFirst={i === 0}
            translated={translated}
            showHints={showHints}
            showAdvancedFields={showAdvancedFields}
            plConfig={plConfig}
            onChange={(updated) => updateObjective(i, updated)}
            onRemove={() => removeObjective(i)}
            onMoveUp={() => moveObjective(i, -1)}
            onMoveDown={() => moveObjective(i, 1)}
          />
        ))}
      </div>
    </div>
  );
}

interface ObjectiveCardProps {
  index: number;
  raw: string;
  isFirst: boolean;
  translated?: boolean;
  showHints?: boolean;
  showAdvancedFields?: boolean;
  plConfig?: PLConfig | null;
  onChange: (raw: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

// Invalidate cache when language changes
let _sagaKeys: string[] | null = null;
onLanguageChange(() => { _sagaKeys = null; });

// Cached outside component to avoid recomputing on every render
function getSagaTranslationKeys(): string[] {
  if (!_sagaKeys) {
    _sagaKeys = [
      ...keysWithPrefix("dbc.saga"),
      ...keysWithPrefix("nc.saga"),
      ...keysWithPrefix("jinryuujrmcore.mission"),
      ...keysWithPrefix("jinryuujrmcore.reward"),
    ];
  }
  return _sagaKeys;
}

function ObjectiveCard({ index, raw, isFirst, translated, showHints = true, showAdvancedFields = true, plConfig, onChange, onRemove, onMoveUp, onMoveDown }: ObjectiveCardProps) {
  const { t } = useTranslation();
  const obj = parseObjective(raw);
  const allFields = FIELDS_BY_TYPE[obj.type] ?? [];
  const fields = showAdvancedFields ? allFields : allFields.filter((f) => !ADVANCED_FIELDS.has(f));
  const translationKeySuggestions = translated ? getSagaTranslationKeys() : [];

  function updateField(field: keyof Objective, value: string) {
    const updated = { ...obj, [field]: value };
    onChange(serializeObjective(updated));
  }

  function updateType(type: ObjectiveType) {
    const updated = { ...obj, type };
    onChange(serializeObjective(updated));
  }

  // Determine which autocomplete list to use for each field
  function getSuggestions(field: keyof Objective): string[] {
    if (field === "name") {
      if (obj.type === "kill" || obj.type === "killsame" || obj.type === "talk") return ALL_ENTITIES;
      if (obj.type === "item") return ALL_ITEMS;
    }
    if (field === "transformations" && (obj.type === "kill" || obj.type === "killsame")) {
      return DBC_TRANSFORMATIONS;
    }
    if (field === "spawnSound" || field === "deathSound") {
      return MC_SOUNDS;
    }
    // Translation key autocomplete for translatable text fields
    if (translated && (field === "dialog" || field === "button" || field === "spawnMessage" || field === "deathMessage")) {
      return translationKeySuggestions;
    }
    return [];
  }

  function getNumberHint(field: keyof Objective, value: string): string | undefined {
    if (field !== "health" && field !== "attack") return undefined;
    if (!value || value.length <= 4) return undefined;
    const n = Number(value);
    if (!Number.isFinite(n)) return undefined;
    return formatNumber(n);
  }

  // Get a hint for a field value
  function getHint(field: keyof Objective, value: string): string | undefined {
    if (!value) return undefined;

    // Entity name hints
    if (field === "name" && (obj.type === "kill" || obj.type === "killsame" || obj.type === "talk")) {
      return entityDisplayName(value);
    }

    // Item name hints
    if (field === "name" && obj.type === "item") {
      return itemDisplayName(value);
    }

    // Translation key hints for dialog, button, spawn message, death message
    if (field === "dialog" || field === "button" || field === "spawnMessage" || field === "deathMessage") {
      return translate(value);
    }

    return undefined;
  }

  const typeOptions = isFirst
    ? (["next", "start", "skip", "restart"] as const)
    : OBJECTIVE_TYPES;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-left">
          <span className="card-index">{isFirst ? t("objectives.action") : `#${index}`}</span>
          <select
            value={obj.type}
            onChange={(e) => updateType(e.target.value as ObjectiveType)}
            style={{ width: "auto" }}
          >
            {typeOptions.map((ot) => (
              <option key={ot} value={ot}>{TYPE_LABELS[ot]}</option>
            ))}
          </select>
        </div>
        <div className="card-actions">
          {!isFirst && (
            <>
              <button className="small" onClick={onMoveUp} title={t("objectives.moveUp")}>^</button>
              <button className="small" onClick={onMoveDown} title={t("objectives.moveDown")}>v</button>
              <button className="small danger" onClick={onRemove} title={t("objectives.remove")}>x</button>
            </>
          )}
        </div>
      </div>

      {fields.length > 0 && (
        <div className="field-grid">
          {fields.map((field) => {
            const suggestions = getSuggestions(field);
            const value = obj[field] || "";
            const hint = getHint(field, value);
            const numberHint = getNumberHint(field, value);
            return (
              <div key={field} className="field-group">
                <label className="field-label">{FIELD_LABELS[field]}</label>
                {field === "protect" ? (
                  <select
                    value={value}
                    onChange={(e) => updateField(field, e.target.value)}
                  >
                    <option value="">{t("protect.default")}</option>
                    <option value="spwn">{t("protect.spawn")}</option>
                    <option value="no">{t("protect.no")}</option>
                  </select>
                ) : suggestions.length > 0 ? (
                  <Autocomplete
                    value={value}
                    onChange={(v) => updateField(field, v)}
                    suggestions={suggestions}
                    placeholder={FIELD_LABELS[field]}
                  />
                ) : (
                  <input
                    value={value}
                    onChange={(e) => updateField(field, e.target.value)}
                    placeholder={FIELD_LABELS[field]}
                  />
                )}
                {numberHint && <span className="number-hint">{numberHint}</span>}
                {showHints && hint && <span className="translation-hint resolved">{hint}</span>}
                {showHints && !hint && value && (field === "spawnMessage" || field === "deathMessage" || field === "dialog" || field === "button") && (
                  <span className="translation-hint unresolved">{t("objectives.noTranslation", { value })}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
      {plConfig && (obj.type === "kill" || obj.type === "killsame") && (() => {
        const pl = computePowerLevel(obj.health, plConfig);
        if (pl === null) return null;
        return (
          <div className="pl-badge">
            {t("objectives.powerLevel")}: <strong>{formatNumber(pl)}</strong>
          </div>
        );
      })()}
    </div>
  );
}
