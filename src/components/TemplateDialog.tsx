import { MISSION_TEMPLATES, threeAlignmentTpReward, nothingReward } from "../utils/templates";
import type { Mission } from "../types/mission";

interface TemplateDialogProps {
  nextId: number;
  onSelect: (mission: Mission) => void;
  onClose: () => void;
}

export function TemplateDialog({ nextId, onSelect, onClose }: TemplateDialogProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>New Mission from Template</span>
          <button className="small" onClick={onClose}>Close</button>
        </div>
        <div className="modal-body">
          <div className="template-grid">
            {MISSION_TEMPLATES.map((t) => (
              <div
                key={t.name}
                className="template-card"
                onClick={() => { onSelect(t.create(nextId)); onClose(); }}
              >
                <div className="template-name">{t.name}</div>
                <div className="template-desc">{t.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface RewardPresetDialogProps {
  nextMissionId: number;
  onApply: (rewards: string[]) => void;
  onClose: () => void;
}

export function RewardPresetDialog({ nextMissionId, onApply, onClose }: RewardPresetDialogProps) {
  const presets = [
    { name: "3-Align TP (Fixed)", desc: "150 TP with Good/Neutral/Evil", apply: () => threeAlignmentTpReward("150", nextMissionId, "fix") },
    { name: "3-Align TP (Level)", desc: "10x level TP with alignment", apply: () => threeAlignmentTpReward("10.0", nextMissionId, "lvlalign") },
    { name: "Nothing (transition)", desc: "No reward, just advance", apply: () => nothingReward(nextMissionId) },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>Reward Presets</span>
          <button className="small" onClick={onClose}>Close</button>
        </div>
        <div className="modal-body">
          <div className="template-grid">
            {presets.map((p) => (
              <div
                key={p.name}
                className="template-card"
                onClick={() => { onApply(p.apply()); onClose(); }}
              >
                <div className="template-name">{p.name}</div>
                <div className="template-desc">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
