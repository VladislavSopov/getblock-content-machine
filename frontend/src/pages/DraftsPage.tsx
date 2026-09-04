import { useEffect, useState, useCallback } from 'react'
import { Check, Trash2, RotateCcw, ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react'
import { useContentStore } from '../store/contentStore'
import { CHANNELS, ContentDraft, getChannel } from '../types'
import toast from 'react-hot-toast'

const STATUSES = ['all', 'draft', 'approved', 'published']

export default function DraftsPage() {
  const { drafts, fetchDrafts, updateDraft, approveDraft, deleteDraft, regenerateDraft } = useContentStore()
  const [statusFilter, setStatusFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editText, setEditText] = useState<Record<string, string>>({})

  useEffect(() => { fetchDrafts() }, [])

  const filtered = drafts.filter(d => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false
    if (channelFilter !== 'all' && d.channel !== channelFilter) return false
    return true
  })

  const toggleSelect = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelected(s => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }, [])

  const allSelected = filtered.length > 0 && filtered.every(d => selected.has(d.id))

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(filtered.map(d => d.id)))
  }

  const deleteSelected = async () => {
    if (!selected.size) return
    if (!confirm(`Delete ${selected.size} draft(s)?`)) return
    setDeleting(true)
    try {
      await Promise.all([...selected].map(id => deleteDraft(id)))
      setSelected(new Set())
      toast.success(`Deleted ${selected.size} draft(s)`)
    } catch { toast.error('Some deletions failed') }
    finally { setDeleting(false) }
  }

  const approve = async (d: ContentDraft) => {
    try { await approveDraft(d.id); toast.success('Approved!') }
    catch { toast.error('Failed') }
  }

  const remove = async (d: ContentDraft) => {
    if (!confirm('Delete this draft?')) return
    try { await deleteDraft(d.id); toast.success('Deleted') }
    catch { toast.error('Failed') }
  }

  const regen = async (d: ContentDraft) => {
    try { await regenerateDraft(d.id); toast.success('Regenerated!') }
    catch { toast.error('Failed') }
  }

  const saveEdit = async (d: ContentDraft) => {
    try {
      await updateDraft(d.id, { draft_text: editText[d.id] })
      toast.success('Saved')
    } catch { toast.error('Failed') }
  }

  const pill = (active: boolean, color?: string) => ({
    padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
    border: `1px solid ${active ? (color || '#7C3AED') : '#2A2A4A'}`,
    background: active ? `${color || '#7C3AED'}22` : 'transparent',
    color: active ? (color || '#A78BFA') : '#64748b',
    cursor: 'pointer' as const,
  })

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>Drafts</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>{filtered.length} drafts</span>
          {selected.size > 0 && (
            <button
              onClick={deleteSelected}
              disabled={deleting}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#EF4444', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1,
              }}
            >
              <Trash2 size={12} />
              {deleting ? 'Deleting...' : `Delete ${selected.size} selected`}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={pill(statusFilter === s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <div style={{ width: 1, background: '#2A2A4A', margin: '0 4px' }} />
        <button onClick={() => setChannelFilter('all')} style={pill(channelFilter === 'all')}>All Channels</button>
        {CHANNELS.map(ch => (
          <button key={ch.id} onClick={() => setChannelFilter(ch.id)} style={pill(channelFilter === ch.id, ch.color)}>
            {ch.name}
          </button>
        ))}
      </div>

      {/* Select all bar — only shown when list is non-empty */}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '6px 4px' }}>
          <button
            onClick={toggleAll}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer', padding: 0 }}
          >
            {allSelected ? <CheckSquare size={15} color="#A78BFA" /> : <Square size={15} color="#64748b" />}
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
          {selected.size > 0 && (
            <span style={{ fontSize: 11, color: '#64748b' }}>{selected.size} of {filtered.length} selected</span>
          )}
        </div>
      )}

      {/* Draft cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>No drafts found.</div>
        )}
        {filtered.map(d => {
          const ch = getChannel(d.channel)
          const isOpen = expanded === d.id
          const isSelected = selected.has(d.id)
          return (
            <div key={d.id} style={{ background: '#1A1A2E', border: `1px solid ${isSelected ? '#7C3AED' : '#2A2A4A'}`, borderRadius: 10, transition: 'border-color 0.15s' }}>
              <div
                style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                onClick={() => {
                  setExpanded(isOpen ? null : d.id)
                  if (!editText[d.id]) setEditText(t => ({ ...t, [d.id]: d.draft_text }))
                }}
              >
                <div onClick={e => toggleSelect(d.id, e)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  {isSelected
                    ? <CheckSquare size={15} color="#A78BFA" />
                    : <Square size={15} color="#64748b" />
                  }
                </div>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: ch.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', flex: 1 }}>{ch.name}</span>
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
                  background: d.status === 'approved' ? 'rgba(16,185,129,0.15)' : d.status === 'published' ? 'rgba(79,70,229,0.15)' : 'rgba(124,58,237,0.1)',
                  color: d.status === 'approved' ? '#10B981' : d.status === 'published' ? '#818CF8' : '#A78BFA',
                }}>{d.status.toUpperCase()}</span>
                {d.scheduled_date && <span style={{ fontSize: 11, color: '#64748b' }}>{d.scheduled_date}</span>}
                {isOpen ? <ChevronUp size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
              </div>

              {isOpen && (
                <div style={{ padding: '0 16px 16px' }}>
                  <textarea
                    value={editText[d.id] ?? d.draft_text}
                    onChange={e => setEditText(t => ({ ...t, [d.id]: e.target.value }))}
                    rows={8}
                    style={{
                      width: '100%', padding: '10px 12px', background: '#0F0F1A',
                      border: '1px solid #2A2A4A', borderRadius: 8, color: '#e2e8f0',
                      fontSize: 13, resize: 'vertical', outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button onClick={() => saveEdit(d)} style={{ padding: '7px 14px', background: '#2A2A4A', border: 'none', borderRadius: 7, color: '#e2e8f0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Save</button>
                    {d.status !== 'approved' && (
                      <button onClick={() => approve(d)} style={{ padding: '7px 14px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 7, color: '#10B981', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Check size={12} /> Approve
                      </button>
                    )}
                    <button onClick={() => regen(d)} style={{ padding: '7px 14px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 7, color: '#A78BFA', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <RotateCcw size={12} /> Regenerate
                    </button>
                    <button onClick={() => remove(d)} style={{ marginLeft: 'auto', padding: '7px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
