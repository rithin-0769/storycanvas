import db from '../db/init.js'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

export const User = {
  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase())
  },

  findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  },

  async create({ name, email, password }) {
    const id = randomUUID()
    const hashed = await bcrypt.hash(password, 10)
    db.prepare(`
      INSERT INTO users (id, name, email, password, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name, email.toLowerCase(), hashed, new Date().toISOString())
    return this.findById(id)
  },

  async matchPassword(user, plain) {
    return bcrypt.compare(plain, user.password)
  },

  sanitize(user) {
    if (!user) return null
    const { password, ...rest } = user
    return rest
  }
}
