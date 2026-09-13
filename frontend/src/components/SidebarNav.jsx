import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const NAV_ITEMS = [
  { icon: '⌂', label: 'Home', to: '/' },
  { icon: '📤', label: 'New Analysis', to: '/upload' },
  { icon: '📊', label: 'Dashboard', to: null },
]

export default function SidebarNav() {
  const [expanded, setExpanded] = useState(false)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const location = useLocation()

  if (!user) return null

  const isActive = (to) => {
    if (!to) return location.pathname.startsWith('/dashboard')
    return location.pathname === to
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav
      className="fixed top-0 left-0 h-full z-50 bg-surface-900 border-r border-surface-700 flex flex-col transition-all duration-200 ease-in-out"
      style={{ width: expanded ? 240 : 64 }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 shrink-0 border-b border-surface-700">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
          S
        </div>
        <span
          className="text-white font-semibold text-sm whitespace-nowrap overflow-hidden transition-all duration-200"
          style={{ opacity: expanded ? 1 : 0, width: expanded ? 'auto' : 0 }}
        >
          SchemaMorph AI
        </span>
      </div>

      {/* Nav items */}
      <div className="flex-1 py-3 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.to)
          const content = (
            <div
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                ${active
                  ? 'bg-brand-500/20 text-brand-400'
                  : 'text-surface-400 hover:bg-surface-700 hover:text-white'
                }`}
            >
              <span className="text-lg shrink-0 w-5 text-center">{item.icon}</span>
              <span
                className="whitespace-nowrap overflow-hidden transition-all duration-200"
                style={{ opacity: expanded ? 1 : 0, width: expanded ? 'auto' : 0 }}
              >
                {item.label}
              </span>
            </div>
          )

          if (item.to) {
            return (
              <Link key={item.label} to={item.to}>
                {content}
              </Link>
            )
          }
          return (
            <button key={item.label} onClick={() => navigate('/upload')} className="w-full text-left">
              {content}
            </button>
          )
        })}
      </div>

      {/* User section */}
      <div className="border-t border-surface-700 px-2 py-3 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-brand-500/30 flex items-center justify-center text-brand-400 text-xs font-bold shrink-0">
            {user.email?.charAt(0).toUpperCase()}
          </div>
          <span
            className="text-xs text-surface-400 whitespace-nowrap overflow-hidden truncate transition-all duration-200"
            style={{ opacity: expanded ? 1 : 0, width: expanded ? 'auto' : 0 }}
          >
            {user.email}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-150"
        >
          <span className="text-lg shrink-0 w-5 text-center">⏻</span>
          <span
            className="whitespace-nowrap overflow-hidden transition-all duration-200"
            style={{ opacity: expanded ? 1 : 0, width: expanded ? 'auto' : 0 }}
          >
            Log Out
          </span>
        </button>
      </div>
    </nav>
  )
}
