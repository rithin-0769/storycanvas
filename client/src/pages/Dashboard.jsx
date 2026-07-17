import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useBooks } from '../hooks/useBooks'
import { Btn, Input, Textarea, Select, Modal, Badge, Spinner, EmptyState } from '../components/ui'
import { STATUS_CONFIG, GENRES, COVER_COLORS } from '../data/constants'
import { Plus, BookOpen, Map, Clock, MoreVertical, LogOut, Trash2, Edit2, ExternalLink } from 'lucide-react'

// ── Create/Edit Book Modal ──────────────────────────────
function BookModal({ book, onClose, onSave }) {
  const [form, setForm] = useState({
    title: book?.title || '',
    genre: book?.genre || 'Fantasy',
    description: book?.description || '',
    coverColor: book?.coverColor || COVER_COLORS[0],
    worldName: book?.worldName || '',
    status: book?.status || 'drafting',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.title.trim()) { setError('Title is required'); return }
    setLoading(true); setError('')
    try {
      await onSave(form)
      onClose()
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  return (
    <Modal title={book ? 'Edit book' : 'New book'} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {/* Cover preview */}
        <div style={{
          height:80, borderRadius:'var(--r-md)', marginBottom:4,
          background:`linear-gradient(135deg, ${form.coverColor}30, ${form.coverColor}10)`,
          border:`1px solid ${form.coverColor}40`,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <span style={{ fontFamily:'var(--font-display)', fontSize:18, color:'var(--white)', fontWeight:600, letterSpacing:'-0.5px', textAlign:'center', padding:'0 16px' }}>
            {form.title || 'Untitled Book'}
          </span>
        </div>

        <div>
          <label style={{ fontSize:11, fontWeight:600, color:'var(--slate)', textTransform:'uppercase', letterSpacing:.7, display:'block', marginBottom:8 }}>Cover colour</label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {COVER_COLORS.map(c => (
              <button key={c} onClick={() => set('coverColor', c)} style={{
                width:28, height:28, borderRadius:'50%', background:c, border:'none',
                outline: form.coverColor === c ? `2px solid var(--white)` : '2px solid transparent',
                outlineOffset:2, cursor:'pointer', transition:'all .15s',
              }}/>
            ))}
          </div>
        </div>

        <Input label="Book title *" placeholder="e.g. The Shattered Realm" value={form.title}
          onChange={e => set('title', e.target.value)} error={error} />

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Select label="Genre" value={form.genre} options={GENRES}
            onChange={e => set('genre', e.target.value)} />
          <Select label="Status" value={form.status}
            options={Object.entries(STATUS_CONFIG).map(([v,c])=>({ value:v, label:c.label }))}
            onChange={e => set('status', e.target.value)} />
        </div>

        <Input label="World name" placeholder="e.g. The Shattered Realm" value={form.worldName}
          onChange={e => set('worldName', e.target.value)} />

        <Textarea label="Description" placeholder="What is this book about?" rows={3}
          value={form.description} onChange={e => set('description', e.target.value)} />

        <div style={{ display:'flex', gap:10, marginTop:4 }}>
          <Btn variant="ghost" style={{ flex:1 }} onClick={onClose}>Cancel</Btn>
          <Btn style={{ flex:2 }} onClick={submit} loading={loading}>
            {book ? 'Save changes' : 'Create book'}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}

// ── Book card ──────────────────────────────────────────
function BookCard({ book, onOpen, onEdit, onDelete }) {
  const [menu, setMenu] = useState(false)
  const s = STATUS_CONFIG[book.status] || STATUS_CONFIG.drafting
  const ago = timeAgo(book.lastEdited)

  return (
    <div
      onClick={() => !menu && onOpen(book.id)}
      style={{
        background:'var(--ink3)', border:'1px solid var(--border)',
        borderRadius:'var(--r-lg)', overflow:'hidden',
        cursor:'pointer', transition:'all .2s', position:'relative',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor=`${book.coverColor}50`; e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 8px 32px ${book.coverColor}12` }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none' }}
    >
      {/* Cover bar */}
      <div style={{
        height:6,
        background:`linear-gradient(90deg, ${book.coverColor}, ${book.coverColor}88)`,
      }}/>

      {/* Cover area */}
      <div style={{
        height:100, padding:'20px 20px 0',
        background:`linear-gradient(135deg, ${book.coverColor}18, transparent)`,
        display:'flex', alignItems:'flex-start', justifyContent:'space-between',
      }}>
        <div style={{
          width:52, height:66, borderRadius:5,
          background:`linear-gradient(160deg, ${book.coverColor}50, ${book.coverColor}25)`,
          border:`1px solid ${book.coverColor}60`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:22, boxShadow:`0 4px 14px ${book.coverColor}20`,
        }}>📖</div>

        {/* Menu */}
        <div style={{ position:'relative' }}>
          <button
            onClick={e => { e.stopPropagation(); setMenu(v=>!v) }}
            style={{
              background:'rgba(255,255,255,.07)', border:'1px solid var(--border)',
              borderRadius:'var(--r-sm)', padding:'4px 7px', color:'var(--slate2)',
            }}>
            <MoreVertical size={14}/>
          </button>
          {menu && (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position:'absolute', right:0, top:32, width:140,
                background:'var(--ink4)', border:'1px solid var(--border2)',
                borderRadius:'var(--r-md)', overflow:'hidden',
                boxShadow:'var(--shadow-lg)', zIndex:20, animation:'fadeInFast .1s ease',
              }}>
              {[
                { icon:<ExternalLink size={13}/>, label:'Open canvas', action:()=>{ onOpen(book.id); setMenu(false) } },
                { icon:<Edit2 size={13}/>, label:'Edit details', action:()=>{ onEdit(book); setMenu(false) } },
                { icon:<Trash2 size={13}/>, label:'Delete', action:()=>{ onDelete(book.id); setMenu(false) }, danger:true },
              ].map(item => (
                <button key={item.label} onClick={item.action} style={{
                  width:'100%', padding:'10px 14px', background:'transparent',
                  color: item.danger ? 'var(--red)' : 'var(--slate2)',
                  fontSize:13, display:'flex', alignItems:'center', gap:9,
                  textAlign:'left', borderBottom:'1px solid var(--border)',
                  transition:'background .1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.05)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >{item.icon}{item.label}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding:'14px 18px 18px' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:600, color:'var(--white)', marginBottom:5, lineHeight:1.3 }}>
          {book.title}
        </div>
        <div style={{ fontSize:12, color:'var(--slate)', marginBottom:10 }}>{book.genre}</div>
        {book.description && (
          <div style={{ fontSize:12, color:'var(--slate)', lineHeight:1.6, marginBottom:12,
            overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
            {book.description}
          </div>
        )}

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
          <Badge color={s.color} bg={s.bg}>{s.label}</Badge>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:11, color:'var(--slate)', display:'flex', alignItems:'center', gap:4 }}>
              <Map size={10}/> {book.nodes?.length ?? 0}
            </span>
            <span style={{ fontSize:11, color:'var(--slate)', display:'flex', alignItems:'center', gap:4 }}>
              <Clock size={10}/> {ago}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function timeAgo(date) {
  if (!date) return 'Never'
  const diff = (Date.now() - new Date(date)) / 1000
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}

// ── Dashboard ──────────────────────────────────────────
export default function Dashboard() {
  const { user, logout } = useAuth()
  const { books, loading, fetchBooks, createBook, updateBook, deleteBook } = useBooks()
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const [editBook, setEditBook] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchBooks() }, [])

  const filtered = books.filter(b => {
    const matchFilter = filter === 'all' || b.status === filter
    const matchSearch = !search || b.title.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const stats = {
    total: books.length,
    drafting: books.filter(b => b.status === 'drafting').length,
    complete: books.filter(b => b.status === 'complete').length,
    locations: books.reduce((s, b) => s + (b.nodes?.length ?? 0), 0),
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--ink)', display:'flex', flexDirection:'column' }}>
      {/* Top nav */}
      <nav style={{
        height:56, padding:'0 5%', display:'flex', alignItems:'center', gap:14,
        background:'rgba(10,14,23,.9)', backdropFilter:'blur(16px)',
        borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:20,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
            <rect x="2" y="2" width="24" height="24" rx="6" fill="rgba(201,168,76,.15)" stroke="#C9A84C" strokeWidth="1.2"/>
            <circle cx="9" cy="9" r="2.2" fill="#C9A84C"/>
            <circle cx="19" cy="9" r="2.2" fill="#C9A84C" opacity=".6"/>
            <circle cx="9" cy="19" r="2.2" fill="#C9A84C" opacity=".6"/>
            <circle cx="19" cy="19" r="2.2" fill="#C9A84C"/>
            <line x1="11.2" y1="9" x2="16.8" y2="9" stroke="#C9A84C" strokeWidth="1" opacity=".5"/>
            <line x1="9" y1="11.2" x2="9" y2="16.8" stroke="#C9A84C" strokeWidth="1" opacity=".5"/>
          </svg>
          <span style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:600, color:'var(--white)' }}>Storycanvas</span>
        </div>

        <div style={{ flex:1 }}/>

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ fontSize:13, color:'var(--slate2)' }}>
            Hey, <strong style={{ color:'var(--white)' }}>{user?.name?.split(' ')[0]}</strong> 👋
          </div>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(201,168,76,.2)', border:'1.5px solid rgba(201,168,76,.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'var(--gold)' }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <Btn variant="ghost" size="sm" onClick={logout} style={{ gap:6 }}>
            <LogOut size={13}/> Sign out
          </Btn>
        </div>
      </nav>

      <main style={{ flex:1, padding:'40px 5%', maxWidth:1280, margin:'0 auto', width:'100%' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:36 }}>
          <div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(22px,3vw,36px)', fontWeight:700, color:'var(--white)', letterSpacing:'-0.5px', marginBottom:6 }}>
              My Library
            </h1>
            <p style={{ fontSize:14, color:'var(--slate)' }}>
              {books.length === 0 ? 'Create your first book to get started' : `${books.length} book${books.length !== 1 ? 's' : ''} in your library`}
            </p>
          </div>
          <Btn onClick={() => setShowCreate(true)} style={{ gap:7 }}>
            <Plus size={15}/> New book
          </Btn>
        </div>

        {/* Stats */}
        {books.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:36 }}>
            {[
              { label:'Total books',   value:stats.total,     color:'var(--gold)' },
              { label:'In progress',   value:stats.drafting,  color:'var(--blue)' },
              { label:'Complete',      value:stats.complete,  color:'var(--green)' },
              { label:'Locations mapped', value:stats.locations, color:'var(--purple)' },
            ].map(s => (
              <div key={s.label} style={{
                background:'var(--ink3)', border:'1px solid var(--border)',
                borderRadius:'var(--r-lg)', padding:'18px 20px',
              }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:700, color:s.color, lineHeight:1, marginBottom:5 }}>{s.value}</div>
                <div style={{ fontSize:12, color:'var(--slate)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        {books.length > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:24 }}>
            <input
              placeholder="Search books..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                background:'rgba(255,255,255,.04)', border:'1px solid var(--border2)',
                borderRadius:'var(--r-sm)', color:'var(--white)', fontSize:13,
                padding:'8px 14px', width:220,
              }}
            />
            <div style={{ display:'flex', gap:6 }}>
              {[['all','All'],['drafting','Drafting'],['editing','Editing'],['complete','Complete'],['paused','Paused']].map(([v,l]) => (
                <button key={v} onClick={() => setFilter(v)} style={{
                  fontSize:12, padding:'6px 14px', borderRadius:20,
                  background: filter===v ? 'rgba(201,168,76,.15)' : 'rgba(255,255,255,.04)',
                  border:`1px solid ${filter===v ? 'rgba(201,168,76,.4)' : 'var(--border)'}`,
                  color: filter===v ? 'var(--gold)' : 'var(--slate2)',
                  fontWeight: filter===v ? 600 : 400,
                  transition:'all .15s',
                }}>{l}</button>
              ))}
            </div>
          </div>
        )}

        {/* Book grid */}
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner size={28}/></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📚"
            title={books.length === 0 ? 'No books yet' : 'No results'}
            desc={books.length === 0 ? 'Create your first book to start building your world on Storycanvas.' : 'Try adjusting your search or filter.'}
            action={books.length === 0 && (
              <Btn onClick={() => setShowCreate(true)} style={{ gap:7 }}>
                <Plus size={15}/> Create first book
              </Btn>
            )}
          />
        ) : (
          <div className="anim-fade" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:20 }}>
            {filtered.map(b => (
              <BookCard
                key={b.id} book={b}
                onOpen={id => navigate(`/canvas/${id}`)}
                onEdit={book => setEditBook(book)}
                onDelete={async id => {
                  if (!confirm('Delete this book? This cannot be undone.')) return
                  await deleteBook(id)
                }}
              />
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <BookModal onClose={() => setShowCreate(false)} onSave={createBook} />
      )}
      {editBook && (
        <BookModal book={editBook} onClose={() => setEditBook(null)}
          onSave={data => updateBook(editBook.id, data)} />
      )}
    </div>
  )
}
