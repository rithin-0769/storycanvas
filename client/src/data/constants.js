export const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export const NODE_TYPES_CONFIG = {
  location: { label:'Location', color:'#4A90D9', icon:'📍' },
  region:   { label:'Region',   color:'#3FA87E', icon:'🗺️' },
  faction:  { label:'Faction',  color:'#8B6FD4', icon:'⚔️' },
  landmark: { label:'Landmark', color:'#C9A84C', icon:'🏛️' },
  ruins:    { label:'Ruins',    color:'#D85A5A', icon:'🏚️' },
  port:     { label:'Port',     color:'#D4943A', icon:'⚓' },
}

export const EDGE_TYPES = {
  trade:    { label:'Trade Route', color:'#3FA87E', dash:false },
  border:   { label:'Border',      color:'#D85A5A', dash:false },
  alliance: { label:'Alliance',    color:'#4A90D9', dash:true },
  conflict: { label:'Conflict',    color:'#D85A5A', dash:true },
  road:     { label:'Road',        color:'#C9A84C', dash:false },
  river:    { label:'River',       color:'#8B6FD4', dash:false },
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
  { id:'n1', type:'locationNode', position:{x:260,y:160},
    data:{ label:'Capital City', nodeType:'location', description:'The seat of power.', climate:'Temperate', population:'100,000', ruler:'', chapter:'', lore:'' }},
  { id:'n2', type:'locationNode', position:{x:80,y:80},
    data:{ label:'Ancient Forest', nodeType:'region', description:'A vast forest with secrets.', climate:'Temperate', population:'Unknown', ruler:'', chapter:'', lore:'' }},
  { id:'n3', type:'locationNode', position:{x:440,y:80},
    data:{ label:'Mountain Pass', nodeType:'landmark', description:'The only crossing through the mountains.', climate:'Alpine', population:'500', ruler:'', chapter:'', lore:'' }},
]