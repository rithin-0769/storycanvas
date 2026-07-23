import { useState, useEffect, useRef } from 'react'
import { NODE_TYPES_CONFIG } from '../data/constants'
import { X, Sparkles, Loader } from 'lucide-react'

export default function NodeSidebar({ node, onUpdate, onDelete, onClose }) {
  const [tab, setTab] = useState('details')
  const [aiText, setAiText] = useState(node.data.lore || '')
  const [aiLoading, setAiLoading] = useState(false)
  const [formData, setFormData] = useState(node.data)
  const debounceTimer = useRef(null)

  const cfg = NODE_TYPES_CONFIG[node.data.nodeType] || NODE_TYPES_CONFIG.location
  const c = cfg.color

  // Debounce updates to parent — only save after 600ms of no typing
  useEffect(() => {
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      onUpdate(node.id, formData)
    }, 600)
    return () => clearTimeout(debounceTimer.current)
  }, [formData, node.id])

  // When external node changes (e.g., from undo/redo), sync local state
  useEffect(() => {
    setFormData(node.data)
  }, [node.id])

  const upd = (k, v) => setFormData(f => ({ ...f, [k]: v }))

  const expandLore = async () => {
    setAiLoading(true); setAiText(''); setTab('ai')
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          model:'claude-sonnet-4-6', max_tokens:900, stream:true,
          messages:[{ role:'user', content:`Write 2 paragraphs of rich, atmospheric lore for this fictional location. Dark epic fantasy tone.\n\nLocation: ${formData.label}\nType: ${cfg.label}\nDescription: ${formData.description}\nClimate: ${formData.climate}\nPopulation: ${formData.population}\nRuler: ${formData.ruler}` }],
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
        ? <textarea value={formData[field]||''} onChange={e=>upd(field,e.target.value)} rows={3}
            style={{ width:'100%', background:'rgba(255,255,255,.04)', border:'1px solid var(--border2)', borderRadius:'var(--r-sm)', color:'var(--white)', fontSize:12, padding:'7px 10px', resize:'vertical', lineHeight:1.6 }}/>
        : <input value={formData[field]||''} onChange={e=>upd(field,e.target.value)}
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
          <input value={formData.label} onChange={e=>upd('label',e.target.value)}
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
                    background:formData.nodeType===key?`${v.color}20`:'rgba(255,255,255,.04)',
                    border:`1px solid ${formData.nodeType===key?v.color:'rgba(255,255,255,.1)'}`,
                    color:formData.nodeType===key?v.color:'var(--slate)', transition:'all .15s',
                  }}>{v.icon} {v.label}</button>
                ))}
              </div>
            </div>
            <F label="Description" field="description" multi/>
            <F label="Climate" field="climate"/>
            <F label="Population" field="population"/>
            <F label="Ruler" field="ruler"/>
            <F label="Appears in" field="chapter"/>
            {formData.lore && (
              <div style={{ marginBottom:13 }}>
                <label style={{ fontSize:10, color:'var(--slate)', fontWeight:600, textTransform:'uppercase', letterSpacing:.7, display:'block', marginBottom:5 }}>Saved Lore</label>
                <div style={{ fontSize:11, color:'var(--slate2)', lineHeight:1.7, background:'rgba(255,255,255,.03)', borderRadius:'var(--r-sm)', padding:'9px 11px', maxHeight:110, overflowY:'auto' }}>{formData.lore}</div>
              </div>
            )}
          </div>
        )}
        {tab==='ai' && (
          <div className="anim-fade">
            <p style={{ fontSize:12, color:'var(--slate)', lineHeight:1.6, marginBottom:13 }}>
              Generate lore for <strong style={{ color:'var(--white)' }}>{formData.label}</strong> using Claude AI.
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
