import { useCallback, useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactFlow, {
  Background, Controls, MiniMap,
  addEdge, applyNodeChanges, applyEdgeChanges,
  ConnectionLineType, MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useBooks } from '../hooks/useBooks'
import { NODE_TYPES_CONFIG, EDGE_TYPES, DEFAULT_NODES } from '../data/constants'
import { Btn, Modal, Spinner } from '../components/ui'
import { ArrowLeft, Plus, Download, Map, Sparkles, X, Loader, Trash2 } from 'lucide-react'
import { Handle, Position } from 'reactflow'

// ── Location Node ─────────────────────────────────────
function LocationNode({ data, selected }) {
  const cfg = NODE_TYPES_CONFIG[data.nodeType] || NODE_TYPES_CONFIG.location
  const c = cfg.color
  return (
    <div style={{
      background: selected ? '#1E2A44' : '#161D2E',
      border: `1.5px solid ${selected ? c : c+'55'}`,
      borderRadius:10, padding:'10px 14px', minWidth:130, maxWidth:180,
      boxShadow: selected ? `0 0 0 2px ${c}28,0 4px 20px rgba(0,0,0,.5)` : '0 2px 12px rgba(0,0,0,.4)',
      transition:'all .15s', cursor:'pointer', fontFamily:'var(--font-body)',
    }}>
      {[Position.Top,Position.Bottom,Position.Left,Position.Right].map(p=>(
        <Handle key={p} type={p===Position.Top||p===Position.Left?'target':'source'} position={p}
          style={{ background:c, border:'none', width:8, height:8 }}/>
      ))}
      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:c, boxShadow:`0 0 6px ${c}`, flexShrink:0 }}/>
        <span style={{ fontSize:9, color:c, fontWeight:600, textTransform:'uppercase', letterSpacing:.8 }}>{cfg.label}</span>
      </div>
      <div style={{ fontSize:12, fontWeight:600, color:'#F4F0EA', lineHeight:1.3, wordBreak:'break-word' }}>{data.label}</div>
      {data.population && <div style={{ fontSize:10, color:'#7A8499', marginTop:4 }}>Pop. {data.population}</div>}
      {data.chapter && (
        <div style={{ marginTop:5, fontSize:9, color:'#7A8499', background:'rgba(255,255,255,.04)', borderRadius:4, padding:'2px 6px', display:'inline-block' }}>
          {data.chapter}
        </div>
      )}
    </div>
  )
}

const nodeTypes = { locationNode: LocationNode }

function buildEdgeStyle(edgeType) {
  const cfg = EDGE_TYPES[edgeType] || EDGE_TYPES.trade
  return {
    style: { stroke:cfg.color, strokeWidth:1.8, strokeDasharray:cfg.dash?'6 4':undefined },
    markerEnd: { type:MarkerType.ArrowClosed, color:cfg.color, width:13, height:13 },
    label:cfg.label, type:'smoothstep',
    labelStyle:{ fill:cfg.color, fontSize:10, fontWeight:600, fontFamily:'Inter,sans-serif' },
    labelBgStyle:{ fill:'#0A0E17', fillOpacity:.88 },
    labelBgPadding:[4,2], labelBgBorderRadius:4,
  }
}
const stripEdge = ({ style, markerEnd, labelStyle, labelBgStyle, labelBgPadding, labelBgBorderRadius, ...r }) => r

// ── Node Sidebar ─────────────────────────────────────
function NodeSidebar({ node, onUpdate, onDelete, onClose }) {
  const [tab, setTab] = useState('details')
  const [aiText, setAiText] = useState(node.data.lore || '')
  const [aiLoading, setAiLoading] = useState(false)
  const cfg = NODE_TYPES_CONFIG[node.data.nodeType] || NODE_TYPES_CONFIG.location
  const c = cfg.color
  const upd = (k,v) => onUpdate(node.id, { ...node.data, [k]:v })

  const expandLore = async () => {
    setAiLoading(true); setAiText(''); setTab('ai')
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          model:'claude-sonnet-4-6', max_tokens:900, stream:true,
          messages:[{ role:'user', content:`Write 2 paragraphs of rich, atmospheric lore for this fictional location. Dark epic fantasy tone.\n\nLocation: ${node.data.label}\nType: ${cfg.label}\nDescription: ${node.data.description}\nClimate: ${node.data.climate}\nPopulation: ${node.data.population}\nRuler: ${node.data.ruler}` }],
        }),
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
            style={{ width:'100%', background:'rgba(255,255,255,.04)', border:'1px solid var(--border2)', borderRadius:'var(--r-sm)', color:'var(--white)', fontSize:12, padding:'7px 10px', resize:'vertical', lineHeight:1.6 }}/>
        : <input value={node.data[field]||''} onChange={e=>upd(field,e.target.value)}
            style={{ width:'100%', background:'rgba(255,255,255,.04)', border:'1px solid var(--border2)', borderRadius:'var(--r-sm)', color:'var(--white)', fontSize:12, padding:'6px 10px' }}/>
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
            borderBottom:tab===id?`2px solid ${c}`:'2px solid transparent', transition:'all .15s',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:14 }}>
        {tab==='details' && (
          <div className="anim-fade">
            <div style={{ marginBottom:13 }}>
              <label style={{ fontSize:10, color:'var(--slate)', fontWeight:600, textTransform:'uppercase', letterSpacing:.7, display:'block', marginBottom:6 }}>Type</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {Object.entries(NODE_TYPES_CONFIG).map(([key,v])=>(
                  <button key={key} onClick={()=>upd('nodeType',key)} style={{
                    fontSize:10, padding:'3px 9px', borderRadius:20,
                    background:node.data.nodeType===key?`${v.color}20`:'rgba(255,255,255,.04)',
                    border:`1px solid ${node.data.nodeType===key?v.color:'rgba(255,255,255,.1)'}`,
                    color:node.data.nodeType===key?v.color:'var(--slate)', transition:'all .15s',
                  }}>{v.icon} {v.label}</button>
                ))}
              </div>
            </div>
            <F label="Description" field="description" multi/>
            <F label="Climate" field="climate"/>
            <F label="Population" field="population"/>
            <F label="Ruler" field="ruler"/>
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
          borderRadius:'var(--r-sm)', color:'var(--red)', fontSize:12, fontWeight:500,
        }}
        onMouseEnter={e=>e.currentTarget.style.background='rgba(216,90,90,.18)'}
        onMouseLeave={e=>e.currentTarget.style.background='rgba(216,90,90,.1)'}
        >Delete location</button>
      </div>
    </div>
  )
}

// ── Add Node Modal ───────────────────────────────────
function AddNodeModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ label:'', nodeType:'location', description:'', climate:'', population:'', ruler:'', chapter:'' })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const submit = () => { if(!form.label.trim()) return; onAdd({...form,lore:''}); onClose() }

  return (
    <Modal title="Add location" onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label style={{ fontSize:11, color:'var(--slate)', fontWeight:600, textTransform:'uppercase', letterSpacing:.7, display:'block', marginBottom:6 }}>Name *</label>
          <input autoFocus placeholder="e.g. Ironhold Fortress" value={form.label} onChange={e=>set('label',e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()}
            style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid var(--border2)', borderRadius:'var(--r-sm)', color:'var(--white)', fontSize:14, padding:'10px 12px' }}/>
        </div>
        <div>
          <label style={{ fontSize:11, color:'var(--slate)', fontWeight:600, textTransform:'uppercase', letterSpacing:.7, display:'block', marginBottom:6 }}>Type</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
            {Object.entries(NODE_TYPES_CONFIG).map(([key,v])=>(
              <button key={key} onClick={()=>set('nodeType',key)} style={{
                fontSize:12, padding:'5px 11px', borderRadius:20,
                background:form.nodeType===key?`${v.color}20`:'rgba(255,255,255,.04)',
                border:`1px solid ${form.nodeType===key?v.color:'rgba(255,255,255,.1)'}`,
                color:form.nodeType===key?v.color:'var(--slate)', transition:'all .15s',
              }}>{v.icon} {v.label}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontSize:11, color:'var(--slate)', fontWeight:600, textTransform:'uppercase', letterSpacing:.7, display:'block', marginBottom:6 }}>Description</label>
          <textarea placeholder="What makes this place unique?" value={form.description} onChange={e=>set('description',e.target.value)} rows={2}
            style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid var(--border2)', borderRadius:'var(--r-sm)', color:'var(--white)', fontSize:13, padding:'8px 12px', resize:'none', lineHeight:1.6 }}/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {[['Climate','climate'],['Population','population'],['Ruler','ruler'],['Appears in','chapter']].map(([l,k])=>(
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
  const [type, setType] = useState('trade')
  return (
    <Modal title="Connect locations" onClose={onClose} width={360}>
      <div style={{ background:'rgba(255,255,255,.04)', borderRadius:'var(--r-sm)', padding:'9px 13px', marginBottom:16, fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontWeight:500, color:'var(--white)' }}>{src?.data?.label}</span>
        <span style={{ color:'var(--slate)' }}>→</span>
        <span style={{ fontWeight:500, color:'var(--white)' }}>{tgt?.data?.label}</span>
      </div>
      <label style={{ fontSize:11, color:'var(--slate)', fontWeight:600, textTransform:'uppercase', letterSpacing:.7, display:'block', marginBottom:9 }}>Connection type</label>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:18 }}>
        {Object.entries(EDGE_TYPES).map(([key,v])=>(
          <button key={key} onClick={()=>setType(key)} style={{
            padding:'8px 11px', borderRadius:'var(--r-sm)',
            background:type===key?`${v.color}18`:'rgba(255,255,255,.03)',
            border:`1px solid ${type===key?v.color:'rgba(255,255,255,.09)'}`,
            color:type===key?v.color:'var(--slate)', fontSize:12, fontWeight:type===key?600:400,
            display:'flex', alignItems:'center', gap:6, transition:'all .15s',
          }}>
            <div style={{ width:18, height:1.5, background:v.color, borderRadius:1 }}/>
            {v.label}
          </button>
        ))}
      </div>
      <div style={{ display:'flex', gap:10 }}>
        <Btn variant="ghost" style={{ flex:1 }} onClick={onClose}>Cancel</Btn>
        <Btn style={{ flex:2, background:EDGE_TYPES[type].color }} onClick={()=>onConfirm(type)}>Add connection</Btn>
      </div>
    </Modal>
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

  // Load book
  useEffect(() => {
    getBook(id).then(b => {
      setBook(b)
      setNodes(b.nodes?.length ? b.nodes : DEFAULT_NODES)
      setEdges((b.edges||[]).map(e=>({...e,...buildEdgeStyle(e.data?.edgeType)})))
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
    const newNode = { id:`n-${Date.now()}`, type:'locationNode', position:{x:180+Math.random()*300,y:120+Math.random()*220}, data }
    setNodes(ns => [...ns, newNode])
  }

  const exportWorld = () => {
    const blob = new Blob([JSON.stringify({title:book.title,nodes,edges:edges.map(stripEdge)},null,2)],{type:'application/json'})
    const url = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'),{href:url,download:`${book.title.replace(/\s+/g,'-')}.json`}).click()
    URL.revokeObjectURL(url)
  }

  if (pageLoading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--ink)' }}>
      <Spinner size={32}/>
    </div>
  )

  const srcNode = pending ? nodes.find(n=>n.id===pending.source) : null
  const tgtNode = pending ? nodes.find(n=>n.id===pending.target) : null

  return (
    <div style={{ width:'100vw', height:'100vh', position:'relative', background:'var(--ink)' }}>
      {/* Toolbar */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, zIndex:10, height:50,
        background:'rgba(10,14,23,.92)', backdropFilter:'blur(16px)',
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

        {/* Stats */}
        {[`${nodes.length} locations`,`${edges.length} connections`].map(s=>(
          <div key={s} style={{ fontSize:11, color:'var(--slate)', background:'rgba(255,255,255,.04)', padding:'2px 9px', borderRadius:20, whiteSpace:'nowrap', display:'flex', gap:4 }}>
            <span style={{ color:'var(--white)', fontWeight:600 }}>{s.split(' ')[0]}</span>
            <span>{s.split(' ').slice(1).join(' ')}</span>
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
          <Plus size={14}/> Add location
        </Btn>
      </div>

      {/* Flow */}
      <div style={{ position:'absolute', top:50, left:0, right:0, bottom:0 }}>
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={onConnect} onNodeClick={onNodeClick} onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionLineStyle={{ stroke:'#C9A84C', strokeWidth:1.8, strokeDasharray:'5 3' }}
          fitView fitViewOptions={{ padding:.2 }}
          minZoom={.1} maxZoom={2.5} deleteKeyCode="Delete"
          proOptions={{ hideAttribution:true }}
        >
          <Background color="rgba(255,255,255,.05)" gap={26} size={1} style={{ background:'var(--ink)' }}/>
          <Controls showInteractive={false}/>
          <MiniMap maskColor="rgba(10,14,23,.7)" style={{ background:'#161D2E', border:'1px solid var(--border)', borderRadius:9 }}/>
        </ReactFlow>
      </div>

      {nodes.length===0 && (
        <div style={{ position:'absolute', top:'55%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', pointerEvents:'none', zIndex:5 }}>
          <div style={{ fontSize:40, opacity:.3, marginBottom:12 }}>🗺️</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:17, color:'var(--slate)' }}>Canvas is empty</div>
          <div style={{ fontSize:13, color:'var(--slate)', opacity:.6, marginTop:4 }}>Click <strong style={{ color:'var(--gold)' }}>+ Add location</strong> to start</div>
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
      {showAdd && <AddNodeModal onAdd={addNode} onClose={()=>setShowAdd(false)}/>}
      {pending && <EdgeModal src={srcNode} tgt={tgtNode} onConfirm={confirmEdge} onClose={()=>setPending(null)}/>}
    </div>
  )
}
