import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Btn, Input, Modal } from '../components/ui'
import { BookOpen, Map, Sparkles, Users, ArrowRight, Check } from 'lucide-react'

function AuthModal({ mode, onClose }) {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(mode === 'login')
  const [form, setForm] = useState({ name:'', email:'', password:'' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    setError(''); setLoading(true)
    try {
      if (isLogin) {
        await login(form.email, form.password)
      } else {
        if (!form.name.trim()) { setError('Name is required'); setLoading(false); return }
        await register(form.name, form.email, form.password)
      }
      navigate('/dashboard')
    } catch (e) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  return (
    <Modal onClose={onClose} width={420}>
      <div style={{ textAlign:'center', marginBottom:28 }}>
        <div style={{ fontSize:32, marginBottom:10 }}>✦</div>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:700, color:'var(--white)', marginBottom:6 }}>
          {isLogin ? 'Welcome back' : 'Start your story'}
        </h2>
        <p style={{ fontSize:13, color:'var(--slate)' }}>
          {isLogin ? 'Sign in to your Storycanvas account' : 'Create your free account — no credit card needed'}
        </p>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:20 }}>
        {!isLogin && (
          <Input label="Your name" placeholder="e.g. Rithin" value={form.name}
            onChange={e => set('name', e.target.value)} />
        )}
        <Input label="Email" type="email" placeholder="you@example.com" value={form.email}
          onChange={e => set('email', e.target.value)} />
        <Input label="Password" type="password" placeholder="••••••••" value={form.password}
          onChange={e => set('password', e.target.value)}
          onKeyDown={e => e.key==='Enter' && submit()} />
        {error && <div style={{ fontSize:12, color:'var(--red)', background:'rgba(216,90,90,.1)', padding:'8px 12px', borderRadius:'var(--r-sm)' }}>{error}</div>}
      </div>

      <Btn size="lg" style={{ width:'100%', marginBottom:16 }} onClick={submit} loading={loading}>
        {isLogin ? 'Sign in' : 'Create account'} <ArrowRight size={15} />
      </Btn>

      <p style={{ textAlign:'center', fontSize:13, color:'var(--slate)' }}>
        {isLogin ? "Don't have an account? " : 'Already have an account? '}
        <button onClick={() => setIsLogin(v => !v)} style={{ background:'none', color:'var(--gold)', fontWeight:500, fontSize:13 }}>
          {isLogin ? 'Sign up free' : 'Sign in'}
        </button>
      </p>
    </Modal>
  )
}

// ── Mini canvas preview ──────────────────────────────────
function CanvasPreview() {
  const nodes = [
    { x:42, y:38, label:'Arathos Keep', color:'#4A90D9' },
    { x:72, y:18, label:'Thornwood',    color:'#3FA87E' },
    { x:78, y:58, label:'Ashen Pass',   color:'#C9A84C' },
    { x:22, y:62, label:'Vorrkai',      color:'#D85A5A' },
    { x:62, y:78, label:'Saltfen',      color:'#8B6FD4' },
  ]
  const edges = [[0,1],[0,2],[0,3],[2,4],[1,3]]

  return (
    <div style={{
      width:'100%', paddingTop:'62%', position:'relative',
      borderRadius:'var(--r-lg)', overflow:'hidden',
      background:'var(--ink3)', border:'1px solid var(--border2)',
      boxShadow:'var(--shadow-lg)',
    }}>
      {/* Toolbar */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, height:36,
        background:'rgba(10,14,23,.9)', borderBottom:'1px solid var(--border)',
        display:'flex', alignItems:'center', gap:6, padding:'0 12px',
      }}>
        {['#D85A5A','#C9A84C','#3FA87E'].map((c,i)=>(
          <div key={i} style={{ width:9, height:9, borderRadius:'50%', background:c, opacity:.7 }}/>
        ))}
        <span style={{ marginLeft:8, fontSize:10, color:'var(--slate)', fontFamily:'var(--font-body)' }}>
          The Shattered Realm — World Map
        </span>
        <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
          {['Characters','Timeline'].map(t=>(
            <span key={t} style={{ fontSize:9, color:'var(--slate)', padding:'1px 6px', border:'1px solid var(--border)', borderRadius:3 }}>{t}</span>
          ))}
        </div>
      </div>
      {/* Canvas */}
      <div style={{ position:'absolute', top:36, inset:'36px 0 0 0' }}>
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', overflow:'visible' }}>
          <defs>
            <pattern id="g" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="11" cy="11" r=".7" fill="rgba(255,255,255,.05)"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#g)"/>
          {edges.map(([a,b],i)=>{
            const na=nodes[a],nb=nodes[b]
            return <line key={i} x1={`${na.x}%`} y1={`${na.y}%`} x2={`${nb.x}%`} y2={`${nb.y}%`} stroke="rgba(255,255,255,.12)" strokeWidth="1.2"/>
          })}
        </svg>
        {nodes.map((n,i)=>(
          <div key={i} style={{
            position:'absolute', left:`${n.x}%`, top:`${n.y}%`,
            transform:'translate(-50%,-50%)',
            background:'var(--ink3)', border:`1.5px solid ${n.color}55`,
            borderRadius:7, padding:'5px 9px', minWidth:72,
            boxShadow:`0 0 14px ${n.color}18`,
            animation:`nodeAppear .4s ease forwards`, animationDelay:`${i*.15}s`,
            opacity:0,
          }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:n.color, marginBottom:3, boxShadow:`0 0 5px ${n.color}` }}/>
            <div style={{ fontSize:9, color:'var(--white)', fontWeight:600, whiteSpace:'nowrap' }}>{n.label}</div>
          </div>
        ))}
        {/* AI hint */}
        <div style={{
          position:'absolute', right:8, top:6, width:110,
          background:'rgba(10,14,23,.88)', border:'1px solid var(--border)',
          borderRadius:8, padding:8, animation:'fadeIn .5s ease 1s both',
        }}>
          <div style={{ fontSize:9, color:'var(--gold)', fontWeight:700, marginBottom:6 }}>✦ AI Assistant</div>
          <div style={{ fontSize:8.5, color:'var(--slate2)', lineHeight:1.6, marginBottom:5 }}>
            Arathos was founded during the Third Unification as neutral ground...
          </div>
          {['Expand lore','Check consistency'].map(t=>(
            <div key={t} style={{ fontSize:8, color:'var(--slate)', padding:'3px 5px', border:'1px solid var(--border)', borderRadius:3, marginTop:3 }}>{t}</div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes nodeAppear{from{opacity:0;transform:translate(-50%,-50%) scale(.6)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
      `}</style>
    </div>
  )
}

// ── Feature card ──────────────────────────────────────────
function FeatureCard({ icon, title, desc, color }) {
  return (
    <div style={{
      background:'var(--ink3)', border:'1px solid var(--border)',
      borderRadius:'var(--r-lg)', padding:24,
      transition:'all .2s',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor=`${color}40`; e.currentTarget.style.transform='translateY(-3px)' }}
    onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='none' }}
    >
      <div style={{ width:40, height:40, borderRadius:10, background:`${color}18`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14, fontSize:18 }}>
        {icon}
      </div>
      <div style={{ fontSize:15, fontWeight:600, color:'var(--white)', marginBottom:8 }}>{title}</div>
      <div style={{ fontSize:13, color:'var(--slate)', lineHeight:1.7 }}>{desc}</div>
    </div>
  )
}

export default function Home() {
  const [authModal, setAuthModal] = useState(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  if (user) { navigate('/dashboard'); return null }

  return (
    <div style={{ minHeight:'100vh', background:'var(--ink)', overflowX:'hidden' }}>

      {/* Nav */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:50,
        height:60, padding:'0 5%', display:'flex', alignItems:'center', gap:16,
        background:'rgba(10,14,23,.88)', backdropFilter:'blur(16px)',
        borderBottom:'1px solid var(--border)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:9, flex:1 }}>
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <rect x="2" y="2" width="24" height="24" rx="6" fill="rgba(201,168,76,.15)" stroke="#C9A84C" strokeWidth="1.2"/>
            <circle cx="9" cy="9" r="2.2" fill="#C9A84C"/>
            <circle cx="19" cy="9" r="2.2" fill="#C9A84C" opacity=".6"/>
            <circle cx="9" cy="19" r="2.2" fill="#C9A84C" opacity=".6"/>
            <circle cx="19" cy="19" r="2.2" fill="#C9A84C"/>
            <line x1="11.2" y1="9" x2="16.8" y2="9" stroke="#C9A84C" strokeWidth="1" opacity=".5"/>
            <line x1="9" y1="11.2" x2="9" y2="16.8" stroke="#C9A84C" strokeWidth="1" opacity=".5"/>
          </svg>
          <span style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:600 }}>Storycanvas</span>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <Btn variant="ghost" size="sm" onClick={() => setAuthModal('login')}>Sign in</Btn>
          <Btn size="sm" onClick={() => setAuthModal('signup')}>Start free</Btn>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight:'100vh', padding:'130px 5% 80px',
        display:'grid', gridTemplateColumns:'1fr 1fr',
        gap:60, alignItems:'center', maxWidth:1200, margin:'0 auto',
        position:'relative',
      }}>
        {/* Glow */}
        <div style={{
          position:'absolute', top:'20%', left:'5%', width:500, height:500,
          background:'radial-gradient(circle, rgba(201,168,76,.06) 0%, transparent 70%)',
          pointerEvents:'none',
        }}/>
        <div style={{ animation:'fadeIn .7s ease' }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:7,
            background:'rgba(201,168,76,.1)', border:'1px solid rgba(201,168,76,.25)',
            borderRadius:100, padding:'5px 14px', marginBottom:28,
          }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--gold)', animation:'pulse 2s infinite' }}/>
            <span style={{ fontSize:12, color:'var(--gold)', fontWeight:500 }}>Now in public beta</span>
          </div>

          <h1 style={{
            fontFamily:'var(--font-display)',
            fontSize:'clamp(36px,4.5vw,64px)',
            fontWeight:700, lineHeight:1.1, letterSpacing:'-1.5px',
            color:'var(--white)', marginBottom:22,
          }}>
            Your world,<br/>
            <em style={{ color:'var(--parchment)', fontStyle:'italic' }}>mapped as you</em><br/>
            write it.
          </h1>

          <p style={{ fontSize:17, lineHeight:1.75, color:'var(--slate2)', maxWidth:440, marginBottom:36, fontWeight:300 }}>
            The all-in-one visual workspace for novel authors. Map locations, track characters, build lore — with Claude AI to expand your world on demand.
          </p>

          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:44 }}>
            <Btn size="lg" onClick={() => setAuthModal('signup')} style={{ boxShadow:'0 4px 24px rgba(201,168,76,.3)' }}>
              Start building free <ArrowRight size={15}/>
            </Btn>
            <Btn variant="ghost" size="lg" onClick={() => setAuthModal('login')}>Sign in</Btn>
          </div>

          <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
            {['No credit card required','Free tier forever','Cancel anytime'].map(t=>(
              <div key={t} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--slate)' }}>
                <Check size={13} color="var(--green)"/> {t}
              </div>
            ))}
          </div>
        </div>

        <div style={{ animation:'fadeIn .7s .15s ease both', filter:'drop-shadow(0 32px 64px rgba(0,0,0,.7))' }}>
          <CanvasPreview/>
        </div>

        <style>{`@media(max-width:900px){section{grid-template-columns:1fr!important}section>div:last-child{display:none}}`}</style>
      </section>

      {/* Features */}
      <section style={{ padding:'80px 5%', maxWidth:1200, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <div style={{ fontSize:11, color:'var(--gold)', fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:14 }}>Everything you need</div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(26px,3.5vw,44px)', fontWeight:700, letterSpacing:'-1px', color:'var(--white)', lineHeight:1.2 }}>
            One canvas for your entire story
          </h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
          <FeatureCard icon={<Map size={18} color="#4A90D9"/>} title="World Map Canvas" color="#4A90D9"
            desc="Drag-and-drop locations on an infinite canvas. Connect them with typed edges — trade routes, alliances, conflicts. Pan and zoom like Figma." />
          <FeatureCard icon={<Users size={18} color="#8B6FD4"/>} title="Multi-Book Library" color="#8B6FD4"
            desc="Manage all your novels from one dashboard. Each book has its own world canvas, character web, and plot timeline." />
          <FeatureCard icon={<Sparkles size={18} color="#C9A84C"/>} title="AI Lore Assistant" color="#C9A84C"
            desc="Click any location and ask Claude to expand its lore, spot inconsistencies, or simulate a 'what if' event. Streams in your manuscript's tone." />
          <FeatureCard icon={<BookOpen size={18} color="#3FA87E"/>} title="Node Detail Sidebar" color="#3FA87E"
            desc="Every location has climate, population, ruler, chapter references and a full lore field. Inline editing, no modal required." />
          <FeatureCard icon="💾" title="Auto-Save & Export" color="#D4943A"
            desc="Changes persist automatically. Export your entire world as JSON anytime — ready to import, share, or back up." />
          <FeatureCard icon="🎨" title="Modern Dark UI" color="#D85A5A"
            desc="Built for long writing sessions. Ink-dark palette, Playfair Display headings, smooth animations — beautiful and distraction-free." />
        </div>
        <style>{`@media(max-width:900px){section:nth-of-type(2)>div:last-child{grid-template-columns:1fr!important}}@media(min-width:600px) and (max-width:900px){section:nth-of-type(2)>div:last-child{grid-template-columns:repeat(2,1fr)!important}}`}</style>
      </section>

      {/* CTA */}
      <section style={{ padding:'60px 5% 100px', maxWidth:800, margin:'0 auto', textAlign:'center' }}>
        <div style={{
          background:'linear-gradient(135deg,#161D2E,#1C2438)',
          border:'1px solid rgba(201,168,76,.2)',
          borderRadius:'var(--r-2xl)', padding:'clamp(36px,5vw,64px)',
          boxShadow:'0 0 60px rgba(201,168,76,.07)',
        }}>
          <div style={{ fontSize:40, marginBottom:16, filter:'drop-shadow(0 0 16px rgba(201,168,76,.3))' }}>✦</div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(24px,3.5vw,44px)', fontWeight:700, letterSpacing:'-1px', lineHeight:1.2, color:'var(--white)', marginBottom:16 }}>
            Your world is waiting<br/><em style={{ color:'var(--parchment)' }}>to be mapped.</em>
          </h2>
          <p style={{ fontSize:15, color:'var(--slate2)', lineHeight:1.7, marginBottom:32, fontWeight:300 }}>
            Join authors who build their worlds on Storycanvas. Free to start.
          </p>
          <Btn size="lg" onClick={() => setAuthModal('signup')} style={{ boxShadow:'0 4px 28px rgba(201,168,76,.35)' }}>
            Start building for free <ArrowRight size={15}/>
          </Btn>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop:'1px solid var(--border)', padding:'28px 5%', textAlign:'center' }}>
        <p style={{ fontSize:13, color:'var(--slate)' }}>
          © 2026 Storycanvas. Built for authors who think spatially.
        </p>
      </footer>

      {authModal && <AuthModal mode={authModal} onClose={() => setAuthModal(null)} />}
    </div>
  )
}
