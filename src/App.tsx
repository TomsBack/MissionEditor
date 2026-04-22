import { useState, useCallback, useEffect, useMemo, useRef } from "react";
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
import { applyTheme } from "./utils/theme";
import { loadSettings, saveSettings, type EditorSettings } from "./utils/settings";
import { loadLanguage, onLanguageChange } from "./utils/translations";
import { useTranslation } from "react-i18next";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { confirm as tauriConfirm } from "@tauri-apps/plugin-dialog";
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from "react-resizable-panels";
import { Sidebar } from "./components/Sidebar";
import { BundleEditor } from "./components/BundleEditor";
import { MissionEditor } from "./components/MissionEditor";
import { ValidationPanel } from "./components/ValidationPanel";
import { FlowGraph } from "./components/FlowGraph";
import { ExportPreview } from "./components/ExportPreview";
import { TemplateDialog } from "./components/TemplateDialog";
import { SettingsDialog } from "./components/SettingsDialog";
import { UpdateDialog } from "./components/UpdateDialog";
import { checkForUpdate, type UpdateInfo } from "./utils/updater";
import type { Update } from "@tauri-apps/plugin-updater";
import {
  IconNew, IconOpen, IconImport, IconSave, IconSaveAs, IconPreview,
  IconUndo, IconRedo, IconSettings, IconRecent,
} from "./components/Icons";

interface LoadedBundle {
  bundle: MissionBundle;
  path?: string;
  dirty: boolean;
  originalJson?: string;
}

type BottomTab = "validation" | "flow" | null;
type ToastMessage = { text: string; type: "error" | "success" };

function App() {
  const { t, i18n } = useTranslation();

  // Undo/redo owns the bundle state (single source of truth)
  const {
    state: bundles,
    set: setBundles,
    undo,
    redo,
    reset: resetBundles,
    canUndo,
    canRedo,
  } = useHistory<LoadedBundle[]>([]);

  const [selectedBundle, setSelectedBundle] = useState(0);
  const [selectedMission, setSelectedMission] = useState(0);
  const [bottomTab, setBottomTab] = useState<BottomTab>(null);
  const [showExport, setShowExport] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [recentFiles, setRecentFiles] = useState<string[]>(getRecentFiles());
  const [settings, setSettingsState] = useState<EditorSettings>(loadSettings);
  const [pendingUpdate, setPendingUpdate] = useState<{ update: Update; info: UpdateInfo } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep a ref for use in the window close handler
  const bundlesRef = useRef(bundles);
  bundlesRef.current = bundles;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  function showToast(text: string, type: "error" | "success" = "error") {
    setToast({ text, type });
    if (toastTimer.current !== null) clearTimeout(toastTimer.current);
    if (type === "success") {
      toastTimer.current = setTimeout(() => setToast(null), 3000);
    } else {
      toastTimer.current = setTimeout(() => setToast(null), 8000);
    }
  }

  // Force re-render when mod translations load/change
  const [, setTranslationVersion] = useState(0);

  useEffect(() => {
    loadLanguage(settings.language);
    return onLanguageChange(() => setTranslationVersion((v) => v + 1));
  }, []);

  // Check for updates once on startup. Swallow failures (offline, not signed, etc).
  useEffect(() => {
    let cancelled = false;
    checkForUpdate()
      .then((result) => {
        if (!cancelled && result) setPendingUpdate(result);
      })
      .catch((err) => console.warn("update check failed", err));
    return () => { cancelled = true; };
  }, []);

  // Apply appearance settings
  useEffect(() => {
    applyTheme(settings.theme);
    document.documentElement.style.setProperty("--app-font-size", `${settings.fontSize}px`);
    document.documentElement.classList.toggle("compact", settings.compactMode);
  }, [settings.theme, settings.fontSize, settings.compactMode]);

  // Warn before closing with unsaved changes
  const closingRef = useRef(false);
  useEffect(() => {
    const unlisten = getCurrentWindow().onCloseRequested(async (event) => {
      if (closingRef.current) return;
      const hasDirty = bundlesRef.current.some((b) => b.dirty);
      if (!hasDirty) return;
      event.preventDefault();
      let confirmed: boolean;
      try {
        confirmed = await tauriConfirm(t("confirm.unsavedChanges"), {
          title: t("confirm.closeBundleTitle"),
          kind: "warning",
        });
      } catch (err) {
        // Dialog plugin failed; fall back to native confirm so the window can still close.
        console.error("close handler dialog failed", err);
        confirmed = window.confirm(t("confirm.unsavedChanges"));
      }
      if (confirmed) {
        closingRef.current = true;
        await getCurrentWindow().destroy();
      }
    });
    return () => { unlisten.then((fn) => fn()); };
  }, []);

  function updateSettings(updated: EditorSettings) {
    if (updated.language !== settings.language) {
      i18n.changeLanguage(updated.language);
      loadLanguage(updated.language);
    }
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
      resetBundles(recovered);
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

  /** Helper: apply an updater to the bundle list. `immediate` skips debouncing. */
  function updateBundles(updater: (prev: LoadedBundle[]) => LoadedBundle[], immediate = false) {
    setBundles(updater(bundles), immediate);
  }

  const updateBundle = useCallback((updated: MissionBundle) => {
    const next = [...bundles];
    next[selectedBundle] = { ...next[selectedBundle], bundle: updated, dirty: true };
    setBundles(next);
  }, [bundles, selectedBundle]);

  const updateMission = useCallback((updated: Mission) => {
    const next = [...bundles];
    const bundle = { ...next[selectedBundle].bundle };
    bundle.missions = [...bundle.missions];
    bundle.missions[selectedMission] = updated;
    next[selectedBundle] = { ...next[selectedBundle], bundle, dirty: true };
    setBundles(next);
  }, [bundles, selectedBundle, selectedMission]);

  const missionDefaults = useMemo(() => ({
    translated: settings.defaultTranslated,
    alignment: settings.defaultAlignment,
  }), [settings.defaultTranslated, settings.defaultAlignment]);

  // #region File Operations

  async function handleOpen() {
    try {
      const result = await openBundleFile();
      if (!result) return;
      const entry: LoadedBundle = {
        bundle: result.bundle,
        path: result.path,
        dirty: false,
        originalJson: JSON.stringify(result.bundle, null, settings.jsonIndent),
      };
      setSelectedBundle(bundles.length);
      updateBundles((prev) => [...prev, entry], true);
      setSelectedMission(0);
      setRecentFiles(getRecentFiles());
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err), "error");
    }
  }

  async function handleOpenRecent(path: string) {
    try {
      const result = await loadBundleFromPath(path);
      const entry: LoadedBundle = {
        bundle: result.bundle,
        path: result.path,
        dirty: false,
        originalJson: JSON.stringify(result.bundle, null, settings.jsonIndent),
      };
      setSelectedBundle(bundles.length);
      updateBundles((prev) => [...prev, entry], true);
      setSelectedMission(0);
      setRecentFiles(getRecentFiles());
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err), "error");
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
        originalJson: JSON.stringify(r.bundle, null, settings.jsonIndent),
      }));
      setSelectedBundle(bundles.length);
      updateBundles((prev) => [...prev, ...entries], true);
      setSelectedMission(0);
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err), "error");
    }
  }

  function handleNew() {
    setSelectedBundle(bundles.length);
    updateBundles((prev) => [...prev, { bundle: createEmptyBundle(), dirty: true }], true);
    setSelectedMission(0);
  }

  async function handleSave() {
    if (!current) return;
    try {
      const path = await saveBundleFile(current.bundle, current.path, settings.jsonIndent);
      if (path) {
        const json = JSON.stringify(current.bundle, null, settings.jsonIndent);
        const next = [...bundles];
        next[selectedBundle] = { ...next[selectedBundle], path, dirty: false, originalJson: json };
        setBundles(next, true);
        clearAutoSaveData();
        setRecentFiles(getRecentFiles());
        showToast(t("toast.saved", { path: path.split(/[/\\]/).pop() }), "success");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err), "error");
    }
  }

  async function handleSaveAs() {
    if (!current) return;
    try {
      const path = await saveBundleFileAs(current.bundle, settings.jsonIndent);
      if (path) {
        const json = JSON.stringify(current.bundle, null, settings.jsonIndent);
        const next = [...bundles];
        next[selectedBundle] = { ...next[selectedBundle], path, dirty: false, originalJson: json };
        setBundles(next, true);
        setRecentFiles(getRecentFiles());
        showToast(t("toast.saved", { path: path.split(/[/\\]/).pop() }), "success");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err), "error");
    }
  }

  function handleCloseBundle(index?: number) {
    const idx = index ?? selectedBundle;
    if (!bundles[idx]) return;

    if (bundles[idx].dirty) {
      if (!window.confirm(t("confirm.closeBundle"))) return;
    }

    const remaining = bundles.length - 1;
    updateBundles((prev) => prev.filter((_, i) => i !== idx), true);
    if (idx < selectedBundle) {
      setSelectedBundle(selectedBundle - 1);
    } else if (idx === selectedBundle) {
      setSelectedBundle(Math.min(idx, remaining - 1));
      setSelectedMission(0);
    }
  }

  // #endregion

  // #region Mission Operations

  function handleAddMission() {
    if (!current) return;
    const maxId = current.bundle.missions.reduce((max, m) => Math.max(max, m.id), -1);
    const newMission = createEmptyMission(maxId + 1, missionDefaults);
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
    if (settings.confirmBeforeDelete) {
      const m = current.bundle.missions[index];
      if (!window.confirm(t("confirm.deleteMission", { id: m?.id ?? index }))) return;
    }
    const updated = {
      ...current.bundle,
      missions: current.bundle.missions.filter((_, i) => i !== index),
    };
    updateBundle(updated);
    if (selectedMission >= updated.missions.length) {
      setSelectedMission(Math.max(0, updated.missions.length - 1));
    }
  }

  function handleDuplicateMission(index: number) {
    if (!current) return;
    const source = current.bundle.missions[index];
    if (!source) return;
    const maxId = current.bundle.missions.reduce((max, m) => Math.max(max, m.id), -1);
    const duplicate: Mission = {
      ...structuredClone(source),
      id: maxId + 1,
    };
    const missions = [...current.bundle.missions];
    missions.splice(index + 1, 0, duplicate);
    updateBundle({ ...current.bundle, missions });
    setSelectedMission(index + 1);
  }

  function handleMoveMission(fromIndex: number, toIndex: number) {
    if (!current) return;
    const missions = [...current.bundle.missions];
    const [moved] = missions.splice(fromIndex, 1);
    missions.splice(toIndex, 0, moved);
    updateBundle({ ...current.bundle, missions });
    setSelectedMission(toIndex);
  }

  const handleAddMissionFromGraph = useCallback((): Mission | undefined => {
    if (!current) return undefined;
    const maxId = current.bundle.missions.reduce((max, m) => Math.max(max, m.id), -1);
    const newMission = createEmptyMission(maxId + 1, {
      translated: settingsRef.current.defaultTranslated,
      alignment: settingsRef.current.defaultAlignment,
    });
    const updated = { ...current.bundle, missions: [...current.bundle.missions, newMission] };
    updateBundle(updated);
    setSelectedMission(updated.missions.length - 1);
    return newMission;
  }, [current, updateBundle]);

  function handleCopyMission(mission: Mission, targetBundleIndex: number) {
    const next = [...bundles];
    const target = { ...next[targetBundleIndex] };
    target.bundle = { ...target.bundle, missions: [...target.bundle.missions, { ...mission }] };
    target.dirty = true;
    next[targetBundleIndex] = target;
    setBundles(next, true);
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
      } else if (ctrl && e.key === "w") {
        e.preventDefault();
        handleCloseBundle();
      } else if (e.key === "Delete" && e.target === document.body) {
        if (current && selectedMission >= 0) {
          handleDeleteMission(selectedMission);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [current, selectedMission, selectedBundle, settings.confirmBeforeDelete]);

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
          {t("app.title")}
          {current?.path && <span className="toolbar-path">{current.path}</span>}
          {current?.dirty && <span style={{ color: "var(--warning)", marginLeft: 6 }}>*</span>}
        </span>
        <button onClick={handleNew} title="Ctrl+N"><IconNew size={14} />{t("toolbar.new")}</button>
        <button onClick={handleOpen} title="Ctrl+O"><IconOpen size={14} />{t("toolbar.open")}</button>
        <button onClick={handleImport} title={t("toolbar.importTooltip")}><IconImport size={14} />{t("toolbar.import")}</button>
        <button onClick={handleSave} disabled={!current} className={current ? "primary" : ""} title="Ctrl+S">
          <IconSave size={14} />{t("toolbar.save")}
        </button>
        <button onClick={handleSaveAs} disabled={!current} title="Ctrl+Shift+S"><IconSaveAs size={14} />{t("toolbar.saveAs")}</button>
        <button onClick={() => setShowExport(true)} disabled={!current}><IconPreview size={14} />{t("toolbar.preview")}</button>
        <span className="toolbar-sep" />
        <button onClick={undo} disabled={!canUndo} title="Ctrl+Z"><IconUndo size={14} />{t("toolbar.undo")}</button>
        <button onClick={redo} disabled={!canRedo} title="Ctrl+Y"><IconRedo size={14} />{t("toolbar.redo")}</button>
        <span className="toolbar-sep" />
        <button onClick={() => setShowSettings(true)} title={t("toolbar.settings")}><IconSettings size={14} />{t("toolbar.settings")}</button>

        {/* Recent files dropdown */}
        {recentFiles.length > 0 && (
          <div className="recent-dropdown">
            <button className="small"><IconRecent size={14} />{t("toolbar.recent")}</button>
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
      <PanelGroup orientation="horizontal" className="main-layout">
        <Panel defaultSize={30} minSize="200px" maxSize="800px" className="sidebar-panel">
          <Sidebar
            bundles={bundleList}
            selectedBundle={selectedBundle}
            selectedMission={selectedMission}
            duplicateIds={duplicateIds}
            dirtyBundles={bundles.map((b) => b.dirty)}
            resolveTranslatedTitles={settings.resolveTranslatedTitles}
            showMissionIds={settings.showMissionIds}
            onSelectBundle={handleSelectBundle}
            onSelectMission={setSelectedMission}
            onAddMission={handleAddMission}
            onAddFromTemplate={() => setShowTemplateDialog(true)}
            onCloseBundle={handleCloseBundle}
            onDeleteMission={handleDeleteMission}
            onMoveMission={handleMoveMission}
            onCopyMission={handleCopyMission}
            onDuplicateMission={handleDuplicateMission}
          />
        </Panel>
        <PanelResizeHandle className="resize-handle resize-handle-horizontal" />
        <Panel minSize="300px">
          {current ? (
            <div className="editor-area">
              <PanelGroup orientation="vertical" className="editor-panels" id="editor-vertical">
                <Panel id="editor-main" minSize="200px">
                  <div className="editor-panel">
                    <BundleEditor bundle={current.bundle} onChange={updateBundle} />
                    {mission ? (
                      <MissionEditor
                        mission={mission}
                        onChange={updateMission}
                        showHints={settings.showTranslationHints}
                        showAdvancedFields={settings.showAdvancedObjectiveFields}
                        plConfig={settings.showPowerLevelHint
                          ? { conStatInc: settings.plConStatInc, bpModeSquared: settings.plBPModeSquared }
                          : null}
                      />
                    ) : (
                      <div className="editor-empty">
                        {t("empty.noMission")}
                      </div>
                    )}
                  </div>
                </Panel>
                {bottomTab && (
                  <>
                    <PanelResizeHandle className="resize-handle resize-handle-vertical" />
                    <Panel id="bottom-panel" defaultSize={45} minSize="100px" maxSize="800px">
                      <div className="bottom-content">
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
                            onUpdateBundle={updateBundle}
                            onAddMission={handleAddMissionFromGraph}
                            onDeleteMission={handleDeleteMission}
                            resolveTranslatedTitles={settings.resolveTranslatedTitles}
                          />
                        )}
                      </div>
                    </Panel>
                  </>
                )}
              </PanelGroup>
              <div className="bottom-tabs">
                <button
                  className={`small ${bottomTab === "validation" ? "primary" : ""}`}
                  onClick={() => setBottomTab(bottomTab === "validation" ? null : "validation")}
                >
                  {t("tab.issues")} {warnings.length > 0 && `(${warnings.length})`}
                </button>
                <button
                  className={`small ${bottomTab === "flow" ? "primary" : ""}`}
                  onClick={() => setBottomTab(bottomTab === "flow" ? null : "flow")}
                >
                  {t("tab.flowGraph")}
                </button>
              </div>
            </div>
          ) : (
            <div className="editor-panel editor-panel-empty">
              <div className="editor-empty">
                {t("empty.noBundle")}
              </div>
            </div>
          )}
        </Panel>
      </PanelGroup>

      {/* Modals */}
      {showExport && current && (
        <ExportPreview
          bundle={current.bundle}
          originalJson={current.originalJson}
          jsonIndent={settings.jsonIndent}
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
      {pendingUpdate && (
        <UpdateDialog
          update={pendingUpdate.update}
          info={pendingUpdate.info}
          onClose={() => setPendingUpdate(null)}
        />
      )}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.text}</span>
          <button className="small" onClick={() => setToast(null)}>&times;</button>
        </div>
      )}
    </div>
  );
}

export default App;
