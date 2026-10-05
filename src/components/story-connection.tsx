"use client";

import { BaseEdge, EdgeLabelRenderer, getBezierPath, useViewport, type EdgeProps } from "@xyflow/react";
import type { StoryEdge } from "@/lib/story-data";
import { connectionKinds, type ConnectionKind } from "@/lib/connections";

export default function StoryConnection({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  selected, label, data, markerEnd, style,
}: EdgeProps<StoryEdge>) {
  const { zoom } = useViewport();
  const kind = (data?.kind || "road") as ConnectionKind;
  const meta = connectionKinds[kind] || connectionKinds.road;
  const [path, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, curvature: 0.22,
  });
  const selectConnection = typeof data?.onSelect === "function" ? data.onSelect as (id: string) => void : undefined;

  return (
    <>
      <path
        d={path}
        className="connection-halo"
        fill="none"
        stroke="#faf7f1"
        strokeWidth={selected ? 8 : 6}
        vectorEffect="non-scaling-stroke"
        pointerEvents="none"
      />
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        interactionWidth={28}
        vectorEffect="non-scaling-stroke"
        style={{
          ...style,
          fill: "none",
          stroke: meta.color,
          strokeWidth: selected ? 4 : 3,
          strokeDasharray: meta.dash,
          strokeLinecap: "round",
          opacity: 1,
        }}
      />
      <EdgeLabelRenderer>
        <button
          type="button"
          className={`connection-label nodrag nopan ${selected ? "active" : ""}`}
          aria-label={`Edit connection: ${typeof label === "string" ? label : meta.label}`}
          onClick={(event) => { event.stopPropagation(); selectConnection?.(id); }}
          style={{
            transform: `translate(${labelX}px, ${labelY}px) scale(${1 / zoom}) translate(-50%, -50%)`,
            color: meta.color,
            borderColor: selected ? meta.color : undefined,
          }}
        >
          <span style={{ background: meta.color }} />
          {label || meta.label}
        </button>
      </EdgeLabelRenderer>
    </>
  );
}
