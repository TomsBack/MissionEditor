import { useCallback, useRef, useState, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  type Node as RFNode,
  type Edge as RFEdge,
  type NodeTypes,
  type EdgeTypes,
  type NodeProps,
  type EdgeProps,
  type Connection,
  type NodeChange,
  type OnNodesChange,
  useReactFlow,
  ReactFlowProvider,
  reconnectEdge,
  applyNodeChanges,
  BaseEdge,
  getBezierPath,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { MissionBundle, Mission } from "../types/mission";
import { parseReward, serializeReward } from "../utils/rewards";
import { translate } from "../utils/translations";
import i18next from "i18next";
import { useTranslation } from "react-i18next";

interface FlowGraphProps {
  bundle: MissionBundle;
  selectedMission: number;
  onSelectMission: (index: number) => void;
  onUpdateBundle?: (bundle: MissionBundle) => void;
  onAddMission?: () => Mission | undefined;
  onDeleteMission?: (index: number) => void;
  resolveTranslatedTitles?: boolean;
}

// #region Layout

interface LayoutNode {
  id: number;
  index: number;
  title: string;
  subtitle: string;
  objectiveCount: number;
  rewardCount: number;
  alignment: string;
  orphan: boolean;
}

const NODE_W = 220;
const NODE_H = 80;
const GAP_X = 100;
const GAP_Y = 24;
const PADDING = 40;

function resolveText(raw: string | undefined, translated: boolean): string {
  if (!raw) return "";
  if (translated) {
    return translate(raw) ?? raw;
  }
  return raw;
}

function buildNode(m: Mission, index: number, resolveTitles: boolean): LayoutNode {
  const title = resolveTitles
    ? resolveText(m.title?.[0], m.translated) || i18next.t("flow.mission", { id: m.id })
    : m.title?.[0] || i18next.t("flow.mission", { id: m.id });
  const subtitle = resolveTitles
    ? resolveText(m.subtitle?.[0], m.translated)
    : m.subtitle?.[0] || "";
  return {
    id: m.id,
    index,
    title,
    subtitle,
    objectiveCount: m.objectives?.[0]?.length ?? 0,
    rewardCount: m.rewards?.[0]?.length ?? 0,
    alignment: m.align?.[0] || "",
    orphan: false,
  };
}

interface FlowEdge {
  fromId: number;
  toId: number;
  buttonName: string;
  rewardIndex: number;
  propIndex: number;
}

function computeLayout(bundle: MissionBundle, resolveTitles: boolean) {
  const nodeMap = new Map<number, LayoutNode>();
  const edges: FlowEdge[] = [];
  const outgoing = new Map<number, number[]>();
  const incoming = new Map<number, Set<number>>();

  bundle.missions.forEach((m, i) => {
    nodeMap.set(m.id, buildNode(m, i, resolveTitles));
  });

  bundle.missions.forEach((m) => {
    const rewards = m.rewards?.[0] ?? [];
    const seen = new Set<number>();
    rewards.forEach((raw, ri) => {
      const reward = parseReward(raw);
      if (reward.nextMissionId !== 0 && !seen.has(reward.nextMissionId)) {
        seen.add(reward.nextMissionId);
        const buttonLabel = reward.buttonName
          ? (m.translated ? (translate(reward.buttonName) ?? reward.buttonName) : reward.buttonName)
          : "";
        edges.push({ fromId: m.id, toId: reward.nextMissionId, buttonName: buttonLabel, rewardIndex: ri, propIndex: 0 });
        if (!outgoing.has(m.id)) outgoing.set(m.id, []);
        outgoing.get(m.id)!.push(reward.nextMissionId);
        if (!incoming.has(reward.nextMissionId)) incoming.set(reward.nextMissionId, new Set());
        incoming.get(reward.nextMissionId)!.add(m.id);
      }
    });
  });

  // BFS layering
  const allIds = [...nodeMap.keys()];
  const layers = new Map<number, number>();
  const roots = allIds.filter((id) => !incoming.has(id) || incoming.get(id)!.size === 0);
  if (roots.length === 0 && allIds.length > 0) roots.push(allIds[0]);

  const queue: number[] = [];
  for (const r of roots) { layers.set(r, 0); queue.push(r); }

  const visited = new Set<string>();
  while (queue.length > 0) {
    const id = queue.shift()!;
    const layer = layers.get(id) ?? 0;
    for (const next of outgoing.get(id) ?? []) {
      if (!nodeMap.has(next)) continue;
      const key = `${id}->${next}`;
      if (visited.has(key)) continue;
      visited.add(key);
      const existing = layers.get(next);
      if (existing === undefined || existing < layer + 1) {
        layers.set(next, layer + 1);
        queue.push(next);
      }
    }
  }

  // Disconnected nodes
  let maxLayer = 0;
  for (const l of layers.values()) maxLayer = Math.max(maxLayer, l);
  for (const id of allIds) {
    if (!layers.has(id)) {
      layers.set(id, ++maxLayer);
      nodeMap.get(id)!.orphan = true;
    }
  }
  for (const id of allIds) {
    if (!roots.includes(id) && (!incoming.has(id) || incoming.get(id)!.size === 0)) {
      nodeMap.get(id)!.orphan = true;
    }
  }

  // Position by layer
  const layerGroups = new Map<number, number[]>();
  for (const [id, layer] of layers) {
    if (!nodeMap.has(id)) continue;
    if (!layerGroups.has(layer)) layerGroups.set(layer, []);
    layerGroups.get(layer)!.push(id);
  }

  const positions = new Map<number, { x: number; y: number }>();
  const sorted = [...layerGroups.entries()].sort((a, b) => a[0] - b[0]);
  for (const [layerIdx, ids] of sorted) {
    ids.forEach((id, i) => {
      positions.set(id, {
        x: PADDING + layerIdx * (NODE_W + GAP_X),
        y: PADDING + i * (NODE_H + GAP_Y),
      });
    });
  }

  return { nodeMap, edges, positions };
}

// #endregion

// #region Custom Node

type MissionNodeData = {
  missionId: number;
  missionIndex: number;
  title: string;
  subtitle: string;
  objectiveCount: number;
  rewardCount: number;
  alignment: string;
  orphan: boolean;
  selected: boolean;
  onDelete?: (index: number) => void;
};

function MissionNode({ data }: NodeProps<RFNode<MissionNodeData>>) {
  const { t } = useTranslation();
  return (
    <div className={`flow-node${data.selected ? " flow-node-selected" : ""}${data.orphan ? " flow-node-orphan" : ""}`}>
      <Handle type="target" position={Position.Left} className="flow-handle" />
      <div className="flow-node-header">
        <span className="flow-node-id">#{data.missionId}</span>
        {data.onDelete && (
          <button
            className="flow-node-delete"
            onClick={(e) => { e.stopPropagation(); data.onDelete!(data.missionIndex); }}
            title={t("flow.deleteNode")}
          >
            &times;
          </button>
        )}
      </div>
      <span className="flow-node-title">{data.title}</span>
      {data.subtitle && <span className="flow-node-subtitle">{data.subtitle}</span>}
      <div className="flow-node-footer">
        <div className="flow-node-stats">
          <span>{t("flow.objectives", { count: data.objectiveCount })}</span>
          <span>{t("flow.rewards", { count: data.rewardCount })}</span>
        </div>
        {data.alignment && <span className="flow-node-align">{data.alignment}</span>}
      </div>
      {data.orphan && <span className="flow-node-badge">{t("flow.orphan")}</span>}
      <Handle type="source" position={Position.Right} className="flow-handle" />
    </div>
  );
}

const nodeTypes: NodeTypes = { mission: MissionNode };

// #endregion

// #region Custom Edge with delete button

function DeletableEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, label, style,
  labelStyle, data,
}: EdgeProps<RFEdge<{ onDelete?: (id: string) => void }>>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} />
      <foreignObject
        x={labelX - 60}
        y={labelY - 12}
        width={120}
        height={24}
        className="flow-edge-label-container"
      >
        <div className="flow-edge-label">
          {label && <span style={labelStyle as React.CSSProperties}>{label}</span>}
          {data?.onDelete && (
            <button
              className="flow-edge-delete"
              onClick={(e) => { e.stopPropagation(); data.onDelete!(id); }}
              title="Remove link"
            >
              &times;
            </button>
          )}
        </div>
      </foreignObject>
    </>
  );
}

const edgeTypes: EdgeTypes = { deletable: DeletableEdge };

// #endregion

// #region Helpers

function hasExistingLink(bundle: MissionBundle, sourceId: number, targetId: number): boolean {
  const mission = bundle.missions.find((m) => m.id === sourceId);
  if (!mission) return false;
  const rewards = mission.rewards?.[0] ?? [];
  return rewards.some((raw) => parseReward(raw).nextMissionId === targetId);
}

function addLink(bundle: MissionBundle, sourceId: number, targetId: number): MissionBundle {
  const missions = [...bundle.missions];
  const sourceIdx = missions.findIndex((m) => m.id === sourceId);
  if (sourceIdx === -1) return bundle;

  const mission = { ...missions[sourceIdx] };
  const rewards = [...(mission.rewards?.[0] ?? [])];

  const emptySlot = rewards.findIndex((raw) => parseReward(raw).nextMissionId === 0);
  if (emptySlot === -1) {
    rewards.push(`nothing;;${targetId}`);
  } else {
    const reward = parseReward(rewards[emptySlot]);
    reward.nextMissionId = targetId;
    rewards[emptySlot] = serializeReward(reward);
  }

  mission.rewards = [...mission.rewards];
  mission.rewards[0] = rewards;
  missions[sourceIdx] = mission;

  return { ...bundle, missions };
}

// #endregion

// #region Inner component (needs ReactFlowProvider context)

function FlowGraphInner({ bundle, selectedMission, onSelectMission, onUpdateBundle, onAddMission, onDeleteMission, resolveTranslatedTitles = false }: FlowGraphProps) {
  const { t } = useTranslation();
  const { fitView, screenToFlowPosition } = useReactFlow();
  const connectingFrom = useRef<string | null>(null);
  const customPositions = useRef<Map<number, { x: number; y: number }>>(new Map());
  const hasCustomPositions = useRef(false);

  const bundleRef = useRef(bundle);
  bundleRef.current = bundle;

  // Build nodes and edges from bundle data + custom positions
  const buildNodesAndEdges = useCallback(() => {
    const { nodeMap, edges, positions } = computeLayout(bundle, resolveTranslatedTitles);

    // Clean up custom positions for deleted missions
    for (const id of customPositions.current.keys()) {
      if (!nodeMap.has(id)) {
        customPositions.current.delete(id);
      }
    }
    hasCustomPositions.current = customPositions.current.size > 0;

    const rfNodes: RFNode<MissionNodeData>[] = [];
    for (const [id, node] of nodeMap) {
      const pos = customPositions.current.get(id) ?? positions.get(id) ?? { x: 0, y: 0 };
      rfNodes.push({
        id: String(id),
        type: "mission",
        position: pos,
        data: {
          missionId: id,
          missionIndex: node.index,
          title: node.title,
          subtitle: node.subtitle,
          objectiveCount: node.objectiveCount,
          rewardCount: node.rewardCount,
          alignment: node.alignment,
          orphan: node.orphan,
          selected: node.index === selectedMission,
          onDelete: onDeleteMission,
        },
        style: { width: NODE_W, height: NODE_H },
      });
    }

    const edgeMeta = new Map<string, { fromId: number; rewardIndex: number; propIndex: number }>();

    const handleDeleteEdge = !onUpdateBundle ? undefined : (edgeId: string) => {
      const meta = edgeMeta.get(edgeId);
      if (!meta) return;

      const currentBundle = bundleRef.current;
      const missions = [...currentBundle.missions];
      const sourceIdx = missions.findIndex((m) => m.id === meta.fromId);
      if (sourceIdx === -1) return;

      const mission = { ...missions[sourceIdx] };
      const rewards = [...(mission.rewards?.[meta.propIndex] ?? [])];
      const raw = rewards[meta.rewardIndex];
      if (!raw) return;

      const reward = parseReward(raw);
      reward.nextMissionId = 0;
      rewards[meta.rewardIndex] = serializeReward(reward);
      mission.rewards = [...mission.rewards];
      mission.rewards[meta.propIndex] = rewards;
      missions[sourceIdx] = mission;

      onUpdateBundle({ ...currentBundle, missions });
    };

    const rfEdges: RFEdge[] = edges
      .filter((e) => nodeMap.has(e.toId))
      .map((e, i) => {
        const edgeId = `e-${e.fromId}-${e.toId}-${i}`;
        edgeMeta.set(edgeId, { fromId: e.fromId, rewardIndex: e.rewardIndex, propIndex: e.propIndex });
        return {
          id: edgeId,
          source: String(e.fromId),
          target: String(e.toId),
          type: onUpdateBundle ? "deletable" : undefined,
          label: e.buttonName || undefined,
          animated: false,
          reconnectable: onUpdateBundle ? ("target" as const) : undefined,
          style: { stroke: "var(--accent)", strokeWidth: 1.5 },
          labelStyle: { fontSize: 10, fill: "var(--text-muted)" },
          data: { onDelete: handleDeleteEdge },
        };
      });

    return { rfNodes, rfEdges, edgeCount: edges.length, edgeMeta };
  }, [bundle, selectedMission, resolveTranslatedTitles, onUpdateBundle, onDeleteMission]);

  // Controlled node/edge state for real-time dragging
  const [nodes, setNodes] = useState<RFNode<MissionNodeData>[]>([]);
  const [edges, setEdges] = useState<RFEdge[]>([]);
  const [edgeCount, setEdgeCount] = useState(0);
  const edgeMetaRef = useRef(new Map<string, { fromId: number; rewardIndex: number; propIndex: number }>());
  // Force re-render trigger for the reset layout button
  const [, setLayoutVersion] = useState(0);

  // Recompute when bundle/selection changes
  useEffect(() => {
    const result = buildNodesAndEdges();
    setNodes(result.rfNodes);
    setEdges(result.rfEdges);
    setEdgeCount(result.edgeCount);
    edgeMetaRef.current = result.edgeMeta;
  }, [buildNodesAndEdges]);

  // Apply React Flow's internal changes (drag, select) to our state in real-time
  const handleNodesChange: OnNodesChange<RFNode<MissionNodeData>> = useCallback((changes: NodeChange<RFNode<MissionNodeData>>[]) => {
    setNodes((prev) => applyNodeChanges(changes, prev));

    // Persist position changes to customPositions ref
    for (const change of changes) {
      if (change.type === "position" && change.position) {
        const missionId = parseInt(change.id);
        if (!isNaN(missionId)) {
          customPositions.current.set(missionId, { x: change.position.x, y: change.position.y });
          hasCustomPositions.current = true;
        }
      }
    }
  }, []);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: RFNode) => {
    const mission = bundleRef.current.missions.find((m) => String(m.id) === node.id);
    if (mission) {
      onSelectMission(bundleRef.current.missions.indexOf(mission));
    }
  }, [onSelectMission]);

  const handleReconnect = useCallback((oldEdge: RFEdge, newConnection: Connection) => {
    if (!onUpdateBundle || !newConnection.target) return edges;

    const meta = edgeMetaRef.current.get(oldEdge.id);
    if (!meta) return edges;

    const newTargetId = parseInt(newConnection.target);
    if (isNaN(newTargetId)) return edges;

    const currentBundle = bundleRef.current;
    const missions = [...currentBundle.missions];
    const sourceIdx = missions.findIndex((m) => m.id === meta.fromId);
    if (sourceIdx === -1) return edges;

    const mission = { ...missions[sourceIdx] };
    const rewards = [...(mission.rewards?.[meta.propIndex] ?? [])];
    const raw = rewards[meta.rewardIndex];
    if (!raw) return edges;

    const reward = parseReward(raw);
    reward.nextMissionId = newTargetId;
    rewards[meta.rewardIndex] = serializeReward(reward);
    mission.rewards = [...mission.rewards];
    mission.rewards[meta.propIndex] = rewards;
    missions[sourceIdx] = mission;

    onUpdateBundle({ ...currentBundle, missions });
    return reconnectEdge(oldEdge, newConnection, edges);
  }, [onUpdateBundle, edges]);

  const handleConnect = useCallback((connection: Connection) => {
    if (!onUpdateBundle || !connection.source || !connection.target) return;
    // Prevent self-links
    if (connection.source === connection.target) return;

    const sourceId = parseInt(connection.source);
    const targetId = parseInt(connection.target);
    if (isNaN(sourceId) || isNaN(targetId)) return;

    const currentBundle = bundleRef.current;
    if (hasExistingLink(currentBundle, sourceId, targetId)) return;

    onUpdateBundle(addLink(currentBundle, sourceId, targetId));
  }, [onUpdateBundle]);

  const handleConnectStart = useCallback((_: unknown, params: { nodeId: string | null }) => {
    connectingFrom.current = params.nodeId;
  }, []);

  const handleConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
    const sourceNodeId = connectingFrom.current;
    connectingFrom.current = null;

    if (!onUpdateBundle || !onAddMission || !sourceNodeId) return;

    const target = (event as MouseEvent).target ?? (event as TouchEvent).changedTouches?.[0]?.target;
    if (target instanceof Element && (target.closest(".react-flow__node") || target.closest(".react-flow__handle"))) {
      return;
    }

    const clientX = (event as MouseEvent).clientX ?? (event as TouchEvent).changedTouches?.[0]?.clientX;
    const clientY = (event as MouseEvent).clientY ?? (event as TouchEvent).changedTouches?.[0]?.clientY;

    const newMission = onAddMission();
    if (!newMission) return;

    if (clientX != null && clientY != null) {
      const flowPos = screenToFlowPosition({ x: clientX, y: clientY });
      customPositions.current.set(newMission.id, { x: flowPos.x - NODE_W / 2, y: flowPos.y - NODE_H / 2 });
      hasCustomPositions.current = true;
    }

    const sourceId = parseInt(sourceNodeId);
    if (isNaN(sourceId) || sourceId === newMission.id) return;

    requestAnimationFrame(() => {
      const currentBundle = bundleRef.current;
      if (!hasExistingLink(currentBundle, sourceId, newMission.id)) {
        onUpdateBundle(addLink(currentBundle, sourceId, newMission.id));
      }
    });
  }, [onUpdateBundle, onAddMission, screenToFlowPosition]);

  const handlePaneDoubleClick = useCallback((event: React.MouseEvent) => {
    if (!onAddMission) return;
    const target = event.target;
    if (target instanceof Element && target.closest(".react-flow__node")) return;

    const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const newMission = onAddMission();
    if (!newMission) return;

    customPositions.current.set(newMission.id, { x: flowPos.x - NODE_W / 2, y: flowPos.y - NODE_H / 2 });
    hasCustomPositions.current = true;
  }, [onAddMission, screenToFlowPosition]);

  const handleFit = useCallback(() => { fitView({ duration: 300 }); }, [fitView]);

  const handleResetLayout = useCallback(() => {
    customPositions.current.clear();
    hasCustomPositions.current = false;
    // Rebuild nodes from auto-layout
    const result = buildNodesAndEdges();
    setNodes(result.rfNodes);
    setEdges(result.rfEdges);
    setEdgeCount(result.edgeCount);
    edgeMetaRef.current = result.edgeMeta;
    setLayoutVersion((v) => v + 1);
    requestAnimationFrame(() => fitView({ duration: 300 }));
  }, [buildNodesAndEdges, fitView]);

  const handleCenter = useCallback(() => {
    const mission = bundle.missions[selectedMission];
    if (!mission) return;
    fitView({ nodes: [{ id: String(mission.id) }], duration: 300, maxZoom: 1.5 });
  }, [bundle, selectedMission, fitView]);

  return (
    <div className="flow-graph-wrapper">
      <div className="flow-graph-toolbar">
        <button className="small" onClick={handleFit}>{t("flow.fit")}</button>
        <button className="small" onClick={handleCenter}>{t("flow.center")}</button>
        {hasCustomPositions.current && (
          <button className="small" onClick={handleResetLayout}>{t("flow.resetLayout")}</button>
        )}
        <span className="flow-graph-stats">
          {t("flow.missions", { count: bundle.missions.length })}, {t("flow.links", { count: edgeCount })}
        </span>
        {onAddMission && (
          <span className="flow-graph-hint">{t("flow.hint")}</span>
        )}
      </div>
      <div className="flow-graph">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={handleNodeClick}
          onReconnect={handleReconnect}
          onConnect={handleConnect}
          onConnectStart={handleConnectStart}
          onConnectEnd={handleConnectEnd}
          onDoubleClick={handlePaneDoubleClick}
          fitView
          minZoom={0.1}
          maxZoom={3}
          proOptions={{ hideAttribution: true }}
          zoomOnDoubleClick={!onAddMission}
          connectionLineStyle={{ stroke: "var(--accent)", strokeWidth: 1.5, strokeDasharray: "5 5" }}
        >
          <Controls showInteractive={false} />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border)" />
        </ReactFlow>
      </div>
    </div>
  );
}

// #endregion

export function FlowGraph(props: FlowGraphProps) {
  return (
    <ReactFlowProvider>
      <FlowGraphInner {...props} />
    </ReactFlowProvider>
  );
}
