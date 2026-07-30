import { useCallback, useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactFlow, {
  Background, Controls, MiniMap,
  addEdge, applyNodeChanges, applyEdgeChanges,
  ConnectionLineType, MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useBooks } from '../hooks/useBooks'
import {
  NODE_TYPES_CONFIG, LOCATION_TYPES_CONFIG, CHARACTER_TYPES_CONFIG,
  EDGE_TYPES, edgeOptionsFor, DEFAULT_NODES, DEFAULT_EDGES,
} from '../data/constants'
import { Btn, Modal, Spinner } from '../components/ui'
import { ArrowLeft, Plus, Download, Map, Sparkles, X, Loader, MapPin, Users, LayoutGrid } from 'lucide-react'
import { Handle, Position } from 'reactflow'

// ── Entity Node (location or character) ──────────────
function EntityNode({ data, selected }) {
  const cfg = NODE_TYPES_CONFIG[data.nodeType] || LOCATION_TYPES_CONFIG.location
  const c = cfg.color
  const isCharacter = data.category === 'character'
  return (
    <div style={{
      background: selected ? `linear-gradient(160deg, ${c}22, #1E2A44)` : '#161D2E',
      border: `1.5px solid ${selected ? c : c+'55'}`,
      borderRadius: 14, padding:'11px 15px', minWidth:136, maxWidth:186,
      boxShadow: selected ? `0 0 0 3px ${c}22, 0 10px 28px rgba(0,0,0,.5)` : '0 2px 12px rgba(0,0,0,.4)',
      transition:'all .22s cubic-bezier(.2,.8,.3,1)', cursor:'pointer', fontFamily:'var(--font-body)',
      transform: selected ? 'translateY(-2px) scale(1.02)' : 'none',
    }}>
      {[Position.Top,Position.Bottom,Position.Left,Position.Right].map(p=>(
        <Handle key={p} type={p===Position.Top||p===Position.Left?'target':'source'} position={p}
          style={{ background:c, border:'none', width:8, height:8, boxShadow:`0 0 5px ${c}` }}/>
      ))}
      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5 }}>
        {isCharacter ? (
          <div style={{
            width:16, height:16, borderRadius:'50%', flexShrink:0,
            background:`radial-gradient(circle at 35% 30%, ${c}, ${c}99)`,
            boxShadow:`0 0 7px ${c}88`, display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:8,
          }}>{cfg.icon}</div>
        ) : (
          <div style={{ width:8, height:8, borderRadius:'50%', background:c, boxShadow:`0 0 6px ${c}`, flexShrink:0 }}/>
        )}
        <span style={{ fontSize:9, color:c, fontWeight:600, textTransform:'uppercase', letterSpacing:.8 }}>{cfg.label}</span>
      </div>
      <div style={{ fontSize:12, fontWeight:600, color:'#F4F0EA', lineHeight:1.3, wordBreak:'break-word' }}>{data.label}</div>
      {!isCharacter && data.population && <div style={{ fontSize:10, color:'#7A8499', marginTop:4 }}>Pop. {data.population}</div>}
      {isCharacter && data.role && <div style={{ fontSize:10, color:'#7A8499', marginTop:4 }}>{data.role}{data.age?` · ${data.age}`:''}</div>}
      {data.chapter && (
        <div style={{ marginTop:5, fontSize:9, color:'#7A8499', background:'rgba(255,255,255,.04)', borderRadius:4, padding:'2px 6px', display:'inline-block' }}>
          {data.chapter}
        </div>
      )}
    </div>
  )
}

const nodeTypes = { entityNode: EntityNode }

function buildEdgeStyle(edgeType) {
  const cfg = EDGE_TYPES[edgeType] || EDGE_TYPES.trade
  return {
    style: { stroke:cfg.color, strokeWidth:1.8, strokeDasharray:cfg.dash?'6 4':undefined },
    markerEnd: { type:MarkerType.ArrowClosed, color:cfg.color, width:13, height:13 },
    label:cfg.label, type:'smoothstep', animated: !!cfg.dash,
    labelStyle:{ fill:cfg.color, fontSize:10, fontWeight:600, fontFamily:'Inter,sans-serif' },
    labelBgStyle:{ fill:'#0A0E17', fillOpacity:.88 },
    labelBgPadding:[4,2], labelBgBorderRadius:4,
  }
}
const stripEdge = ({ style, markerEnd, labelStyle, labelBgStyle, labelBgPadding, labelBgBorderRadius, animated, ...r }) => r

// ── Node Sidebar ─────────────────────────────────────
function NodeSidebar({ node, onUpdate, onDelete, onClose }) {
  const [tab, setTab] = useState('details')
  const [aiText, setAiText] = useState(node.data.lore || '')
  const [aiLoading, setAiLoading] = useState(false)
  const cfg = NODE_TYPES_CONFIG[node.data.nodeType] || LOCATION_TYPES_CONFIG.location
  const c = cfg.color
  const isCharacter = node.data.category === 'character'
  const categoryTypes = isCharacter ? CHARACTER_TYPES_CONFIG : LOCATION_TYPES_CONFIG
  const upd = (k,v) => onUpdate(node.id, { ...node.data, [k]:v })

  const expandLore = async () => {
    setAiLoading(true); setAiText(''); setTab('ai')
    try {
      const prompt = isCharacter
        ? `Write 2 paragraphs of rich, atmospheric character lore. Dark epic fantasy tone.\n\nName: ${node.data.label}\nRole: ${cfg.label}\nDescription: ${node.data.description}\nAge: ${node.data.age}\nAppearance: ${node.data.appearance}`
        : `Write 2 paragraphs of rich, atmospheric lore for this fictional location. Dark epic fantasy tone.\n\nLocation: ${node.data.label}\nType: ${cfg.label}\nDescription: ${node.data.description}\nClimate: ${node.data.climate}\nPopulation: ${node.data.population}\nRuler: ${node.data.ruler}`
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:900, stream:true, messages:[{ role:'user', content:prompt }] }),
      })
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf=''
      while(true) {
        const { done, value } = await reader.read(); if(done) break
        buf += dec.decode(value,{stream:true})
        const lines = buf.split('\n'); buf = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try { const e = JSON.parse(line.slice(6)); if(e.delta?.text) setAiText(p=>p+e.delta.text) } catch {}
        }
      }
    } catch { setAiText('Could not reach AI. Please try again.') }
    setAiLoading(false)
  }

  const F = ({ label, field, multi }) => (
    <div style={{ marginBottom:13 }}>
      <label style={{ fontSize:10, color:'var(--slate)', fontWeight:600, textTransform:'uppercase', letterSpacing:.7, display:'block', marginBottom:5 }}>{label}</label>
      {multi
        ? <textarea value={node.data[field]||''} onChange={e=>upd(field,e.target.value)} rows={3}
            style={{ width:'100%', background:'rgba(255,255,255,.04)', border:'1px solid var(--border2)', borderRadius:'var(--r-sm)', color:'var(--white)', fontSize:12, padding:'7px 10px', resize:'vertical', lineHeight:1.6, transition:'border-color .15s' }}/>
        : <input value={node.data[field]||''} onChange={e=>upd(field,e.target.value)}
            style={{ width:'100%', background:'rgba(255,255,255,.04)', border:'1px solid var(--border2)', borderRadius:'var(--r-sm)', color:'var(--white)', fontSize:12, padding:'6px 10px', transition:'border-color .15s' }}/>
      }
    </div>
  )

  return (
    <div className="anim-slide-l" style={{
      position:'absolute', right:0, top:0, bottom:0, width:290,
      background:'var(--ink2)', borderLeft:'1px solid var(--border)',
      display:'flex', flexDirection:'column', zIndex:10, fontFamily:'var(--font-body)',
    }}>
      <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:9 }}>
        <div style={{ width:9, height:9, borderRadius:'50%', background:c, boxShadow:`0 0 7px ${c}` }}/>
        <div style={{ flex:1, minWidth:0 }}>
          <input value={node.data.label} onChange={e=>upd('label',e.target.value)}
            style={{ background:'transparent', border:'none', color:'var(--white)', fontSize:14, fontWeight:600, width:'100%', fontFamily:'var(--font-body)' }}/>
          <div style={{ fontSize:10, color:c }}>{cfg.icon} {cfg.label}</div>
        </div>
        <button onClick={onClose} style={{ background:'transparent', color:'var(--slate)', padding:4 }}><X size={15}/></button>
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid var(--border)' }}>
        {[['details','Details'],['ai','✦ AI Lore']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{
            flex:1, padding:'9px', fontSize:12, fontWeight:500, background:'transparent',
            color:tab===id?'var(--white)':'var(--slate)',
            borderBottom:tab===id?`2px solid ${c}`:'2px solid transparent', transition:'all .2s cubic-bezier(.2,.8,.3,1)',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:14 }}>
        {tab==='details' && (
          <div className="anim-fade">
            <div style={{ marginBottom:13 }}>
              <label style={{ fontSize:10, color:'var(--slate)', fontWeight:600, textTransform:'uppercase', letterSpacing:.7, display:'block', marginBottom:6 }}>Type</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {Object.entries(categoryTypes).map(([key,v])=>(
                  <button key={key} onClick={()=>upd('nodeType',key)} style={{
                    fontSize:10, padding:'3px 9px', borderRadius:20,
                    background:node.data.nodeType===key?`${v.color}20`:'rgba(255,255,255,.04)',
                    border:`1px solid ${node.data.nodeType===key?v.color:'rgba(255,255,255,.1)'}`,
                    color:node.data.nodeType===key?v.color:'var(--slate)', transition:'all .2s cubic-bezier(.2,.8,.3,1)',
                  }}>{v.icon} {v.label}</button>
                ))}
              </div>
            </div>
            <F label="Description" field="description" multi/>
            {isCharacter ? (
              <>
                <F label="Role" field="role"/>
                <F label="Age" field="age"/>
                <F label="Appearance" field="appearance"/>
              </>
            ) : (
              <>
                <F label="Climate" field="climate"/>
                <F label="Population" field="population"/>
                <F label="Ruler" field="ruler"/>
              </>
            )}
            <F label="Appears in" field="chapter"/>
            {node.data.lore && (
              <div style={{ marginBottom:13 }}>
                <label style={{ fontSize:10, color:'var(--slate)', fontWeight:600, textTransform:'uppercase', letterSpacing:.7, display:'block', marginBottom:5 }}>Saved Lore</label>
                <div style={{ fontSize:11, color:'var(--slate2)', lineHeight:1.7, background:'rgba(255,255,255,.03)', borderRadius:'var(--r-sm)', padding:'9px 11px', maxHeight:110, overflowY:'auto' }}>{node.data.lore}</div>
              </div>
            )}
          </div>
        )}
        {tab==='ai' && (
          <div className="anim-fade">
            <p style={{ fontSize:12, color:'var(--slate)', lineHeight:1.6, marginBottom:13 }}>
              Generate lore for <strong style={{ color:'var(--white)' }}>{node.data.label}</strong> using Claude AI.
            </p>
            <button onClick={expandLore} disabled={aiLoading} style={{
              width:'100%', padding:'9px', background:aiLoading?'rgba(201,168,76,.08)':'rgba(201,168,76,.14)',
              border:'1px solid rgba(201,168,76,.32)', borderRadius:'var(--r-sm)', color:'var(--gold)',
              fontSize:12, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:7, marginBottom:14,
              transition:'all .2s cubic-bezier(.2,.8,.3,1)',
            }}>
              {aiLoading?<><Loader size={13} style={{ animation:'spin 1s linear infinite' }}/> Generating...</>:<><Sparkles size={13}/> Expand lore with AI</>}
            </button>
            {aiText && (
              <>
                <div style={{ fontSize:12, color:'var(--slate2)', lineHeight:1.8, background:'rgba(255,255,255,.03)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', padding:'11px 13px', marginBottom:10, whiteSpace:'pre-wrap', maxHeight:260, overflowY:'auto' }}>
                  {aiText}{aiLoading&&<span style={{ animation:'pulse 1s infinite', display:'inline-block', marginLeft:2 }}>▋</span>}
                </div>
                {!aiLoading&&<button onClick={()=>{ upd('lore',aiText); setTab('details') }} style={{ width:'100%', padding:'8px', background:'var(--gold)', color:'#0A0E17', borderRadius:'var(--r-sm)', fontSize:12, fontWeight:600 }}>Save to node</button>}
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ padding:'11px 14px', borderTop:'1px solid var(--border)' }}>
        <button onClick={()=>onDelete(node.id)} style={{
          width:'100%', padding:'7px', background:'rgba(216,90,90,.1)', border:'1px solid rgba(216,90,90,.28)',
          borderRadius:'var(--r-sm)', color:'var(--red)', fontSize:12, fontWeight:500, transition:'background .2s',
        }}
        onMouseEnter={e=>e.currentTarget.style.background='rgba(216,90,90,.18)'}
        onMouseLeave={e=>e.currentTarget.style.background='rgba(216,90,90,.1)'}
        >Delete {isCharacter ? 'character' : 'location'}</button>
      </div>
    </div>
  )
}

// ── Add Node Modal ───────────────────────────────────
function AddNodeModal({ defaultCategory, onAdd, onClose }) {
  const firstOfCategory = (cat) => Object.keys(cat === 'character' ? CHARACTER_TYPES_CONFIG : LOCATION_TYPES_CONFIG)[0]
  const [category, setCategory] = useState(defaultCategory || 'location')
  const [form, setForm] = useState({ label:'', nodeType:firstOfCategory(defaultCategory||'location'), description:'', climate:'', population:'', ruler:'', role:'', age:'', appearance:'', chapter:'' })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const switchCategory = (cat) => { setCategory(cat); set('nodeType', firstOfCategory(cat)) }
  const submit = () => { if(!form.label.trim()) return; onAdd({...form, category, lore:''}); onClose() }
  const activeTypes = category === 'character' ? CHARACTER_TYPES_CONFIG : LOCATION_TYPES_CONFIG

  return (
    <Modal title={category === 'character' ? 'Add character' : 'Add location'} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ display:'flex', gap:8, background:'rgba(255,255,255,.03)', padding:4, borderRadius:'var(--r-sm)' }}>
          {[['location','📍 Location'],['character','🎭 Character']].map(([key,label])=>(
            <button key={key} onClick={()=>switchCategory(key)} style={{
              flex:1, padding:'8px', borderRadius:8, fontSize:12, fontWeight:600,
              background:category===key?'rgba(255,255,255,.08)':'transparent',
              color:category===key?'var(--white)':'var(--slate)',
              transition:'all .2s cubic-bezier(.2,.8,.3,1)',
            }}>{label}</button>
          ))}
        </div>
        <div>
          <label style={{ fontSize:11, color:'var(--slate)', fontWeight:600, textTransform:'uppercase', letterSpacing:.7, display:'block', marginBottom:6 }}>Name *</label>
          <input autoFocus placeholder={category==='character'?'e.g. Kestrel Vane':'e.g. Ironhold Fortress'} value={form.label} onChange={e=>set('label',e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()}
            style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid var(--border2)', borderRadius:'var(--r-sm)', color:'var(--white)', fontSize:14, padding:'10px 12px' }}/>
        </div>
        <div>
          <label style={{ fontSize:11, color:'var(--slate)', fontWeight:600, textTransform:'uppercase', letterSpacing:.7, display:'block', marginBottom:6 }}>Type</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
            {Object.entries(activeTypes).map(([key,v])=>(
              <button key={key} onClick={()=>set('nodeType',key)} style={{
                fontSize:12, padding:'5px 11px', borderRadius:20,
                background:form.nodeType===key?`${v.color}20`:'rgba(255,255,255,.04)',
                border:`1px solid ${form.nodeType===key?v.color:'rgba(255,255,255,.1)'}`,
                color:form.nodeType===key?v.color:'var(--slate)', transition:'all .2s cubic-bezier(.2,.8,.3,1)',
              }}>{v.icon} {v.label}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontSize:11, color:'var(--slate)', fontWeight:600, textTransform:'uppercase', letterSpacing:.7, display:'block', marginBottom:6 }}>Description</label>
          <textarea placeholder={category==='character'?'Who are they, and what do they want?':'What makes this place unique?'} value={form.description} onChange={e=>set('description',e.target.value)} rows={2}
            style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid var(--border2)', borderRadius:'var(--r-sm)', color:'var(--white)', fontSize:13, padding:'8px 12px', resize:'none', lineHeight:1.6 }}/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {(category === 'character'
            ? [['Role','role'],['Age','age'],['Appearance','appearance'],['Appears in','chapter']]
            : [['Climate','climate'],['Population','population'],['Ruler','ruler'],['Appears in','chapter']]
          ).map(([l,k])=>(
            <div key={k}>
              <label style={{ fontSize:11, color:'var(--slate)', fontWeight:600, textTransform:'uppercase', letterSpacing:.7, display:'block', marginBottom:5 }}>{l}</label>
              <input placeholder={l} value={form[k]} onChange={e=>set(k,e.target.value)}
                style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid var(--border2)', borderRadius:'var(--r-sm)', color:'var(--white)', fontSize:12, padding:'7px 10px' }}/>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <Btn variant="ghost" style={{ flex:1 }} onClick={onClose}>Cancel</Btn>
          <Btn style={{ flex:2 }} onClick={submit} disabled={!form.label.trim()}>Add to canvas</Btn>
        </div>
      </div>
    </Modal>
  )
}

// ── Edge Modal ───────────────────────────────────────
function EdgeModal({ src, tgt, onConfirm, onClose }) {
  const options = useMemo(() => edgeOptionsFor(src?.data?.category, tgt?.data?.category), [src, tgt])
  const [type, setType] = useState(Object.keys(options)[0])
  return (
    <Modal title="Connect entities" onClose={onClose} width={360}>
      <div style={{ background:'rgba(255,255,255,.04)', borderRadius:'var(--r-sm)', padding:'9px 13px', marginBottom:16, fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontWeight:500, color:'var(--white)' }}>{src?.data?.label}</span>
        <span style={{ color:'var(--slate)' }}>→</span>
        <span style={{ fontWeight:500, color:'var(--white)' }}>{tgt?.data?.label}</span>
      </div>
      <label style={{ fontSize:11, color:'var(--slate)', fontWeight:600, textTransform:'uppercase', letterSpacing:.7, display:'block', marginBottom:9 }}>Connection type</label>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:18 }}>
        {Object.entries(options).map(([key,v])=>(
          <button key={key} onClick={()=>setType(key)} style={{
            padding:'8px 11px', borderRadius:'var(--r-sm)',
            background:type===key?`${v.color}18`:'rgba(255,255,255,.03)',
            border:`1px solid ${type===key?v.color:'rgba(255,255,255,.09)'}`,
            color:type===key?v.color:'var(--slate)', fontSize:12, fontWeight:type===key?600:400,
            display:'flex', alignItems:'center', gap:6, transition:'all .2s cubic-bezier(.2,.8,.3,1)',
          }}>
            <div style={{ width:18, height:1.5, background:v.color, borderRadius:1 }}/>
            {v.label}
          </button>
        ))}
      </div>
      <div style={{ display:'flex', gap:10 }}>
        <Btn variant="ghost" style={{ flex:1 }} onClick={onClose}>Cancel</Btn>
        <Btn style={{ flex:2, background:options[type].color }} onClick={()=>onConfirm(type)}>Add connection</Btn>
      </div>
    </Modal>
  )
}

// ── Category filter pill ─────────────────────────────
function CategoryFilter({ value, onChange }) {
  const options = [
    { key:'all', label:'All', icon:LayoutGrid },
    { key:'location', label:'Locations', icon:MapPin },
    { key:'character', label:'Characters', icon:Users },
  ]
  const idx = options.findIndex(o=>o.key===value)
  return (
    <div style={{ position:'relative', display:'flex', background:'rgba(255,255,255,.04)', borderRadius:20, padding:3, flexShrink:0 }}>
      <div style={{
        position:'absolute', top:3, bottom:3, left:3,
        width:`calc((100% - 6px) / 3)`,
        transform:`translateX(${idx*100}%)`,
        background:'rgba(255,255,255,.09)', borderRadius:16,
        transition:'transform .28s cubic-bezier(.2,.8,.3,1)',
      }}/>
      {options.map(({key,label,icon:Icon})=>(
        <button key={key} onClick={()=>onChange(key)} style={{
          position:'relative', zIndex:1, padding:'5px 12px', borderRadius:16,
          fontSize:11, fontWeight:600, display:'flex', alignItems:'center', gap:5,
          color:value===key?'var(--white)':'var(--slate)', whiteSpace:'nowrap',
          transition:'color .2s',
        }}>
          <Icon size={11}/> {label}
        </button>
      ))}
    </div>
  )
}

// ── Canvas Page ──────────────────────────────────────
export default function CanvasPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getBook, updateBook } = useBooks()

  const [book, setBook] = useState(null)
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [pending, setPending] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(true)
  const [pageLoading, setPageLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  // Load book
  useEffect(() => {
    getBook(id).then(b => {
      setBook(b)
      const usingDefaults = !b.nodes?.length
      setNodes(usingDefaults ? DEFAULT_NODES : b.nodes)
      const rawEdges = usingDefaults ? DEFAULT_EDGES : (b.edges||[])
      setEdges(rawEdges.map(e=>({...e,...buildEdgeStyle(e.data?.edgeType)})))
      setPageLoading(false)
    }).catch(() => navigate('/dashboard'))
  }, [id])

  // Auto-save
  useEffect(() => {
    if (!book) return
    setSaved(false)
    const t = setTimeout(async () => {
      setSaving(true)
      try { await updateBook(id, { nodes, edges:edges.map(stripEdge) }) } catch {}
      setSaving(false); setSaved(true)
    }, 1200)
    return () => clearTimeout(t)
  }, [nodes, edges])

  const onNodesChange = useCallback(c => setNodes(n => applyNodeChanges(c, n)), [])
  const onEdgesChange = useCallback(c => setEdges(e => applyEdgeChanges(c, e)), [])
  const onConnect = useCallback(p => setPending(p), [])
  const onNodeClick = useCallback((_,n) => setSelected(n), [])
  const onPaneClick = useCallback(() => setSelected(null), [])

  const confirmEdge = (type) => {
    const newEdge = { ...pending, id:`e-${Date.now()}`, data:{edgeType:type}, ...buildEdgeStyle(type) }
    setEdges(eds => addEdge(newEdge, eds))
    setPending(null)
  }

  const updateNode = (id, data) => {
    setNodes(ns => ns.map(n => n.id===id ? {...n,data} : n))
    setSelected(s => s?.id===id ? {...s,data} : s)
  }

  const deleteNode = (nid) => {
    setNodes(ns => ns.filter(n => n.id!==nid))
    setEdges(es => es.filter(e => e.source!==nid && e.target!==nid))
    setSelected(null)
  }

  const addNode = (data) => {
    const newNode = { id:`n-${Date.now()}`, type:'entityNode', position:{x:180+Math.random()*300,y:120+Math.random()*220}, data }
    setNodes(ns => [...ns, newNode])
  }

  const exportWorld = () => {
    const blob = new Blob([JSON.stringify({title:book.title,nodes,edges:edges.map(stripEdge)},null,2)],{type:'application/json'})
    const url = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'),{href:url,download:`${book.title.replace(/\s+/g,'-')}.json`}).click()
    URL.revokeObjectURL(url)
  }

  const visibleNodes = useMemo(() => filter === 'all' ? nodes : nodes.filter(n => n.data.category === filter), [nodes, filter])
  const visibleIds = useMemo(() => new Set(visibleNodes.map(n=>n.id)), [visibleNodes])
  const visibleEdges = useMemo(() => edges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target)), [edges, visibleIds])

  const locationCount = useMemo(() => nodes.filter(n=>n.data.category==='location').length, [nodes])
  const characterCount = useMemo(() => nodes.filter(n=>n.data.category==='character').length, [nodes])

  if (pageLoading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--ink)' }}>
      <Spinner size={32}/>
    </div>
  )

  const srcNode = pending ? nodes.find(n=>n.id===pending.source) : null
  const tgtNode = pending ? nodes.find(n=>n.id===pending.target) : null

  return (
    <div style={{ width:'100vw', height:'100vh', position:'relative', background:'var(--ink)', overflow:'hidden' }}>
      {/* Ambient background blobs for fluid depth */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:0 }}>
        <div style={{
          position:'absolute', top:'-10%', left:'8%', width:420, height:420, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(76,159,232,.08), transparent 70%)',
          animation:'floatBlob 22s ease-in-out infinite',
        }}/>
        <div style={{
          position:'absolute', bottom:'-15%', right:'5%', width:480, height:480, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(232,93,158,.07), transparent 70%)',
          animation:'floatBlob 26s ease-in-out infinite reverse',
        }}/>
      </div>

      {/* Toolbar */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, zIndex:10, height:50,
        background:'rgba(10,14,23,.92)', backdropFilter:'blur(18px)',
        borderBottom:'1px solid var(--border)',
        display:'flex', alignItems:'center', padding:'0 14px', gap:10,
      }}>
        <Btn variant="ghost" size="sm" onClick={()=>navigate('/dashboard')} style={{ gap:6, flexShrink:0 }}>
          <ArrowLeft size={13}/> Dashboard
        </Btn>
        <div style={{ width:1, height:20, background:'var(--border)' }}/>
        <Map size={13} color="var(--slate)"/>
        <span style={{ fontSize:13, fontWeight:600, color:'var(--white)', whiteSpace:'nowrap' }}>
          {book?.title}
        </span>
        <div style={{ fontSize:11, color:'var(--slate)', background:'rgba(255,255,255,.05)', padding:'2px 8px', borderRadius:20, whiteSpace:'nowrap' }}>
          {book?.genre}
        </div>

        <div style={{ flex:1 }}/>

        <CategoryFilter value={filter} onChange={setFilter}/>

        {/* Stats */}
        {[[locationCount,'locations'],[characterCount,'characters'],[edges.length,'connections']].map(([n,label])=>(
          <div key={label} style={{ fontSize:11, color:'var(--slate)', background:'rgba(255,255,255,.04)', padding:'2px 9px', borderRadius:20, whiteSpace:'nowrap', display:'flex', gap:4 }}>
            <span style={{ color:'var(--white)', fontWeight:600 }}>{n}</span>
            <span>{label}</span>
          </div>
        ))}

        {/* Saved indicator */}
        <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
          {saving ? <Loader size={11} color="var(--gold)" style={{ animation:'spin 1s linear infinite' }}/> : <div style={{ width:6, height:6, borderRadius:'50%', background:saved?'var(--green)':'var(--amber)', animation:saved?'none':'pulse 1.5s infinite' }}/>}
          <span style={{ fontSize:11, color:'var(--slate)', whiteSpace:'nowrap' }}>{saving?'Saving...':saved?'Saved':'Unsaved'}</span>
        </div>

        <div style={{ width:1, height:20, background:'var(--border)' }}/>

        <Btn variant="subtle" size="sm" onClick={exportWorld} style={{ gap:5, flexShrink:0 }}>
          <Download size={12}/> Export
        </Btn>
        <Btn size="sm" onClick={()=>setShowAdd(true)} style={{ gap:5, flexShrink:0 }}>
          <Plus size={14}/> Add
        </Btn>
      </div>

      {/* Flow */}
      <div style={{ position:'absolute', top:50, left:0, right:0, bottom:0, zIndex:1 }}>
        <ReactFlow
          nodes={visibleNodes} edges={visibleEdges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={onConnect} onNodeClick={onNodeClick} onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionLineStyle={{ stroke:'#C9A84C', strokeWidth:1.8, strokeDasharray:'5 3' }}
          fitView fitViewOptions={{ padding:.2 }}
          minZoom={.1} maxZoom={2.5} deleteKeyCode="Delete"
          proOptions={{ hideAttribution:true }}
        >
          <Background color="rgba(255,255,255,.05)" gap={26} size={1} style={{ background:'transparent' }}/>
          <Controls showInteractive={false}/>
          <MiniMap
            maskColor="rgba(10,14,23,.7)"
            style={{ background:'#161D2E', border:'1px solid var(--border)', borderRadius:12 }}
            nodeColor={n => (NODE_TYPES_CONFIG[n.data?.nodeType] || LOCATION_TYPES_CONFIG.location).color}
          />
        </ReactFlow>
      </div>

      {visibleNodes.length===0 && (
        <div style={{ position:'absolute', top:'55%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', pointerEvents:'none', zIndex:5 }}>
          <div style={{ fontSize:40, opacity:.3, marginBottom:12 }}>{filter==='character'?'🎭':'🗺️'}</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:17, color:'var(--slate)' }}>
            {filter==='all' ? 'Canvas is empty' : `No ${filter}s yet`}
          </div>
          <div style={{ fontSize:13, color:'var(--slate)', opacity:.6, marginTop:4 }}>Click <strong style={{ color:'var(--gold)' }}>+ Add</strong> to start</div>
        </div>
      )}

      <div style={{
        position:'absolute', bottom:10, left:'50%', transform:'translateX(-50%)',
        background:'rgba(10,14,23,.8)', backdropFilter:'blur(8px)',
        border:'1px solid var(--border)', borderRadius:20,
        padding:'4px 14px', fontSize:11, color:'var(--slate)',
        pointerEvents:'none', whiteSpace:'nowrap', zIndex:5,
      }}>
        Drag node handles to connect · Click node to edit · Delete key removes selected
      </div>

      {selected && <NodeSidebar node={selected} onUpdate={updateNode} onDelete={deleteNode} onClose={()=>setSelected(null)}/>}
      {showAdd && <AddNodeModal defaultCategory={filter==='all'?'location':filter} onAdd={addNode} onClose={()=>setShowAdd(false)}/>}
      {pending && <EdgeModal src={srcNode} tgt={tgtNode} onConfirm={confirmEdge} onClose={()=>setPending(null)}/>}

      <style>{`
        @keyframes floatBlob {
          0%, 100% { transform: translate(0,0); }
          50% { transform: translate(30px, -25px); }
        }
      `}</style>
    </div>
  )
                  }
