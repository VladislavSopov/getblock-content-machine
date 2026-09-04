import { useEffect, useState } from 'react'
import api from '../lib/api'
import { CHANNELS } from '../types'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [users, setUsers] = useState<any[]>([])
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'viewer' })
  const [loading, setLoading] = useState(false)

  const MODELS: Record<string, string[]> = {
    openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  }

  useEffect(() => {
    api.get('/api/settings').then(r => setSettings(r.data)).catch(() => {})
    api.get('/api/users').then(r => setUsers(r.data)).catch(() => {})
  }, [])

  const save = async (key: string, value: string) => {
    try {
      await api.patch('/api/settings', { [key]: value })
      setSettings(s => ({ ...s, [key]: value }))
      toast.success('Saved')
    } catch { toast.error('Failed to save') }
  }

  const inviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/api/users', newUser)
      setUsers(u => [...u, res.data])
      setNewUser({ email: '', password: '', role: 'viewer' })
      toast.success('User created')
    } catch { toast.error('Failed to create user') } finally { setLoading(false) }
  }

  const deleteUser = async (id: string) => {
    if (!confirm('Delete this user?')) return
    try {
      await api.delete(`/api/users/${id}`)
      setUsers(u => u.filter(usr => usr.id !== id))
      toast.success('User removed')
    } catch { toast.error('Failed') }
  }

  const section = (title: string) => (
    <h2 style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', margin: '28px 0 14px', letterSpacing: '0.05em' }}>
      {title}
    </h2>
  )

  const inp = {
    width: '100%', padding: '9px 12px', background: '#0F0F1A',
    border: '1px solid #2A2A4A', borderRadius: 8, color: '#e2e8f0',
    fontSize: 13, outline: 'none',
  }

  const lbl = { display: 'block' as const, fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 5 }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 28, maxWidth: 700 }}>
      <h1 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>Settings</h1>
      <p style={{ margin: '0 0 8px', fontSize: 13, color: '#64748b' }}>Configure AI, channels, and users.</p>

      {/* AI Settings */}
      {section('AI Settings')}
      <div style={{ background: '#1A1A2E', border: '1px solid #2A2A4A', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={lbl}>AI Provider</label>
            <select
              style={inp}
              value={settings.ai_provider || 'openai'}
              onChange={e => {
                const newProvider = e.target.value
                const newModel = MODELS[newProvider]?.[0] ?? ''
                save('ai_provider', newProvider)
                save('ai_model', newModel)
                setSettings(s => ({ ...s, ai_provider: newProvider, ai_model: newModel }))
              }}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic Claude</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Model</label>
            <select
              style={inp}
              value={settings.ai_model || MODELS[settings.ai_provider || 'openai']?.[0]}
              onChange={e => save('ai_model', e.target.value)}
            >
              {(MODELS[settings.ai_provider || 'openai'] ?? []).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={lbl}>OpenAI API Key</label>
          <input
            type="password"
            style={inp}
            defaultValue={settings.openai_api_key || ''}
            onBlur={e => save('openai_api_key', e.target.value)}
            placeholder="sk-..."
          />
        </div>
        <div>
          <label style={lbl}>Anthropic API Key</label>
          <input
            type="password"
            style={inp}
            defaultValue={settings.anthropic_api_key || ''}
            onBlur={e => save('anthropic_api_key', e.target.value)}
            placeholder="sk-ant-..."
          />
        </div>
        <div>
          <label style={lbl}>Default Tone of Voice</label>
          <select style={inp} value={settings.default_tone || 'Professional'} onChange={e => save('default_tone', e.target.value)}>
            {['Professional', 'Technical', 'Casual', 'Hype'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Default Target Audience</label>
          <input style={inp} defaultValue={settings.default_audience || 'Web3 developers, blockchain node operators'} onBlur={e => save('default_audience', e.target.value)} />
        </div>
      </div>

      {/* Channel Settings */}
      {section('Channel Settings')}
      <div style={{ background: '#1A1A2E', border: '1px solid #2A2A4A', borderRadius: 10, overflow: 'hidden' }}>
        {CHANNELS.map((ch, i) => (
          <div key={ch.id} style={{
            padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
            borderBottom: i < CHANNELS.length - 1 ? '1px solid #2A2A4A' : 'none',
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: ch.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#e2e8f0', flex: 1 }}>{ch.name}</span>
            <span style={{ fontSize: 11, color: '#64748b' }}>Active</span>
          </div>
        ))}
      </div>

      {/* User Management */}
      {section('User Management')}
      <div style={{ background: '#1A1A2E', border: '1px solid #2A2A4A', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
        {users.map((u, i) => (
          <div key={u.id} style={{
            padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
            borderBottom: i < users.length - 1 ? '1px solid #2A2A4A' : 'none',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0,
            }}>{u.email?.[0]?.toUpperCase()}</div>
            <span style={{ fontSize: 13, color: '#e2e8f0', flex: 1 }}>{u.email}</span>
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
              background: u.role === 'admin' ? 'rgba(124,58,237,0.15)' : 'rgba(100,116,139,0.15)',
              color: u.role === 'admin' ? '#A78BFA' : '#94a3b8',
            }}>{u.role.toUpperCase()}</span>
            <button
              onClick={() => deleteUser(u.id)}
              style={{ padding: '4px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, color: '#EF4444', fontSize: 11, cursor: 'pointer' }}
            >Remove</button>
          </div>
        ))}
      </div>

      <div style={{ background: '#1A1A2E', border: '1px solid #2A2A4A', borderRadius: 10, padding: 20 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>Invite New User</h3>
        <form onSubmit={inviteUser} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 160px', gap: 10 }}>
            <div>
              <label style={lbl}>Email</label>
              <input type="email" style={inp} value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} required />
            </div>
            <div>
              <label style={lbl}>Password</label>
              <input type="password" style={inp} value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} required />
            </div>
            <div>
              <label style={lbl}>Role</label>
              <select style={inp} value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}>
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ alignSelf: 'flex-start', padding: '8px 18px', background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', border: 'none', borderRadius: 7, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </div>
    </div>
  )
}
