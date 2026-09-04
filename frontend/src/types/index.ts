export interface User {
  id: string
  email: string
  role: 'admin' | 'viewer'
  created_at?: string
}

export interface ContentBatch {
  id: string
  title: string
  source_text: string
  content_type: string
  tone: string
  audience: string
  keywords: string
  preferred_week: string
  channels: string[]
  created_by: string
  created_at: string
}

export interface ContentDraft {
  id: string
  batch_id: string
  channel: string
  draft_text: string
  status: 'draft' | 'approved' | 'published'
  scheduled_date: string | null
  scheduled_time: string | null
  ai_reasoning: string | null
  created_at: string
  updated_at: string
  batch_title?: string
}

export interface Channel {
  id: string
  name: string
  color: string
}

export const CHANNELS: Channel[] = [
  { id: 'blog_article', name: 'Blog Article', color: '#4F46E5' },
  { id: 'youtube_shorts', name: 'YouTube Shorts', color: '#EF4444' },
  { id: 'youtube_full', name: 'YouTube Full', color: '#F97316' },
  { id: 'x_article', name: 'X Article', color: '#0EA5E9' },
  { id: 'x_thread', name: 'X Thread', color: '#38BDF8' },
  { id: 'medium', name: 'Medium', color: '#10B981' },
  { id: 'paragraph', name: 'Paragraph', color: '#6366F1' },
  { id: 'hackernoon', name: 'Hackernoon', color: '#84CC16' },
  { id: 'publish0x', name: 'Publish0x', color: '#F59E0B' },
  { id: 'reddit', name: 'Reddit', color: '#FF4500' },
  { id: 'stackoverflow', name: 'Stack Overflow', color: '#F48024' },
]

export const getChannel = (id: string): Channel =>
  CHANNELS.find(c => c.id === id) ?? { id, name: id, color: '#7C3AED' }
