import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Zap } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@getblock.io')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      navigate('/calendar')
    } catch {
      toast.error('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0F0F1A',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 40px rgba(124,58,237,0.4)',
          }}>
            <Zap size={28} color="white" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: '0 0 6px' }}>
            GetBlock Content Machine
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Sign in to continue</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          background: '#1A1A2E', border: '1px solid #2A2A4A',
          borderRadius: 12, padding: 28,
        }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px 12px', background: '#0F0F1A',
                border: '1px solid #2A2A4A', borderRadius: 8, color: '#e2e8f0',
                fontSize: 14, outline: 'none',
              }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px 12px', background: '#0F0F1A',
                border: '1px solid #2A2A4A', borderRadius: 8, color: '#e2e8f0',
                fontSize: 14, outline: 'none',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '11px',
              background: loading ? '#4c1d95' : 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              border: 'none', borderRadius: 8, color: 'white',
              fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#374151', marginTop: 16 }}>
          Default: admin@getblock.io / admin123
        </p>
      </div>
    </div>
  )
}
