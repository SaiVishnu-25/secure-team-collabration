import { useNavigate } from 'react-router-dom';

export default function Home() {
  const nav = useNavigate();
  return (
    <div>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at center,rgba(148,163,184,.38) 0%,#020617 55%,#020617 100%);color:#e5e7eb;padding:24px}
        .wrapper{width:100%;max-width:1100px;position:relative;margin:24px auto}
        .wrapper::before{content:"";position:fixed;inset:0;margin:auto;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,rgba(148,163,184,.45),transparent 65%);opacity:.65;filter:blur(12px);pointer-events:none;z-index:-1}
        .hero{position:relative;padding:32px 32px 36px;border-radius:24px;background:rgba(15,23,42,.55);border:1px solid rgba(148,163,184,.35);box-shadow:0 20px 45px rgba(15,23,42,.75);backdrop-filter:blur(16px);display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1.5fr);gap:32px}
        .hero-header{position:absolute;top:20px;left:32px;right:32px;display:flex;align-items:center;justify-content:space-between;gap:16px}
        .brand{display:flex;align-items:baseline;gap:6px}
        .brand-logo{width:32px;height:32px;border-radius:12px;background:radial-gradient(circle at 20% 0,#22d3ee,#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;color:#0b1220;box-shadow:0 0 0 1px rgba(15,23,42,.45)}
        .brand-text{font-weight:650;letter-spacing:.14em;font-size:13px;color:#cbd5f5}
        .login-btn{padding:8px 20px;border-radius:999px;border:1px solid rgba(148,163,184,.7);background:linear-gradient(120deg,rgba(15,23,42,.2),rgba(15,23,42,.7));color:#e5e7eb;font-size:14px;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:all .18s ease-out;backdrop-filter:blur(10px)}
        .login-btn span.icon{width:18px;height:18px;border-radius:50%;background:radial-gradient(circle at 30% 10%,#22c55e,#16a34a);display:inline-block}
        .login-btn:hover{border-color:#22c55e;box-shadow:0 0 0 1px rgba(34,197,94,.4),0 14px 30px rgba(15,23,42,.9);transform:translateY(-1px)}
        .hero-main{margin-top:40px}
        .eyebrow{font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:#93c5fd;margin-bottom:12px}
        .title{font-size:clamp(32px,4vw,44px);line-height:1.12;margin-bottom:14px}
        .highlight{background:linear-gradient(120deg,#22d3ee,#a855f7);-webkit-background-clip:text;background-clip:text;color:transparent}
        .subtitle{font-size:15px;line-height:1.6;color:#cbd5f5;max-width:430px;margin-bottom:20px}
        .pill-row{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:26px}
        .pill{font-size:11px;text-transform:uppercase;letter-spacing:.16em;padding:6px 12px;border-radius:999px;border:1px solid rgba(148,163,184,.6);background:radial-gradient(circle at top left,rgba(148,163,184,.18),rgba(15,23,42,.75));color:#e5e7eb}
        .primary-cta{display:inline-flex;align-items:center;gap:10px;padding:10px 22px;border-radius:999px;border:none;background:linear-gradient(135deg,#22c55e,#22d3ee);color:#020617;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 16px 35px rgba(15,23,42,.85);transition:transform .16s ease-out,box-shadow .16s ease-out}
        .primary-cta:hover{transform:translateY(-1px);box-shadow:0 22px 45px rgba(15,23,42,.95)}
        .primary-cta small{text-transform:uppercase;font-size:10px;letter-spacing:.22em;opacity:.9}
        .meta-line{margin-top:14px;font-size:12px;color:#9ca3af}
        .meta-line strong{color:#e5e7eb;font-weight:600}
        .hero-aside{margin-top:40px;display:flex;align-items:stretch;justify-content:center}
        .glass-card{width:100%;max-width:340px;padding:18px 18px 20px;border-radius:18px;background:rgba(2,6,23,.35);border:1px solid rgba(148,163,184,.35);box-shadow:0 16px 35px rgba(2,6,23,.85);backdrop-filter:blur(14px)}
        .card-title{font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:#93c5fd;margin-bottom:10px}
        .card-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:12px;background:rgba(15,23,42,.45);border:1px solid rgba(148,163,184,.25);margin-bottom:8px}
        .dot{width:10px;height:10px;border-radius:50%;background:linear-gradient(135deg,#22d3ee,#a855f7)}
      `}</style>

      <div className="wrapper">
        <div className="hero">
          <div className="hero-header">
            <div className="brand">
              <div className="brand-logo">S</div>
              <div className="brand-text">SETEAMS</div>
            </div>
            <button className="login-btn" onClick={()=>nav('/login')}>
              <span className="icon"></span>
              Login
            </button>
          </div>

          <section className="hero-main">
            <div className="eyebrow">Secure Collaboration</div>
            <h1 className="title">
              Modern teamwork with
              <span className="highlight"> end‑to‑end encryption</span>
            </h1>
            <p className="subtitle">Chats, Teams, Files and Calls — all protected by strong cryptography, phishing checks, and safe sharing.</p>
            <div className="pill-row">
              <span className="pill">Encrypted Rooms</span>
              <span className="pill">File Scanning</span>
              <span className="pill">Signed URLs</span>
              <span className="pill">Role Control</span>
            </div>
            <button className="primary-cta" onClick={()=>nav('/login')}>
              <small>Get Started</small>
              →
            </button>
            <div className="meta-line">Free trial • <strong>No credit card</strong></div>
          </section>

          <aside className="hero-aside">
            <div className="glass-card">
              <div className="card-title">Highlights</div>
              <div className="card-item"><span className="dot" /> End‑to‑end encrypted messages</div>
              <div className="card-item"><span className="dot" /> Secure file uploads (Supabase)</div>
              <div className="card-item"><span className="dot" /> Malware & phishing protection</div>
              <div className="card-item"><span className="dot" /> Time‑limited link sharing</div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

