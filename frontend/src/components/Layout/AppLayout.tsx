import { NavLink, useNavigate } from 'react-router-dom'
import { Calendar, FileText, Settings, LogOut, Zap } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Logged out')
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-purple-600 text-white'
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0F0F1A' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        minWidth: 240,
        background: '#1A1A2E',
        borderRight: '1px solid #2A2A4A',
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #2A2A4A' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Zap size={16} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', lineHeight: 1 }}>GetBlock</div>
              <div style={{ fontSize: 10, color: '#7C3AED', lineHeight: 1.4 }}>Content Machine</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 12px' }}>
          <NavLink to="/calendar" className={navClass}>
            <Calendar size={16} />
            Calendar
          </NavLink>
          {isAdmin() && (
            <NavLink to="/drafts" className={navClass} style={{ marginTop: 4 }}>
              <FileText size={16} />
              Drafts
            </NavLink>
          )}
          {isAdmin() && (
            <NavLink to="/settings" className={navClass} style={{ marginTop: 4 }}>
              <Settings size={16} />
              Settings
            </NavLink>
          )}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #2A2A4A' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: 'white',
            }}>
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
              <span style={{
                fontSize: 10, padding: '1px 6px', borderRadius: 4,
                background: user?.role === 'admin' ? 'rgba(124,58,237,0.2)' : 'rgba(100,116,139,0.2)',
                color: user?.role === 'admin' ? '#A78BFA' : '#94a3b8',
                fontWeight: 600,
              }}>
                {user?.role?.toUpperCase()}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 8px', borderRadius: 6, background: 'transparent',
              border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 12,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  )
}
