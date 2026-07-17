import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'storycanvas-dev-secret-change-me'

export const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token provided' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export const signToken = (id) =>
  jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' })
