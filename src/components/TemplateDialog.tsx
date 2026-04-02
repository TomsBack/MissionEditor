import { MISSION_TEMPLATES, threeAlignmentTpReward, nothingReward } from "../utils/templates";
import type { Mission } from "../types/mission";
import { useTranslation } from "react-i18next";

interface TemplateDialogProps {
  nextId: number;
  onSelect: (mission: Mission) => void;
  onClose: () => void;
}

export function TemplateDialog({ nextId, onSelect, onClose }: TemplateDialogProps) {
  const { t } = useTranslation();
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>{t("template.title")}</span>
          <button className="small" onClick={onClose}>{t("template.close")}</button>
        </div>
        <div className="modal-body">
          <div className="template-grid">
            {MISSION_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.name}
                className="template-card"
                onClick={() => { onSelect(tmpl.create(nextId)); onClose(); }}
              >
                <div className="template-card-name">{tmpl.name}</div>
                <div className="template-card-desc">{tmpl.description}</div>
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
  const { t } = useTranslation();
  const presets = [
    { name: t("template.alignTpFixed"), desc: t("template.alignTpFixedDesc"), apply: () => threeAlignmentTpReward("150", nextMissionId, "fix") },
    { name: t("template.alignTpLevel"), desc: t("template.alignTpLevelDesc"), apply: () => threeAlignmentTpReward("10.0", nextMissionId, "lvlalign") },
    { name: t("template.nothing"), desc: t("template.nothingDesc"), apply: () => nothingReward(nextMissionId) },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>{t("template.rewardPresets")}</span>
          <button className="small" onClick={onClose}>{t("template.close")}</button>
        </div>
        <div className="modal-body">
          <div className="template-grid">
            {presets.map((p) => (
              <div
                key={p.name}
                className="template-card"
                onClick={() => { onApply(p.apply()); onClose(); }}
              >
                <div className="template-card-name">{p.name}</div>
                <div className="template-card-desc">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
