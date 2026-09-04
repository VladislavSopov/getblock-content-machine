import { useState, useMemo } from 'react'
import { X, Zap } from 'lucide-react'
import { useContentStore } from '../store/contentStore'
import { CHANNELS } from '../types'
import toast from 'react-hot-toast'

const CONTENT_TYPES = ['Blog Article','YouTube Short Scenario','YouTube Full Video Scenario','X Article','X Thread','Owned Media Post']
const TONES = ['Professional','Technical','Casual','Hype']

export default function NewContentModal({ onClose }: { onClose: () => void }) {
  const { createBatch, isGenerating } = useContentStore()
  const [form, setForm] = useState({
    title: '',
    content_type: CONTENT_TYPES[0],
    source_text: '',
    audience: 'Web3 developers, blockchain node operators',
    tone: 'Professional',
    keywords: '',
    preferred_week: (() => { const d = new Date(); const jan1 = new Date(d.getFullYear(),0,1); const w = Math.ceil(((d.getTime()-jan1.getTime())/86400000+jan1.getDay()+1)/7); return `${d.getFullYear()}-W${String(w).padStart(2,'0')}` })(),
    channels: CHANNELS.map(c => c.id),
  })
  const [weekMode, setWeekMode] = useState<'this' | 'next' | 'custom'>('this')

  const getIsoWeek = (d: Date) => {
    const jan1 = new Date(d.getFullYear(), 0, 1)
    const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
    return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
  }

  const thisWeek = useMemo(() => getIsoWeek(new Date()), [])
  const nextWeek = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 7); return getIsoWeek(d)
  }, [])

  const setWeek = (mode: 'this' | 'next' | 'custom') => {
    setWeekMode(mode)
    if (mode === 'this') setForm(f => ({ ...f, preferred_week: thisWeek }))
    else if (mode === 'next') setForm(f => ({ ...f, preferred_week: nextWeek }))
    else setForm(f => ({ ...f, preferred_week: '' }))
  }

  const toggleChannel = (id: string) => {
    setForm(f => ({
      ...f,
      channels: f.channels.includes(id) ? f.channels.filter(c => c !== id) : [...f.channels, id],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.source_text.trim()) { toast.error('Source text is required'); return }
    if (form.channels.length === 0) { toast.error('Select at least one channel'); return }
    try {
      await createBatch(form)
      toast.success('Content batch created! Drafts are being generated.')
      onClose()
    } catch {
      toast.error('Failed to create content batch')
    }
  }

  const inp = {
    width: '100%', padding: '9px 12px', background: '#0F0F1A',
    border: '1px solid #2A2A4A', borderRadius: 8, color: '#e2e8f0',
    fontSize: 13, outline: 'none',
  }

  const lbl = { display: 'block' as const, fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 5, textTransform: 'uppercase' as const }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: 20,
    }}>
      <div style={{
        background: '#1A1A2E', border: '1px solid #2A2A4A',
        borderRadius: 14, width: '100%', maxWidth: 640,
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #2A2A4A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Zap size={18} color="#7C3AED" />
            <span style={{ fontWeight: 700, fontSize: 16, color: '#e2e8f0' }}>New Content</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {isGenerating ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{
                width: 56, height: 56, margin: '0 auto 20px',
                borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'spin 2s linear infinite',
              }}>
                <Zap size={24} color="white" />
              </div>
              <p style={{ color: '#94a3b8', fontSize: 15 }}>Generating your content repurposing plan...</p>
              <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lbl}>Content Title</label>
                <input style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. How GetBlock RPC works" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Content Type</label>
                  <select style={inp} value={form.content_type} onChange={e => setForm(f => ({ ...f, content_type: e.target.value }))}>
                    {CONTENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Tone of Voice</label>
                  <select style={inp} value={form.tone} onChange={e => setForm(f => ({ ...f, tone: e.target.value }))}>
                    {TONES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={lbl}>Source Text</label>
                <textarea
                  style={{ ...inp, minHeight: 140, resize: 'vertical' }}
                  value={form.source_text}
                  onChange={e => setForm(f => ({ ...f, source_text: e.target.value }))}
                  placeholder="Paste your blog post, article, or any source content here..."
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Target Audience</label>
                  <input style={inp} value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))} />
                </div>
                <div>
                  <label style={lbl}>Primary Keywords</label>
                  <input style={inp} value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} placeholder="RPC, blockchain, Web3" />
                </div>
              </div>

              <div>
                <label style={lbl}>Preferred Posting Week</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['this', 'next', 'custom'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setWeek(mode)}
                      style={{
                        flex: 1, padding: '8px 4px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                        border: `1px solid ${weekMode === mode ? '#7C3AED' : '#2A2A4A'}`,
                        background: weekMode === mode ? 'rgba(124,58,237,0.15)' : 'transparent',
                        color: weekMode === mode ? '#A78BFA' : '#64748b',
                        cursor: 'pointer',
                      }}
                    >
                      {mode === 'this' ? 'This Week' : mode === 'next' ? 'Next Week' : 'Custom'}
                    </button>
                  ))}
                </div>
                {weekMode === 'custom' && (
                  <input
                    type="date"
                    style={{ ...inp, marginTop: 8 }}
                    onChange={e => {
                      if (!e.target.value) { setForm(f => ({ ...f, preferred_week: '' })); return }
                      const d = new Date(e.target.value)
                      setForm(f => ({ ...f, preferred_week: getIsoWeek(d) }))
                    }}
                  />
                )}
                {form.preferred_week && (
                  <div style={{ marginTop: 6, fontSize: 11, color: '#64748b' }}>Week: {form.preferred_week}</div>
                )}
              </div>

              <div>
                <label style={lbl}>Channels to Generate</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {CHANNELS.map(ch => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => toggleChannel(ch.id)}
                      style={{
                        padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                        border: `1px solid ${form.channels.includes(ch.id) ? ch.color : '#2A2A4A'}`,
                        background: form.channels.includes(ch.id) ? `${ch.color}22` : 'transparent',
                        color: form.channels.includes(ch.id) ? ch.color : '#64748b',
                        cursor: 'pointer',
                      }}
                    >
                      {ch.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                style={{
                  marginTop: 8, padding: '11px',
                  background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                  border: 'none', borderRadius: 8, color: 'white',
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                }}
              >
                Generate Repurposed Content
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
