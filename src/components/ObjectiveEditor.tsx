import { OBJECTIVE_TYPES, type ObjectiveType, type Objective } from "../types/mission";
import {
  parseObjective,
  serializeObjective,
  FIELDS_BY_TYPE,
  FIELD_LABELS,
  TYPE_LABELS,
} from "../utils/objectives";

interface ObjectiveEditorProps {
  objectives: string[];
  onChange: (objectives: string[]) => void;
}

export function ObjectiveEditor({ objectives, onChange }: ObjectiveEditorProps) {
  function updateObjective(index: number, raw: string) {
    const updated = [...objectives];
    updated[index] = raw;
    onChange(updated);
  }

  function addObjective() {
    onChange([...objectives, "kill;N;H100;A50"]);
  }

  function removeObjective(index: number) {
    // Don't remove the first objective (action button)
    if (index === 0) return;
    onChange(objectives.filter((_, i) => i !== index));
  }

  function moveObjective(index: number, direction: -1 | 1) {
    if (index === 0) return; // Don't move action button
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
  onChange: (raw: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function ObjectiveCard({ index, raw, isFirst, onChange, onRemove, onMoveUp, onMoveDown }: ObjectiveCardProps) {
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

  // For the first objective, only show action button types
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
          {fields.map((field) => (
            <div key={field} className="field-group">
              <label className="field-label">{FIELD_LABELS[field]}</label>
              {field === "protect" ? (
                <select
                  value={obj[field] || ""}
                  onChange={(e) => updateField(field, e.target.value)}
                >
                  <option value="">Default (must kill specific)</option>
                  <option value="spwn">Spawn (any will do)</option>
                  <option value="no">No protect (any will do)</option>
                </select>
              ) : (
                <input
                  value={obj[field] || ""}
                  onChange={(e) => updateField(field, e.target.value)}
                  placeholder={FIELD_LABELS[field]}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
