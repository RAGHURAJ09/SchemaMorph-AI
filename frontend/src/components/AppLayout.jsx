import Navbar from './Navbar'

export default function AppLayout({ children }) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh', 
      background: '#090C12',
      // Subtle animated grid background
      backgroundImage: `
        linear-gradient(rgba(29,158,117,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(29,158,117,0.03) 1px, transparent 1px)
      `,
      backgroundSize: '40px 40px',
      position: 'relative'
    }}>
      <Navbar />

      {/* Main area - added top padding to account for the floating navbar */}
      <main style={{ 
        flex: 1, 
        overflow: 'auto', 
        paddingTop: 100, // Space for the navbar
        display: 'flex',
        flexDirection: 'column'
      }}>
        {children}
      </main>
    </div>
  )
}
