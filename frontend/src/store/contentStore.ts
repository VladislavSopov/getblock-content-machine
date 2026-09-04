import { create } from 'zustand'
import api from '../lib/api'
import { ContentBatch, ContentDraft } from '../types'

interface ContentState {
  batches: ContentBatch[]
  drafts: ContentDraft[]
  isGenerating: boolean
  fetchDrafts: (params?: Record<string, string>) => Promise<void>
  fetchBatches: () => Promise<void>
  createBatch: (data: any) => Promise<void>
  updateDraft: (id: string, data: any) => Promise<void>
  approveDraft: (id: string) => Promise<void>
  deleteDraft: (id: string) => Promise<void>
  regenerateDraft: (id: string) => Promise<void>
}

export const useContentStore = create<ContentState>((set, get) => ({
  batches: [],
  drafts: [],
  isGenerating: false,

  fetchDrafts: async (params = {}) => {
    const res = await api.get('/api/content/drafts', { params })
    set({ drafts: res.data })
  },

  fetchBatches: async () => {
    const res = await api.get('/api/content/batches')
    set({ batches: res.data })
  },

  createBatch: async (data) => {
    set({ isGenerating: true })
    try {
      const res = await api.post('/api/content/batches', data)
      const batchId = res.data.id
      // Poll until drafts for this batch appear (background generation)
      const start = Date.now()
      const poll = async (): Promise<void> => {
        await get().fetchDrafts()
        const hasDrafts = get().drafts.some(d => d.batch_id === batchId)
        if (!hasDrafts && Date.now() - start < 180_000) {
          await new Promise(r => setTimeout(r, 3000))
          return poll()
        }
      }
      await poll()
    } finally {
      set({ isGenerating: false })
    }
  },

  updateDraft: async (id, data) => {
    await api.patch(`/api/content/drafts/${id}`, data)
    await get().fetchDrafts()
  },

  approveDraft: async (id) => {
    await api.patch(`/api/content/drafts/${id}`, { status: 'approved' })
    await get().fetchDrafts()
  },

  deleteDraft: async (id) => {
    await api.delete(`/api/content/drafts/${id}`)
    set(s => ({ drafts: s.drafts.filter(d => d.id !== id) }))
  },

  regenerateDraft: async (id) => {
    await api.post(`/api/content/drafts/${id}/regenerate`)
    await get().fetchDrafts()
  },
}))
