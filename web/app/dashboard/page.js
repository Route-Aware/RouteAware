'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const supabase = createClient(
  'https://newerjuliwrjakdrisum.supabase.co',
  'sb_publishable_7T3SjE7guPPwieSzn-jLGw_-h5e1z6Q'
);

export default function Dashboard() {
  const router = useRouter();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [calendarView, setCalendarView] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [userName, setUserName] = useState('');

  // Fetch trips for current user
  useEffect(() => {
    fetchTrips();
  }, []);

  // Fetch user profile name
  useEffect(() => {
    const fetchUserName = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // First try to get name from profiles table
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
          // Fallback to email username
          setUserName(user.email?.split('@')[0] || 'Explorer');
        }
      }
    };
    
    fetchUserName();
  }, []);

  const fetchTrips = async () => {
    setLoading(true);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setTrips([]);
      setLoading(false);
      return;
    }
    
    // Fetch ONLY trips for this user
    const { data, error } = await supabase
      .from('saved_trips')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching trips:', error);
    } else {
      setTrips(data || []);
    }
    setLoading(false);
  };

  const getTripDates = () => {
    const dates = [];
    trips.forEach(trip => {
      if (trip.start_date) dates.push(new Date(trip.start_date));
      if (trip.end_date) dates.push(new Date(trip.end_date));
    });
    return dates;
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const tripDates = getTripDates();
      if (tripDates.some(tripDate => tripDate.toDateString() === date.toDateString())) {
        return 'has-trip';
      }
    }
    return null;
  };

  return (
    <>
      <style jsx global>{`
        .react-calendar {
          background: #1e293b !important;
          border: 1px solid #334155 !important;
          border-radius: 16px !important;
          width: 100% !important;
          font-family: inherit !important;
        }
        .react-calendar__tile {
          color: white !important;
          background: transparent !important;
          border-radius: 8px !important;
          padding: 12px 6px !important;
        }
        .react-calendar__tile:enabled:hover {
          background: #334155 !important;
        }
        .react-calendar__tile--active {
          background: #14b8a6 !important;
          color: white !important;
        }
        .react-calendar__tile--now {
          background: #0f172a !important;
          border: 1px solid #14b8a6 !important;
        }
        .react-calendar__month-view__weekdays {
          color: #94a3b8 !important;
          text-transform: uppercase !important;
          font-size: 11px !important;
        }
        .react-calendar__navigation button {
          color: white !important;
          background: transparent !important;
          font-size: 14px !important;
          padding: 8px !important;
          border-radius: 8px !important;
        }
        .react-calendar__navigation button:enabled:hover {
          background: #334155 !important;
        }
        .has-trip {
          background: rgba(20, 184, 166, 0.2) !important;
          position: relative;
        }
        .has-trip::after {
          content: '●';
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 8px;
          color: #14b8a6;
        }
        
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
        
        .trip-card {
          transition: all 0.2s ease;
        }
        .trip-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(20, 184, 166, 0.15);
        }
        
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: #14b8a6;
          border-radius: 4px;
        }
      `}</style>

      <main style={{ minHeight: '100vh', background: '#0f172a', color: 'white', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        
        <nav style={{
          display: 'flex', alignItems: 'center', gap: 24,
          padding: '16px 32px', 
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
          position: 'sticky', top: 0, zIndex: 50
        }}>
          <span 
            onClick={() => router.push('/dashboard')} 
            style={{ 
              fontWeight: 800, fontSize: 22, cursor: 'pointer',
              background: 'linear-gradient(135deg, #fff, #14b8a6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            RouteAware
          </span>
          
          <div style={{ display: 'flex', gap: 8, marginLeft: 40 }}>
            <NavButton onClick={() => router.push('/map')} icon="🗺️" label="Map" />
            <NavButton onClick={() => router.push('/planner')} icon="📋" label="Planner" />
            <NavButton onClick={() => setCalendarView(!calendarView)} icon="📅" label="Calendar" active={calendarView} />
          </div>
          
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
            <button 
              onClick={() => router.push('/planner')}
              style={{
                background: 'linear-gradient(135deg, #14b8a6, #0f766e)',
                border: 'none', padding: '8px 20px', borderRadius: 40,
                color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              <span>+</span> New Trip
            </button>
            <button 
              onClick={async () => {
                setLoading(true);
                await supabase.auth.signOut();
                router.push('/login');
              }}
              style={{
                background: 'none', border: '1px solid #334155',
                padding: '8px 16px', borderRadius: 8,
                color: '#94a3b8', cursor: 'pointer', fontSize: 14
              }}
            >
              Sign Out
            </button>
          </div>
        </nav>

        <div style={{ padding: '32px', maxWidth: 1400, margin: '0 auto' }}>
          
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8, background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Welcome back, {userName || 'Explorer'} ✨
            </h1>
            <p style={{ color: '#64748b', fontSize: 16 }}>Plan your next adventure through Northern Pakistan's most breathtaking routes</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
            <StatCard icon="✈️" value={trips.length} label="Total Trips" color="#14b8a6" />
            <StatCard icon="📍" value={trips.filter(t => t.destination).length} label="Destinations" color="#8b5cf6" />
            <StatCard icon="📅" value={new Date().toLocaleDateString('en-US', { month: 'long' })} label="Current Month" color="#f59e0b" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: calendarView ? '1fr 380px' : '1fr', gap: 32, transition: 'all 0.3s' }}>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700 }}>Your Journeys</h2>
                  <p style={{ color: '#64748b', fontSize: 13 }}>{trips.length} planned {trips.length === 1 ? 'trip' : 'trips'}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={() => setCalendarView(!calendarView)}
                    style={{
                      background: calendarView ? '#14b8a6' : '#1e293b',
                      border: '1px solid #334155', padding: '8px 16px', borderRadius: 40,
                      color: 'white', fontSize: 12, cursor: 'pointer'
                    }}
                  >
                    {calendarView ? 'Hide Calendar' : 'Show Calendar'}
                  </button>
                </div>
              </div>

              {loading ? (
                <LoadingSkeleton />
              ) : trips.length === 0 ? (
                <EmptyState onPlan={() => router.push('/planner')} />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
                  {trips.map((trip) => (
                    <TripCard 
                      key={trip.id}
                      trip={trip}
                      onClick={() => router.push(`/map?from=${encodeURIComponent(trip.origin)}&to=${encodeURIComponent(trip.destination)}`)}
                      onViewDetails={() => {
                        setSelectedTrip(trip);
                        setSidebarOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {calendarView && (
              <div style={{
                background: '#1e293b', borderRadius: 24, padding: 20,
                border: '1px solid #334155', height: 'fit-content', position: 'sticky', top: 100
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>📅</span> Trip Calendar
                </h3>
                <Calendar
                  onChange={setSelectedDate}
                  value={selectedDate}
                  tileClassName={tileClassName}
                />
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#94a3b8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 10, background: '#14b8a6', opacity: 0.3 }}></div>
                      <span>Has Trip</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 10, border: '1px solid #14b8a6', background: '#0f172a' }}></div>
                      <span>Today</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Slide-out Sidebar */}
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 400,
          background: '#1e293b', zIndex: 1000, boxShadow: '-4px 0 24px rgba(0,0,0,0.4)',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-out', overflow: 'auto'
        }}>
          {selectedTrip && (
            <div style={{ padding: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>Trip Details</h2>
                <button 
                  onClick={() => setSidebarOpen(false)}
                  style={{ background: '#334155', border: 'none', width: 32, height: 32, borderRadius: 40, color: 'white', cursor: 'pointer', fontSize: 18 }}
                >✕</button>
              </div>
              
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Route</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{selectedTrip.origin} → {selectedTrip.destination}</div>
              </div>
              
              {selectedTrip.start_date && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Dates</div>
                  <div style={{ fontSize: 14, color: '#14b8a6' }}>
                    {new Date(selectedTrip.start_date).toLocaleDateString()} 
                    {selectedTrip.end_date && ` — ${new Date(selectedTrip.end_date).toLocaleDateString()}`}
                  </div>
                </div>
              )}
              
              {selectedTrip.travelers && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Travelers</div>
                  <div style={{ fontSize: 14 }}>{selectedTrip.travelers} {selectedTrip.travelers === 1 ? 'person' : 'people'}</div>
                </div>
              )}
              
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Created</div>
                <div style={{ fontSize: 14 }}>{new Date(selectedTrip.created_at).toLocaleDateString()}</div>
              </div>
              
              <button 
                onClick={() => {
                  setSidebarOpen(false);
                  router.push(`/map?from=${encodeURIComponent(selectedTrip.origin)}&to=${encodeURIComponent(selectedTrip.destination)}`);
                }}
                style={{
                  width: '100%', padding: 14, borderRadius: 12,
                  background: 'linear-gradient(135deg, #14b8a6, #0f766e)',
                  border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer',
                  marginTop: 16
                }}
              >
                View on Map →
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

// Helper Components
function NavButton({ onClick, icon, label, active }) {
  return (
    <button 
      onClick={onClick}
      style={{
        background: active ? '#14b8a620' : 'transparent',
        border: 'none', padding: '8px 16px', borderRadius: 40,
        color: active ? '#14b8a6' : '#94a3b8', cursor: 'pointer',
        fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = '#334155'}
      onMouseLeave={(e) => e.currentTarget.style.background = active ? '#14b8a620' : 'transparent'}
    >
      <span>{icon}</span> {label}
    </button>
  );
}

function StatCard({ icon, value, label, color }) {
  return (
    <div style={{
      background: '#1e293b', borderRadius: 20, padding: 20,
      border: '1px solid #334155', transition: 'all 0.2s'
    }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: '#64748b' }}>{label}</div>
    </div>
  );
}

function TripCard({ trip, onClick, onViewDetails }) {
  const days = trip.start_date && trip.end_date 
    ? Math.ceil((new Date(trip.end_date) - new Date(trip.start_date)) / (1000 * 60 * 60 * 24))
    : null;
  
  return (
    <div 
      className="trip-card"
      style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        borderRadius: 20, padding: 20, cursor: 'pointer',
        border: '1px solid #334155', position: 'relative', overflow: 'hidden'
      }}
    >
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 80, height: 80,
        background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 70%)'
      }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <span style={{
          background: '#14b8a620', color: '#14b8a6', fontSize: 11,
          padding: '4px 12px', borderRadius: 40, fontWeight: 500
        }}>
          {days ? `${days} days` : 'Upcoming'}
        </span>
        <button 
          onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 14 }}
        >⋮</button>
      </div>
      
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }} onClick={onClick}>
        {trip.origin} → {trip.destination}
      </h3>
      
      <p style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>
        {trip.start_date && new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        {trip.end_date && ` — ${new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
      </p>
      
      <div style={{ display: 'flex', gap: 16, borderTop: '1px solid #334155', paddingTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>📍</span>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>{trip.travelers || 1} traveler</span>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ background: '#1e293b', borderRadius: 20, padding: 20, border: '1px solid #334155' }}>
          <div style={{ width: 60, height: 24, background: '#334155', borderRadius: 40, marginBottom: 16 }} />
          <div style={{ width: '70%', height: 24, background: '#334155', borderRadius: 8, marginBottom: 12 }} />
          <div style={{ width: '50%', height: 16, background: '#334155', borderRadius: 8, marginBottom: 16 }} />
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ width: 40, height: 20, background: '#334155', borderRadius: 8 }} />
            <div style={{ width: 40, height: 20, background: '#334155', borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onPlan }) {
  return (
    <div style={{ textAlign: 'center', padding: 60, background: '#1e293b', borderRadius: 24, border: '1px solid #334155' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
      <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No trips yet</h3>
      <p style={{ color: '#64748b', marginBottom: 24 }}>Start planning your first journey to Northern Pakistan</p>
      <button 
        onClick={onPlan}
        style={{
          background: 'linear-gradient(135deg, #14b8a6, #0f766e)',
          border: 'none', padding: '12px 28px', borderRadius: 40,
          color: 'white', fontWeight: 600, cursor: 'pointer'
        }}
      >
        + Plan Your First Trip
      </button>
    </div>
  );
}