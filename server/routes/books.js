import express from 'express'
import { Book } from '../models/Book.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()
router.use(protect)

router.get('/', (req, res) => {
  try {
    res.json(Book.findAllByOwner(req.user.id))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/', (req, res) => {
  try {
    const { title, genre, description, coverColor, worldName } = req.body
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' })
    const book = Book.create({ ownerId: req.user.id, title: title.trim(), genre, description, coverColor, worldName })
    res.status(201).json(book)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/:id', (req, res) => {
  try {
    const book = Book.findById(req.params.id, req.user.id)
    if (!book) return res.status(404).json({ error: 'Book not found' })
    res.json(book)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/:id', (req, res) => {
  try {
    const book = Book.update(req.params.id, req.user.id, req.body)
    if (!book) return res.status(404).json({ error: 'Book not found' })
    res.json(book)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/:id', (req, res) => {
  try {
    Book.delete(req.params.id, req.user.id)
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
