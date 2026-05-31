'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard');
    });
  }, []);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://project-ilsfa.vercel.app/dashboard' },
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleSignup = async () => {
    setError('');
    if (!name.trim()) return setError('Please enter your name');
    if (!isValidEmail(email)) return setError('Please enter a valid email address');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://project-ilsfa.vercel.app/dashboard',
        data: { name, full_name: name }
      }
    });
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        name,
        created_at: new Date().toISOString()
      });
      router.push('/dashboard');
    }
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleLogin = async () => {
    setError('');
    if (!email || !password) return setError('Please enter email and password');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else router.push('/dashboard');
    setLoading(false);
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    const demoEmail = 'demo@routeaware.com';
    const demoPassword = 'demo123456';
    let { error } = await supabase.auth.signInWithPassword({ email: demoEmail, password: demoPassword });
    if (error) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
        options: { data: { name: 'Demo User', is_demo: true } }
      });
      if (!signUpError && data.user) {
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

  return (
    <main style={{
      minHeight: '100vh',
      background: '#020817',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Real map tile background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url("https://tile.openstreetmap.org/6/42/26.png")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.18,
        filter: 'invert(1) hue-rotate(180deg) saturate(3) brightness(0.5)',
        pointerEvents: 'none',
        transform: 'scale(1.05)'
      }} />

      {/* Dark gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(2,8,23,0.85) 0%, rgba(12,30,61,0.7) 50%, rgba(2,8,23,0.85) 100%)',
        pointerEvents: 'none'
      }} />

      {/* Blue glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 50%, rgba(14,165,233,0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Login box */}
      <div style={{
        position: 'relative', zIndex: 10,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: 40, borderRadius: 24, width: 440,
        border: '1px solid rgba(56, 189, 248, 0.2)',
        boxShadow: '0 0 40px rgba(14, 165, 233, 0.1), 0 25px 50px rgba(0,0,0,0.5)'
      }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
          </div>
          <h1 style={{
            fontSize: 32, fontWeight: 800, margin: 0,
            background: 'linear-gradient(135deg, #fff 0%, #38bdf8 50%, #14b8a6 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            RouteAware
          </h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        {isSignUp && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Full Name</label>
            <input type="text" placeholder="e.g., Ali Khan" value={name} onChange={e => setName(e.target.value)}
              style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #1e3a5f', background: 'rgba(15,23,42,0.8)', color: 'white', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#38bdf8'} onBlur={e => e.target.style.borderColor = '#1e3a5f'} />
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Email</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #1e3a5f', background: 'rgba(15,23,42,0.8)', color: 'white', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = '#38bdf8'} onBlur={e => e.target.style.borderColor = '#1e3a5f'} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Password</label>
          <div style={{ position: 'relative' }}>
            <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: 14, paddingRight: 45, borderRadius: 12, border: '1px solid #1e3a5f', background: 'rgba(15,23,42,0.8)', color: 'white', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#38bdf8'} onBlur={e => e.target.style.borderColor = '#1e3a5f'} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', padding: 12, borderRadius: 8, color: '#ef4444', fontSize: 12, marginBottom: 16, textAlign: 'center', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        <button onClick={isSignUp ? handleSignup : handleLogin} disabled={loading}
          style={{ width: '100%', padding: 14, borderRadius: 40, background: loading ? '#0f766e' : 'linear-gradient(135deg, #0ea5e9, #14b8a6)', border: 'none', color: 'white', fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 12 }}>
          {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
        </button>

        <button onClick={handleGoogleLogin} disabled={loading}
          style={{ width: '100%', padding: 14, borderRadius: 40, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <button onClick={handleDemoLogin} disabled={loading}
          style={{ width: '100%', padding: 14, borderRadius: 40, background: 'transparent', border: '1px solid #1e3a5f', color: '#94a3b8', cursor: 'pointer', marginBottom: 20 }}>
          Try Demo Account
        </button>

        <div style={{ textAlign: 'center', fontSize: 13, color: '#64748b' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button onClick={() => { setIsSignUp(!isSignUp); setError(''); setName(''); }}
            style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', marginLeft: 6 }}>
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </main>
  );
}
