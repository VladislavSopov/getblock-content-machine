import { useState } from 'react'
import { X, Check, Trash2, RotateCcw, Calendar } from 'lucide-react'
import { ContentDraft, getChannel } from '../types'
import { useContentStore } from '../store/contentStore'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function EventModal({ draft, onClose }: { draft: ContentDraft; onClose: () => void }) {
  const { updateDraft, approveDraft, deleteDraft, regenerateDraft } = useContentStore()
  const { isAdmin } = useAuthStore()
  const [text, setText] = useState(draft.draft_text)
  const [date, setDate] = useState(draft.scheduled_date || '')
  const [time, setTime] = useState(draft.scheduled_time || '')
  const [saving, setSaving] = useState(false)
  const channel = getChannel(draft.channel)

  const save = async () => {
    setSaving(true)
    try {
      await updateDraft(draft.id, { draft_text: text, scheduled_date: date, scheduled_time: time })
      toast.success('Draft updated')
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  const approve = async () => {
    try {
      await approveDraft(draft.id)
      toast.success('Draft approved and scheduled!')
      onClose()
    } catch { toast.error('Failed to approve') }
  }

  const remove = async () => {
    if (!confirm('Delete this draft?')) return
    try {
      await deleteDraft(draft.id)
      toast.success('Draft deleted')
      onClose()
    } catch { toast.error('Failed to delete') }
  }

  const regen = async () => {
    try {
      await regenerateDraft(draft.id)
      toast.success('Draft regenerated')
      onClose()
    } catch { toast.error('Failed to regenerate') }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 60, padding: 20,
    }}>
      <div style={{
        background: '#1A1A2E', border: '1px solid #2A2A4A',
        borderRadius: 14, width: '100%', maxWidth: 600,
        maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #2A2A4A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: channel.color }} />
            <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 15 }}>{channel.name}</span>
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 20,
              background: draft.status === 'approved' ? 'rgba(16,185,129,0.15)' : 'rgba(124,58,237,0.15)',
              color: draft.status === 'approved' ? '#10B981' : '#A78BFA',
              fontWeight: 600,
            }}>{draft.status.toUpperCase()}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            readOnly={!isAdmin()}
            rows={12}
            style={{
              width: '100%', padding: '12px', background: '#0F0F1A',
              border: '1px solid #2A2A4A', borderRadius: 8, color: '#e2e8f0',
              fontSize: 13, resize: 'vertical', outline: 'none',
            }}
          />

          {isAdmin() && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 4 }}>SCHEDULED DATE</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', background: '#0F0F1A', border: '1px solid #2A2A4A', borderRadius: 6, color: '#e2e8f0', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 4 }}>TIME (UTC)</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', background: '#0F0F1A', border: '1px solid #2A2A4A', borderRadius: 6, color: '#e2e8f0', fontSize: 13 }} />
              </div>
            </div>
          )}

          {draft.ai_reasoning && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(124,58,237,0.08)', borderRadius: 8, border: '1px solid rgba(124,58,237,0.2)' }}>
              <p style={{ fontSize: 11, color: '#7C3AED', fontWeight: 600, margin: '0 0 4px' }}>AI REASONING</p>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{draft.ai_reasoning}</p>
            </div>
          )}
        </div>

        {isAdmin() && (
          <div style={{ padding: '14px 22px', borderTop: '1px solid #2A2A4A', display: 'flex', gap: 8 }}>
            <button onClick={save} disabled={saving} style={{ padding: '8px 14px', background: '#2A2A4A', border: 'none', borderRadius: 7, color: '#e2e8f0', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={approve} style={{ padding: '8px 14px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 7, color: '#10B981', fontSize: 13, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Check size={13} /> Approve
            </button>
            <button onClick={regen} style={{ padding: '8px 14px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 7, color: '#A78BFA', fontSize: 13, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
              <RotateCcw size={13} /> Regenerate
            </button>
            <button onClick={remove} style={{ marginLeft: 'auto', padding: '8px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, color: '#EF4444', fontSize: 13, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Trash2 size={13} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
