import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithEmail, signupWithEmail, resetPassword, getAllowedDomains } from '@/lib/auth';
import { toast } from 'sonner';

export default function Login() {
  const nav = useNavigate();
  const [mode, setMode] = useState<'login'|'signup'|'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowed = getAllowedDomains().join(', ');

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        toast.success('Logged in');
      } else if (mode === 'signup') {
        await signupWithEmail(email, password);
        toast.success('Account created');
      } else {
        await resetPassword(email);
        toast.success('Reset email sent');
        setMode('login');
        setLoading(false);
        return;
      }
      nav('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <style>{`
*{margin:0;padding:0;box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle,rgba(148,163,184,.38),#020617 55%);color:#e5e7eb;padding:26px}
.hidden{display:none !important}
.wrapper{width:100%;max-width:480px;position:relative;margin:24px auto}
.wrapper::before{content:"";position:fixed;inset:0;margin:auto;width:460px;height:460px;border-radius:50%;background:radial-gradient(circle,rgba(148,163,184,.4),transparent 70%);opacity:.6;filter:blur(14px);pointer-events:none;z-index:-1}
.card{padding:34px 30px 40px;border-radius:24px;background:rgba(15,23,42,.55);border:1px solid rgba(148,163,184,.35);box-shadow:0 20px 45px rgba(15,23,42,.75);backdrop-filter:blur(16px)}
.brand{display:flex;align-items:baseline;gap:8px;margin-bottom:28px;justify-content:center}
.brand-logo{width:34px;height:34px;border-radius:12px;background:radial-gradient(circle at 20% 0,#22d3ee,#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:700;color:#0b1220;font-size:18px}
.brand-text{font-size:14px;letter-spacing:.14em;color:#cbd5f5;font-weight:650}
h2.title{text-align:center;font-size:26px;margin-bottom:6px}
p.subtitle{text-align:center;font-size:14px;color:#94a3b8;margin-bottom:26px}
label{font-size:13px;color:#cbd5f5;display:block;margin-bottom:6px}
.input{width:100%;padding:11px 14px;border-radius:12px;margin-bottom:18px;border:1px solid rgba(148,163,184,.4);background:rgba(15,23,42,.55);color:#e5e7eb;font-size:14px;outline:none}
.input:focus{border-color:#22d3ee}
.btn{width:100%;padding:12px 22px;border-radius:999px;border:none;background:linear-gradient(135deg,#22c55e,#22d3ee);color:#020617;font-size:15px;font-weight:600;cursor:pointer;box-shadow:0 16px 35px rgba(15,23,42,.85);transition:.15s}
.btn:hover{transform:translateY(-1px);box-shadow:0 22px 45px rgba(15,23,42,.95)}
.link{text-align:center;margin-top:20px;font-size:13px;color:#94a3b8}
.link a{color:#22d3ee;text-decoration:none;font-weight:500;cursor:pointer}
.error{margin-top:10px;color:#f87171;text-align:center;font-size:13px}
.domains{margin-top:10px;text-align:center;font-size:12px;color:#94a3b8}
      `}</style>

      <div className="wrapper">
        {mode === 'login' && (
          <div className="screen card">
            <div className="brand">
              <div className="brand-logo">S</div>
              <div className="brand-text">SEteams</div>
            </div>
            <h2 className="title">Welcome Back</h2>
            <p className="subtitle">Login to your secure workspace</p>
            <label>Email</label>
            <input type="email" className="input" placeholder="you@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
            <label>Password</label>
            <input type="password" className="input" placeholder="••••••••" value={password} onChange={(e)=>setPassword(e.target.value)} />
            <button className="btn" onClick={submit} disabled={loading}>{loading ? 'Processing…' : 'Login'}</button>
            {error && <div className="error">{error}</div>}
            <div className="domains">Allowed domains: {allowed}</div>
            <p className="link">
              <a onClick={()=>setMode('forgot')}>Forgot password?</a>
              <br /><br />
              Don't have an account? <a onClick={()=>setMode('signup')}>Create one</a>
            </p>
          </div>
        )}

        {mode === 'signup' && (
          <div className="screen card">
            <div className="brand">
              <div className="brand-logo">S</div>
              <div className="brand-text">SEteams</div>
            </div>
            <h2 className="title">Create Account</h2>
            <p className="subtitle">Start your secure workspace</p>
            <label>Email</label>
            <input type="email" className="input" placeholder="you@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
            <label>Password</label>
            <input type="password" className="input" placeholder="Create a password" value={password} onChange={(e)=>setPassword(e.target.value)} />
            <button className="btn" onClick={submit} disabled={loading}>{loading ? 'Processing…' : 'Continue'}</button>
            {error && <div className="error">{error}</div>}
            <div className="domains">Allowed domains: {allowed}</div>
            <p className="link">Already have an account? <a onClick={()=>setMode('login')}>Login</a></p>
          </div>
        )}

        {mode === 'forgot' && (
          <div className="screen card">
            <div className="brand">
              <div className="brand-logo">S</div>
              <div className="brand-text">SEteams</div>
            </div>
            <h2 className="title">Reset Password</h2>
            <p className="subtitle">Enter your email to receive reset link</p>
            <label>Email</label>
            <input type="email" className="input" placeholder="you@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
            <button className="btn" onClick={submit} disabled={loading}>{loading ? 'Processing…' : 'Send Reset Email'}</button>
            {error && <div className="error">{error}</div>}
            <div className="domains">Allowed domains: {allowed}</div>
            <p className="link">Remembered your password? <a onClick={()=>setMode('login')}>Login</a></p>
          </div>
        )}
      </div>
    </div>
  );
}
