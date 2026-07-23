import express from 'express'
import { User } from '../models/User.js'
import { signToken, protect } from '../middleware/auth.js'

const router = express.Router()

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name?.trim() || !email?.trim() || !password)
      return res.status(400).json({ error: 'All fields are required' })
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    if (User.findByEmail(email))
      return res.status(400).json({ error: 'Email already in use' })

    const user = await User.create({ name: name.trim(), email: email.trim(), password })
    res.status(201).json({
      message: 'Account created! Check the verification code below.',
      verificationCode: user.verificationCode,
      token: signToken(user.id),
      user: User.sanitize(user),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/verify-email', protect, async (req, res) => {
  try {
    const { code } = req.body
    if (!code?.trim())
      return res.status(400).json({ error: 'Verification code is required' })

    const user = User.findByVerificationCode(code.trim())
    if (!user || user.id !== req.user.id)
      return res.status(400).json({ error: 'Invalid or expired code' })

    const verified = User.verifyEmail(user.id)
    res.json({
      message: 'Email verified!',
      user: User.sanitize(verified),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = User.findByEmail(email || '')
    if (!user || !(await User.matchPassword(user, password)))
      return res.status(401).json({ error: 'Invalid email or password' })

    res.json({
      token: signToken(user.id),
      user: User.sanitize(user),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/me', protect, (req, res) => {
  const user = User.findById(req.user.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(User.sanitize(user))
})

export default router
