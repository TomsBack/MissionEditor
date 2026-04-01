import { useState } from "react";
import type { Mission } from "../types/mission";
import { ObjectiveEditor } from "./ObjectiveEditor";
import { RewardEditor } from "./RewardEditor";

interface MissionEditorProps {
  mission: Mission;
  onChange: (mission: Mission) => void;
}

export function MissionEditor({ mission, onChange }: MissionEditorProps) {
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
      align: [...mission.align, "50"],
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
      <div className="editor-section">
        <div className="prop-tabs">
          {mission.props.map((p, i) => (
            <div
              key={i}
              className={`prop-tab ${i === safePropIndex ? "active" : ""}`}
              onClick={() => setPropIndex(i)}
            >
              {p || `Variant ${i}`}
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
          <button className="small" onClick={addVariant}>+ Variant</button>
        </div>
      </div>

      {/* Per-variant fields */}
      <div className="editor-section">
        <div className="editor-section-header">
          Content (Variant: {mission.props[safePropIndex] || "default"})
        </div>
        <div className="field-grid">
          <div className="field-group">
            <label className="field-label">Property / Race+Class</label>
            <input
              value={mission.props[safePropIndex] ?? ""}
              onChange={(e) => updatePropField("props", safePropIndex, e.target.value)}
            />
          </div>
          <div className="field-group">
            <label className="field-label">Alignment</label>
            <input
              value={mission.align[safePropIndex] ?? ""}
              onChange={(e) => updatePropField("align", safePropIndex, e.target.value)}
            />
          </div>
          <div className="field-group full-width">
            <label className="field-label">Title</label>
            <input
              value={mission.title[safePropIndex] ?? ""}
              onChange={(e) => updatePropField("title", safePropIndex, e.target.value)}
            />
            {mission.translated && mission.title[safePropIndex] && (
              <span className="translation-hint">Key: {mission.title[safePropIndex]}</span>
            )}
          </div>
          <div className="field-group full-width">
            <label className="field-label">Subtitle</label>
            <input
              value={mission.subtitle[safePropIndex] ?? ""}
              onChange={(e) => updatePropField("subtitle", safePropIndex, e.target.value)}
            />
          </div>
          <div className="field-group full-width">
            <label className="field-label">Description</label>
            <textarea
              value={mission.description[safePropIndex] ?? ""}
              onChange={(e) => updatePropField("description", safePropIndex, e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Objectives */}
      <ObjectiveEditor
        objectives={mission.objectives[safePropIndex] ?? []}
        onChange={(objs) => updateObjectives(safePropIndex, objs)}
      />

      {/* Rewards */}
      <RewardEditor
        rewards={mission.rewards[safePropIndex] ?? []}
        onChange={(rwds) => updateRewards(safePropIndex, rwds)}
        missionId={mission.id}
      />
    </>
  );
}
