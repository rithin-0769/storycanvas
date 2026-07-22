import db from '../db/init.js'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

function generateVerificationCode() {
  return Math.random().toString().slice(2, 8)
}

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
    const verificationCode = generateVerificationCode()
    db.prepare(`
      INSERT INTO users (id, name, email, password, emailVerified, verificationCode, createdAt)
      VALUES (?, ?, ?, ?, 0, ?, ?)
    `).run(id, name, email.toLowerCase(), hashed, verificationCode, new Date().toISOString())
    return this.findById(id)
  },

  verifyEmail(userId) {
    db.prepare('UPDATE users SET emailVerified = 1, verificationCode = NULL WHERE id = ?').run(userId)
    return this.findById(userId)
  },

  findByVerificationCode(code) {
    return db.prepare('SELECT * FROM users WHERE verificationCode = ? AND emailVerified = 0').get(code)
  },

  async matchPassword(user, plain) {
    return bcrypt.compare(plain, user.password)
  },

  sanitize(user) {
    if (!user) return null
    const { password, verificationCode, ...rest } = user
    return rest
  }
}
