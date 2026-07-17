import { Loader } from 'lucide-react'

// ── Button ──────────────────────────────────────────────
export function Btn({ children, variant='primary', size='md', loading, disabled, style={}, ...props }) {
  const base = {
    display:'inline-flex', alignItems:'center', justifyContent:'center', gap:7,
    borderRadius:'var(--r-sm)', fontWeight:500, border:'none', cursor: (disabled||loading)?'not-allowed':'pointer',
    opacity: (disabled&&!loading) ? 0.5 : 1, transition:'all .15s', flexShrink:0,
  }
  const sizes = {
    sm:{ fontSize:12, padding:'6px 12px' },
    md:{ fontSize:13, padding:'9px 18px' },
    lg:{ fontSize:15, padding:'13px 28px' },
  }
  const variants = {
    primary:  { background:'var(--gold)', color:'#0A0E17', boxShadow:'0 2px 16px rgba(201,168,76,.25)' },
    ghost:    { background:'transparent', color:'var(--slate2)', border:'1px solid var(--border2)' },
    danger:   { background:'rgba(216,90,90,.12)', color:'var(--red)', border:'1px solid rgba(216,90,90,.25)' },
    subtle:   { background:'rgba(255,255,255,.05)', color:'var(--slate3)', border:'1px solid var(--border)' },
  }
  return (
    <button
      disabled={disabled || loading}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.filter='brightness(1.1)'; e.currentTarget.style.transform='translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.filter=''; e.currentTarget.style.transform='' }}
      {...props}
    >
      {loading && <Loader size={13} style={{ animation:'spin 1s linear infinite' }} />}
      {children}
    </button>
  )
}

// ── Input ──────────────────────────────────────────────
export function Input({ label, error, style={}, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {label && <label style={{ fontSize:11, fontWeight:600, color:'var(--slate)', textTransform:'uppercase', letterSpacing:.7 }}>{label}</label>}
      <input
        style={{
          background:'rgba(255,255,255,.04)', border:`1px solid ${error?'var(--red)':'var(--border2)'}`,
          borderRadius:'var(--r-sm)', color:'var(--white)', fontSize:14, padding:'10px 12px',
          width:'100%', transition:'border-color .15s',
          ...style,
        }}
        onFocus={e => { if(!error) e.target.style.borderColor='var(--border3)' }}
        onBlur={e => { if(!error) e.target.style.borderColor='var(--border2)' }}
        {...props}
      />
      {error && <span style={{ fontSize:12, color:'var(--red)' }}>{error}</span>}
    </div>
  )
}

// ── Textarea ──────────────────────────────────────────────
export function Textarea({ label, style={}, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {label && <label style={{ fontSize:11, fontWeight:600, color:'var(--slate)', textTransform:'uppercase', letterSpacing:.7 }}>{label}</label>}
      <textarea
        style={{
          background:'rgba(255,255,255,.04)', border:'1px solid var(--border2)',
          borderRadius:'var(--r-sm)', color:'var(--white)', fontSize:13, padding:'10px 12px',
          width:'100%', resize:'vertical', lineHeight:1.65,
          ...style,
        }}
        onFocus={e => e.target.style.borderColor='var(--border3)'}
        onBlur={e => e.target.style.borderColor='var(--border2)'}
        {...props}
      />
    </div>
  )
}

// ── Select ──────────────────────────────────────────────
export function Select({ label, options=[], style={}, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {label && <label style={{ fontSize:11, fontWeight:600, color:'var(--slate)', textTransform:'uppercase', letterSpacing:.7 }}>{label}</label>}
      <select
        style={{
          background:'rgba(255,255,255,.04)', border:'1px solid var(--border2)',
          borderRadius:'var(--r-sm)', color:'var(--white)', fontSize:13, padding:'10px 12px',
          width:'100%', cursor:'pointer',
          ...style,
        }}
        {...props}
      >
        {options.map(o => (
          <option key={typeof o==='string'?o:o.value} value={typeof o==='string'?o:o.value}
            style={{ background:'#161D2E' }}>
            {typeof o==='string'?o:o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ── Modal ──────────────────────────────────────────────
export function Modal({ title, children, onClose, width=460 }) {
  return (
    <div
      style={{
        position:'fixed', inset:0, zIndex:100,
        background:'rgba(0,0,0,.65)', backdropFilter:'blur(6px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:16, animation:'fadeInFast .15s ease',
      }}
      onClick={e => e.target===e.currentTarget && onClose?.()}
    >
      <div
        className="anim-fade"
        style={{
          background:'var(--ink3)', border:'1px solid var(--border2)',
          borderRadius:'var(--r-xl)', padding:28, width:'100%', maxWidth:width,
          boxShadow:'var(--shadow-lg)', maxHeight:'90vh', overflowY:'auto',
        }}
      >
        {title && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:600, color:'var(--white)' }}>{title}</h2>
            <button onClick={onClose} style={{ background:'transparent', color:'var(--slate)', padding:6, borderRadius:'var(--r-sm)', fontSize:18, lineHeight:1 }}>✕</button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

// ── Badge ──────────────────────────────────────────────
export function Badge({ children, color='var(--gold)', bg }) {
  return (
    <span style={{
      fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:20,
      color, background: bg || `${color}18`,
      border:`1px solid ${color}30`, display:'inline-flex', alignItems:'center',
    }}>{children}</span>
  )
}

// ── Spinner ──────────────────────────────────────────────
export function Spinner({ size=20, color='var(--gold)' }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      border:`2px solid ${color}30`,
      borderTopColor:color,
      animation:'spin .8s linear infinite',
      flexShrink:0,
    }}/>
  )
}

// ── Empty state ──────────────────────────────────────────
export function EmptyState({ icon='📚', title, desc, action }) {
  return (
    <div style={{ textAlign:'center', padding:'64px 24px' }}>
      <div style={{ fontSize:48, marginBottom:16, opacity:.4 }}>{icon}</div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:20, color:'var(--slate2)', marginBottom:8 }}>{title}</div>
      <div style={{ fontSize:14, color:'var(--slate)', lineHeight:1.7, marginBottom:action?24:0 }}>{desc}</div>
      {action}
    </div>
  )
}
