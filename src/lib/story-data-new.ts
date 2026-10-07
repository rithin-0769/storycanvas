
const genreNameParts: Record<string, Record<EntityType, string[]>> = {
  "Science Fiction": {
    city: ["Neo-Veridia", "Ares Station", "Sector 4", "Outpost Delta", "Titan's Reach", "Ceres Prime"],
    region: ["The Asteroid Belt", "Kuiper Expanse", "The Dead Zone", "Sirius Sector", "Helios Core"],
    landmark: ["The Dyson Sphere", "Abandoned Relays", "The Plasma Storm", "Crashed Dreadnought", "The Singularity Point"],
    faction: ["Terran Federation", "The Syndicate", "Starborn Alliance", "Void Scavengers"],
    ruin: ["Derelict Cruiser", "Ruined Colony", "The Shattered Array", "Dead Station"],
    port: ["Orbital Dock", "Space Elevator Base", "Hyperlane Hub", "Smuggler's Cove"],
    character: ["Dr. Aris Thorne", "Commander Shepard", "Jax 'Glitch' Vane", "Elara Sol", "Captain Reiss", "Zane"],
  },
  "Epic Fantasy": {
    city: ["Ravenmoor", "Goldvale", "Duskhaven", "Fenwick", "Highreach", "Thornbury"],
    region: ["The Pale Reaches", "Mirewood", "The Ashlands", "Frostmere Vale", "The Hollow Downs"],
    landmark: ["The Iron Gate", "Weeping Falls", "The Old Beacon", "Giant's Rest", "The Broken Arch"],
    faction: ["The Crimson Hand", "Order of the Veil", "The Free Companies", "House Vanmoor"],
    ruin: ["Blackmere Ruins", "The Fallen Temple", "Ossary Deep", "The Ghost Bastion"],
    port: ["Windward Dock", "Copperbay", "The Long Wharf", "Saltcliff"],
    character: ["Aria Sunstrike", "Kaelen", "Thane of Fenwick", "Elara", "Garrick", "Seraphina"],
  },
  "Dark Fantasy": {
    city: ["Gloomhaven", "Blackridge", "Murkwell", "Shadowfall", "Grimhold"],
    region: ["The Cursed Moors", "Blightwood", "The Wasting Marshes", "Bloodfen"],
    landmark: ["The Weeping Obelisk", "The Bone Spine", "Traitor's Mount"],
    faction: ["Cult of the Worm", "The Silent Brethren", "Bloodsworn"],
    ruin: ["The Desecrated Abbey", "Ruins of Aethelgard", "The Shattered Keep"],
    port: ["Smuggler's Rot", "Deadman's Bay", "The Gloomy Wharf"],
    character: ["Vane the Betrayer", "Lady Morwen", "Ghul", "Silas The Mad"],
  },
  "Urban Fantasy": {
    city: ["New York (Hidden)", "London Under", "The Shroud City", "Neon Veil"],
    region: ["The Warrens", "The Sub-Way", "Vampire District", "Fae Territory"],
    landmark: ["The Clocktower", "Grand Central Nexus", "The Midnight Market"],
    faction: ["The Night Watch", "Coven of the Moon", "The Lycan Brotherhood"],
    ruin: ["The Abandoned Subway", "The Forgotten Factory", "Burned Asylum"],
    port: ["Pier 9 (Hidden)", "The Ghost Ferries", "Shadow Docks"],
    character: ["Detective Vance", "Lilith", "Rowan (Warlock)", "Marcus (Vampire)"],
  },
  "Weird West": {
    city: ["Dust Creek", "Redwater", "Tumbleweed", "Gallows Hill"],
    region: ["The Badlands", "The Painted Desert", "Scorched Earth"],
    landmark: ["Devil's Anvil", "The Hanging Tree", "Snakebite Canyon"],
    faction: ["The Pinkertons", "Cult of the Horned Snake", "The Outlaws"],
    ruin: ["Abandoned Mine", "Ghost Town", "The Burned Mission"],
    port: ["Muddy Banks", "Steamboat Wreck", "River End"],
    character: ["Wyatt", "Silas 'Snake-Eye'", "Calamity Jane", "Preacher Ezekiel"],
  }
};

const defaultNameParts = genreNameParts["Epic Fantasy"];

const genreClimates: Record<string, string[]> = {
  "Science Fiction": ["Vacuum", "Artificial, Climate-Controlled", "Toxic Atmosphere", "Frozen Wasteland", "Desert, High-Radiation"],
  "Epic Fantasy": ["Temperate", "Cold and foggy", "Arid highlands", "Humid and green", "Storm-battered", "Frozen"],
  "Dark Fantasy": ["Oppressive, dark", "Constant freezing rain", "Stagnant marsh", "Dead ash-falls"],
  "Urban Fantasy": ["Smoggy", "Endless rain", "Neon-lit fog", "Unnaturally cold"],
  "Weird West": ["Scorching sun", "Dust storms", "Arid", "Dry and windy"]
};

function pick<T>(list: T[]) {
  return list[Math.floor(Math.random() * list.length)];
}

export function quickFillCanvas(count = 5, genre?: string) {
  const parts = (genre && genreNameParts[genre]) ? genreNameParts[genre] : defaultNameParts;
  const climatesList = (genre && genreClimates[genre]) ? genreClimates[genre] : genreClimates["Epic Fantasy"];
  const types: EntityType[] = ["city", "region", "landmark", "faction", "ruin", "port", "character"];
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
        label: pick(parts[type]),
        subtitle: meta.label,
        type,
        climate: pick(climatesList),
        population: type === "character" ? "1" : (type === "ruin" || type === "faction" ? "Unknown" : `${Math.floor(3 + Math.random() * 90)},000`),
        ruler: type === "character" ? undefined : "Unknown",
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
