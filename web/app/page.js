'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const router = useRouter();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data?.session?.user;
      if (!sessionUser) { router.push('/login'); return; }
      setUser(sessionUser);
    };
    initAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) router.push('/login');
      else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchUserName = async () => {
      const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single();
      if (profile?.name) setUserName(profile.name);
      else if (user.user_metadata?.name) setUserName(user.user_metadata.name);
      else setUserName(user.email?.split('@')[0] || 'Explorer');
    };
    fetchUserName();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchTrips = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('saved_trips').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (!error) setTrips(data || []);
      setLoading(false);
    };
    fetchTrips();
  }, [user]);

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #020817 0%, #0f172a 40%, #0c1e3d 70%, #020817 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>

      {/* Blue glow */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(14,165,233,0.06) 0%, transparent 60%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      {/* Nav */}
      <nav style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 32px',
        borderBottom: '1px solid rgba(56,189,248,0.1)',
        background: 'rgba(2,8,23,0.6)',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
          </div>
          <span style={{
            fontWeight: 800, fontSize: 20,
            background: 'linear-gradient(135deg, #fff 0%, #38bdf8 50%, #14b8a6 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>RouteAware</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => router.push('/planner')} style={{
            background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)',
            border: 'none', padding: '8px 20px', borderRadius: 40,
            color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 14
          }}>+ New Trip</button>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} style={{
            background: 'none', border: '1px solid rgba(56,189,248,0.2)',
            padding: '8px 16px', borderRadius: 8,
            color: '#94a3b8', cursor: 'pointer', fontSize: 14
          }}>Sign Out</button>
        </div>
      </nav>

      <div style={{ position: 'relative', zIndex: 10, padding: 32, maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{
            fontSize: 36, fontWeight: 800, marginBottom: 8,
            background: 'linear-gradient(135deg, #fff 0%, #38bdf8 60%, #14b8a6 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            Welcome back, {userName || 'Explorer'}
          </h1>
          <p style={{ color: '#64748b', fontSize: 15 }}>
            Your saved routes through Northern Pakistan
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background: 'rgba(30,41,59,0.5)', borderRadius: 20, padding: 20, border: '1px solid rgba(56,189,248,0.1)', height: 100, animation: 'pulse 2s infinite' }} />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: 80,
            background: 'rgba(15,23,42,0.6)',
            backdropFilter: 'blur(12px)',
            borderRadius: 24, border: '1px solid rgba(56,189,248,0.1)'
          }}>
            <div style={{ marginBottom: 20 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto', opacity: 0.6 }}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: 'white' }}>No trips yet</h3>
            <p style={{ color: '#64748b', marginBottom: 24 }}>Start planning your first journey</p>
            <button onClick={() => router.push('/planner')} style={{
              background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)',
              border: 'none', padding: '12px 28px', borderRadius: 40,
              color: 'white', fontWeight: 600, cursor: 'pointer'
            }}>+ Plan Your First Trip</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {trips.map(trip => (
              <div key={trip.id}
                style={{
                  background: 'rgba(15,23,42,0.7)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: 20, padding: 24, cursor: 'pointer',
                  border: '1px solid rgba(56,189,248,0.1)',
                  transition: 'all 0.2s',
                  position: 'relative', overflow: 'hidden'
                }}
                onMouseEnter={e => { e.currentTarget.style.border = '1px solid rgba(56,189,248,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.border = '1px solid rgba(56,189,248,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{
                  position: 'absolute', top: 0, right: 0, width: 80, height: 80,
                  background: 'radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)'
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)' }} />
                  <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase' }}>Route</span>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: 'white' }}>
                  {trip.origin} → {trip.destination}
                </h3>
                <p style={{ color: '#64748b', fontSize: 12 }}>
                  {trip.start_date && new Date(trip.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
