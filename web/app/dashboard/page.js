
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
    <main style={{ minHeight: '100vh', background: '#0f172a', color: 'white', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid #334155' }}>
        <span style={{ fontWeight: 800, fontSize: 22 }}>RouteAware</span>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => router.push('/planner')} style={{ background: 'linear-gradient(135deg, #14b8a6, #0f766e)', border: 'none', padding: '8px 20px', borderRadius: 40, color: 'white', fontWeight: 600, cursor: 'pointer' }}>+ New Trip</button>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} style={{ background: 'none', border: '1px solid #334155', padding: '8px 16px', borderRadius: 8, color: '#94a3b8', cursor: 'pointer' }}>Sign Out</button>
        </div>
      </nav>
      <div style={{ padding: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 24 }}>Welcome back, {userName || 'Explorer'} ✨</h1>
        {loading ? <p>Loading trips...</p> : trips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#1e293b', borderRadius: 24, border: '1px solid #334155' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
            <h3>No trips yet</h3>
            <button onClick={() => router.push('/planner')} style={{ background: 'linear-gradient(135deg, #14b8a6, #0f766e)', border: 'none', padding: '12px 28px', borderRadius: 40, color: 'white', fontWeight: 600, cursor: 'pointer', marginTop: 16 }}>+ Plan Your First Trip</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {trips.map(trip => (
              <div key={trip.id} onClick={() => router.push(`/map?from=${encodeURIComponent(trip.origin)}&to=${encodeURIComponent(trip.destination)}`)}
                style={{ background: '#1e293b', borderRadius: 20, padding: 20, cursor: 'pointer', border: '1px solid #334155' }}>
                <h3 style={{ marginBottom: 8 }}>{trip.origin} → {trip.destination}</h3>
                <p style={{ color: '#64748b', fontSize: 12 }}>{trip.start_date && new Date(trip.start_date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

