import { useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const sidebarW = collapsed ? 64 : 240

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#090C12' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      {/* Main area */}
      <div style={{
        marginLeft: sidebarW,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        transition: 'margin-left 0.25s cubic-bezier(.4,0,.2,1)',
        // Subtle animated grid background
        backgroundImage: `
          linear-gradient(rgba(29,158,117,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(29,158,117,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}>
        <TopBar sidebarCollapsed={collapsed} />
        <main style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
