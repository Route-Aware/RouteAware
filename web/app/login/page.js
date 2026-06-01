'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  'https://newerjuliwrjakdrisum.supabase.co',
  'sb_publishable_7T3SjE7guPPwieSzn-jLGw_-h5e1z6Q'
);

const MAP_ZOOM = 11;
const MAP_CENTER = { x: 1051, y: 682 };
const TILE_SIZE = 256;
const TILE_RADIUS = 2;

function MapBackground() {
  const tiles = [];
  for (let dx = -TILE_RADIUS; dx <= TILE_RADIUS; dx++) {
    for (let dy = -TILE_RADIUS; dy <= TILE_RADIUS; dy++) {
      tiles.push({ x: MAP_CENTER.x + dx, y: MAP_CENTER.y + dy, key: `${dx}-${dy}` });
    }
  }

  const gridSize = TILE_SIZE * (TILE_RADIUS * 2 + 1);

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: gridSize,
          height: gridSize,
          transform: 'translate(-50%, -50%) scale(1.15)',
          display: 'grid',
          gridTemplateColumns: `repeat(${TILE_RADIUS * 2 + 1}, ${TILE_SIZE}px)`,
          gridTemplateRows: `repeat(${TILE_RADIUS * 2 + 1}, ${TILE_SIZE}px)`,
          opacity: 0.28,
          filter:
            'brightness(0.35) contrast(1.15) saturate(0.9) hue-rotate(195deg) sepia(0.25)',
        }}
      >
        {tiles.map((t) => (
          <img
            key={t.key}
            src={`https://a.basemaps.cartocdn.com/dark_all/${MAP_ZOOM}/${t.x}/${t.y}.png`}
            alt=""
            width={TILE_SIZE}
            height={TILE_SIZE}
            draggable={false}
            style={{ display: 'block', width: TILE_SIZE, height: TILE_SIZE }}
          />
        ))}
      </div>

      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.35 }}
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#94a3b8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.9" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g fill="none" stroke="url(#routeGlow)" strokeWidth="1.5" filter="url(#glow)" strokeLinecap="round">
          <path d="M80 420 L220 380 L380 400 L520 320 L680 350 L840 280 L1020 310 L1120 260" />
          <path d="M120 520 L280 480 L440 500 L600 440 L760 460 L920 400 L1080 430" />
          <path d="M200 200 L320 280 L480 240 L640 300 L800 220 L960 280" />
          <path d="M400 600 L520 540 L700 560 L880 500 L1000 520" />
          <path d="M300 350 L300 550" strokeWidth="1" opacity="0.6" />
          <path d="M550 180 L550 620" strokeWidth="1" opacity="0.6" />
          <path d="M750 200 L750 650" strokeWidth="1" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
}

function EyeIcon({ hidden }) {
  if (hidden) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function PinLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

const inputStyle = {
  width: '100%',
  padding: 14,
  borderRadius: 12,
  border: '1px solid #1e3a5f',
  background: 'rgba(15,23,42,0.8)',
  color: 'white',
  fontSize: 14,
  boxSizing: 'border-box',
  outline: 'none',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard');
    });
  }, [router]);

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin}/dashboard` },
    });
    if (oauthError) setError(oauthError.message);
    setLoading(false);
  };

  const handleSignup = async () => {
    setError('');
    if (!name.trim()) return setError('Please enter your name');
    if (!isValidEmail(email)) return setError('Please enter a valid email address');
    if (password.length < 6) return setError('Password must be at least 6 characters');

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { name, full_name: name },
      },
    });

    if (data?.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        name,
        created_at: new Date().toISOString(),
      });
      setConfirmationSent(true);
    }
    if (signUpError) setError(signUpError.message);
    setLoading(false);
  };

  const handleLogin = async () => {
    setError('');
    if (!email || !password) return setError('Please enter email and password');
    setLoading(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) setError(loginError.message);
    else router.push('/dashboard');
    setLoading(false);
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    const demoEmail = 'demo@routeaware.com';
    const demoPassword = 'demo123456';

    let { error: demoError } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword,
    });

    if (demoError) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
        options: { data: { name: 'Demo User', is_demo: true } },
      });
      if (!signUpError && data?.user) {
        await supabase.from('profiles').insert({ id: data.user.id, name: 'Demo User' });
        await supabase.auth.signInWithPassword({ email: demoEmail, password: demoPassword });
        router.push('/dashboard');
      } else {
        setError('Demo mode unavailable. Please try again.');
      }
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
  };

  const focusBorder = (e) => { e.target.style.borderColor = '#38bdf8'; };
  const blurBorder = (e) => { e.target.style.borderColor = '#1e3a5f'; };

  if (confirmationSent) {
    return (
      <main style={shellStyle}>
        <MapBackground />
        <div style={overlayStyle} />
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
            <MailIcon />
          </div>
          <h2 style={{ color: 'white', marginBottom: 8, fontSize: 22 }}>Check your email</h2>
          <p style={{ color: '#94a3b8', marginBottom: 20, fontSize: 14 }}>
            We sent a confirmation link to <strong style={{ color: '#e2e8f0' }}>{email}</strong>
          </p>
          <button
            type="button"
            onClick={() => {
              setConfirmationSent(false);
              setEmail('');
              setPassword('');
              setName('');
            }}
            style={primaryBtnStyle(false)}
          >
            Back to login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={shellStyle}>
      <MapBackground />
      <div style={overlayStyle} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 40%, rgba(14,165,233,0.12) 0%, transparent 55%)',
          pointerEvents: 'none',
        }}
      />
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              margin: '0 auto 12px',
              background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 24px rgba(14, 165, 233, 0.35)',
            }}
          >
            <PinLogo />
          </div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              margin: 0,
              background: 'linear-gradient(135deg, #fff 0%, #38bdf8 50%, #14b8a6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            RouteAware
          </h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        {isSignUp && (
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              placeholder="e.g., Ali Khan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            onFocus={focusBorder}
            onBlur={blurBorder}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...inputStyle, paddingRight: 45 }}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
              }}
            >
              <EyeIcon hidden={!showPassword} />
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239,68,68,0.15)',
              padding: 12,
              borderRadius: 8,
              color: '#ef4444',
              fontSize: 12,
              marginBottom: 16,
              textAlign: 'center',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={isSignUp ? handleSignup : handleLogin}
          disabled={loading}
          style={primaryBtnStyle(loading)}
        >
          {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: 14,
            borderRadius: 40,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'white',
            fontWeight: 600,
            fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: 14,
            borderRadius: 40,
            background: 'transparent',
            border: '1px solid #1e3a5f',
            color: '#94a3b8',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: 20,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Try Demo Account
        </button>

        <div style={{ textAlign: 'center', fontSize: 13, color: '#64748b' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setName('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#38bdf8',
              cursor: 'pointer',
              marginLeft: 6,
              fontSize: 13,
            }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </main>
  );
}

const shellStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(160deg, #020817 0%, #0c1e3d 45%, #020817 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  position: 'relative',
  overflow: 'hidden',
};

const overlayStyle = {
  position: 'absolute',
  inset: 0,
  background:
    'linear-gradient(135deg, rgba(2,8,23,0.88) 0%, rgba(12,30,61,0.75) 50%, rgba(2,8,23,0.92) 100%)',
  pointerEvents: 'none',
};

const cardStyle = {
  position: 'relative',
  zIndex: 10,
  background: 'rgba(15, 23, 42, 0.88)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  padding: 40,
  borderRadius: 24,
  width: 440,
  maxWidth: 'calc(100vw - 32px)',
  border: '1px solid rgba(56, 189, 248, 0.22)',
  boxShadow: '0 0 48px rgba(14, 165, 233, 0.12), 0 25px 50px rgba(0,0,0,0.55)',
};

const labelStyle = {
  fontSize: 12,
  color: '#94a3b8',
  marginBottom: 6,
  display: 'block',
};

function primaryBtnStyle(loading) {
  return {
    width: '100%',
    padding: 14,
    borderRadius: 40,
    background: loading ? '#0f766e' : 'linear-gradient(135deg, #0ea5e9, #14b8a6)',
    border: 'none',
    color: 'white',
    fontWeight: 600,
    fontSize: 14,
    cursor: loading ? 'not-allowed' : 'pointer',
    marginBottom: 12,
    boxShadow: loading ? 'none' : '0 4px 20px rgba(14, 165, 233, 0.25)',
  };
}
