import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Plus } from 'lucide-react'
import { useContentStore } from '../store/contentStore'
import { useAuthStore } from '../store/authStore'
import { CHANNELS, ContentDraft, getChannel } from '../types'
import NewContentModal from '../components/NewContentModal'
import EventModal from '../components/EventModal'
import toast from 'react-hot-toast'

export default function CalendarPage() {
  const { drafts, fetchDrafts, updateDraft } = useContentStore()
  const { isAdmin } = useAuthStore()
  const [showNew, setShowNew] = useState(false)
  const [selectedDraft, setSelectedDraft] = useState<ContentDraft | null>(null)
  const [activeChannels, setActiveChannels] = useState<string[]>(CHANNELS.map(c => c.id))

  useEffect(() => { fetchDrafts() }, [])

  const events = drafts
    .filter(d => d.scheduled_date && activeChannels.includes(d.channel))
    .map(d => ({
      id: d.id,
      title: d.batch_title ? `${d.batch_title} - ${getChannel(d.channel).name}` : getChannel(d.channel).name,
      date: d.scheduled_date!,
      backgroundColor: getChannel(d.channel).color,
      borderColor: 'transparent',
      extendedProps: { draft: d },
    }))

  const toggleChannel = (id: string) =>
    setActiveChannels(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )

  const handleEventDrop = async (info: any) => {
    if (!isAdmin()) { info.revert(); toast.error('Viewers cannot reschedule'); return }
    const draft: ContentDraft = info.event.extendedProps.draft
    const newDate = info.event.startStr.split('T')[0]
    try {
      await updateDraft(draft.id, { scheduled_date: newDate })
      toast.success('Rescheduled!')
    } catch {
      info.revert()
      toast.error('Failed to reschedule')
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>Content Calendar</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
            {drafts.filter(d => d.scheduled_date).length} posts scheduled
          </p>
        </div>
        {isAdmin() && (
          <button
            onClick={() => setShowNew(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
              background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              border: 'none', borderRadius: 8, color: 'white', fontWeight: 600,
              fontSize: 13, cursor: 'pointer',
            }}
          >
            <Plus size={16} /> New Content
          </button>
        )}
      </div>

      {/* Channel filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {CHANNELS.map(ch => (
          <button
            key={ch.id}
            onClick={() => toggleChannel(ch.id)}
            style={{
              padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              border: `1px solid ${activeChannels.includes(ch.id) ? ch.color : '#2A2A4A'}`,
              background: activeChannels.includes(ch.id) ? `${ch.color}22` : 'transparent',
              color: activeChannels.includes(ch.id) ? ch.color : '#64748b',
              cursor: 'pointer',
            }}
          >
            {ch.name}
          </button>
        ))}
      </div>

      {/* Calendar */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {events.length === 0 && drafts.length === 0 && (
          <div style={{
            position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)',
            textAlign: 'center', zIndex: 10, pointerEvents: 'none',
          }}>
            <p style={{ color: '#64748b', fontSize: 14 }}>No content scheduled yet.</p>
            {isAdmin() && <p style={{ color: '#4B5563', fontSize: 12 }}>Click <strong style={{ color: '#7C3AED' }}>+ New Content</strong> to get started.</p>}
          </div>
        )}
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate="2026-04-01"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
          events={events}
          editable={isAdmin()}
          eventDrop={handleEventDrop}
          eventClick={info => setSelectedDraft(info.event.extendedProps.draft)}
          height="100%"
          eventDisplay="block"
        />
      </div>

      {/* Color legend */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        background: '#1A1A2E', border: '1px solid #2A2A4A',
        borderRadius: 10, padding: '12px 16px', zIndex: 10,
        display: 'flex', flexDirection: 'column', gap: 5,
      }}>
        <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Channels</p>
        {CHANNELS.map(ch => (
          <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ch.color }} />
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{ch.name}</span>
          </div>
        ))}
      </div>

      {showNew && <NewContentModal onClose={() => { setShowNew(false); fetchDrafts() }} />}
      {selectedDraft && <EventModal draft={selectedDraft} onClose={() => { setSelectedDraft(null); fetchDrafts() }} />}
    </div>
  )
}
