import { useState } from "react";
import type { MissionBundle } from "../types/mission";

interface ExportPreviewProps {
  bundle: MissionBundle;
  originalJson?: string;
  onClose: () => void;
}

export function ExportPreview({ bundle, originalJson, onClose }: ExportPreviewProps) {
  const [tab, setTab] = useState<"preview" | "diff">(originalJson ? "diff" : "preview");
  const currentJson = JSON.stringify(bundle, null, 2);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>Export Preview</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              className={`small ${tab === "preview" ? "primary" : ""}`}
              onClick={() => setTab("preview")}
            >
              Preview
            </button>
            {originalJson && (
              <button
                className={`small ${tab === "diff" ? "primary" : ""}`}
                onClick={() => setTab("diff")}
              >
                Diff
              </button>
            )}
            <button className="small" onClick={onClose}>Close</button>
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

function DiffView({ original, current }: { original: string; current: string }) {
  const origLines = original.split("\n");
  const currLines = current.split("\n");
  const maxLen = Math.max(origLines.length, currLines.length);

  // Simple line-by-line diff
  const lines: { type: "same" | "add" | "remove" | "change"; line: string; lineNum: number }[] = [];

  for (let i = 0; i < maxLen; i++) {
    const o = origLines[i];
    const c = currLines[i];
    if (o === c) {
      lines.push({ type: "same", line: c ?? "", lineNum: i + 1 });
    } else if (o === undefined) {
      lines.push({ type: "add", line: c, lineNum: i + 1 });
    } else if (c === undefined) {
      lines.push({ type: "remove", line: o, lineNum: i + 1 });
    } else {
      lines.push({ type: "remove", line: o, lineNum: i + 1 });
      lines.push({ type: "add", line: c, lineNum: i + 1 });
    }
  }

  const changedLines = lines.filter((l) => l.type !== "same");

  return (
    <div className="diff-view">
      {changedLines.length === 0 ? (
        <div className="diff-no-changes">No changes from saved version</div>
      ) : (
        <pre className="json-preview">
          {lines
            .filter((l) => l.type !== "same")
            .map((l, i) => (
              <div key={i} className={`diff-line diff-${l.type}`}>
                <span className="diff-indicator">{l.type === "add" ? "+" : l.type === "remove" ? "-" : " "}</span>
                {l.line}
              </div>
            ))}
        </pre>
      )}
    </div>
  );
}
