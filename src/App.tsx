import { useState, useCallback } from "react";
import "./App.css";
import type { MissionBundle, Mission } from "./types/mission";
import { openBundleFile, saveBundleFile, saveBundleFileAs, createEmptyBundle, createEmptyMission } from "./utils/files";
import { Sidebar } from "./components/Sidebar";
import { BundleEditor } from "./components/BundleEditor";
import { MissionEditor } from "./components/MissionEditor";

interface LoadedBundle {
  bundle: MissionBundle;
  path?: string;
  dirty: boolean;
}

function App() {
  const [bundles, setBundles] = useState<LoadedBundle[]>([]);
  const [selectedBundle, setSelectedBundle] = useState(0);
  const [selectedMission, setSelectedMission] = useState(0);

  const current = bundles[selectedBundle];
  const mission = current?.bundle.missions[selectedMission];

  const updateBundle = useCallback((updated: MissionBundle) => {
    setBundles((prev) => {
      const next = [...prev];
      next[selectedBundle] = { ...next[selectedBundle], bundle: updated, dirty: true };
      return next;
    });
  }, [selectedBundle]);

  const updateMission = useCallback((updated: Mission) => {
    setBundles((prev) => {
      const next = [...prev];
      const bundle = { ...next[selectedBundle].bundle };
      bundle.missions = [...bundle.missions];
      bundle.missions[selectedMission] = updated;
      next[selectedBundle] = { ...next[selectedBundle], bundle, dirty: true };
      return next;
    });
  }, [selectedBundle, selectedMission]);

  async function handleOpen() {
    try {
      const result = await openBundleFile();
      if (!result) return;
      setBundles((prev) => [...prev, { bundle: result.bundle, path: result.path, dirty: false }]);
      setSelectedBundle(bundles.length);
      setSelectedMission(0);
    } catch (err) {
      console.error("Failed to open file:", err);
    }
  }

  function handleNew() {
    setBundles((prev) => [...prev, { bundle: createEmptyBundle(), dirty: true }]);
    setSelectedBundle(bundles.length);
    setSelectedMission(0);
  }

  async function handleSave() {
    if (!current) return;
    try {
      const path = await saveBundleFile(current.bundle, current.path);
      if (path) {
        setBundles((prev) => {
          const next = [...prev];
          next[selectedBundle] = { ...next[selectedBundle], path, dirty: false };
          return next;
        });
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
        setBundles((prev) => {
          const next = [...prev];
          next[selectedBundle] = { ...next[selectedBundle], path, dirty: false };
          return next;
        });
      }
    } catch (err) {
      console.error("Failed to save file:", err);
    }
  }

  function handleCloseBundle() {
    if (!current) return;
    setBundles((prev) => prev.filter((_, i) => i !== selectedBundle));
    setSelectedBundle(Math.max(0, selectedBundle - 1));
    setSelectedMission(0);
  }

  function handleAddMission() {
    if (!current) return;
    const maxId = current.bundle.missions.reduce((max, m) => Math.max(max, m.id), -1);
    const newMission = createEmptyMission(maxId + 1);
    const updated = { ...current.bundle, missions: [...current.bundle.missions, newMission] };
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

  function handleSelectBundle(index: number) {
    setSelectedBundle(index);
    setSelectedMission(0);
  }

  const bundleList = bundles.map((b) => b.bundle);

  return (
    <div className="app">
      <div className="toolbar">
        <span className="toolbar-title">
          Mission Editor
          {current?.path && (
            <span className="toolbar-path">{current.path}</span>
          )}
          {current?.dirty && <span style={{ color: "var(--warning)", marginLeft: 6 }}>*</span>}
        </span>
        <button onClick={handleNew}>New</button>
        <button onClick={handleOpen}>Open</button>
        <button onClick={handleSave} disabled={!current} className={current ? "primary" : ""}>
          Save
        </button>
        <button onClick={handleSaveAs} disabled={!current}>Save As</button>
        <button onClick={handleCloseBundle} disabled={!current} className="danger">Close</button>
      </div>

      <div className="main-layout">
        <Sidebar
          bundles={bundleList}
          selectedBundle={selectedBundle}
          selectedMission={selectedMission}
          onSelectBundle={handleSelectBundle}
          onSelectMission={setSelectedMission}
          onAddMission={handleAddMission}
          onDeleteMission={handleDeleteMission}
        />

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
      </div>
    </div>
  );
}

export default App;
