import Navbar from './Navbar'
import Background3D from './Background3D'

export default function AppLayout({ children }) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh', 
      background: '#060810',
      position: 'relative'
    }}>
      {/* 3D Background behind all content */}
      <Background3D />

      <Navbar />

      {/* Main area - sits above the 3D background */}
      <main style={{ 
        flex: 1, 
        overflow: 'auto', 
        paddingTop: 100,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 1,
      }}>
        {children}
      </main>
    </div>
  )
}
