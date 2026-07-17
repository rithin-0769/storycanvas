import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import { API } from '../data/constants'

export function useBooks() {
  const { authFetch } = useAuth()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchBooks = useCallback(async () => {
    setLoading(true)
    try {
      const r = await authFetch(`${API}/books`)
      if (r.ok) setBooks(await r.json())
    } finally { setLoading(false) }
  }, [authFetch])

  const createBook = async (data) => {
    const r = await authFetch(`${API}/books`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!r.ok) throw new Error((await r.json()).error)
    const book = await r.json()
    setBooks(prev => [book, ...prev])
    return book
  }

  const updateBook = async (id, data) => {
    const r = await authFetch(`${API}/books/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!r.ok) throw new Error((await r.json()).error)
    const book = await r.json()
    setBooks(prev => prev.map(b => b.id === id ? book : b))
    return book
  }

  const deleteBook = async (id) => {
    await authFetch(`${API}/books/${id}`, { method: 'DELETE' })
    setBooks(prev => prev.filter(b => b.id !== id))
  }

  const getBook = async (id) => {
    const r = await authFetch(`${API}/books/${id}`)
    if (!r.ok) throw new Error('Not found')
    return r.json()
  }

  return { books, loading, fetchBooks, createBook, updateBook, deleteBook, getBook }
}
