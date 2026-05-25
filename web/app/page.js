import Link from 'next/link';

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#0f172a',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      textAlign: 'center',
      padding: '40px'
    }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 8 }}>
        Route<span style={{ color: '#14b8a6' }}>Aware</span>
      </h1>
      <p style={{ fontSize: 20, color: '#94a3b8', marginBottom: 48 }}>
        Real-time road safety intelligence for Northern Pakistan
      </p>

      <div style={{ display: 'flex', gap: 16 }}>
        <Link href="/map" style={{
          background: '#14b8a6',
          color: 'white',
          padding: '14px 32px',
          borderRadius: 8,
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: 16
        }}>
          View Map
        </Link>
        <Link href="/login" style={{
          background: '#1e293b',
          color: 'white',
          padding: '14px 32px',
          borderRadius: 8,
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: 16
        }}>
          Sign In
        </Link>
      </div>
    </main>
  );
}