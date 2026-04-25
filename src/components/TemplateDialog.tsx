import { MISSION_TEMPLATES } from "../utils/templates";
import type { Mission } from "../types/mission";
import { useTranslation } from "react-i18next";

// Re-export the inline preset dialogs from their dedicated module so existing
// consumers (and tests) can still import them from here.
export { RewardPresetDialog, ObjectivePresetDialog } from "./PresetDialogs";

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
