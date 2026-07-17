import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import './db/init.js'          // creates storycanvas.db + tables on boot
import authRoutes from './routes/auth.js'
import bookRoutes from './routes/books.js'

dotenv.config()

const app = express()

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/books', bookRoutes)

app.get('/api/health', (_, res) => res.json({ status: 'ok', db: 'sqlite' }))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Storycanvas server running on port ${PORT} (SQLite)`))

export default app
