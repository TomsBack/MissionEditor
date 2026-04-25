import { useState } from "react";
import type { MissionBundle, Mission } from "../types/mission";
import { useTranslation } from "react-i18next";
import { translate } from "../utils/translations";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { IconDuplicate, IconTrash } from "./Icons";

interface SidebarProps {
  bundles: MissionBundle[];
  selectedBundle: number;
  selectedMission: number;
  duplicateIds: Set<number>;
  dirtyBundles: boolean[];
  /** Mission IDs that have unsaved edits in the current bundle. */
  editedMissionIds?: Set<number>;
  resolveTranslatedTitles?: boolean;
  showMissionIds?: boolean;
  onSelectBundle: (index: number) => void;
  onSelectMission: (index: number) => void;
  onAddMission: () => void;
  onAddFromTemplate: () => void;
  onCloseBundle: (index: number) => void;
  onDeleteMission: (index: number) => void;
  onMoveMission: (fromIndex: number, toIndex: number) => void;
  onCopyMission: (mission: Mission, targetBundleIndex: number) => void;
  onDuplicateMission: (index: number) => void;
}

function getMissionTitle(m: Mission, fallback: string, resolve: boolean): string {
  const raw = m.title?.[0];
  if (!raw) return fallback;
  if (resolve && m.translated) {
    return translate(raw) ?? raw;
  }
  return raw;
}

function getMissionSubtitle(m: Mission, resolve: boolean): string | null {
  const raw = m.subtitle?.[0];
  if (!raw) return null;
  if (resolve && m.translated) {
    return translate(raw) ?? raw;
  }
  return raw;
}

// #region Sortable Mission Item

interface SortableMissionProps {
  mission: Mission;
  index: number;
  isSelected: boolean;
  isDuplicate: boolean;
  isEdited: boolean;
  resolveTranslatedTitles: boolean;
  showMissionIds: boolean;
  showCopySelect: boolean;
  bundles: MissionBundle[];
  selectedBundle: number;
  fallbackTitle: string;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onCopy: (mission: Mission, targetBundleIndex: number) => void;
}

function SortableMissionItem({
  mission, index, isSelected, isDuplicate, isEdited, resolveTranslatedTitles,
  showMissionIds, showCopySelect, bundles, selectedBundle, fallbackTitle,
  onSelect, onDelete, onDuplicate, onCopy,
}: SortableMissionProps) {
  const { t } = useTranslation();
  const { ref, isDragSource } = useSortable({ id: `mission-${index}`, index });
  const subtitle = getMissionSubtitle(mission, resolveTranslatedTitles);

  return (
    <div
      ref={ref}
      className={`sidebar-item${isSelected ? " selected" : ""}${isDragSource ? " dragging" : ""}`}
      onClick={onSelect}
    >
      {showMissionIds && (
        <span className={`sidebar-item-id ${isDuplicate ? "duplicate" : ""}`}>
          #{mission.id}
        </span>
      )}
      <span className="sidebar-item-text">
        <span className="sidebar-item-name">
          {isEdited && <span className="dirty-dot" title={t("sidebar.edited")} />}
          {getMissionTitle(mission, fallbackTitle, resolveTranslatedTitles)}
        </span>
        {subtitle && (
          <span className="sidebar-item-subtitle">{subtitle}</span>
        )}
      </span>
      {showCopySelect && (
        <select
          className="copy-select"
          value=""
          onChange={(e) => {
            const idx = parseInt(e.target.value);
            if (!isNaN(idx)) onCopy(mission, idx);
          }}
          onClick={(e) => e.stopPropagation()}
          title={t("sidebar.copyToBundle")}
        >
          <option value="" disabled>CP</option>
          {bundles.map((b, bi) => bi !== selectedBundle && (
            <option key={bi} value={bi}>{b.name || `Bundle ${bi}`}</option>
          ))}
        </select>
      )}
      <button
        className="small"
        onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
        title={t("sidebar.duplicate")}
      >
        <IconDuplicate size={11} />
      </button>
      <button
        className="small danger"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title={t("sidebar.delete")}
      >
        <IconTrash size={11} />
      </button>
    </div>
  );
}

// #endregion

export function Sidebar({
  bundles,
  selectedBundle,
  selectedMission,
  duplicateIds,
  dirtyBundles,
  editedMissionIds,
  resolveTranslatedTitles = false,
  showMissionIds = true,
  onSelectBundle,
  onSelectMission,
  onAddMission,
  onAddFromTemplate,
  onCloseBundle,
  onDeleteMission,
  onMoveMission,
  onCopyMission,
  onDuplicateMission,
}: SidebarProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const bundle = bundles[selectedBundle];
  const missions = bundle?.missions ?? [];

  const filtered = search
    ? missions.map((m, i) => ({ m, i })).filter(({ m }) => {
        const q = search.toLowerCase();
        const title = getMissionTitle(m, "", resolveTranslatedTitles);
        const subtitle = getMissionSubtitle(m, resolveTranslatedTitles) ?? "";
        const desc = m.description?.[0] ?? "";
        const resolvedDesc = resolveTranslatedTitles && m.translated
          ? (translate(desc) ?? desc)
          : desc;
        return (
          m.id.toString().includes(q) ||
          title.toLowerCase().includes(q) ||
          subtitle.toLowerCase().includes(q) ||
          resolvedDesc.toLowerCase().includes(q)
        );
      })
    : missions.map((m, i) => ({ m, i }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleDragEnd(event: any) {
    const { source, target } = event.operation;
    if (!source?.sortable || !target?.sortable) return;
    const from = source.sortable.index;
    const to = target.sortable.index;
    if (from !== to) {
      onMoveMission(from, to);
    }
  }

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-header">
          <span>{t("sidebar.bundles")}</span>
        </div>
        <div className="sidebar-list">
          {bundles.map((b, i) => (
            <div
              key={i}
              className={`sidebar-item ${i === selectedBundle ? "selected" : ""}`}
              onClick={() => onSelectBundle(i)}
            >
              <span className="sidebar-item-name">
                {dirtyBundles[i] && <span className="dirty-dot" />}
                {b.name || t("sidebar.untitled")}
              </span>
              <span className="sidebar-item-count">{b.missions.length}</span>
              <button
                className="small danger"
                onClick={(e) => { e.stopPropagation(); onCloseBundle(i); }}
                title={t("sidebar.closeBundle")}
              >
                <IconTrash size={11} />
              </button>
            </div>
          ))}
          {bundles.length === 0 && (
            <div className="sidebar-empty">
              {t("sidebar.noBundles")}
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-header">
          <span>{t("sidebar.missions")}</span>
          {bundle && (
            <div style={{ display: "flex", gap: 3 }}>
              <button className="small" onClick={onAddMission}>+</button>
              <button className="small" onClick={onAddFromTemplate} title={t("sidebar.fromTemplate")}>T</button>
            </div>
          )}
        </div>

        {bundle && missions.length > 5 && (
          <div className="sidebar-search">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("sidebar.search")}
            />
          </div>
        )}

        <DragDropProvider onDragEnd={handleDragEnd}>
          <div className="sidebar-list">
            {filtered.map(({ m, i }) => (
              <SortableMissionItem
                key={`${selectedBundle}-${i}`}
                mission={m}
                index={i}
                isSelected={i === selectedMission}
                isDuplicate={duplicateIds.has(m.id)}
                isEdited={editedMissionIds?.has(m.id) ?? false}
                resolveTranslatedTitles={resolveTranslatedTitles}
                showMissionIds={showMissionIds}
                showCopySelect={bundles.length > 1}
                bundles={bundles}
                selectedBundle={selectedBundle}
                fallbackTitle={`${t("mission.title")} ${m.id}`}
                onSelect={() => onSelectMission(i)}
                onDelete={() => onDeleteMission(i)}
                onDuplicate={() => onDuplicateMission(i)}
                onCopy={onCopyMission}
              />
            ))}
            {bundle && missions.length === 0 && (
              <div className="sidebar-empty">
                {t("sidebar.noMissions")}
              </div>
            )}
            {bundle && search && filtered.length === 0 && (
              <div className="sidebar-empty">{t("sidebar.noResults", { query: search })}</div>
            )}
          </div>
        </DragDropProvider>
      </div>
    </div>
  );
}
