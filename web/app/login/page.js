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
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard');
    });
  }, []);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { name, full_name: name }
      }
    });
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        name,
        created_at: new Date().toISOString()
      });
      setConfirmationSent(true);
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

  if (confirmationSent) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#1e293b', padding: 40, borderRadius: 24, width: 400, textAlign: 'center', border: '1px solid #334155' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
          <h2 style={{ color: 'white', marginBottom: 8 }}>Check your email</h2>
          <p style={{ color: '#94a3b8', marginBottom: 16 }}>We sent a confirmation link to <strong>{email}</strong></p>
          <button onClick={() => { setConfirmationSent(false); setEmail(''); setPassword(''); setName(''); }}
            style={{ background: '#14b8a6', border: 'none', padding: '10px 20px', borderRadius: 8, color: 'white', cursor: 'pointer' }}>
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #0a0f1a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ background: '#1e293b', padding: 40, borderRadius: 24, width: 440, border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🗺️</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #fff, #14b8a6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            RouteAware
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 8 }}>{isSignUp ? 'Create your account' : 'Welcome back'}</p>
        </div>

        {isSignUp && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Full Name</label>
            <input type="text" placeholder="e.g., Ali Khan" value={name} onChange={e => setName(e.target.value)}
              style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#14b8a6'} onBlur={e => e.target.style.borderColor = '#334155'} />
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Email</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = '#14b8a6'} onBlur={e => e.target.style.borderColor = '#334155'} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Password</label>
          <div style={{ position: 'relative' }}>
            <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: 14, paddingRight: 45, borderRadius: 12, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#14b8a6'} onBlur={e => e.target.style.borderColor = '#334155'} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', padding: 12, borderRadius: 8, color: '#ef4444', fontSize: 12, marginBottom: 16, textAlign: 'center' }}>
            {error}
          </div>
        )}

        <button onClick={isSignUp ? handleSignup : handleLogin} disabled={loading}
          style={{ width: '100%', padding: 14, borderRadius: 40, background: loading ? '#0f766e' : '#14b8a6', border: 'none', color: 'white', fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 12 }}>
          {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
        </button>

        <button onClick={handleDemoLogin} disabled={loading}
          style={{ width: '100%', padding: 14, borderRadius: 40, background: 'transparent', border: '1px solid #334155', color: '#94a3b8', cursor: 'pointer', marginBottom: 20 }}>
          🎯 Try Demo Account
        </button>

        <div style={{ textAlign: 'center', fontSize: 13, color: '#64748b' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button onClick={() => { setIsSignUp(!isSignUp); setError(''); setName(''); }}
            style={{ background: 'none', border: 'none', color: '#14b8a6', cursor: 'pointer', marginLeft: 6 }}>
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </main>
  );
}
