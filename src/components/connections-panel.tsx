"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Link2, Plus, Route, Trash2 } from "lucide-react";
import type { StoryEdge, StoryNode } from "@/lib/story-data";
import { connectionKindKeys, connectionKindOf, connectionKinds, type ConnectionKind } from "@/lib/connections";

type Props = {
  nodes: StoryNode[];
  edges: StoryEdge[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (source: string, target: string, kind: ConnectionKind, label: string) => void;
  onUpdate: (id: string, update: Partial<StoryEdge>) => void;
  onDelete: (id: string) => void;
};

export default function ConnectionsPanel({ nodes, edges, selectedId, onSelect, onAdd, onUpdate, onDelete }: Props) {
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [kind, setKind] = useState<ConnectionKind>("road");
  const [label, setLabel] = useState("");
  const source = nodes.some((node) => node.id === fromId) ? fromId : nodes[0]?.id || "";
  const target = nodes.some((node) => node.id === toId && node.id !== source) ? toId : nodes.find((node) => node.id !== source)?.id || "";
  const selected = edges.find((edge) => edge.id === selectedId);
  const titleOf = (id: string) => nodes.find((node) => node.id === id)?.data.label || "Missing place";
  const duplicate = edges.some((edge) => edge.source === source && edge.target === target && connectionKindOf(edge) === kind);

  function add(event: FormEvent) {
    event.preventDefault();
    if (!source || !target || source === target || duplicate) return;
    onAdd(source, target, kind, label);
    setLabel("");
  }

  return (
    <div className="inspector-scroll connections-panel">
      <div className="connections-intro"><Route size={19} /><div><strong>{edges.length} {edges.length === 1 ? "connection" : "connections"}</strong><p>Click a route on the map or choose one below.</p></div></div>
      <nav className="connection-list" aria-label="Canvas connections">
        {edges.map((edge) => {
          const meta = connectionKinds[connectionKindOf(edge)];
          return (
            <button key={edge.id} type="button" className={edge.id === selectedId ? "active" : ""} onClick={() => onSelect(edge.id)} aria-pressed={edge.id === selectedId}>
              <span className="route-color" style={{ background: meta.color }} />
              <span><strong>{typeof edge.label === "string" && edge.label ? edge.label : meta.label}</strong><small>{titleOf(edge.source)} <ArrowRight size={11} /> {titleOf(edge.target)}</small></span>
            </button>
          );
        })}
        {!edges.length && <p className="no-connections">No routes yet. Connect two places using the form below, or drag between the visible dots on your nodes.</p>}
      </nav>

      {selected && (
        <section className="connection-edit" aria-label="Edit selected connection">
          <h3><Link2 size={14} /> Edit connection</h3>
          <p>{titleOf(selected.source)} <ArrowRight size={13} /> {titleOf(selected.target)}</p>
          <label>Connection name<input aria-label="Connection name" value={typeof selected.label === "string" ? selected.label : ""} onChange={(event) => onUpdate(selected.id, { label: event.target.value })} /></label>
          <label>Relationship type<select aria-label="Relationship type" value={connectionKindOf(selected)} onChange={(event) => onUpdate(selected.id, { data: { ...selected.data, kind: event.target.value } })}>{connectionKindKeys.map((key) => <option key={key} value={key}>{connectionKinds[key].label}</option>)}</select></label>
          <button className="delete-node" type="button" onClick={() => onDelete(selected.id)}><Trash2 size={14} /> Delete connection</button>
        </section>
      )}

      <form className="connection-create" onSubmit={add}>
        <h3><Plus size={15} /> Add a connection</h3>
        <label>From place<select aria-label="From place" value={source} disabled={!nodes.length} onChange={(event) => setFromId(event.target.value)}>{!nodes.length && <option value="">Add a place first</option>}{nodes.map((node) => <option key={node.id} value={node.id}>{node.data.label}</option>)}</select></label>
        <label>To place<select aria-label="To place" value={target} disabled={nodes.length < 2} onChange={(event) => setToId(event.target.value)}>{nodes.length < 2 && <option value="">Add another place</option>}{nodes.filter((node) => node.id !== source).map((node) => <option key={node.id} value={node.id}>{node.data.label}</option>)}</select></label>
        <label>Connection type<select aria-label="Connection type" value={kind} onChange={(event) => setKind(event.target.value as ConnectionKind)}>{connectionKindKeys.map((key) => <option key={key} value={key}>{connectionKinds[key].label}</option>)}</select></label>
        <label>Route name (optional)<input aria-label="Route name (optional)" value={label} onChange={(event) => setLabel(event.target.value)} placeholder={`e.g. ${kind === "trade" ? "The Silk Route" : "The Old Road"}`} /></label>
        <button className="primary-button full" disabled={nodes.length < 2 || !target || duplicate}><Link2 size={15} /> Add connection</button>
        {nodes.length < 2 && <p>Add at least two places to draw a connection.</p>}
        {duplicate && <p>This relationship already connects these places. Choose a different type or another destination.</p>}
      </form>
    </div>
  );
}
