import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = process.env.DB_PATH || path.join(__dirname, 'storycanvas.db')

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    emailVerified INTEGER DEFAULT 0,
    verificationCode TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    ownerId TEXT NOT NULL,
    title TEXT NOT NULL,
    genre TEXT DEFAULT 'Fantasy',
    description TEXT DEFAULT '',
    coverColor TEXT DEFAULT '#4A90D9',
    status TEXT DEFAULT 'drafting',
    worldName TEXT DEFAULT 'Untitled World',
    nodes TEXT DEFAULT '[]',
    edges TEXT DEFAULT '[]',
    lastEdited TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (ownerId) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_books_owner ON books(ownerId);
`)

export default db
