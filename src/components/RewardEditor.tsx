import { useState } from "react";
import { REWARD_TYPES, TP_MODES, type RewardType, type TpMode, type RewardChoice, type RewardComponent } from "../types/mission";
import { useTranslation } from "react-i18next";
import {
  parseReward,
  serializeReward,
  REWARD_TYPE_LABELS,
  TP_MODE_LABELS,
} from "../utils/rewards";
import { ALL_ITEMS } from "../utils/registry";
import { translate, keysWithPrefix, onLanguageChange } from "../utils/translations";
import { Autocomplete } from "./Autocomplete";
import { RewardPresetDialog } from "./TemplateDialog";

// Cached button name translation keys for autocomplete (invalidated on language change)
let _buttonNameKeys: string[] | null = null;
onLanguageChange(() => { _buttonNameKeys = null; });
function getButtonNameKeys(): string[] {
  if (!_buttonNameKeys) {
    _buttonNameKeys = keysWithPrefix("jinryuujrmcore.");
  }
  return _buttonNameKeys;
}

interface RewardEditorProps {
  rewards: string[];
  onChange: (rewards: string[]) => void;
  missionId: number;
  translated?: boolean;
  showHints?: boolean;
}

export function RewardEditor({ rewards, onChange, missionId, translated, showHints = true }: RewardEditorProps) {
  const { t } = useTranslation();
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
        <span>{t("rewards.title")}</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button className="small" onClick={() => setShowPresets(true)}>{t("rewards.presets")}</button>
          <button className="small" onClick={addReward}>{t("rewards.addChoice")}</button>
        </div>
      </div>
      <div className="card-list">
        {rewards.map((raw, i) => (
          <RewardCard
            key={i}
            index={i}
            raw={raw}
            translated={translated}
            showHints={showHints}
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
  showHints?: boolean;
  onChange: (raw: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function RewardCard({ index, raw, translated, showHints = true, onChange, onRemove, canRemove }: RewardCardProps) {
  const { t } = useTranslation();
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
          <span className="card-index">{t("rewards.choice")} #{index + 1}</span>
        </div>
        <div className="card-actions">
          {canRemove && <button className="small danger" onClick={onRemove}>x</button>}
        </div>
      </div>

      <div className="field-grid" style={{ marginBottom: 10 }}>
        <div className="field-group">
          <label className="field-label">{t("rewards.buttonName")}</label>
          <Autocomplete
            value={reward.buttonName}
            onChange={(v) => updateMeta("buttonName", v)}
            suggestions={getButtonNameKeys()}
            placeholder={t("rewards.buttonPlaceholder")}
          />
          {showHints && buttonHint !== undefined && (
            <span className="translation-hint resolved">{buttonHint}</span>
          )}
          {showHints && reward.buttonName && buttonHint === undefined && translated && (
            <span className="translation-hint unresolved">{t("rewards.noTranslation", { value: reward.buttonName })}</span>
          )}
        </div>
        <div className="field-group">
          <label className="field-label">{t("rewards.nextMissionId")}</label>
          <input
            type="number"
            value={reward.nextMissionId}
            onChange={(e) => updateMeta("nextMissionId", e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span className="field-label">{t("rewards.components")}</span>
        <button className="small" onClick={addComponent}>{t("rewards.addComponent")}</button>
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
  const { t } = useTranslation();

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
          {REWARD_TYPES.map((rt) => (
            <option key={rt} value={rt}>{REWARD_TYPE_LABELS[rt]}</option>
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
              placeholder={t("reward.tpPlaceholder")}
            />
          </div>
        </>
      )}

      {component.type === "align" && (
        <div className="field-group" style={{ flex: 1 }}>
          <input
            value={component.value}
            onChange={(e) => onChange({ ...component, value: e.target.value })}
            placeholder={t("reward.alignPlaceholder")}
          />
        </div>
      )}

      {component.type === "item" && (
        <div className="field-group" style={{ flex: 1 }}>
          <Autocomplete
            value={component.value}
            onChange={(v) => onChange({ ...component, value: v })}
            suggestions={ALL_ITEMS}
            placeholder={t("reward.itemPlaceholder")}
            valueSeparator=","
          />
        </div>
      )}

      {component.type === "com" && (
        <div className="field-group" style={{ flex: 1 }}>
          <input
            value={component.value}
            onChange={(e) => onChange({ ...component, value: e.target.value })}
            placeholder={t("reward.comPlaceholder")}
          />
        </div>
      )}

      {canRemove && (
        <button className="small danger" onClick={onRemove} style={{ alignSelf: "center" }}>x</button>
      )}
    </div>
  );
}
