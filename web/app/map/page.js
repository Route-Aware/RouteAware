'use client';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const API_BASE = 'https://routeaware-api.onrender.com';

// ============================================================
// STYLES — edit all visual styles here
// ============================================================
const STYLES = {
  loadingScreen: {
    height: '100vh',
    background: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  },
  noRouteScreen: {
    height: '100vh',
    background: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    color: 'white',
  },
  backButton: {
    marginTop: 16,
    background: '#14b8a6',
    border: 'none',
    padding: '10px 20px',
    borderRadius: 8,
    color: 'white',
    cursor: 'pointer',
  },
  mapContainer: {
    width: '100vw',
    height: '100vh',
  },
  routeInfoPanel: {
    position: 'absolute',
    top: 20,
    left: 160,
    background: '#1e293b',
    padding: '12px 20px',
    borderRadius: 12,
    color: 'white',
    zIndex: 10,
    borderLeft: '4px solid #14b8a6',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  routeInfoMeta: {
    marginLeft: 12,
    fontSize: 11,
    color: '#94a3b8',
  },
  eventsPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    maxWidth: 350,
    background: '#1e293b',
    borderRadius: 12,
    padding: 16,
    color: 'white',
    zIndex: 10,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    maxHeight: 400,
    overflowY: 'auto',
  },
  eventsPanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eventsPanelClose: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 18,
  },
  confidenceBadge: (color) => ({
    marginBottom: 12,
    padding: 8,
    borderRadius: 8,
    background:
      color === 'green'  ? '#22c55e20' :
      color === 'yellow' ? '#f59e0b20' :
      '#ef444420',
  }),
  eventCard: {
    marginBottom: 8,
    padding: 8,
    background: '#0f172a',
    borderRadius: 6,
    fontSize: 12,
  },
  eventMeta: {
    color: '#475569',
    fontSize: 10,
    marginTop: 4,
  },
  noAlerts: {
    color: '#94a3b8',
    textAlign: 'center',
    padding: 16,
  },
  polyline: {
    strokeOpacity: 0.9,
    strokeWeight: 6,
  },
  markerScale: {
    endpoint: 8,
    midpoint: 6,
  },
  markerColor: {
    start: '#22c55e',
    end:   '#ef4444',
    mid:   '#14b8a6',
  },
  segmentColor: {
    green:  '#22c55e',
    yellow: '#f59e0b',
    red:    '#ef4444',
    gray:   '#888888',
  },
};

// ============================================================
// GRAPH
// ============================================================
const graph = {
  'Islamabad':   ['Mansehra', 'Rawalpindi'],
  'Rawalpindi':  ['Islamabad', 'Murree'],
  'Murree':      ['Rawalpindi'],
  'Mansehra':    ['Islamabad', 'Naran', 'Shogran'],
  'Shogran':     ['Mansehra'],
  'Naran':       ['Mansehra', 'Babusar Top'],
  'Babusar Top': ['Naran', 'Chilas'],
  'Chilas':      ['Babusar Top', 'Gilgit'],
  'Gilgit':      ['Chilas', 'Hunza', 'Skardu', 'Astore'],
  'Hunza':       ['Gilgit', 'Sost'],
  'Sost':        ['Hunza'],
  'Skardu':      ['Gilgit'],
  'Astore':      ['Gilgit'],
  'Dir':         ['Chitral'],
  'Chitral':     ['Dir'],
};

// ============================================================
// CITY COORDS — fallback
// ============================================================
const defaultCityCoords = {
  'Islamabad':   { lat: 33.6844, lng: 73.0479 },
  'Rawalpindi':  { lat: 33.5651, lng: 73.0479 },
  'Murree':      { lat: 33.9062, lng: 73.3903 },
  'Mansehra':    { lat: 34.3333, lng: 73.2000 },
  'Shogran':     { lat: 34.6500, lng: 73.4833 },
  'Naran':       { lat: 34.9090, lng: 73.6500 },
  'Babusar Top': { lat: 35.1833, lng: 73.6511 },
  'Chilas':      { lat: 35.4167, lng: 74.0999 },
  'Gilgit':      { lat: 35.9208, lng: 74.3587 },
  'Hunza':       { lat: 36.3167, lng: 74.6524 },
  'Sost':        { lat: 36.7167, lng: 75.1833 },
  'Skardu':      { lat: 35.2971, lng: 75.6333 },
  'Astore':      { lat: 35.3667, lng: 74.8500 },
  'Dir':         { lat: 34.9167, lng: 71.8667 },
  'Chitral':     { lat: 35.8500, lng: 71.7833 },
};

// ============================================================
// BFS
// ============================================================
function findPath(start, end) {
  if (!graph[start] || !graph[end]) return null;
  const queue = [[start]];
  const visited = new Set([start]);
  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];
    if (current === end) return path;
    for (const neighbor of graph[current]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }
  return null;
}

// ============================================================
// OSRM — road-following coordinates
// ============================================================
async function fetchRoadCoords(startCoord, endCoord) {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${startCoord.lng},${startCoord.lat};${endCoord.lng},${endCoord.lat}` +
      `?overview=full&geometries=geojson`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;
    return data.routes[0].geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
  } catch (err) {
    console.error('OSRM fetch failed:', err);
    return null;
  }
}

// ============================================================
// COMPONENT (RENAMED from Map to MapComponent)
// ============================================================
function MapComponent() {
  const mapRef = useRef(null);
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const to   = searchParams.get('to');

  const [path,            setPath]            = useState(null);
  const [segments,        setSegments]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [mapInstance,     setMapInstance]     = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res  = await fetch(`${API_BASE}/api/segments`);
        const data = await res.json();
        setSegments(data.segments || []);
      } catch (err) {
        console.error('Failed to fetch from backend:', err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (from && to) {
      const found = findPath(from, to);
      setPath(found);
    }
  }, [from, to]);

  useEffect(() => {
    if (!mapRef.current || loading || !path || path.length === 0) return;

    if (!window.google?.maps) {
      const id = setInterval(() => {
        if (window.google?.maps) { clearInterval(id); initMap(); }
      }, 100);
      return;
    }

    initMap();

    async function initMap() {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 35.5, lng: 74.5 },
        zoom: 7,
        streetViewControl: true,
        streetViewControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
        },
        fullscreenControl: true,
        mapTypeControl: true,
        styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
      });

      const streetView = map.getStreetView();
      streetView.setOptions({
        disableDefaultUI: false,
        enableCloseButton: true,
        pov: { heading: 0, pitch: 0 },
        zoom: 1,
      });

      window.google.maps.event.addListener(streetView, 'visible_changed', function() {
        if (!streetView.getVisible()) {
          setTimeout(() => {
            window.google.maps.event.trigger(map, 'resize');
          }, 100);
        }
      });

      setMapInstance(map);

      const bounds = new window.google.maps.LatLngBounds();

      for (let i = 0; i < path.length - 1; i++) {
        const fromCity = path[i];
        const toCity   = path[i + 1];

        const backendSegment = segments.find(s =>
          (s.from_place === fromCity && s.to_place === toCity) ||
          (s.from_place === toCity   && s.to_place === fromCity)
        );

        const startCoord = backendSegment?.start_lat
          ? { lat: backendSegment.start_lat, lng: backendSegment.start_lng }
          : defaultCityCoords[fromCity];

        const endCoord = backendSegment?.end_lat
          ? { lat: backendSegment.end_lat, lng: backendSegment.end_lng }
          : defaultCityCoords[toCity];

        if (!startCoord || !endCoord) continue;

        const roadCoords   = await fetchRoadCoords(startCoord, endCoord);
        const polylinePath = roadCoords ?? [startCoord, endCoord];

        polylinePath.forEach(coord => bounds.extend(coord));

        const lineColor = STYLES.segmentColor[backendSegment?.color] ?? STYLES.segmentColor.gray;

        const line = new window.google.maps.Polyline({
          path:          polylinePath,
          geodesic:      true,
          strokeColor:   lineColor,
          strokeOpacity: STYLES.polyline.strokeOpacity,
          strokeWeight:  STYLES.polyline.strokeWeight,
          map,
        });

        if (backendSegment) {
          line.addListener('click', async () => {
            try {
              const res  = await fetch(`${API_BASE}/api/segments/${backendSegment.id}`);
              const data = await res.json();
              setSelectedSegment(data);
            } catch (err) {
              console.error('Failed to fetch segment details:', err);
            }
          });
        }
      }

      path.forEach((city, index) => {
        const coord   = defaultCityCoords[city];
        if (!coord) return;
        const isStart = index === 0;
        const isEnd   = index === path.length - 1;
        const color   = isStart ? STYLES.markerColor.start : isEnd ? STYLES.markerColor.end : STYLES.markerColor.mid;
        const scale   = (isStart || isEnd) ? STYLES.markerScale.endpoint : STYLES.markerScale.midpoint;

        const marker = new window.google.maps.Marker({
          position: coord,
          map,
          title: city,
          icon: {
            path:         window.google.maps.SymbolPath.CIRCLE,
            scale,
            fillColor:    color,
            fillOpacity:  1,
            strokeColor:  'white',
            strokeWeight: 2,
          },
        });

        const infoWindow = new window.google.maps.InfoWindow({ content: `<strong>${city}</strong>` });
        marker.addListener('click', () => infoWindow.open(map, marker));
      });

      map.fitBounds(bounds);
    }
  }, [path, segments, loading]);

  if (loading) {
    return <div style={STYLES.loadingScreen}>Loading route data from backend...</div>;
  }

  if (!path) {
    return (
      <div style={STYLES.noRouteScreen}>
        <p>No route found from {from} to {to}</p>
        <button style={STYLES.backButton} onClick={() => window.location.href = '/dashboard'}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <>
      <div ref={mapRef} style={STYLES.mapContainer} />

      <div style={STYLES.routeInfoPanel}>
        <strong>{from} → {to}</strong>
        <span style={STYLES.routeInfoMeta}>
          {path.length} stops • {path.length - 1} segments
        </span>
      </div>

      {selectedSegment && (
        <div style={STYLES.eventsPanel}>
          <div style={STYLES.eventsPanelHeader}>
            <strong>{selectedSegment.from_place} → {selectedSegment.to_place}</strong>
            <button style={STYLES.eventsPanelClose} onClick={() => setSelectedSegment(null)}>✕</button>
          </div>

          <div style={STYLES.confidenceBadge(selectedSegment.color)}>
            <span>Confidence Score: </span>
            <strong>{(selectedSegment.confidence_score * 100).toFixed(0)}%</strong>
            <span style={{ marginLeft: 8 }}>
              {selectedSegment.color === 'green'  ? '✅ Safe'     :
               selectedSegment.color === 'yellow' ? '⚠️ Caution' :
               '🔴 Dangerous'}
            </span>
          </div>

          {selectedSegment.events?.length > 0 ? (
            <>
              <strong style={{ display: 'block', marginBottom: 8 }}>⚠️ Active Alerts</strong>
              {selectedSegment.events.map((event, idx) => (
                <div key={idx} style={STYLES.eventCard}>
                  <div><strong>{event.event_type?.toUpperCase()}</strong></div>
                  <div style={{ color: '#94a3b8' }}>{event.description}</div>
                  <div style={STYLES.eventMeta}>
                    {event.source_name} • {new Date(event.reported_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={STYLES.noAlerts}>No active alerts for this route</div>
          )}
        </div>
      )}
    </>
  );
}

// ============================================================
// EXPORT — with Suspense boundary for useSearchParams
// ============================================================
export default function Page() {
  return (
    <Suspense fallback={<div style={STYLES.loadingScreen}>Loading map...</div>}>
      <MapComponent />
    </Suspense>
  );
}
