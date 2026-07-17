import db from '../db/init.js'
import { randomUUID } from 'crypto'

function parseRow(row) {
  if (!row) return null
  return {
    ...row,
    nodes: JSON.parse(row.nodes || '[]'),
    edges: JSON.parse(row.edges || '[]'),
  }
}

export const Book = {
  findAllByOwner(ownerId) {
    const rows = db.prepare(`
      SELECT id, ownerId, title, genre, description, coverColor, status, worldName, lastEdited, createdAt,
             nodes
      FROM books WHERE ownerId = ? ORDER BY lastEdited DESC
    `).all(ownerId)
    // Only send node count for list view, not full node data (keeps payload small)
    return rows.map(r => {
      const nodes = JSON.parse(r.nodes || '[]')
      const { nodes: _drop, ...rest } = r
      return { ...rest, nodes } // keep nodes for count on dashboard cards
    })
  },

  findById(id, ownerId) {
    const row = db.prepare('SELECT * FROM books WHERE id = ? AND ownerId = ?').get(id, ownerId)
    return parseRow(row)
  },

  create({ ownerId, title, genre, description, coverColor, worldName }) {
    const id = randomUUID()
    const now = new Date().toISOString()
    db.prepare(`
      INSERT INTO books (id, ownerId, title, genre, description, coverColor, status, worldName, nodes, edges, lastEdited, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, 'drafting', ?, '[]', '[]', ?, ?)
    `).run(id, ownerId, title, genre || 'Fantasy', description || '', coverColor || '#4A90D9', worldName || 'Untitled World', now, now)
    return this.findById(id, ownerId)
  },

  update(id, ownerId, data) {
    const existing = this.findById(id, ownerId)
    if (!existing) return null

    const merged = {
      title: data.title ?? existing.title,
      genre: data.genre ?? existing.genre,
      description: data.description ?? existing.description,
      coverColor: data.coverColor ?? existing.coverColor,
      status: data.status ?? existing.status,
      worldName: data.worldName ?? existing.worldName,
      nodes: data.nodes !== undefined ? JSON.stringify(data.nodes) : JSON.stringify(existing.nodes),
      edges: data.edges !== undefined ? JSON.stringify(data.edges) : JSON.stringify(existing.edges),
    }

    db.prepare(`
      UPDATE books SET title=?, genre=?, description=?, coverColor=?, status=?, worldName=?, nodes=?, edges=?, lastEdited=?
      WHERE id = ? AND ownerId = ?
    `).run(
      merged.title, merged.genre, merged.description, merged.coverColor,
      merged.status, merged.worldName, merged.nodes, merged.edges,
      new Date().toISOString(), id, ownerId
    )
    return this.findById(id, ownerId)
  },

  delete(id, ownerId) {
    db.prepare('DELETE FROM books WHERE id = ? AND ownerId = ?').run(id, ownerId)
  }
}
