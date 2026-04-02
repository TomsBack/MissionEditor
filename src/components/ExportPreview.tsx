import { useState, useMemo } from "react";
import type { MissionBundle } from "../types/mission";
import { useTranslation } from "react-i18next";

interface ExportPreviewProps {
  bundle: MissionBundle;
  originalJson?: string;
  jsonIndent?: number;
  onClose: () => void;
}

export function ExportPreview({ bundle, originalJson, jsonIndent = 2, onClose }: ExportPreviewProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"preview" | "diff">(originalJson ? "diff" : "preview");
  const currentJson = JSON.stringify(bundle, null, jsonIndent);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>{t("export.title")}</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              className={`small ${tab === "preview" ? "primary" : ""}`}
              onClick={() => setTab("preview")}
            >
              {t("export.preview")}
            </button>
            {originalJson && (
              <button
                className={`small ${tab === "diff" ? "primary" : ""}`}
                onClick={() => setTab("diff")}
              >
                {t("export.diff")}
              </button>
            )}
            <button className="small" onClick={onClose}>{t("export.close")}</button>
          </div>
        </div>
        <div className="modal-body">
          {tab === "preview" ? (
            <pre className="json-preview">{currentJson}</pre>
          ) : (
            <DiffView original={originalJson || ""} current={currentJson} />
          )}
        </div>
      </div>
    </div>
  );
}

// #region LCS-based diff

interface DiffLine {
  type: "same" | "add" | "remove";
  text: string;
  lineNum: number;
}

/** Compute a minimal diff using the LCS (longest common subsequence) algorithm. */
function computeDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  const m = oldLines.length;
  const n = newLines.length;

  // For very large files, fall back to simple line-by-line to avoid memory issues
  if (m * n > 500_000) {
    return simpleDiff(oldLines, newLines);
  }

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to produce diff
  const result: DiffLine[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.push({ type: "same", text: oldLines[i - 1], lineNum: j });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ type: "add", text: newLines[j - 1], lineNum: j });
      j--;
    } else {
      result.push({ type: "remove", text: oldLines[i - 1], lineNum: i });
      i--;
    }
  }

  return result.reverse();
}

function simpleDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  const result: DiffLine[] = [];
  const maxLen = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLen; i++) {
    const o = oldLines[i];
    const c = newLines[i];
    if (o === c) {
      result.push({ type: "same", text: c ?? "", lineNum: i + 1 });
    } else {
      if (o !== undefined) result.push({ type: "remove", text: o, lineNum: i + 1 });
      if (c !== undefined) result.push({ type: "add", text: c, lineNum: i + 1 });
    }
  }
  return result;
}

// #endregion

function DiffView({ original, current }: { original: string; current: string }) {
  const { t } = useTranslation();
  const origLines = original.split("\n");
  const currLines = current.split("\n");

  const diff = useMemo(() => computeDiff(origLines, currLines), [original, current]);

  const hasChanges = diff.some((l) => l.type !== "same");

  if (!hasChanges) {
    return (
      <div className="diff-view">
        <div className="diff-no-changes">{t("export.noChanges")}</div>
      </div>
    );
  }

  // Show changed lines with context (3 lines around each change)
  const CONTEXT = 3;
  const changedIndices = new Set<number>();
  diff.forEach((line, i) => {
    if (line.type !== "same") {
      for (let c = Math.max(0, i - CONTEXT); c <= Math.min(diff.length - 1, i + CONTEXT); c++) {
        changedIndices.add(c);
      }
    }
  });

  const visibleLines: (DiffLine | "separator")[] = [];
  let lastShown = -1;
  for (let i = 0; i < diff.length; i++) {
    if (!changedIndices.has(i)) continue;
    if (lastShown !== -1 && i - lastShown > 1) {
      visibleLines.push("separator");
    }
    visibleLines.push(diff[i]);
    lastShown = i;
  }

  return (
    <div className="diff-view">
      <pre className="json-preview">
        {visibleLines.map((entry, i) => {
          if (entry === "separator") {
            return <div key={i} className="diff-line diff-separator">...</div>;
          }
          const indicator = entry.type === "add" ? "+" : entry.type === "remove" ? "-" : " ";
          return (
            <div key={i} className={`diff-line diff-${entry.type}`}>
              <span className="diff-indicator">{indicator}</span>
              {entry.text}
            </div>
          );
        })}
      </pre>
    </div>
  );
}
