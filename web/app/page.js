import Link from 'next/link';

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #020817 0%, #0f172a 40%, #0c1e3d 70%, #020817 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      textAlign: 'center',
      padding: '40px',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Blue glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 40%, rgba(14,165,233,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 10 }}>

        {/* Logo icon */}
        <div style={{
          width: 64, height: 64, borderRadius: 16, margin: '0 auto 20px',
          background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 64,
          fontWeight: 800,
          marginBottom: 0,
          lineHeight: 1.1,
          background: 'linear-gradient(135deg, #fff 0%, #38bdf8 50%, #14b8a6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          RouteAware
        </h1>

        {/* Get started link (kept as single CTA) */}
        <Link
          href="/login"
          style={{
            display: 'inline-block',
            marginTop: 16,
            marginBottom: 24,
            fontSize: 16,
            fontWeight: 600,
            color: '#38bdf8',
            textDecoration: 'underline',
            textDecorationColor: 'rgba(56,189,248,0.4)',
            textUnderlineOffset: 4,
            letterSpacing: 0.5
          }}
        >
          Get started →
        </Link>

        {/* Subtitle */}
        <p style={{
          fontSize: 18,
          color: '#64748b',
          marginBottom: 48,
          maxWidth: 480,
          margin: '0 auto'
        }}>
          Real-time road safety intelligence for Northern Pakistan
        </p>

      </div>
    </main>
  );
}
