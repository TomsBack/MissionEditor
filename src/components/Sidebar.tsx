import { useState } from "react";
import type { MissionBundle, Mission } from "../types/mission";

interface SidebarProps {
  bundles: MissionBundle[];
  selectedBundle: number;
  selectedMission: number;
  duplicateIds: Set<number>;
  onSelectBundle: (index: number) => void;
  onSelectMission: (index: number) => void;
  onAddMission: () => void;
  onAddFromTemplate: () => void;
  onDeleteMission: (index: number) => void;
  onMoveMission: (fromIndex: number, toIndex: number) => void;
  onCopyMission: (mission: Mission, targetBundleIndex: number) => void;
}

export function Sidebar({
  bundles,
  selectedBundle,
  selectedMission,
  duplicateIds,
  onSelectBundle,
  onSelectMission,
  onAddMission,
  onAddFromTemplate,
  onDeleteMission,
  onMoveMission,
  onCopyMission,
}: SidebarProps) {
  const [search, setSearch] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const bundle = bundles[selectedBundle];
  const missions = bundle?.missions ?? [];

  const filtered = search
    ? missions.map((m, i) => ({ m, i })).filter(({ m }) => {
        const q = search.toLowerCase();
        return (
          m.id.toString().includes(q) ||
          (m.title?.[0] ?? "").toLowerCase().includes(q)
        );
      })
    : missions.map((m, i) => ({ m, i }));

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDropIndex(index);
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex !== null && dragIndex !== targetIndex) {
      onMoveMission(dragIndex, targetIndex);
    }
    setDragIndex(null);
    setDropIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setDropIndex(null);
  }

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-header">
          <span>Bundles</span>
        </div>
        <div className="sidebar-list">
          {bundles.map((b, i) => (
            <div
              key={i}
              className={`sidebar-item ${i === selectedBundle ? "selected" : ""}`}
              onClick={() => onSelectBundle(i)}
            >
              <span className="sidebar-item-name">{b.name || "Untitled"}</span>
              <span className="sidebar-item-count">{b.missions.length}</span>
            </div>
          ))}
          {bundles.length === 0 && (
            <div className="sidebar-empty">
              No bundles loaded. Open a JSON file or create a new bundle.
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-header">
          <span>Missions</span>
          {bundle && (
            <div style={{ display: "flex", gap: 3 }}>
              <button className="small" onClick={onAddMission}>+</button>
              <button className="small" onClick={onAddFromTemplate} title="From template">T</button>
            </div>
          )}
        </div>

        {bundle && missions.length > 5 && (
          <div className="sidebar-search">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search missions..."
            />
          </div>
        )}

        <div className="sidebar-list">
          {filtered.map(({ m, i }) => (
            <div
              key={i}
              className={`sidebar-item ${i === selectedMission ? "selected" : ""} ${dropIndex === i ? "drop-target" : ""}`}
              onClick={() => onSelectMission(i)}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={() => handleDrop(i)}
              onDragEnd={handleDragEnd}
            >
              <span className={`sidebar-item-id ${duplicateIds.has(m.id) ? "duplicate" : ""}`}>
                #{m.id}
              </span>
              <span className="sidebar-item-name">
                {m.title?.[0] || `Mission ${m.id}`}
              </span>
              {bundles.length > 1 && (
                <select
                  className="copy-select"
                  value=""
                  onChange={(e) => {
                    const idx = parseInt(e.target.value);
                    if (!isNaN(idx)) onCopyMission(m, idx);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  title="Copy to bundle"
                >
                  <option value="" disabled>CP</option>
                  {bundles.map((b, bi) => bi !== selectedBundle && (
                    <option key={bi} value={bi}>{b.name || `Bundle ${bi}`}</option>
                  ))}
                </select>
              )}
              <button
                className="small danger"
                onClick={(e) => { e.stopPropagation(); onDeleteMission(i); }}
                title="Delete"
              >
                x
              </button>
            </div>
          ))}
          {bundle && missions.length === 0 && (
            <div className="sidebar-empty">
              No missions yet. Click "+" to create one.
            </div>
          )}
          {bundle && search && filtered.length === 0 && (
            <div className="sidebar-empty">No missions matching "{search}"</div>
          )}
        </div>
      </div>
    </div>
  );
}
