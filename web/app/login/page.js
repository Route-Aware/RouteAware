'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function Dashboard() {
  const router = useRouter();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');

  // ✅ 1. AUTH: persistent session check (IMPORTANT FIX)
  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();

      const sessionUser = data?.session?.user;

      if (!sessionUser) {
        router.push('/login');
        return;
      }

      setUser(sessionUser);
    };

    initAuth();

    // ✅ live auth listener (fixes Vercel session issues)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user;

      if (!sessionUser) {
        router.push('/login');
      } else {
        setUser(sessionUser);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ✅ 2. Fetch user name safely
  useEffect(() => {
    const fetchUserName = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      if (profile?.name) {
        setUserName(profile.name);
      } else if (user.user_metadata?.name) {
        setUserName(user.user_metadata.name);
      } else {
        setUserName(user.email?.split('@')[0] || 'Explorer');
      }
    };

    fetchUserName();
  }, [user]);

  // ✅ 3. Fetch trips ONLY when user exists
  useEffect(() => {
    if (!user) return;

    const fetchTrips = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('saved_trips')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) setTrips(data || []);

      setLoading(false);
    };

    fetchTrips();
  }, [user]);

  // logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <main style={{ minHeight: '100vh', background: '#0f172a', color: 'white' }}>
      
      {/* NAV */}
      <nav style={{ padding: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>RouteAware</h2>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => router.push('/planner')}>New Trip</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* BODY */}
      <div style={{ padding: 32 }}>
        <h1>Welcome {userName}</h1>

        {loading ? (
          <p>Loading trips...</p>
        ) : trips.length === 0 ? (
          <p>No trips yet</p>
        ) : (
          trips.map((trip) => (
            <div key={trip.id} style={{ padding: 10, border: '1px solid gray', marginTop: 10 }}>
              <p>{trip.origin} → {trip.destination}</p>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
