export const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// ── Location types — blue/green/earth family ─────────
export const LOCATION_TYPES_CONFIG = {
  location: { label:'Location', color:'#4C9FE8', icon:'📍', category:'location' },
  region:   { label:'Region',   color:'#33B88C', icon:'🗺️', category:'location' },
  faction:  { label:'Faction',  color:'#9D7BEA', icon:'⚔️', category:'location' },
  landmark: { label:'Landmark', color:'#E8B84C', icon:'🏛️', category:'location' },
  ruins:    { label:'Ruins',    color:'#E85D6B', icon:'🏚️', category:'location' },
  port:     { label:'Port',     color:'#E89B4C', icon:'⚓', category:'location' },
}

// ── Character types — pink/violet/amber family ───────
export const CHARACTER_TYPES_CONFIG = {
  protagonist: { label:'Protagonist', color:'#E85D9E', icon:'🌟', category:'character' },
  antagonist:  { label:'Antagonist',  color:'#C4374F', icon:'🗡️', category:'character' },
  ally:        { label:'Ally',        color:'#B98BEA', icon:'🤝', category:'character' },
  mentor:      { label:'Mentor',      color:'#EAA23B', icon:'📖', category:'character' },
  rival:       { label:'Rival',       color:'#E8734C', icon:'⚡', category:'character' },
  minor:       { label:'Minor',       color:'#8891A6', icon:'🎭', category:'character' },
}

// Combined lookup by type key, regardless of category
export const NODE_TYPES_CONFIG = { ...LOCATION_TYPES_CONFIG, ...CHARACTER_TYPES_CONFIG }

// ── Edge types: location <-> location ──────────────────
export const LOCATION_EDGE_TYPES = {
  trade:    { label:'Trade Route', color:'#33B88C', dash:false },
  border:   { label:'Border',      color:'#E85D6B', dash:false },
  alliance: { label:'Alliance',    color:'#4C9FE8', dash:true },
  conflict: { label:'Conflict',    color:'#E85D6B', dash:true },
  road:     { label:'Road',        color:'#E8B84C', dash:false },
  river:    { label:'River',       color:'#9D7BEA', dash:false },
}

// ── Edge types: character <-> character ─────────────────
export const CHARACTER_EDGE_TYPES = {
  kinship:     { label:'Family',      color:'#E85D9E', dash:false },
  loyalty:     { label:'Allied',      color:'#B98BEA', dash:false },
  mentorship:  { label:'Mentorship',  color:'#EAA23B', dash:false },
  rivalry:     { label:'Rivalry',     color:'#E8734C', dash:true },
  romance:     { label:'Romance',     color:'#D14FE0', dash:true },
  betrayal:    { label:'Betrayal',    color:'#C4374F', dash:true },
}

// ── Edge types: character <-> location ──────────────────
export const CROSS_EDGE_TYPES = {
  resides: { label:'Resides In',    color:'#4C9FE8', dash:false },
  rules:   { label:'Rules Over',    color:'#E8B84C', dash:false },
  born:    { label:'Born In',       color:'#33B88C', dash:true },
  exiled:  { label:'Exiled From',   color:'#C4374F', dash:true },
}

// Combined lookup for rendering any edge regardless of category pairing
export const EDGE_TYPES = { ...LOCATION_EDGE_TYPES, ...CHARACTER_EDGE_TYPES, ...CROSS_EDGE_TYPES }

// Which edge type set applies for a given pair of node categories
export function edgeOptionsFor(catA, catB) {
  if (catA === 'character' && catB === 'character') return CHARACTER_EDGE_TYPES
  if (catA === 'location' && catB === 'location') return LOCATION_EDGE_TYPES
  return CROSS_EDGE_TYPES
}

export const GENRES = ['Fantasy','Sci-Fi','Romance','Mystery','Thriller','Historical','Horror','Literary','Other']

export const STATUS_CONFIG = {
  drafting: { label:'Drafting',  color:'#4A90D9', bg:'rgba(74,144,217,.15)' },
  editing:  { label:'Editing',   color:'#C9A84C', bg:'rgba(201,168,76,.15)' },
  complete: { label:'Complete',  color:'#3FA87E', bg:'rgba(63,168,126,.15)' },
  paused:   { label:'Paused',    color:'#7A8499', bg:'rgba(122,132,153,.15)' },
}

export const COVER_COLORS = [
  '#4A90D9','#3FA87E','#8B6FD4','#C9A84C','#D85A5A',
  '#D4943A','#3D9BD4','#7AB87A','#C47AC0','#5B8FD4',
]

export const DEFAULT_NODES = [
  { id:'n1', type:'entityNode', position:{x:300,y:180},
    data:{ category:'location', label:'Capital City', nodeType:'location', description:'The seat of power.', climate:'Temperate', population:'100,000', ruler:'', chapter:'', lore:'' }},
  { id:'n2', type:'entityNode', position:{x:100,y:80},
    data:{ category:'location', label:'Ancient Forest', nodeType:'region', description:'A vast forest with secrets.', climate:'Temperate', population:'Unknown', ruler:'', chapter:'', lore:'' }},
  { id:'n3', type:'entityNode', position:{x:500,y:80},
    data:{ category:'location', label:'Mountain Pass', nodeType:'landmark', description:'The only crossing through the mountains.', climate:'Alpine', population:'500', ruler:'', chapter:'', lore:'' }},
  { id:'n4', type:'entityNode', position:{x:300,y:360},
    data:{ category:'character', label:'Kestrel Vane', nodeType:'protagonist', description:'A wandering knight searching for her missing brother.', role:'Wandering knight', age:'27', appearance:'Scarred, silver-eyed', chapter:'Ch. 1', lore:'' }},
]

export const DEFAULT_EDGES = [
  { id:'e-default-1', source:'n4', target:'n1', data:{ edgeType:'resides' } },
]
