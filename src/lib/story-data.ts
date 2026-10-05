import type { Edge, Node } from "@xyflow/react";

export type EntityType = "city" | "region" | "landmark" | "faction" | "ruin" | "port";

export type StoryNodeData = {
  label: string;
  subtitle: string;
  type: EntityType;
  climate?: string;
  population?: string;
  ruler?: string;
  description?: string;
  [key: string]: unknown;
};

export type StoryNode = Node<StoryNodeData, "story">;
export type StoryEdge = Edge;

export const entityMeta: Record<EntityType, { label: string; color: string }> = {
  city: { label: "City", color: "#d99a56" },
  region: { label: "Region", color: "#8c9b73" },
  landmark: { label: "Landmark", color: "#b47b5b" },
  faction: { label: "Faction", color: "#88719d" },
  ruin: { label: "Ruin", color: "#8b8278" },
  port: { label: "Port", color: "#688c9d" },
};

export const starterNodes: StoryNode[] = [
  {
    id: "n-emberfall",
    type: "story",
    position: { x: 410, y: 255 },
    data: {
      label: "Emberfall",
      subtitle: "Capital City",
      type: "city",
      climate: "Temperate, ash-touched",
      population: "84,000",
      ruler: "Queen Seraphine III",
      description: "A many-tiered capital raised around the last living ember of an ancient star.",
    },
  },
  {
    id: "n-whisperwood",
    type: "story",
    position: { x: 85, y: 80 },
    data: {
      label: "The Whisperwood",
      subtitle: "Ancient Forest",
      type: "region",
      climate: "Cool and mist-laden",
      population: "Unknown",
      ruler: "The Verdant Court",
      description: "A listening forest where paths shift beneath silver leaves.",
    },
  },
  {
    id: "n-ironhold",
    type: "story",
    position: { x: 775, y: 62 },
    data: {
      label: "Ironhold",
      subtitle: "Mountain Fortress",
      type: "landmark",
      climate: "Alpine",
      population: "12,400",
      ruler: "Warden Kael Voss",
      description: "A black-stone fortress guarding the only pass through the northern teeth.",
    },
  },
  {
    id: "n-ashen",
    type: "story",
    position: { x: 820, y: 408 },
    data: {
      label: "Ashen Coast",
      subtitle: "Coastal Region",
      type: "region",
      climate: "Windy and volcanic",
      population: "31,000",
      ruler: "The Salt Council",
      description: "A dark coast of glass beaches, lighthouse monasteries, and storm ports.",
    },
  },
  {
    id: "n-starfall",
    type: "story",
    position: { x: 116, y: 470 },
    data: {
      label: "Starfall Ruins",
      subtitle: "Ancient Ruins",
      type: "ruin",
      climate: "Dry highlands",
      population: "Uninhabited",
      ruler: "None",
      description: "Broken observatories that still turn toward constellations no longer in the sky.",
    },
  },
];

export const starterEdges: StoryEdge[] = [
  { id: "e1", source: "n-whisperwood", target: "n-emberfall", label: "Old King’s Road", type: "smoothstep", animated: true },
  { id: "e2", source: "n-ironhold", target: "n-emberfall", label: "Iron Road", type: "smoothstep" },
  { id: "e3", source: "n-emberfall", target: "n-ashen", label: "Trade Route", type: "smoothstep", animated: true },
  { id: "e4", source: "n-starfall", target: "n-emberfall", label: "Pilgrim’s Way", type: "smoothstep" },
];

export function starterCanvas() {
  return { nodes: starterNodes, edges: starterEdges };
}

type TemplateNode = {
  ref: string;
  x: number;
  y: number;
  data: StoryNodeData;
};

type TemplateEdge = { from: string; to: string; label: string; animated?: boolean };

export type WorldTemplate = {
  id: string;
  name: string;
  tagline: string;
  accent: string;
  nodes: TemplateNode[];
  edges: TemplateEdge[];
};

export const worldTemplates: WorldTemplate[] = [
  {
    id: "fantasy-realm",
    name: "Classic Fantasy Realm",
    tagline: "A capital, wild frontiers, and old ruins to explore.",
    accent: "#a5573f",
    nodes: [
      { ref: "cap", x: 430, y: 250, data: { label: "Highcrown", subtitle: "Capital City", type: "city", climate: "Temperate", population: "72,000", ruler: "King Alden IV", description: "The seat of the realm, crowned by white towers." } },
      { ref: "forest", x: 110, y: 90, data: { label: "The Greenmarch", subtitle: "Ancient Forest", type: "region", climate: "Humid, misty", population: "Sparse", ruler: "The Wild Court", description: "A living forest older than any kingdom." } },
      { ref: "keep", x: 780, y: 95, data: { label: "Stormkeep", subtitle: "Mountain Fortress", type: "landmark", climate: "Alpine", population: "9,500", ruler: "Lord Commander Rhys", description: "Guards the only pass into the northern wastes." } },
      { ref: "port", x: 800, y: 430, data: { label: "Saltharbor", subtitle: "Trade Port", type: "port", climate: "Coastal", population: "28,000", ruler: "The Merchant Guilds", description: "Where every ship and every rumor eventually docks." } },
      { ref: "ruin", x: 130, y: 460, data: { label: "The Sunken Spire", subtitle: "Ancient Ruins", type: "ruin", climate: "Marsh", population: "Uninhabited", ruler: "None", description: "A drowned tower said to whisper the names of the dead." } },
      { ref: "order", x: 470, y: 500, data: { label: "The Ashen Order", subtitle: "Secret Faction", type: "faction", climate: "—", population: "~300 sworn", ruler: "The Grey Prior", description: "A hidden order sworn to keep the old seals unbroken." } },
    ],
    edges: [
      { from: "forest", to: "cap", label: "King's Road", animated: true },
      { from: "keep", to: "cap", label: "The High Pass" },
      { from: "cap", to: "port", label: "Trade Route", animated: true },
      { from: "ruin", to: "cap", label: "Pilgrim's Way" },
      { from: "order", to: "cap", label: "Hidden Ties" },
      { from: "order", to: "ruin", label: "Sworn Watch" },
    ],
  },
  {
    id: "scifi-system",
    name: "Sci-Fi Star System",
    tagline: "Colonies, stations, and derelicts around a dying sun.",
    accent: "#4c5286",
    nodes: [
      { ref: "core", x: 430, y: 250, data: { label: "Veyra Prime", subtitle: "Core World", type: "city", climate: "Domed, arid", population: "4.1 million", ruler: "The Directorate", description: "The administrative heart of the frontier system." } },
      { ref: "mine", x: 120, y: 110, data: { label: "Tessel Belt", subtitle: "Mining Colony", type: "region", climate: "Vacuum", population: "18,000", ruler: "Foreman's Union", description: "Asteroid rigs stripping ore from a shattered moon." } },
      { ref: "station", x: 790, y: 110, data: { label: "Halcyon Station", subtitle: "Orbital Port", type: "port", climate: "Controlled", population: "60,000", ruler: "Dockmaster AI 'Wren'", description: "A ring station and the system's only neutral ground." } },
      { ref: "derelict", x: 800, y: 440, data: { label: "The Silent Ark", subtitle: "Derelict Ship", type: "ruin", climate: "Dead", population: "0", ruler: "None", description: "A generation ship that answered no hails for 200 years." } },
      { ref: "rebels", x: 150, y: 460, data: { label: "The Ember Cells", subtitle: "Rebel Faction", type: "faction", climate: "—", population: "Unknown", ruler: "Commander Vos", description: "Frontier separatists fighting the Directorate's tithes." } },
    ],
    edges: [
      { from: "mine", to: "core", label: "Ore Route", animated: true },
      { from: "station", to: "core", label: "Transit Lane", animated: true },
      { from: "derelict", to: "station", label: "Salvage Claim" },
      { from: "rebels", to: "mine", label: "Supply Line" },
      { from: "rebels", to: "core", label: "Blockade" },
    ],
  },
  {
    id: "coastal-network",
    name: "Coastal Trade Network",
    tagline: "Rival ports and city-states along a busy sea.",
    accent: "#477f82",
    nodes: [
      { ref: "a", x: 130, y: 130, data: { label: "Port Meridian", subtitle: "Free Port", type: "port", climate: "Warm, humid", population: "44,000", ruler: "The Tide Council", description: "The oldest and greediest of the trade ports." } },
      { ref: "b", x: 470, y: 90, data: { label: "Coral Reach", subtitle: "Island City", type: "city", climate: "Tropical", population: "31,000", ruler: "Governor Lyle", description: "Built on stilts above a glowing reef." } },
      { ref: "c", x: 800, y: 160, data: { label: "Graystone", subtitle: "Fortified Port", type: "port", climate: "Cold, foggy", population: "22,000", ruler: "Admiral Corrin", description: "A naval stronghold guarding the northern straits." } },
      { ref: "d", x: 300, y: 430, data: { label: "The Drowned Market", subtitle: "Smuggler Haven", type: "landmark", climate: "Tidal", population: "Fluid", ruler: "The Whisper Broker", description: "A market that only exists at low tide." } },
      { ref: "e", x: 700, y: 450, data: { label: "The Salt Pact", subtitle: "Merchant Faction", type: "faction", climate: "—", population: "12 houses", ruler: "The First Ledger", description: "A cartel that sets the price of everything at sea." } },
    ],
    edges: [
      { from: "a", to: "b", label: "Spice Route", animated: true },
      { from: "b", to: "c", label: "Northern Run", animated: true },
      { from: "a", to: "d", label: "Smuggler's Path" },
      { from: "e", to: "a", label: "Controls" },
      { from: "e", to: "c", label: "Controls" },
      { from: "d", to: "e", label: "Debts" },
    ],
  },
];

export function instantiateTemplate(template: WorldTemplate, seed = Date.now()) {
  const idMap = new Map<string, string>();
  const nodes: StoryNode[] = template.nodes.map((node, index) => {
    const id = `n-${seed}-${index}`;
    idMap.set(node.ref, id);
    return { id, type: "story", position: { x: node.x, y: node.y }, data: { ...node.data } };
  });
  const edges: StoryEdge[] = template.edges.map((edge, index) => ({
    id: `e-${seed}-${index}`,
    source: idMap.get(edge.from)!,
    target: idMap.get(edge.to)!,
    label: edge.label,
    type: "smoothstep",
    animated: edge.animated,
  }));
  return { nodes, edges };
}

const nameParts = {
  city: ["Ravenmoor", "Goldvale", "Duskhaven", "Fenwick", "Highreach", "Thornbury"],
  region: ["The Pale Reaches", "Mirewood", "The Ashlands", "Frostmere Vale", "The Hollow Downs"],
  landmark: ["The Iron Gate", "Weeping Falls", "The Old Beacon", "Giant's Rest", "The Broken Arch"],
  faction: ["The Crimson Hand", "Order of the Veil", "The Free Companies", "House Vanmoor"],
  ruin: ["Blackmere Ruins", "The Fallen Temple", "Ossary Deep", "The Ghost Bastion"],
  port: ["Windward Dock", "Copperbay", "The Long Wharf", "Saltcliff"],
} satisfies Record<EntityType, string[]>;

const climates = ["Temperate", "Cold and foggy", "Arid highlands", "Humid and green", "Storm-battered", "Frozen"];

function pick<T>(list: T[]) {
  return list[Math.floor(Math.random() * list.length)];
}

export function quickFillCanvas(count = 5) {
  const types: EntityType[] = ["city", "region", "landmark", "faction", "ruin", "port"];
  const seed = Date.now();
  const nodes: StoryNode[] = Array.from({ length: count }).map((_, index) => {
    const type = index === 0 ? "city" : pick(types);
    const meta = entityMeta[type];
    const angle = (index / count) * Math.PI * 2;
    return {
      id: `n-${seed}-${index}`,
      type: "story",
      position: { x: 430 + Math.cos(angle) * 300, y: 280 + Math.sin(angle) * 200 },
      data: {
        label: pick(nameParts[type]),
        subtitle: meta.label,
        type,
        climate: pick(climates),
        population: type === "ruin" || type === "faction" ? "Unknown" : `${Math.floor(3 + Math.random() * 90)},000`,
        ruler: "Unknown",
        description: "",
      },
    };
  });
  const edges: StoryEdge[] = nodes.slice(1).map((node, index) => ({
    id: `e-${seed}-${index}`,
    source: nodes[0].id,
    target: node.id,
    label: "Route",
    type: "smoothstep",
    animated: index % 2 === 0,
  }));
  return { nodes, edges };
}

