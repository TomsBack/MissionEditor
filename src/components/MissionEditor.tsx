import type { Mission } from "../types/mission";
import { ObjectiveEditor } from "./ObjectiveEditor";
import { RewardEditor } from "./RewardEditor";

interface MissionEditorProps {
  mission: Mission;
  onChange: (mission: Mission) => void;
}

export function MissionEditor({ mission, onChange }: MissionEditorProps) {
  const propIndex = 0; // For now, always edit the first property variant
  const propCount = mission.props.length;

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

  return (
    <div className="editor-panel">
      {/* Mission Metadata */}
      <div className="editor-section">
        <div className="editor-section-header">Mission #{mission.id}</div>
        <div className="field-grid">
          <div className="field-group">
            <label className="field-label">Mission ID</label>
            <input
              type="number"
              value={mission.id}
              onChange={(e) => updateField("id", parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <div className="field-group">
            <label className="field-label">Translated</label>
            <div style={{ paddingTop: 4 }}>
              <input
                type="checkbox"
                checked={mission.translated}
                onChange={(e) => updateField("translated", e.target.checked)}
              />
              <span style={{ marginLeft: 6, fontSize: 12, color: "var(--text-secondary)" }}>
                Values are translation keys
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Property Variant Tabs */}
      {propCount > 1 && (
        <div className="prop-tabs">
          {mission.props.map((p, i) => (
            <span
              key={i}
              className={`prop-tab ${i === propIndex ? "active" : ""}`}
            >
              {p || `Variant ${i}`}
            </span>
          ))}
        </div>
      )}

      {/* Per-variant fields */}
      <div className="editor-section">
        <div className="editor-section-header">Content (Variant: {mission.props[propIndex] || "default"})</div>
        <div className="field-grid">
          <div className="field-group">
            <label className="field-label">Property / Race+Class</label>
            <input
              value={mission.props[propIndex] ?? ""}
              onChange={(e) => updatePropField("props", propIndex, e.target.value)}
            />
          </div>
          <div className="field-group">
            <label className="field-label">Alignment</label>
            <input
              value={mission.align[propIndex] ?? ""}
              onChange={(e) => updatePropField("align", propIndex, e.target.value)}
            />
          </div>
          <div className="field-group full-width">
            <label className="field-label">Title</label>
            <input
              value={mission.title[propIndex] ?? ""}
              onChange={(e) => updatePropField("title", propIndex, e.target.value)}
            />
          </div>
          <div className="field-group full-width">
            <label className="field-label">Subtitle</label>
            <input
              value={mission.subtitle[propIndex] ?? ""}
              onChange={(e) => updatePropField("subtitle", propIndex, e.target.value)}
            />
          </div>
          <div className="field-group full-width">
            <label className="field-label">Description</label>
            <textarea
              value={mission.description[propIndex] ?? ""}
              onChange={(e) => updatePropField("description", propIndex, e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Objectives */}
      <ObjectiveEditor
        objectives={mission.objectives[propIndex] ?? []}
        onChange={(objs) => updateObjectives(propIndex, objs)}
      />

      {/* Rewards */}
      <RewardEditor
        rewards={mission.rewards[propIndex] ?? []}
        onChange={(rwds) => updateRewards(propIndex, rwds)}
      />
    </div>
  );
}
