"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronDown, Clock3, Compass, Grid2X2, Library, MoreHorizontal, Plus, Search, Settings, Sparkles, Trash2, X } from "lucide-react";

type World = {
  id: number;
  title: string;
  genre: string;
  description: string;
  coverColor: string;
  updatedAt: string;
  canvas?: { nodes?: unknown[] };
};

const colorArt: Record<string, string> = {
  ember: "from-[#693c30] via-[#b1643e] to-[#d99b62]",
  cosmos: "from-[#202b50] via-[#4c5286] to-[#ab87a8]",
  ocean: "from-[#244b57] via-[#477f82] to-[#b0b389]",
  desert: "from-[#67432e] via-[#b8784d] to-[#d8b06f]",
  violet: "from-[#483f62] via-[#75638d] to-[#bd8fa4]",
};

function timeAgo(date: string) {
  const diff = Math.max(1, Date.now() - new Date(date).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? "Just now" : `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Dashboard() {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All genres");
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [newGenre, setNewGenre] = useState("Epic Fantasy");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/worlds").then((r) => r.json()).then(setWorlds).finally(() => setLoading(false));
  }, []);

  const genres = useMemo(() => ["All genres", ...Array.from(new Set(worlds.map((w) => w.genre)))], [worlds]);
  const filtered = worlds.filter((world) => {
    const matchesText = `${world.title} ${world.description}`.toLowerCase().includes(query.toLowerCase());
    return matchesText && (genre === "All genres" || world.genre === genre);
  });

  async function createWorld(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    const response = await fetch("/api/worlds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, genre: newGenre, coverColor: "violet" }),
    });
    const created = await response.json();
    setWorlds((current) => [created, ...current]);
    setTitle("");
    setCreating(false);
    setShowCreate(false);
  }

  async function deleteWorld(id: number) {
    if (!window.confirm("Delete this world and its canvas? This cannot be undone.")) return;
    const response = await fetch(`/api/worlds/${id}`, { method: "DELETE" });
    if (response.ok) setWorlds((current) => current.filter((world) => world.id !== id));
  }

  return (
    <div className="app-shell">
      <aside className="dashboard-sidebar">
        <div className="brand-lockup"><span className="brand-mark"><Sparkles size={18} /></span><span>Storycanvas</span></div>
        <nav className="side-nav" aria-label="Main navigation">
          <button className="active"><Grid2X2 size={18} /><span>My worlds</span></button>
          <button><Compass size={18} /><span>Explore</span><span className="soon">Soon</span></button>
          <button><Library size={18} /><span>Lore library</span></button>
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-quote"><span>“</span><p>The world is not in your books and maps. It’s out there.</p><small>— Gandalf</small></div>
        <nav className="side-nav bottom"><button><Settings size={18} /><span>Settings</span></button></nav>
        <div className="profile-row">
          <div className="avatar">AM</div><div><strong>Alex Morgan</strong><small>Writer plan</small></div><MoreHorizontal size={18} />
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div><p className="eyebrow">Your creative atlas</p><h1>Worlds in progress</h1><p className="subtitle">Build places worth getting lost in.</p></div>
          <button className="primary-button" onClick={() => setShowCreate(true)}><Plus size={18} /> New world</button>
        </header>

        <section className="toolbar" aria-label="Project filters">
          <label className="search-field"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your worlds..." /></label>
          <label className="select-field"><BookOpen size={16} /><select value={genre} onChange={(e) => setGenre(e.target.value)}>{genres.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></label>
          <span className="world-count">{filtered.length} {filtered.length === 1 ? "world" : "worlds"}</span>
        </section>

        {loading ? (
          <div className="world-grid">{[1,2,3,4].map((item) => <div key={item} className="world-card skeleton" />)}</div>
        ) : filtered.length ? (
          <div className="world-grid">
            {filtered.map((world, index) => (
              <article className="world-card" key={world.id}>
                <Link href={`/world/${world.id}`} className={`cover-art bg-gradient-to-br ${colorArt[world.coverColor] || colorArt.violet}`}>
                  <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
                  <span className="cover-index">0{index + 1}</span>
                  <div className="cover-title"><small>A world by Alex Morgan</small><strong>{world.title}</strong></div>
                  <span className="open-hint">Open canvas <span>↗</span></span>
                </Link>
                <div className="card-info">
                  <div className="card-title-row"><div><span className="genre-pill">{world.genre}</span><h2><Link href={`/world/${world.id}`}>{world.title}</Link></h2></div><button onClick={() => deleteWorld(world.id)} className="icon-button danger" title="Delete world"><Trash2 size={16} /></button></div>
                  <p>{world.description}</p>
                  <footer><span><Clock3 size={14} /> Edited {timeAgo(world.updatedAt)}</span><span>{world.canvas?.nodes?.length ?? 0} places</span></footer>
                </div>
              </article>
            ))}
            <button className="new-world-card" onClick={() => setShowCreate(true)}><span><Plus size={23} /></span><strong>Start a new world</strong><small>Begin with a blank canvas</small></button>
          </div>
        ) : (
          <div className="empty-state"><Compass size={28} /><h2>No worlds found</h2><p>Try another search or begin a new world.</p><button className="primary-button" onClick={() => setShowCreate(true)}><Plus size={17} /> New world</button></div>
        )}
      </main>

      {showCreate && (
        <div className="modal-backdrop" onMouseDown={() => setShowCreate(false)}>
          <form className="create-modal" onSubmit={createWorld} onMouseDown={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setShowCreate(false)}><X size={18} /></button>
            <span className="modal-icon"><Sparkles size={21} /></span><p className="eyebrow">A new beginning</p><h2>Name your world</h2><p>Every great story starts with an empty map.</p>
            <label>World title<input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. The Ember Kingdoms" /></label>
            <label>Genre<select value={newGenre} onChange={(e) => setNewGenre(e.target.value)}><option>Epic Fantasy</option><option>Science Fiction</option><option>Dark Fantasy</option><option>Urban Fantasy</option><option>Weird West</option><option>Other</option></select></label>
            <button className="primary-button full" disabled={creating || !title.trim()}>{creating ? "Creating…" : "Create world"}</button>
          </form>
        </div>
      )}
    </div>
  );
}
