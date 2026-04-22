import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Update } from "@tauri-apps/plugin-updater";
import { checkForUpdate, installUpdateAndRestart, type UpdateInfo } from "../utils/updater";

interface Props {
  update: Update;
  info: UpdateInfo;
  onClose: () => void;
}

export function UpdateDialog({ update: initialUpdate, info, onClose }: Props) {
  const { t } = useTranslation();
  const [update, setUpdate] = useState(initialUpdate);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState<{ downloaded: number; total: number | null }>({ downloaded: 0, total: null });
  const [error, setError] = useState<string | null>(null);

  async function install() {
    setInstalling(true);
    setError(null);
    setProgress({ downloaded: 0, total: null });
    try {
      await installUpdateAndRestart(update, (downloaded, total) => {
        setProgress({ downloaded, total });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setInstalling(false);
      // downloadAndInstall consumes the handle; a retry needs a fresh one.
      try {
        const fresh = await checkForUpdate();
        if (fresh) setUpdate(fresh.update);
      } catch {
        // leave the stale handle; install button will surface the same error on retry
      }
    }
  }

  const percent = progress.total ? Math.round((progress.downloaded / progress.total) * 100) : null;

  return (
    <div className="modal-overlay" onClick={installing ? undefined : onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <span>{t("update.available")}</span>
          {!installing && <button className="small" onClick={onClose}>{t("update.later")}</button>}
        </div>
        <div style={{ padding: 16 }}>
          <p style={{ marginBottom: 12 }}>
            {t("update.newVersion", { version: info.version, current: info.currentVersion })}
          </p>
          {info.notes && (
            <div style={{ background: "var(--bg-input)", padding: 10, borderRadius: "var(--radius-sm)", fontSize: 12, whiteSpace: "pre-wrap", maxHeight: 260, overflowY: "auto", marginBottom: 12 }}>
              {info.notes}
            </div>
          )}
          {installing && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ height: 6, background: "var(--bg-input)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: percent !== null ? `${percent}%` : "40%", background: "var(--accent)", transition: "width 0.2s" }} />
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
                {percent !== null ? t("update.downloading", { percent }) : t("update.downloadingUnknown")}
              </div>
            </div>
          )}
          {error && <div className="translation-hint unresolved">{error}</div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            {!installing && (
              <>
                <button className="small" onClick={onClose}>{t("update.later")}</button>
                <button className="small primary" onClick={install}>{t("update.installNow")}</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
