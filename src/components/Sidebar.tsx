import type { MissionBundle } from "../types/mission";

interface SidebarProps {
  bundles: MissionBundle[];
  selectedBundle: number;
  selectedMission: number;
  onSelectBundle: (index: number) => void;
  onSelectMission: (index: number) => void;
  onAddMission: () => void;
  onDeleteMission: (index: number) => void;
}

export function Sidebar({
  bundles,
  selectedBundle,
  selectedMission,
  onSelectBundle,
  onSelectMission,
  onAddMission,
  onDeleteMission,
}: SidebarProps) {
  const bundle = bundles[selectedBundle];
  const missions = bundle?.missions ?? [];

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
            </div>
          ))}
          {bundles.length === 0 && (
            <div style={{ padding: "12px", color: "var(--text-muted)", fontSize: "12px" }}>
              No bundles loaded. Open a JSON file or create a new bundle.
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-header">
          <span>Missions</span>
          {bundle && (
            <button className="small" onClick={onAddMission}>+ Add</button>
          )}
        </div>
        <div className="sidebar-list">
          {missions.map((m, i) => (
            <div
              key={i}
              className={`sidebar-item ${i === selectedMission ? "selected" : ""}`}
              onClick={() => onSelectMission(i)}
            >
              <span className="sidebar-item-id">#{m.id}</span>
              <span className="sidebar-item-name">
                {m.title?.[0] || `Mission ${m.id}`}
              </span>
              <button
                className="small danger"
                onClick={(e) => { e.stopPropagation(); onDeleteMission(i); }}
                title="Delete mission"
              >
                x
              </button>
            </div>
          ))}
          {bundle && missions.length === 0 && (
            <div style={{ padding: "12px", color: "var(--text-muted)", fontSize: "12px" }}>
              No missions yet. Click "+ Add" to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
