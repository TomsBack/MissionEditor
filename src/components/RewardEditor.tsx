import { useState } from "react";
import { REWARD_TYPES, TP_MODES, type RewardType, type TpMode, type RewardChoice, type RewardComponent } from "../types/mission";
import {
  parseReward,
  serializeReward,
  REWARD_TYPE_LABELS,
  TP_MODE_LABELS,
} from "../utils/rewards";
import { ALL_ITEMS } from "../utils/registry";
import { translate } from "../utils/translations";
import { Autocomplete } from "./Autocomplete";
import { RewardPresetDialog } from "./TemplateDialog";

interface RewardEditorProps {
  rewards: string[];
  onChange: (rewards: string[]) => void;
  missionId: number;
  translated?: boolean;
}

export function RewardEditor({ rewards, onChange, missionId, translated }: RewardEditorProps) {
  const [showPresets, setShowPresets] = useState(false);

  function updateReward(index: number, raw: string) {
    const updated = [...rewards];
    updated[index] = raw;
    onChange(updated);
  }

  function addReward() {
    onChange([...rewards, "nothing;;0"]);
  }

  function removeReward(index: number) {
    if (rewards.length <= 1) return;
    onChange(rewards.filter((_, i) => i !== index));
  }

  return (
    <div className="editor-section">
      <div className="editor-section-header">
        <span>Rewards</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button className="small" onClick={() => setShowPresets(true)}>Presets</button>
          <button className="small" onClick={addReward}>+ Add Choice</button>
        </div>
      </div>
      <div className="card-list">
        {rewards.map((raw, i) => (
          <RewardCard
            key={i}
            index={i}
            raw={raw}
            translated={translated}
            onChange={(updated) => updateReward(i, updated)}
            onRemove={() => removeReward(i)}
            canRemove={rewards.length > 1}
          />
        ))}
      </div>

      {showPresets && (
        <RewardPresetDialog
          nextMissionId={missionId + 1}
          onApply={(presetRewards) => onChange(presetRewards)}
          onClose={() => setShowPresets(false)}
        />
      )}
    </div>
  );
}

interface RewardCardProps {
  index: number;
  raw: string;
  translated?: boolean;
  onChange: (raw: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function RewardCard({ index, raw, translated, onChange, onRemove, canRemove }: RewardCardProps) {
  const reward = parseReward(raw);

  function updateAndSerialize(updated: RewardChoice) {
    onChange(serializeReward(updated));
  }

  function updateMeta(field: "buttonName" | "nextMissionId", value: string) {
    const updated = { ...reward, [field]: field === "nextMissionId" ? parseInt(value, 10) || 0 : value };
    updateAndSerialize(updated);
  }

  function updateComponent(compIndex: number, comp: RewardComponent) {
    const updated = { ...reward, components: [...reward.components] };
    updated.components[compIndex] = comp;
    updateAndSerialize(updated);
  }

  function addComponent() {
    updateAndSerialize({
      ...reward,
      components: [...reward.components, { type: "nothing", value: "" }],
    });
  }

  function removeComponent(compIndex: number) {
    if (reward.components.length <= 1) return;
    updateAndSerialize({
      ...reward,
      components: reward.components.filter((_, i) => i !== compIndex),
    });
  }

  // Resolve the button name translation
  const buttonHint = reward.buttonName ? translate(reward.buttonName) : undefined;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-left">
          <span className="card-index">Choice #{index + 1}</span>
        </div>
        <div className="card-actions">
          {canRemove && <button className="small danger" onClick={onRemove}>x</button>}
        </div>
      </div>

      <div className="field-grid" style={{ marginBottom: 10 }}>
        <div className="field-group">
          <label className="field-label">Button Name</label>
          <input
            value={reward.buttonName}
            onChange={(e) => updateMeta("buttonName", e.target.value)}
            placeholder="Translation key or display name"
          />
          {buttonHint !== undefined && (
            <span className="translation-hint resolved">{buttonHint}</span>
          )}
          {reward.buttonName && buttonHint === undefined && translated && (
            <span className="translation-hint unresolved">No translation for "{reward.buttonName}"</span>
          )}
        </div>
        <div className="field-group">
          <label className="field-label">Next Mission ID</label>
          <input
            type="number"
            value={reward.nextMissionId}
            onChange={(e) => updateMeta("nextMissionId", e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span className="field-label">Components</span>
        <button className="small" onClick={addComponent}>+ Add</button>
      </div>

      {reward.components.map((comp, ci) => (
        <RewardComponentRow
          key={ci}
          component={comp}
          onChange={(updated) => updateComponent(ci, updated)}
          onRemove={() => removeComponent(ci)}
          canRemove={reward.components.length > 1}
        />
      ))}
    </div>
  );
}

interface RewardComponentRowProps {
  component: RewardComponent;
  onChange: (comp: RewardComponent) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function RewardComponentRow({ component, onChange, onRemove, canRemove }: RewardComponentRowProps) {
  function updateType(type: RewardType) {
    const defaults: Record<RewardType, Partial<RewardComponent>> = {
      nothing: { value: "" },
      tp: { tpMode: "fix", value: "100" },
      align: { value: "+10" },
      item: { value: "minecraft:diamond,1" },
      com: { value: "" },
    };
    onChange({ type, ...defaults[type] } as RewardComponent);
  }

  return (
    <div className="reward-component">
      <div className="field-group" style={{ minWidth: 130 }}>
        <select
          value={component.type}
          onChange={(e) => updateType(e.target.value as RewardType)}
          style={{ width: "100%" }}
        >
          {REWARD_TYPES.map((t) => (
            <option key={t} value={t}>{REWARD_TYPE_LABELS[t]}</option>
          ))}
        </select>
      </div>

      {component.type === "tp" && (
        <>
          <div className="field-group" style={{ minWidth: 120 }}>
            <select
              value={component.tpMode || "fix"}
              onChange={(e) => onChange({ ...component, tpMode: e.target.value as TpMode })}
              style={{ width: "100%" }}
            >
              {TP_MODES.map((m) => (
                <option key={m} value={m}>{TP_MODE_LABELS[m]}</option>
              ))}
            </select>
          </div>
          <div className="field-group" style={{ flex: 1 }}>
            <input
              value={component.value}
              onChange={(e) => onChange({ ...component, value: e.target.value })}
              placeholder="Amount or multiplier"
            />
          </div>
        </>
      )}

      {component.type === "align" && (
        <div className="field-group" style={{ flex: 1 }}>
          <input
            value={component.value}
            onChange={(e) => onChange({ ...component, value: e.target.value })}
            placeholder="+10, -10, or 0 (auto-balance)"
          />
        </div>
      )}

      {component.type === "item" && (
        <div className="field-group" style={{ flex: 1 }}>
          <Autocomplete
            value={component.value}
            onChange={(v) => onChange({ ...component, value: v })}
            suggestions={ALL_ITEMS}
            placeholder="mod:itemname::metadata,count"
            valueSeparator=","
          />
        </div>
      )}

      {component.type === "com" && (
        <div className="field-group" style={{ flex: 1 }}>
          <input
            value={component.value}
            onChange={(e) => onChange({ ...component, value: e.target.value })}
            placeholder="Command (@p for player name)"
          />
        </div>
      )}

      {canRemove && (
        <button className="small danger" onClick={onRemove} style={{ alignSelf: "center" }}>x</button>
      )}
    </div>
  );
}
