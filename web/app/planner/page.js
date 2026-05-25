'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Calendar, Users, MapPin, Loader2, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';

const supabase = createClient(
  'https://newerjuliwrjakdrisum.supabase.co',
  'sb_publishable_7T3SjE7guPPwieSzn-jLGw_-h5e1z6Q'
);

// Try multiple API keys (rotate if one fails)
const GEMINI_KEYS = [
  process.env.NEXT_PUBLIC_GEMINI_KEY_1,
  process.env.NEXT_PUBLIC_GEMINI_KEY_2,
  'AIzaSyBGA3CK5eHmjWQnHxfQSvKnj6j06saiBZw',
].filter(Boolean);

// City options with coordinates
const CITIES = [
  { name: 'Islamabad', lat: 33.6844, lng: 73.0479, region: 'Capital' },
  { name: 'Mansehra', lat: 34.3333, lng: 73.2000, region: 'KPK' },
  { name: 'Naran', lat: 34.9090, lng: 73.6500, region: 'KPK' },
  { name: 'Babusar Top', lat: 35.1833, lng: 73.6511, region: 'KPK' },
  { name: 'Chilas', lat: 35.4167, lng: 74.0999, region: 'Gilgit-Baltistan' },
  { name: 'Gilgit', lat: 35.9208, lng: 74.3587, region: 'Gilgit-Baltistan' },
  { name: 'Hunza', lat: 36.3167, lng: 74.6524, region: 'Gilgit-Baltistan' },
  { name: 'Skardu', lat: 35.2971, lng: 75.6333, region: 'Gilgit-Baltistan' },
];

// Helper to call Gemini with fallback keys
async function callGemini(prompt, retryCount = 0) {
  if (retryCount >= GEMINI_KEYS.length) {
    throw new Error('All Gemini API keys exhausted');
  }
  
  const apiKey = GEMINI_KEYS[retryCount];
  if (!apiKey) return callGemini(prompt, retryCount + 1);
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      }
    );
    
    if (response.status === 429) {
      return callGemini(prompt, retryCount + 1);
    }
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    console.error(`Gemini key ${retryCount + 1} failed:`, error);
    return callGemini(prompt, retryCount + 1);
  }
}

// Parse AI response into structured days
function parsePlanToDays(planText) {
  const days = [];
  const lines = planText.split('\n');
  let currentDay = null;
  
  for (const line of lines) {
    const dayMatch = line.match(/^Day\s+(\d+)[:\-]?\s*(.*)$/i);
    if (dayMatch) {
      if (currentDay) days.push(currentDay);
      currentDay = { day: parseInt(dayMatch[1]), title: dayMatch[2], activities: [] };
    } else if (currentDay && line.trim().length > 0 && line.match(/^[\s•\-*]/)) {
      currentDay.activities.push(line.replace(/^[\s•\-*]+/, '').trim());
    } else if (currentDay && line.trim().length > 0 && !line.match(/^Confidence|^Safety/)) {
      currentDay.activities.push(line.trim());
    }
  }
  if (currentDay) days.push(currentDay);
  return days.length > 0 ? days : null;
}

export default function Planner() {
  const router = useRouter();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelers, setTravelers] = useState(1);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState('');
  const [parsedDays, setParsedDays] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);

  const calculateDays = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 1;
    }
    return 0;
  };

  const tripDays = calculateDays();

  const generatePlan = async () => {
    if (!origin || !destination || !startDate || !endDate) {
      alert('Please fill in all fields!');
      return;
    }

    setLoading(true);
    setPlan('');
    setParsedDays(null);
    setSaveStatus(null);
    setSelectedRoute(null);

    let savedTripId = null;

    try {
     // Get current user first
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  alert('Please log in to save trips');
  setLoading(false);
  return;
}

// Save with user_id
const { data: savedTrip, error: saveError } = await supabase
  .from('saved_trips')
  .insert({
    origin,
    destination,
    start_date: startDate,
    end_date: endDate,
    travelers,
    user_id: user.id,  // ← MAKE SURE THIS LINE EXISTS
    created_at: new Date().toISOString(),
  })
  .select();
        
      if (saveError) throw new Error('Failed to save trip');
      
      savedTripId = savedTrip?.[0]?.id;
      setSaveStatus('saved');
      console.log('Trip saved:', savedTripId);

      // STEP 3: Fetch route data for context
      const [eventsRes, confidenceRes, routesRes] = await Promise.all([
        supabase.from('events').select('*').limit(30),
        supabase.from('route_confidence').select('*'),
        supabase.from('routes').select('from_place, to_place, start_lat, start_lng, end_lat, end_lng'),
      ]);

      const events = eventsRes.data || [];
      const confidence = confidenceRes.data || [];
      const routes = routesRes.data || [];

      const eventsSummary = events.map(e => 
        `- ${e.event_type?.toUpperCase()}: ${e.description} (${e.route_name || 'unknown route'})`
      ).join('\n');

      const confidenceSummary = confidence.map(c => 
        `- Route ${c.route_id}: ${(c.confidence_score * 100).toFixed(0)}% safe (${c.color})`
      ).join('\n');

      const routeSummary = routes.map(r => 
        `- ${r.from_place} → ${r.to_place}`
      ).join('\n');

      const prompt = `You are RouteAware, a road safety AI for Northern Pakistan.
      
Generate a detailed day-by-day road trip plan from ${origin} to ${destination}.
Trip duration: ${tripDays} days (${startDate} to ${endDate})
Travelers: ${travelers}

KNOWN ROUTES (you can only use these segments):
${routeSummary}

CURRENT ROAD CONDITIONS:
${eventsSummary || 'No recent incidents reported'}

CONFIDENCE SCORES (0-100%):
${confidenceSummary || 'Calculating...'}

INSTRUCTIONS:
1. Create a plan using ONLY the known route segments above
2. If you need to go through intermediate cities, include them
3. Format EXACTLY like this:

Day 1: [City/Cities] - [Theme]
• [Activity or travel detail]
• [Safety note or confidence score]
Day 2: [City/Cities] - [Theme]
• [Activity]
...

Do not add extra text before or after the day plan. Be concise. Focus on road safety.`;

      const aiPlan = await callGemini(prompt);
      
      if (aiPlan) {
        setPlan(aiPlan);
        const days = parsePlanToDays(aiPlan);
        if (days) setParsedDays(days);
        setSaveStatus('ai_generated');
      } else {
        setPlan('✨ Trip saved! AI plan is being refined. Check back in a moment.');
        setSaveStatus('saved_only');
      }

    } catch (err) {
      console.error('Error:', err);
      setPlan('❌ Something went wrong. Your trip preferences have been saved. Please try generating the plan again.');
      setSaveStatus('error');
    }

    setLoading(false);
  };

  const getRegionColor = (cityName) => {
    const city = CITIES.find(c => c.name === cityName);
    if (!city) return '#14b8a6';
    return city.region === 'Gilgit-Baltistan' ? '#8b5cf6' : '#14b8a6';
  };

  return (
    <main style={{ minHeight: '100vh', background: '#0f172a', color: 'white', fontFamily: 'sans-serif' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', gap: 32,
        padding: '16px 32px', borderBottom: '1px solid #1e293b',
        background: '#0f172a', position: 'sticky', top: 0, zIndex: 50
      }}>
        <span onClick={() => router.push('/dashboard')} style={{ fontWeight: 800, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={20} color="#14b8a6" />
          Route<span style={{ color: '#14b8a6' }}>Aware</span>
        </span>
        <button onClick={() => router.push('/map')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>🗺️ Map</button>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>📋 My Trips</button>
      </nav>

      <div style={{ maxWidth: 1200, margin: '32px auto', padding: '0 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
          
          {/* LEFT COLUMN - Trip Form */}
          <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, background: 'linear-gradient(135deg, #fff, #14b8a6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Plan Your Journey
              </h1>
              <p style={{ color: '#94a3b8' }}>Get AI-powered road safety recommendations for Northern Pakistan</p>
            </div>

            <div style={{ background: '#1e293b', borderRadius: 24, padding: 28, border: '1px solid #334155' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <MapPin size={14} /> From
                  </label>
                  <select value={origin} onChange={e => setOrigin(e.target.value)} style={{
                    width: '100%', padding: '14px', borderRadius: 12, fontSize: 14,
                    border: '1px solid #334155', background: '#0f172a', color: 'white',
                  }}>
                    <option value="">Select origin</option>
                    {CITIES.map(city => <option key={city.name}>{city.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>To</label>
                  <select value={destination} onChange={e => setDestination(e.target.value)} style={{
                    width: '100%', padding: '14px', borderRadius: 12, fontSize: 14,
                    border: '1px solid #334155', background: '#0f172a', color: 'white',
                  }}>
                    <option value="">Select destination</option>
                    {CITIES.map(city => <option key={city.name}>{city.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Calendar size={14} /> Start Date
                  </label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{
                    width: '100%', padding: '14px', borderRadius: 12, fontSize: 14,
                    border: '1px solid #334155', background: '#0f172a', color: 'white',
                  }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Calendar size={14} /> End Date
                  </label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{
                    width: '100%', padding: '14px', borderRadius: 12, fontSize: 14,
                    border: '1px solid #334155', background: '#0f172a', color: 'white',
                  }} />
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Users size={14} /> Travelers
                </label>
                <input type="number" min={1} max={20} value={travelers} onChange={e => setTravelers(e.target.value)} style={{
                  width: '100%', padding: '14px', borderRadius: 12, fontSize: 14,
                  border: '1px solid #334155', background: '#0f172a', color: 'white',
                }} />
              </div>

              {tripDays > 0 && (
                <div style={{ marginBottom: 24, padding: '12px 16px', background: '#0f172a', borderRadius: 12, borderLeft: `3px solid #14b8a6` }}>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>Trip Duration</span>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{tripDays} {tripDays === 1 ? 'day' : 'days'}</div>
                </div>
              )}

              <button onClick={generatePlan} disabled={loading} style={{
                width: '100%', padding: '16px', borderRadius: 40, fontSize: 16, fontWeight: 600,
                background: loading ? '#0f766e' : 'linear-gradient(135deg, #14b8a6, #0f766e)',
                color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'all 0.2s'
              }}>
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Creating your trip plan...</>
                ) : (
                  <><Sparkles size={18} /> Generate Trip Plan</>
                )}
              </button>

              {saveStatus === 'saved' && !loading && (
                <div style={{ marginTop: 16, padding: 10, background: '#0f172a', borderRadius: 8, textAlign: 'center', fontSize: 13, color: '#14b8a6' }}>
                  ✓ Trip saved to dashboard
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - Trip Plan Output */}
          <div>
            {loading ? (
              <div style={{ background: '#1e293b', borderRadius: 24, padding: 40, textAlign: 'center', border: '1px solid #334155' }}>
                <Loader2 size={40} className="animate-spin" style={{ margin: '0 auto 16px', color: '#14b8a6' }} />
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Analyzing road conditions...</h3>
                <p style={{ color: '#94a3b8', fontSize: 14 }}>Checking routes, alerts, and calculating safety scores</p>
              </div>
            ) : parsedDays ? (
              <div style={{ background: '#1e293b', borderRadius: 24, border: '1px solid #334155', overflow: 'hidden' }}>
                <div style={{ padding: 20, borderBottom: '1px solid #334155', background: '#0f172a' }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={20} color="#14b8a6" /> Your Personalized Plan
                  </h2>
                  <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{origin} → {destination} • {tripDays} days</p>
                </div>
                <div style={{ padding: 20, maxHeight: 500, overflowY: 'auto' }}>
                  {parsedDays.map((day, idx) => (
                    <div key={idx} style={{ marginBottom: 24, paddingLeft: 16, borderLeft: `3px solid ${idx === 0 ? '#14b8a6' : '#334155'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{ background: idx === 0 ? '#14b8a620' : '#33415540', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                          Day {day.day}
                        </span>
                        {day.title && <span style={{ color: '#e2e8f0', fontSize: 14 }}>{day.title}</span>}
                      </div>
                      <div style={{ paddingLeft: 12 }}>
                        {day.activities.map((activity, aIdx) => (
                          <div key={aIdx} style={{ marginBottom: 8, fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <span style={{ color: '#14b8a6' }}>•</span>
                            <span>{activity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: 16, borderTop: '1px solid #334155', background: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#475569' }}>AI-generated based on live road data</span>
                  <button onClick={() => router.push('/dashboard')} style={{ background: '#14b8a6', border: 'none', padding: '8px 20px', borderRadius: 40, fontSize: 13, color: 'white', cursor: 'pointer' }}>
                    View in Dashboard →
                  </button>
                </div>
              </div>
            ) : plan ? (
              <div style={{ background: '#1e293b', borderRadius: 24, padding: 28, border: '1px solid #334155' }}>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.6, color: '#e2e8f0' }}>{plan}</div>
                <button onClick={() => router.push('/dashboard')} style={{ marginTop: 24, width: '100%', background: '#14b8a6', border: 'none', padding: '12px', borderRadius: 40, fontSize: 14, color: 'white', cursor: 'pointer' }}>
                  View My Trips →
                </button>
              </div>
            ) : (
              <div style={{ background: '#1e293b', borderRadius: 24, padding: 60, textAlign: 'center', border: '1px solid #334155' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Ready to explore the North</h3>
                <p style={{ color: '#94a3b8', fontSize: 14, maxWidth: 280, margin: '0 auto' }}>Fill in your trip details and we'll create a safety-optimized plan</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </main>
  );
}