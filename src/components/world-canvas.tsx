"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  addEdge, Background, BackgroundVariant, Controls, Handle, MarkerType, MiniMap,
  Position, ReactFlow, useEdgesState, useNodesInitialized, useNodesState, useReactFlow,
  useStore, type Connection, type NodeProps, type ReactFlowInstance,
} from "@xyflow/react";
import {
  ArrowLeft, ArrowRight, BookOpen, Building2, Castle, Check, ChevronDown, CircleDot,
  CloudSun, Download, Flag, Landmark, LayoutTemplate, Link2, Map, MapPin, Menu,
  Mountain, Plus, Route, Save, ScanLine, ShipWheel, Shuffle, Sparkles, Trash2,
  Users, WandSparkles, X,
} from "lucide-react";
import {
  entityMeta, instantiateTemplate, quickFillCanvas, worldTemplates,
  type EntityType, type StoryEdge, type StoryNode, type StoryNodeData, type WorldTemplate,
} from "@/lib/story-data";
import { connectionKindOf, connectionKinds, makeConnection, type ConnectionKind } from "@/lib/connections";
import ConnectionsPanel from "@/components/connections-panel";
import StoryConnection from "@/components/story-connection";

type World = {
  id: number;
  title: string;
  genre: string;
  description: string;
  canvas: { nodes: StoryNode[]; edges: StoryEdge[] } | null;
};

const icons: Record<EntityType, React.ElementType> = {
  city: Building2, region: Mountain, landmark: Landmark, faction: Flag, ruin: Castle, port: ShipWheel,
};

function StoryNodeCard({ data, selected, isConnectable }: NodeProps<StoryNode>) {
  const Icon = icons[data.type] || MapPin;
  const meta = entityMeta[data.type] || entityMeta.city;
  return (
    <div className={`story-node ${selected ? "selected" : ""}`} style={{ "--node-color": meta.color } as React.CSSProperties}>
      <Handle id="in" type="target" position={Position.Left} isConnectable={isConnectable} title="Incoming connection: connect another place here" />
      <div className="node-icon"><Icon size={18} /></div>
      <div className="node-copy"><strong>{data.label}</strong><span>{data.subtitle}</span></div>
      <span className="node-dot" />
      <Handle id="out" type="source" position={Position.Right} isConnectable={isConnectable} title="Connect places: drag or click this dot, then the left dot of another place" />
    </div>
  );
}

const nodeTypes = { story: StoryNodeCard };
const edgeTypes = { storyConnection: StoryConnection };
const palette: Array<{ type: EntityType; label: string; hint: string }> = [
  { type: "city", label: "City", hint: "Settlement" },
  { type: "region", label: "Region", hint: "Territory" },
  { type: "landmark", label: "Landmark", hint: "Point of interest" },
  { type: "faction", label: "Faction", hint: "Group or power" },
  { type: "ruin", label: "Ruin", hint: "Ancient place" },
  { type: "port", label: "Port", hint: "Harbor" },
];

function FitCanvas({ request }: { request: number }) {
  const initialized = useNodesInitialized();
  const width = useStore((state) => state.width);
  const height = useStore((state) => state.height);
  const { fitView } = useReactFlow();
  useEffect(() => {
    if (!initialized || !width || !height) return;
    const frame = requestAnimationFrame(() => {
      void fitView({ padding: 0.18, duration: 300, minZoom: 0.12, maxZoom: 1.2 });
    });
    return () => cancelAnimationFrame(frame);
  }, [initialized, width, height, request, fitView]);
  return null;
}

function MarkdownLore({ text }: { text: string }) {
  return <div className="lore-output">{text.split("\n").map((line, i) => {
    if (line.startsWith("### ")) return <h3 key={i}>{line.slice(4)}</h3>;
    if (line.startsWith("#### ")) return <h4 key={i}>{line.slice(5)}</h4>;
    if (!line) return <br key={i} />;
    const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return <p key={i}>{parts.map((part, j) => part.startsWith("**") ? <strong key={j}>{part.slice(2, -2)}</strong> : part.startsWith("*") ? <em key={j}>{part.slice(1, -1)}</em> : part)}</p>;
  })}</div>;
}

export default function WorldCanvas({ world }: { world: World }) {
  const initial = world.canvas?.nodes?.length ? world.canvas : { nodes: [], edges: [] };
  const [nodes, setNodes, onNodesChange] = useNodesState<StoryNode>(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<StoryEdge>(initial.edges);
  const [selectedId, setSelectedId] = useState<string | null>(initial.nodes[0]?.id ?? null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [inspectorMode, setInspectorMode] = useState<"place" | "connections">("place");
  const [showTemplates, setShowTemplates] = useState(false);
  const [flow, setFlow] = useState<ReactFlowInstance<StoryNode, StoryEdge> | null>(null);
  const [fitRequest, setFitRequest] = useState(0);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved">("saved");
  const [lore, setLore] = useState("");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [rightOpen, setRightOpen] = useState(true);
  const [leftOpen, setLeftOpen] = useState(true);
  const initialized = useRef(false);
  const selected = nodes.find((node) => node.id === selectedId) ?? null;
  const relatedEdges = edges.filter((edge) => edge.source === selectedId || edge.target === selectedId);

  useEffect(() => {
    const compact = window.matchMedia("(max-width: 950px)");
    const phone = window.matchMedia("(max-width: 700px)");
    const update = () => { setLeftOpen(!compact.matches); setRightOpen(!phone.matches); };
    update();
    compact.addEventListener("change", update);
    phone.addEventListener("change", update);
    return () => { compact.removeEventListener("change", update); phone.removeEventListener("change", update); };
  }, []);

  const selectConnection = useCallback((id: string) => {
    setSelectedEdgeId(id);
    setInspectorMode("connections");
    setRightOpen(true);
  }, []);

  const visibleEdges = useMemo<StoryEdge[]>(() => edges.map((edge) => {
    const kind = connectionKindOf(edge);
    const color = connectionKinds[kind].color;
    return {
      ...edge,
      type: "storyConnection",
      sourceHandle: "out",
      targetHandle: "in",
      hidden: false,
      selected: edge.id === selectedEdgeId,
      data: { ...edge.data, kind, onSelect: selectConnection },
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 18, height: 18, markerUnits: "userSpaceOnUse" },
      ariaLabel: `${typeof edge.label === "string" ? edge.label : connectionKinds[kind].label}: ${nodes.find((node) => node.id === edge.source)?.data.label || "place"} to ${nodes.find((node) => node.id === edge.target)?.data.label || "place"}`,
    };
  }), [edges, nodes, selectedEdgeId, selectConnection]);

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target || connection.source === connection.target) return;
    setEdges((current) => addEdge(makeConnection(connection.source!, connection.target!, "road"), current));
  }, [setEdges]);

  useEffect(() => {
    if (!initialized.current) { initialized.current = true; return; }
    setSaveState("unsaved");
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSaveState("saving");
      try {
        const response = await fetch(`/api/worlds/${world.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ canvas: { nodes, edges } }),
          signal: controller.signal,
        });
        if (!controller.signal.aborted) setSaveState(response.ok ? "saved" : "unsaved");
      } catch {
        if (!controller.signal.aborted) setSaveState("unsaved");
      }
    }, 900);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [nodes, edges, world.id]);

  function addNode(type: EntityType, position?: { x: number; y: number }) {
    const meta = entityMeta[type];
    const id = `n-${crypto.randomUUID()}`;
    const newNode: StoryNode = {
      id, type: "story",
      position: position ?? { x: 350 + Math.random() * 180, y: 220 + Math.random() * 120 },
      data: { label: `New ${meta.label}`, subtitle: meta.label, type, climate: "Unknown", population: "Unknown", ruler: "Unknown", description: "" },
    };
    setNodes((current) => [...current, newNode]);
    setSelectedId(id);
    setSelectedEdgeId(null);
    setInspectorMode("place");
    setRightOpen(true);
    setFitRequest((current) => current + 1);
  }

  function loadCanvas(next: { nodes: StoryNode[]; edges: StoryEdge[] }, append: boolean) {
    if (append && nodes.length) {
      const offset = Math.max(...nodes.map((node) => node.position.x)) + 280 - Math.min(...next.nodes.map((node) => node.position.x));
      next = { ...next, nodes: next.nodes.map((node) => ({ ...node, position: { ...node.position, x: node.position.x + offset } })) };
    }
    setNodes((current) => append ? [...current, ...next.nodes] : next.nodes);
    setEdges((current) => append ? [...current, ...next.edges] : next.edges);
    setSelectedId(next.nodes[0]?.id ?? null);
    setSelectedEdgeId(null);
    setInspectorMode("place");
    setLore("");
    setShowTemplates(false);
    setFitRequest((current) => current + 1);
  }

  function applyTemplate(template: WorldTemplate) {
    const append = nodes.length > 0 && !window.confirm("Replace the current canvas with this template? Choose Cancel to add it alongside your existing places.");
    loadCanvas(instantiateTemplate(template), append);
  }

  function quickFill() { loadCanvas(quickFillCanvas(6), nodes.length > 0); }

  function updateSelected(key: keyof StoryNodeData, value: string) {
    if (!selectedId) return;
    setNodes((current) => current.map((node) => node.id === selectedId ? { ...node, data: { ...node.data, [key]: value } } : node));
  }

  function deleteSelected() {
    if (!selectedId) return;
    setNodes((current) => current.filter((node) => node.id !== selectedId));
    setEdges((current) => current.filter((edge) => edge.source !== selectedId && edge.target !== selectedId));
    setSelectedId(null);
    setLore("");
    setFitRequest((current) => current + 1);
  }

  function addConnection(source: string, target: string, kind: ConnectionKind, label: string) {
    const edge = makeConnection(source, target, kind, label);
    setEdges((current) => [...current, edge]);
    selectConnection(edge.id);
  }

  function updateConnection(id: string, update: Partial<StoryEdge>) {
    setEdges((current) => current.map((edge) => edge.id === id ? { ...edge, ...update } : edge));
  }

  function deleteConnection(id: string) {
    setEdges((current) => current.filter((edge) => edge.id !== id));
    if (selectedEdgeId === id) setSelectedEdgeId(null);
  }

  function onDragStart(event: React.DragEvent, type: EntityType) {
    event.dataTransfer.setData("application/storycanvas", type);
    event.dataTransfer.effectAllowed = "move";
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    const type = event.dataTransfer.getData("application/storycanvas") as EntityType;
    if (!type || !flow || !entityMeta[type]) return;
    addNode(type, flow.screenToFlowPosition({ x: event.clientX, y: event.clientY }));
  }

  function exportCanvas() {
    const blob = new Blob([JSON.stringify({ world: world.title, exportedAt: new Date().toISOString(), nodes, edges }, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `${world.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-canvas.json`;
    anchor.click();
    URL.revokeObjectURL(href);
  }

  async function generateLore() {
    if (!selected) return;
    setLore("");
    setGenerating(true);
    try {
      const response = await fetch("/api/ai/lore", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worldId: world.id, node: selected.data, prompt }),
      });
      if (!response.ok || !response.body) throw new Error("Could not generate lore");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setLore((current) => current + decoder.decode(value, { stream: true }));
      }
    } catch { setLore("The archive is quiet right now. Please try the generation again."); }
    finally { setGenerating(false); }
  }

  const miniMapColor = useCallback((node: StoryNode) => entityMeta[node.data.type]?.color || "#9b8268", []);
  const saveLabel = saveState === "saving" ? "Saving…" : saveState === "saved" ? "All changes saved" : "Unsaved changes";

  return (
    <div className="canvas-page">
      <header className="canvas-topbar">
        <div className="canvas-brand"><Link href="/" title="Back to worlds"><ArrowLeft size={18} /></Link><span className="brand-mark small"><Sparkles size={15} /></span><span className="wordmark">Storycanvas</span><span className="crumb" /><div><strong>{world.title}</strong><small>{world.genre}</small></div></div>
        <div className="canvas-title"><Map size={16} /><span>World map</span><ChevronDown size={14} /></div>
        <div className="canvas-actions"><span className={`save-status ${saveState}`} role="status"><span>{saveState === "saved" ? <Check size={12} /> : <Save size={12} />}</span>{saveLabel}</span><button className="secondary-button" onClick={() => setShowTemplates(true)} title="World templates"><LayoutTemplate size={16} /> Templates</button><button className="secondary-button" onClick={exportCanvas} title="Export canvas"><Download size={16} /> Export</button><button className="avatar compact">AM</button></div>
      </header>

      <div className="canvas-workspace">
        <aside className={`entity-palette ${leftOpen ? "" : "collapsed"}`}>
          <button className="collapse-button" aria-label={leftOpen ? "Collapse world elements" : "Open world elements"} onClick={() => setLeftOpen((value) => !value)}><Menu size={17} /></button>
          {leftOpen && <><div className="palette-heading"><span>World elements</span><small>Click or drag onto canvas</small></div><div className="palette-list">{palette.map(({ type, label, hint }) => { const Icon = icons[type]; return <button key={type} draggable onDragStart={(event) => onDragStart(event, type)} onClick={() => addNode(type)}><span className="palette-icon" style={{ color: entityMeta[type].color }}><Icon size={17} /></span><span><strong>{label}</strong><small>{hint}</small></span><Plus size={14} /></button>; })}</div><div className="palette-help"><CircleDot size={15} /><p><strong>Connect your world</strong>Drag from the right dot of a place to the left dot of another. You can also use the Connections panel.</p></div></>}
        </aside>

        <main className="flow-wrap" aria-label="Interactive world map" onDrop={onDrop} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }}>
          <ReactFlow<StoryNode, StoryEdge>
            nodes={nodes}
            edges={visibleEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setFlow}
            onNodeClick={(_, node) => { setSelectedId(node.id); setSelectedEdgeId(null); setInspectorMode("place"); setRightOpen(true); setLore(""); }}
            onEdgeClick={(_, edge) => selectConnection(edge.id)}
            onPaneClick={() => { setSelectedId(null); setSelectedEdgeId(null); }}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.18 }}
            minZoom={0.12}
            maxZoom={1.8}
            connectionRadius={28}
            connectOnClick
            isValidConnection={(connection) => connection.source !== connection.target}
            connectionLineStyle={{ stroke: "#ad5836", strokeWidth: 3 }}
            defaultEdgeOptions={{ type: "storyConnection", interactionWidth: 28 }}
          >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="#d8cec1" />
            <Controls position="bottom-left" showInteractive={false} />
            <MiniMap position="bottom-right" nodeColor={miniMapColor} maskColor="rgba(244,239,231,.76)" pannable zoomable />
            <FitCanvas request={fitRequest} />
          </ReactFlow>
          <div className="map-toolbar">
            <button type="button" aria-label="Fit map" onClick={() => setFitRequest((current) => current + 1)}><ScanLine size={15} /><span>Fit map</span></button>
            <button type="button" aria-label="Show connections" aria-pressed={rightOpen && inspectorMode === "connections"} onClick={() => { setInspectorMode("connections"); setRightOpen(true); }}><Link2 size={15} /><span>Connections</span><b>{edges.length}</b></button>
          </div>
          {nodes.length === 0 && (
            <div className="canvas-empty">
              <div className="empty-inner">
                <span className="empty-badge"><Map size={26} /></span><p className="eyebrow">A blank world awaits</p><h2>Fill your canvas</h2>
                <p className="empty-sub">Start from a ready-made world, let us generate one, or place your first location by hand.</p>
                <div className="empty-actions"><button className="primary-button" onClick={() => setShowTemplates(true)}><LayoutTemplate size={16} /> Browse templates</button><button className="secondary-button" onClick={quickFill}><Shuffle size={15} /> Quick-fill a world</button><button className="secondary-button" onClick={() => addNode("city")}><Plus size={15} /> Add first place</button></div>
                <div className="empty-templates">{worldTemplates.map((template) => <button key={template.id} onClick={() => applyTemplate(template)} style={{ "--tpl": template.accent } as React.CSSProperties}><span className="tpl-dot" /><strong>{template.name}</strong><small>{template.tagline}</small><em>{template.nodes.length} places · {template.edges.length} links</em></button>)}</div>
              </div>
            </div>
          )}
          <div className="canvas-hint"><Route size={14} /> {nodes.length} places · {edges.length} connections</div>
        </main>

        <aside className={`inspector ${rightOpen ? "" : "closed"}`}>
          {!rightOpen ? <button className="open-inspector" aria-label="Open inspector" onClick={() => setRightOpen(true)}><BookOpen size={17} /></button> : (
            <>
              <div className="inspector-header"><div><span className="eyebrow">Inspector</span><strong>{inspectorMode === "connections" ? "Connections" : selected ? "Place details" : "Canvas notes"}</strong></div><button aria-label="Close inspector" onClick={() => setRightOpen(false)}><X size={18} /></button></div>
              {inspectorMode === "connections" ? <ConnectionsPanel nodes={nodes} edges={edges} selectedId={selectedEdgeId} onSelect={selectConnection} onAdd={addConnection} onUpdate={updateConnection} onDelete={deleteConnection} /> : selected ? <div className="inspector-scroll">
                <div className="selected-summary"><span className="large-node-icon" style={{ color: entityMeta[selected.data.type]?.color }}>{(() => { const Icon = icons[selected.data.type] || MapPin; return <Icon size={22} />; })()}</span><div><strong>{selected.data.label}</strong><small>{selected.data.subtitle} · {relatedEdges.length} connections</small></div></div>
                <div className="form-grid">
                  <label className="span-two">Name<input value={selected.data.label} onChange={(event) => updateSelected("label", event.target.value)} /></label>
                  <label className="span-two">Kind<input value={selected.data.subtitle} onChange={(event) => updateSelected("subtitle", event.target.value)} /></label>
                  <label><CloudSun size={13} /> Climate<input value={selected.data.climate || ""} onChange={(event) => updateSelected("climate", event.target.value)} /></label>
                  <label><Users size={13} /> Population<input value={selected.data.population || ""} onChange={(event) => updateSelected("population", event.target.value)} /></label>
                  <label className="span-two"><Flag size={13} /> Ruler or faction<input value={selected.data.ruler || ""} onChange={(event) => updateSelected("ruler", event.target.value)} /></label>
                  <label className="span-two">Notes<textarea rows={3} value={selected.data.description || ""} onChange={(event) => updateSelected("description", event.target.value)} placeholder="What makes this place memorable?" /></label>
                </div>
                <section className="node-connections"><div><strong><Link2 size={13} /> Connected places</strong><button onClick={() => { setInspectorMode("connections"); setRightOpen(true); }}>Manage</button></div>{relatedEdges.map((edge) => { const other = nodes.find((node) => node.id === (edge.source === selectedId ? edge.target : edge.source)); return <button key={edge.id} className="node-route" onClick={() => selectConnection(edge.id)}><span style={{ background: connectionKinds[connectionKindOf(edge)].color }} /><div><strong>{other?.data.label || "Missing place"}</strong><small>{typeof edge.label === "string" ? edge.label : "Connection"}</small></div><ArrowRight size={13} /></button>; })}{!relatedEdges.length && <p>No connections yet. Use Manage to link this place to your world.</p>}</section>
                <section className="ai-section"><div className="ai-title"><span><WandSparkles size={15} /> Lore studio</span><small>Powered by Claude</small></div><p>Turn your map details into atmospheric history and story hooks.</p><textarea rows={2} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Optional direction, e.g. make it mysterious…" /><button className="generate-button" onClick={generateLore} disabled={generating}><Sparkles size={15} />{generating ? "Writing lore…" : lore ? "Regenerate lore" : "Generate lore"}</button>{(lore || generating) && <div className={`lore-card ${generating ? "streaming" : ""}`}>{lore ? <MarkdownLore text={lore} /> : <div className="lore-loading"><i /><i /><i /><span>Consulting the archive…</span></div>}</div>}</section>
                <button className="delete-node" onClick={deleteSelected}><Trash2 size={15} /> Delete place</button>
              </div> : <div className="nothing-selected"><MapPin size={25} /><h3>Select a place</h3><p>Choose a node on the map to edit its details and generate lore, or use Connections to link your places.</p></div>}
            </>
          )}
        </aside>
      </div>

      {showTemplates && (
        <div className="modal-backdrop" onMouseDown={() => setShowTemplates(false)}>
          <div className="templates-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" aria-label="Close templates" onClick={() => setShowTemplates(false)}><X size={18} /></button><span className="modal-icon"><LayoutTemplate size={20} /></span><p className="eyebrow">Jump-start your map</p><h2>World templates</h2>
            <p className="templates-sub">Drop in a themed set of places and connections. If your canvas already has places, you’ll be asked whether to replace or add to them.</p>
            <div className="templates-grid">{worldTemplates.map((template) => <button key={template.id} className="template-card" onClick={() => applyTemplate(template)} style={{ "--tpl": template.accent } as React.CSSProperties}><span className="template-swatch" /><strong>{template.name}</strong><small>{template.tagline}</small><em>{template.nodes.length} places · {template.edges.length} connections</em></button>)}<button className="template-card ghost" onClick={quickFill}><span className="template-swatch shuffle"><Shuffle size={17} /></span><strong>Surprise me</strong><small>Generate a random assortment of places to remix.</small><em>6 places · auto-linked</em></button></div>
          </div>
        </div>
      )}
    </div>
  );
}
