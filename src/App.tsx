import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import "./App.css";
import type { MissionBundle, Mission } from "./types/mission";
import {
  openBundleFile, saveBundleFile, saveBundleFileAs,
  createEmptyBundle, createEmptyMission,
  getRecentFiles, loadBundleFromPath, importFromGameFolder,
  saveAutoSaveData, loadAutoSaveData, clearAutoSaveData,
} from "./utils/files";
import { useHistory } from "./utils/history";
import { validateBundle, type ValidationWarning } from "./utils/validation";
import { getStoredTheme, setStoredTheme, applyTheme, type Theme } from "./utils/theme";
import { loadSettings, saveSettings, type EditorSettings } from "./utils/settings";
import { Sidebar } from "./components/Sidebar";
import { BundleEditor } from "./components/BundleEditor";
import { MissionEditor } from "./components/MissionEditor";
import { ValidationPanel } from "./components/ValidationPanel";
import { FlowGraph } from "./components/FlowGraph";
import { ExportPreview } from "./components/ExportPreview";
import { TemplateDialog } from "./components/TemplateDialog";
import { SettingsDialog } from "./components/SettingsDialog";

interface LoadedBundle {
  bundle: MissionBundle;
  path?: string;
  dirty: boolean;
  originalJson?: string;
}

type BottomTab = "validation" | "flow" | null;

function App() {
  const [bundles, setBundles] = useState<LoadedBundle[]>([]);
  const [selectedBundle, setSelectedBundle] = useState(0);
  const [selectedMission, setSelectedMission] = useState(0);
  const [bottomTab, setBottomTab] = useState<BottomTab>(null);
  const [showExport, setShowExport] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setThemeState] = useState<Theme>(getStoredTheme());
  const [recentFiles, setRecentFiles] = useState<string[]>(getRecentFiles());
  const [settings, setSettingsState] = useState<EditorSettings>(loadSettings);

  // Undo/redo for bundle state
  const {
    state: undoState,
    set: pushUndoState,
    undo,
    redo,
    reset: resetUndo,
    canUndo,
    canRedo,
  } = useHistory<LoadedBundle[]>([]);

  // Sync undo state to bundles (only when undo/redo navigates)
  const undoStateRef = useRef(undoState);
  useEffect(() => {
    if (undoState !== undoStateRef.current) {
      undoStateRef.current = undoState;
      if (undoState.length > 0) {
        setBundles(undoState);
      }
    }
  }, [undoState]);

  // Apply theme on mount
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    setStoredTheme(next);
    applyTheme(next);
  }

  function updateSettings(updated: EditorSettings) {
    setSettingsState(updated);
    saveSettings(updated);
  }

  // Auto-save at the configured interval
  useEffect(() => {
    if (!settings.autoSaveEnabled) return;
    const interval = setInterval(() => {
      if (bundles.some((b) => b.dirty)) {
        saveAutoSaveData({
          bundles: bundles.map((b) => ({ bundle: b.bundle, path: b.path })),
        });
      }
    }, settings.autoSaveInterval * 1000);
    return () => clearInterval(interval);
  }, [bundles, settings.autoSaveEnabled, settings.autoSaveInterval]);

  // Recover auto-save on mount
  useEffect(() => {
    const saved = loadAutoSaveData();
    if (saved && saved.bundles.length > 0 && bundles.length === 0) {
      const recovered = saved.bundles.map((b) => ({
        bundle: b.bundle,
        path: b.path,
        dirty: true,
        originalJson: undefined,
      }));
      setBundles(recovered);
      resetUndo(recovered);
    }
  }, []);

  const current = bundles[selectedBundle];
  const mission = current?.bundle.missions[selectedMission];

  // Validation
  const warnings = useMemo<ValidationWarning[]>(
    () => current ? validateBundle(current.bundle) : [],
    [current?.bundle]
  );

  // Duplicate ID detection for sidebar
  const duplicateIds = useMemo(() => {
    if (!current) return new Set<number>();
    const seen = new Set<number>();
    const dupes = new Set<number>();
    for (const m of current.bundle.missions) {
      if (seen.has(m.id)) dupes.add(m.id);
      seen.add(m.id);
    }
    return dupes;
  }, [current?.bundle]);

  function setBundlesWithUndo(updater: (prev: LoadedBundle[]) => LoadedBundle[], immediate = false) {
    setBundles((prev) => {
      const next = updater(prev);
      pushUndoState(next, immediate);
      return next;
    });
  }

  const updateBundle = useCallback((updated: MissionBundle) => {
    setBundlesWithUndo((prev) => {
      const next = [...prev];
      next[selectedBundle] = { ...next[selectedBundle], bundle: updated, dirty: true };
      return next;
    });
  }, [selectedBundle]);

  const updateMission = useCallback((updated: Mission) => {
    setBundlesWithUndo((prev) => {
      const next = [...prev];
      const bundle = { ...next[selectedBundle].bundle };
      bundle.missions = [...bundle.missions];
      bundle.missions[selectedMission] = updated;
      next[selectedBundle] = { ...next[selectedBundle], bundle, dirty: true };
      return next;
    });
  }, [selectedBundle, selectedMission]);

  // #region File Operations

  async function handleOpen() {
    try {
      const result = await openBundleFile();
      if (!result) return;
      const entry: LoadedBundle = {
        bundle: result.bundle,
        path: result.path,
        dirty: false,
        originalJson: JSON.stringify(result.bundle, null, 2),
      };
      setBundlesWithUndo((prev) => {
        setSelectedBundle(prev.length);
        return [...prev, entry];
      }, true);
      setSelectedMission(0);
      setRecentFiles(getRecentFiles());
    } catch (err) {
      console.error("Failed to open file:", err);
    }
  }

  async function handleOpenRecent(path: string) {
    try {
      const result = await loadBundleFromPath(path);
      const entry: LoadedBundle = {
        bundle: result.bundle,
        path: result.path,
        dirty: false,
        originalJson: JSON.stringify(result.bundle, null, 2),
      };
      setBundlesWithUndo((prev) => {
        setSelectedBundle(prev.length);
        return [...prev, entry];
      }, true);
      setSelectedMission(0);
      setRecentFiles(getRecentFiles());
    } catch (err) {
      console.error("Failed to open recent file:", err);
    }
  }

  async function handleImport() {
    try {
      const results = await importFromGameFolder();
      if (!results) return;
      const entries = results.map((r) => ({
        bundle: r.bundle,
        path: r.path,
        dirty: false,
        originalJson: JSON.stringify(r.bundle, null, 2),
      }));
      setBundlesWithUndo((prev) => {
        setSelectedBundle(prev.length);
        return [...prev, ...entries];
      }, true);
      setSelectedMission(0);
    } catch (err) {
      console.error("Failed to import:", err);
    }
  }

  function handleNew() {
    setBundlesWithUndo((prev) => {
      setSelectedBundle(prev.length);
      return [...prev, { bundle: createEmptyBundle(), dirty: true }];
    }, true);
    setSelectedMission(0);
  }

  async function handleSave() {
    if (!current) return;
    try {
      const path = await saveBundleFile(current.bundle, current.path);
      if (path) {
        const json = JSON.stringify(current.bundle, null, 2);
        setBundles((prev) => {
          const next = [...prev];
          next[selectedBundle] = { ...next[selectedBundle], path, dirty: false, originalJson: json };
          return next;
        });
        clearAutoSaveData();
        setRecentFiles(getRecentFiles());
      }
    } catch (err) {
      console.error("Failed to save file:", err);
    }
  }

  async function handleSaveAs() {
    if (!current) return;
    try {
      const path = await saveBundleFileAs(current.bundle);
      if (path) {
        const json = JSON.stringify(current.bundle, null, 2);
        setBundles((prev) => {
          const next = [...prev];
          next[selectedBundle] = { ...next[selectedBundle], path, dirty: false, originalJson: json };
          return next;
        });
        setRecentFiles(getRecentFiles());
      }
    } catch (err) {
      console.error("Failed to save file:", err);
    }
  }

  function handleCloseBundle() {
    if (!current) return;
    setBundlesWithUndo((prev) => prev.filter((_, i) => i !== selectedBundle), true);
    setSelectedBundle(Math.max(0, selectedBundle - 1));
    setSelectedMission(0);
  }

  // #endregion

  // #region Mission Operations

  function handleAddMission() {
    if (!current) return;
    const maxId = current.bundle.missions.reduce((max, m) => Math.max(max, m.id), -1);
    const newMission = createEmptyMission(maxId + 1);
    const updated = { ...current.bundle, missions: [...current.bundle.missions, newMission] };
    updateBundle(updated);
    setSelectedMission(updated.missions.length - 1);
  }

  function handleAddFromTemplate(mission: Mission) {
    if (!current) return;
    const updated = { ...current.bundle, missions: [...current.bundle.missions, mission] };
    updateBundle(updated);
    setSelectedMission(updated.missions.length - 1);
  }

  function handleDeleteMission(index: number) {
    if (!current) return;
    const updated = {
      ...current.bundle,
      missions: current.bundle.missions.filter((_, i) => i !== index),
    };
    updateBundle(updated);
    if (selectedMission >= updated.missions.length) {
      setSelectedMission(Math.max(0, updated.missions.length - 1));
    }
  }

  function handleMoveMission(fromIndex: number, toIndex: number) {
    if (!current) return;
    const missions = [...current.bundle.missions];
    const [moved] = missions.splice(fromIndex, 1);
    missions.splice(toIndex, 0, moved);
    updateBundle({ ...current.bundle, missions });
    setSelectedMission(toIndex);
  }

  function handleCopyMission(mission: Mission, targetBundleIndex: number) {
    setBundlesWithUndo((prev) => {
      const next = [...prev];
      const target = { ...next[targetBundleIndex] };
      target.bundle = { ...target.bundle, missions: [...target.bundle.missions, { ...mission }] };
      target.dirty = true;
      next[targetBundleIndex] = target;
      return next;
    }, true);
  }

  function handleSelectBundle(index: number) {
    setSelectedBundle(index);
    setSelectedMission(0);
  }

  // #endregion

  // #region Keyboard Shortcuts

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === "s") {
        e.preventDefault();
        if (e.shiftKey) handleSaveAs();
        else handleSave();
      } else if (ctrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (ctrl && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if (ctrl && e.key === "n") {
        e.preventDefault();
        handleNew();
      } else if (ctrl && e.key === "o") {
        e.preventDefault();
        handleOpen();
      } else if (e.key === "Delete" && e.target === document.body) {
        if (current && selectedMission >= 0) {
          handleDeleteMission(selectedMission);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [current, selectedMission, selectedBundle]);

  // #endregion

  const bundleList = bundles.map((b) => b.bundle);
  const nextId = current
    ? current.bundle.missions.reduce((max, m) => Math.max(max, m.id), -1) + 1
    : 0;

  return (
    <div className="app">
      {/* Toolbar */}
      <div className="toolbar">
        <span className="toolbar-title">
          Mission Editor
          {current?.path && <span className="toolbar-path">{current.path}</span>}
          {current?.dirty && <span style={{ color: "var(--warning)", marginLeft: 6 }}>*</span>}
        </span>
        <button onClick={handleNew} title="Ctrl+N">New</button>
        <button onClick={handleOpen} title="Ctrl+O">Open</button>
        <button onClick={handleImport} title="Import from game folder">Import</button>
        <button onClick={handleSave} disabled={!current} className={current ? "primary" : ""} title="Ctrl+S">
          Save
        </button>
        <button onClick={handleSaveAs} disabled={!current} title="Ctrl+Shift+S">Save As</button>
        <button onClick={() => setShowExport(true)} disabled={!current}>Preview</button>
        <span className="toolbar-sep" />
        <button onClick={undo} disabled={!canUndo} title="Ctrl+Z">Undo</button>
        <button onClick={redo} disabled={!canRedo} title="Ctrl+Y">Redo</button>
        <span className="toolbar-sep" />
        <button onClick={toggleTheme} title="Toggle theme">{theme === "dark" ? "Light" : "Dark"}</button>
        <button onClick={() => setShowSettings(true)} title="Settings">Settings</button>
        <button onClick={handleCloseBundle} disabled={!current} className="danger">Close</button>

        {/* Recent files dropdown */}
        {recentFiles.length > 0 && (
          <div className="recent-dropdown">
            <button className="small">Recent</button>
            <div className="recent-menu">
              {recentFiles.map((path, i) => (
                <div key={i} className="recent-item" onClick={() => handleOpenRecent(path)}>
                  {path.split(/[/\\]/).pop()}
                  <span className="recent-path">{path}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="main-layout">
        <Sidebar
          bundles={bundleList}
          selectedBundle={selectedBundle}
          selectedMission={selectedMission}
          duplicateIds={duplicateIds}
          onSelectBundle={handleSelectBundle}
          onSelectMission={setSelectedMission}
          onAddMission={handleAddMission}
          onAddFromTemplate={() => setShowTemplateDialog(true)}
          onDeleteMission={handleDeleteMission}
          onMoveMission={handleMoveMission}
          onCopyMission={handleCopyMission}
        />

        <div className="editor-area">
          {current ? (
            <div className="editor-panel">
              <BundleEditor bundle={current.bundle} onChange={updateBundle} />
              {mission ? (
                <MissionEditor mission={mission} onChange={updateMission} />
              ) : (
                <div className="editor-empty">
                  Select a mission from the sidebar or add a new one.
                </div>
              )}
            </div>
          ) : (
            <div className="editor-panel">
              <div className="editor-empty">
                Open a mission bundle JSON file or create a new one to get started.
              </div>
            </div>
          )}

          {/* Bottom Panel */}
          {current && (
            <div className="bottom-bar">
              <div className="bottom-tabs">
                <button
                  className={`small ${bottomTab === "validation" ? "primary" : ""}`}
                  onClick={() => setBottomTab(bottomTab === "validation" ? null : "validation")}
                >
                  Issues {warnings.length > 0 && `(${warnings.length})`}
                </button>
                <button
                  className={`small ${bottomTab === "flow" ? "primary" : ""}`}
                  onClick={() => setBottomTab(bottomTab === "flow" ? null : "flow")}
                >
                  Flow Graph
                </button>
              </div>

              {bottomTab === "validation" && (
                <ValidationPanel
                  warnings={warnings}
                  onNavigate={(mi) => setSelectedMission(mi)}
                />
              )}
              {bottomTab === "flow" && (
                <FlowGraph
                  bundle={current.bundle}
                  selectedMission={selectedMission}
                  onSelectMission={setSelectedMission}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showExport && current && (
        <ExportPreview
          bundle={current.bundle}
          originalJson={current.originalJson}
          onClose={() => setShowExport(false)}
        />
      )}
      {showTemplateDialog && current && (
        <TemplateDialog
          nextId={nextId}
          onSelect={handleAddFromTemplate}
          onClose={() => setShowTemplateDialog(false)}
        />
      )}
      {showSettings && (
        <SettingsDialog
          settings={settings}
          onChange={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
