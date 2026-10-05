import type { StoryEdge } from "@/lib/story-data";

export const connectionKinds = {
  road: { label: "Road", color: "#87603d", dash: undefined },
  trade: { label: "Trade route", color: "#ad5836", dash: "8 5" },
  alliance: { label: "Alliance", color: "#4b775b", dash: undefined },
  conflict: { label: "Conflict", color: "#b13b42", dash: "5 5" },
  river: { label: "River", color: "#3f779e", dash: undefined },
  border: { label: "Border", color: "#80659a", dash: "3 5" },
} as const;

export type ConnectionKind = keyof typeof connectionKinds;
export const connectionKindKeys = Object.keys(connectionKinds) as ConnectionKind[];

export function connectionKindOf(edge: StoryEdge): ConnectionKind {
  const savedKind = edge.data?.kind;
  if (typeof savedKind === "string" && Object.hasOwn(connectionKinds, savedKind)) return savedKind as ConnectionKind;
  const label = typeof edge.label === "string" ? edge.label.toLowerCase() : "";
  if (/trade|spice|ore|supply|transit|shipping/.test(label)) return "trade";
  if (/conflict|war|blockade|enemy/.test(label)) return "conflict";
  if (/river|water/.test(label)) return "river";
  if (/border|boundary/.test(label)) return "border";
  if (/alliance|ties|pact|watch|controls/.test(label)) return "alliance";
  return "road";
}

export function makeConnection(source: string, target: string, kind: ConnectionKind, label?: string): StoryEdge {
  return {
    id: `e-${crypto.randomUUID()}`,
    source,
    target,
    sourceHandle: "out",
    targetHandle: "in",
    type: "storyConnection",
    label: label?.trim() || connectionKinds[kind].label,
    data: { kind },
  };
}
