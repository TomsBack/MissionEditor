import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import type { MissionBundle } from "../types/mission";
import { parseReward } from "../utils/rewards";

interface FlowGraphProps {
  bundle: MissionBundle;
  selectedMission: number;
  onSelectMission: (index: number) => void;
}

interface Node {
  id: number;
  index: number;
  title: string;
  x: number;
  y: number;
}

interface Edge {
  from: number;
  to: number;
  label?: string;
}

const NODE_W = 160;
const NODE_H = 40;
const GAP_X = 60;
const GAP_Y = 30;
const PADDING = 40;

export function FlowGraph({ bundle, selectedMission, onSelectMission }: FlowGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Build nodes and edges from the bundle
  const { nodes, edges } = useMemo(() => {
    const nodeMap = new Map<number, Node>();
    const edges: Edge[] = [];

    // Create nodes for each mission
    bundle.missions.forEach((m, i) => {
      nodeMap.set(m.id, { id: m.id, index: i, title: m.title?.[0] || `Mission ${m.id}`, x: 0, y: 0 });
    });

    // Create edges from reward nextMissionId links
    bundle.missions.forEach((m) => {
      const rewards = m.rewards?.[0] ?? [];
      const seenTargets = new Set<number>();
      rewards.forEach((raw) => {
        const reward = parseReward(raw);
        if (reward.nextMissionId !== 0 && !seenTargets.has(reward.nextMissionId)) {
          seenTargets.add(reward.nextMissionId);
          edges.push({ from: m.id, to: reward.nextMissionId });
        }
      });
    });

    // Layout: topological sort with layering
    const outgoing = new Map<number, number[]>();
    const incoming = new Map<number, number[]>();
    for (const e of edges) {
      if (!outgoing.has(e.from)) outgoing.set(e.from, []);
      outgoing.get(e.from)!.push(e.to);
      if (!incoming.has(e.to)) incoming.set(e.to, []);
      incoming.get(e.to)!.push(e.from);
    }

    // Assign layers via BFS from roots
    const layers = new Map<number, number>();
    const allIds = [...nodeMap.keys()];
    const roots = allIds.filter((id) => !incoming.has(id) || incoming.get(id)!.length === 0);
    if (roots.length === 0 && allIds.length > 0) roots.push(allIds[0]);

    const queue: number[] = [];
    const visited = new Map<number, number>(); // id -> visit count (cycle protection)
    for (const r of roots) {
      layers.set(r, 0);
      queue.push(r);
      visited.set(r, 0);
    }

    const maxVisits = allIds.length + 1;
    while (queue.length > 0) {
      const id = queue.shift()!;
      const layer = layers.get(id) ?? 0;
      for (const next of outgoing.get(id) ?? []) {
        const count = (visited.get(next) ?? 0) + 1;
        if (count > maxVisits) continue; // cycle detected, stop propagating
        visited.set(next, count);
        const existing = layers.get(next);
        if (existing === undefined || existing < layer + 1) {
          layers.set(next, layer + 1);
          queue.push(next);
        }
      }
    }

    // Assign layers to disconnected nodes
    let maxLayer = 0;
    for (const l of layers.values()) maxLayer = Math.max(maxLayer, l);
    for (const id of allIds) {
      if (!layers.has(id)) {
        layers.set(id, ++maxLayer);
      }
    }

    // Group by layer and position
    const layerGroups = new Map<number, number[]>();
    for (const [id, layer] of layers) {
      if (!layerGroups.has(layer)) layerGroups.set(layer, []);
      layerGroups.get(layer)!.push(id);
    }

    const sortedLayers = [...layerGroups.entries()].sort((a, b) => a[0] - b[0]);
    for (const [layerIdx, ids] of sortedLayers) {
      ids.forEach((id, i) => {
        const node = nodeMap.get(id);
        if (node) {
          node.x = PADDING + layerIdx * (NODE_W + GAP_X);
          node.y = PADDING + i * (NODE_H + GAP_Y);
        }
      });
    }

    return { nodes: [...nodeMap.values()], edges };
  }, [bundle]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(offset.x, offset.y);

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // Draw edges
    ctx.strokeStyle = "#3a5c8a";
    ctx.lineWidth = 1.5;
    for (const edge of edges) {
      const from = nodeMap.get(edge.from);
      const to = nodeMap.get(edge.to);
      if (!from || !to) continue;

      const x1 = from.x + NODE_W;
      const y1 = from.y + NODE_H / 2;
      const x2 = to.x;
      const y2 = to.y + NODE_H / 2;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      const cpx = (x1 + x2) / 2;
      ctx.bezierCurveTo(cpx, y1, cpx, y2, x2, y2);
      ctx.stroke();

      // Arrow
      ctx.save();
      ctx.translate(x2, y2);
      ctx.rotate(Math.atan2(y2 - (y1 + y2) / 2, x2 - cpx));
      ctx.fillStyle = "#3a5c8a";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-8, -4);
      ctx.lineTo(-8, 4);
      ctx.fill();
      ctx.restore();
    }

    // Draw nodes
    for (const node of nodes) {
      const isSelected = node.index === selectedMission;
      ctx.fillStyle = isSelected ? "#2d4a7a" : "#1e2a45";
      ctx.strokeStyle = isSelected ? "#4a9eff" : "#2a3a5c";
      ctx.lineWidth = isSelected ? 2 : 1;

      ctx.beginPath();
      ctx.roundRect(node.x, node.y, NODE_W, NODE_H, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#8892a4";
      ctx.font = "10px -apple-system, sans-serif";
      ctx.fillText(`#${node.id}`, node.x + 8, node.y + 14);

      ctx.fillStyle = isSelected ? "#ffffff" : "#e0e0e0";
      ctx.font = "11px -apple-system, sans-serif";
      const title = node.title.length > 18 ? node.title.slice(0, 16) + "..." : node.title;
      ctx.fillText(title, node.x + 8, node.y + 28);
    }

    ctx.restore();
  }, [nodes, edges, offset, selectedMission]);

  useEffect(() => { draw(); }, [draw]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => draw());
    observer.observe(container);
    return () => observer.disconnect();
  }, [draw]);

  function handleMouseDown(e: React.MouseEvent) {
    // Check if clicking a node
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left - offset.x;
    const my = e.clientY - rect.top - offset.y;

    for (const node of nodes) {
      if (mx >= node.x && mx <= node.x + NODE_W && my >= node.y && my <= node.y + NODE_H) {
        onSelectMission(node.index);
        return;
      }
    }

    // Start panning
    setDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  }

  function handleMouseUp() {
    setDragging(false);
  }

  return (
    <div
      ref={containerRef}
      className="flow-graph"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
