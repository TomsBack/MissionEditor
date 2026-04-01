import { OBJECTIVE_TYPES, type ObjectiveType, type Objective } from "../types/mission";
import {
  parseObjective,
  serializeObjective,
  FIELDS_BY_TYPE,
  FIELD_LABELS,
  TYPE_LABELS,
} from "../utils/objectives";
import { ALL_ENTITIES, ALL_ITEMS } from "../utils/registry";
import { translate, entityDisplayName } from "../utils/translations";
import { Autocomplete } from "./Autocomplete";

interface ObjectiveEditorProps {
  objectives: string[];
  onChange: (objectives: string[]) => void;
  translated?: boolean;
}

export function ObjectiveEditor({ objectives, onChange, translated }: ObjectiveEditorProps) {
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
        <span>Objectives</span>
        <button className="small" onClick={addObjective}>+ Add Objective</button>
      </div>
      <div className="card-list">
        {objectives.map((raw, i) => (
          <ObjectiveCard
            key={i}
            index={i}
            raw={raw}
            isFirst={i === 0}
            translated={translated}
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
  onChange: (raw: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function ObjectiveCard({ index, raw, isFirst, translated, onChange, onRemove, onMoveUp, onMoveDown }: ObjectiveCardProps) {
  const obj = parseObjective(raw);
  const fields = FIELDS_BY_TYPE[obj.type] ?? [];

  function updateField(field: keyof Objective, value: string) {
    const updated = { ...obj, [field]: value };
    onChange(serializeObjective(updated));
  }

  function updateType(type: ObjectiveType) {
    const updated = { ...obj, type };
    onChange(serializeObjective(updated));
  }

  // Determine which autocomplete list to use for the "name" field
  function getSuggestions(field: keyof Objective): string[] {
    if (field !== "name") return [];
    if (obj.type === "kill" || obj.type === "killsame" || obj.type === "talk") return ALL_ENTITIES;
    if (obj.type === "item") return ALL_ITEMS;
    return [];
  }

  // Get a hint for a field value
  function getHint(field: keyof Objective, value: string): string | undefined {
    if (!value) return undefined;

    // Entity name hints
    if (field === "name" && (obj.type === "kill" || obj.type === "killsame" || obj.type === "talk")) {
      return entityDisplayName(value);
    }

    // Translation key hints for dialog and button fields
    if (translated && (field === "dialog" || field === "button")) {
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
          <span className="card-index">{isFirst ? "Action" : `#${index}`}</span>
          <select
            value={obj.type}
            onChange={(e) => updateType(e.target.value as ObjectiveType)}
            style={{ width: "auto" }}
          >
            {typeOptions.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div className="card-actions">
          {!isFirst && (
            <>
              <button className="small" onClick={onMoveUp} title="Move up">^</button>
              <button className="small" onClick={onMoveDown} title="Move down">v</button>
              <button className="small danger" onClick={onRemove} title="Remove">x</button>
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
            return (
              <div key={field} className="field-group">
                <label className="field-label">{FIELD_LABELS[field]}</label>
                {field === "protect" ? (
                  <select
                    value={value}
                    onChange={(e) => updateField(field, e.target.value)}
                  >
                    <option value="">Default (must kill specific)</option>
                    <option value="spwn">Spawn (any will do)</option>
                    <option value="no">No protect (any will do)</option>
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
                {hint && <span className="translation-hint resolved">{hint}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
