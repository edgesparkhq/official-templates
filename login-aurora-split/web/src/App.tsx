import { useState, useEffect } from "react";
import { client } from "@/lib/edgespark";

/* ─── Aurora Left Panel (shared) ─── */
function AuroraPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:w-[54%] relative overflow-hidden flex flex-col justify-between p-8 sm:p-12 lg:p-14 min-h-[300px] lg:min-h-screen">
      {/* Deep space base */}
      <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(ellipse 80% 60% at 30% 40%, #091420 0%, #040b14 50%, #020509 100%)" }}>
        {/* Aurora curtains */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 10%, rgba(16,185,129,0.12) 30%, rgba(59,130,246,0.08) 50%, transparent 70%)", animation: "auroraWave1 12s ease-in-out infinite" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(170deg, transparent 20%, rgba(6,182,212,0.1) 40%, rgba(139,92,246,0.06) 60%, transparent 80%)", animation: "auroraWave2 16s ease-in-out infinite" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(190deg, transparent 15%, rgba(52,211,153,0.08) 35%, rgba(96,165,250,0.05) 55%, transparent 75%)", animation: "auroraWave3 20s ease-in-out infinite" }} />

        {/* Topographic contour lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="topo" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              <ellipse cx="100" cy="100" rx="90" ry="60" fill="none" stroke="white" strokeWidth="0.5" />
              <ellipse cx="100" cy="100" rx="70" ry="45" fill="none" stroke="white" strokeWidth="0.5" />
              <ellipse cx="100" cy="100" rx="50" ry="30" fill="none" stroke="white" strokeWidth="0.5" />
              <ellipse cx="100" cy="100" rx="30" ry="18" fill="none" stroke="white" strokeWidth="0.5" />
              <ellipse cx="100" cy="100" rx="12" ry="7" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#topo)" />
        </svg>

        {/* Noise grain */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "128px 128px" }} />

        {/* Horizon glow */}
        <div className="absolute bottom-0 left-0 right-0 h-[40%]" style={{ background: "linear-gradient(to top, rgba(16,185,129,0.05), transparent)" }} />
      </div>
      {children}
    </div>
  );
}

/* ─── Right Panel (shared) ─── */
function FormPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:w-[46%] flex items-center justify-center p-6 sm:p-12 lg:p-14 relative" style={{ background: "#080b12" }}>
      {/* Subtle noise */}
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "128px 128px" }} />
      {/* Left edge glow */}
      <div className="absolute top-0 left-0 bottom-0 w-[1px]" style={{ background: "linear-gradient(180deg, transparent, rgba(16,185,129,0.15), rgba(59,130,246,0.1), transparent)" }} />
      <div className="absolute top-0 left-0 bottom-0 w-24" style={{ background: "linear-gradient(to right, rgba(16,185,129,0.02), transparent)" }} />
      <div className="w-full max-w-[360px] relative z-10">
        {children}
      </div>
    </div>
  );
}

/* ─── Dashboard ─── */
function Dashboard() {
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    client.auth.getSession().then((s) => { if (s?.data?.user?.email) setUserEmail(s.data.user.email); });
  }, []);

  const handleSignOut = async () => { await client.auth.signOut(); window.location.href = "/"; };

  return (
    <main className="min-h-screen flex flex-col lg:flex-row">
      <AuroraPanel>
        <div className="relative z-10 anim-slide-right d1">
          <Logo />
        </div>
        <div className="relative z-10 lg:max-w-lg">
          <h2 className="anim-slide-right d2 text-white text-3xl sm:text-4xl font-bold leading-[1.15] tracking-[-0.03em] mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
            You're in.
          </h2>
          <p className="anim-fade d3 text-white/40 text-[15px] leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Your EdgeSpark project is live on the edge. Deploy, manage, scale.
          </p>
        </div>
        <div className="relative z-10 anim-fade d4" />
      </AuroraPanel>

      <FormPanel>
        <div className="mb-8">
          <h1 className="anim-slide-up d1 text-white text-[22px] font-semibold tracking-[-0.02em]" style={{ fontFamily: "'Sora', sans-serif" }}>Dashboard</h1>
          <p className="anim-slide-up d2 text-white/30 text-[13px] mt-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Signed in as <span className="text-emerald-400/70 font-medium">{userEmail || "..."}</span>
          </p>
        </div>

        <div className="space-y-2 mb-8">
          {[
            { label: "Deploy project", cmd: "edgespark deploy", icon: "M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" },
            { label: "Database", cmd: "edgespark db migrate", icon: "M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" },
            { label: "Secrets", cmd: "edgespark secret set", icon: "M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" },
            { label: "Logs", cmd: "edgespark logs", icon: "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" },
          ].map((item, i) => (
            <div
              key={item.label}
              className={`anim-slide-up d${i + 3} group flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 cursor-pointer`}
              style={{ border: "1px solid rgba(255,255,255,0.04)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.04)"; e.currentTarget.style.borderColor = "rgba(16,185,129,0.12)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; }}
            >
              <svg className="w-[18px] h-[18px] text-emerald-500/60 shrink-0 transition-colors group-hover:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
              <div className="flex-1 min-w-0">
                <div className="text-white/80 text-[13px] font-medium group-hover:text-white transition-colors" style={{ fontFamily: "'Sora', sans-serif" }}>{item.label}</div>
                <div className="text-white/20 text-[11px] font-mono mt-0.5 truncate">{item.cmd}</div>
              </div>
              <svg className="w-3.5 h-3.5 text-white/15 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </div>
          ))}
        </div>

        <button onClick={handleSignOut} className="anim-slide-up d7 w-full py-3 rounded-2xl text-white/30 text-[13px] font-medium transition-all duration-300 hover:text-rose-400/70 cursor-pointer" style={{ fontFamily: "'Sora', sans-serif", border: "1px solid rgba(255,255,255,0.04)" }}>
          Sign out
        </button>
      </FormPanel>
    </main>
  );
}

/* ─── Login Page ─── */
function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signup");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true); setError("");
    try {
      if (mode === "signin") {
        const r = await client.auth.signIn.email({ email, password });
        if (r.error) { setError(r.error.message ?? "Sign-in failed"); setLoading(false); return; }
      } else {
        const r = await client.auth.signUp.email({ name: email.split("@")[0], email, password });
        if (r.error) { setError(r.error.message ?? "Sign-up failed"); setLoading(false); return; }
      }
      window.location.href = "/";
    } catch { setError("Connection error. Please try again."); setLoading(false); }
  };

  const inputCls = "w-full px-4 py-3.5 rounded-2xl text-white placeholder-white/15 text-[14px] outline-none transition-all duration-300 focus:ring-2 focus:ring-emerald-500/20";
  const inputStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontFamily: "'DM Sans', sans-serif" };

  return (
    <main className="min-h-screen flex flex-col lg:flex-row">
      <AuroraPanel>
        {/* Logo */}
        <div className="relative z-10 anim-slide-right d1">
          <Logo />
        </div>

        {/* Hero */}
        <div className="relative z-10 lg:max-w-lg">
          <h2 className="anim-slide-right d2 text-white text-[36px] sm:text-[44px] lg:text-[52px] font-extrabold leading-[1.08] tracking-[-0.04em] mb-6" style={{ fontFamily: "'Sora', sans-serif" }}>
            Ship to the<br />
            <span style={{ background: "linear-gradient(135deg, #34d399 0%, #22d3ee 40%, #60a5fa 80%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              edge.
            </span>
          </h2>
          <p className="anim-fade d3 text-white/35 text-[15px] sm:text-[16px] leading-[1.7] max-w-md font-light" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            One CLI to deploy, authenticate, store, and scale.<br />
            Built for developers who ship fast.
          </p>

          {/* Stats */}
          <div className="flex gap-10 mt-10">
            {[{ value: "12K+", label: "Deploys" }, { value: "99.9%", label: "Uptime" }, { value: "<50ms", label: "Latency" }].map((stat, i) => (
              <div key={stat.label} className={`anim-count d${i + 4}`}>
                <div className="text-white font-bold text-[24px] sm:text-[28px] tracking-[-0.02em]" style={{ fontFamily: "'Sora', sans-serif" }}>{stat.value}</div>
                <div className="text-white/25 text-[11px] mt-1.5 uppercase tracking-[0.1em] font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 anim-fade d7">
          <div className="relative rounded-2xl p-6 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="absolute top-4 left-5 text-emerald-500/15 text-[48px] leading-none font-serif">"</div>
            <p className="relative z-10 text-white/50 text-[14px] leading-[1.75] italic pl-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Replaced our entire deploy pipeline with one command. EdgeSpark just works.
            </p>
            <div className="flex items-center gap-3 mt-5 pl-1">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: "linear-gradient(135deg, #10b981, #3b82f6)" }}>JC</div>
              <div>
                <div className="text-white/70 text-[13px] font-medium" style={{ fontFamily: "'Sora', sans-serif" }}>Jamie Chen</div>
                <div className="text-white/25 text-[11px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>CTO at LaunchPad</div>
              </div>
            </div>
          </div>
        </div>
      </AuroraPanel>

      <FormPanel>
        <div className="mb-9">
          <h1 className="anim-slide-up d1 text-white text-[24px] font-semibold tracking-[-0.03em]" style={{ fontFamily: "'Sora', sans-serif" }}>
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h1>
          <p className="anim-slide-up d2 text-white/30 text-[13px] mt-2.5 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {mode === "signin" ? "Enter your credentials to continue." : "Sign up to get started with EdgeSpark."}
          </p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-2xl text-rose-300 text-[13px] flex items-center gap-2.5" style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.12)", fontFamily: "'DM Sans', sans-serif" }}>
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="anim-slide-up d3">
            <label className="block text-white/40 text-[11px] font-semibold mb-2.5 tracking-[0.08em] uppercase" style={{ fontFamily: "'Sora', sans-serif" }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required className={inputCls} style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.3)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
            />
          </div>

          <div className="anim-slide-up d4">
            <div className="flex justify-between items-center mb-2.5">
              <label className="text-white/40 text-[11px] font-semibold tracking-[0.08em] uppercase" style={{ fontFamily: "'Sora', sans-serif" }}>Password</label>
              <span className="text-white/15 text-[11px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Min 8 characters</span>
            </div>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••" required minLength={8} className={inputCls} style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.3)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
            />
          </div>

          <div className="anim-slide-up d5 pt-1">
            <button type="submit" disabled={loading}
              className="relative w-full py-4 rounded-2xl text-white font-semibold text-[14px] tracking-wide transition-all duration-300 cursor-pointer active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
              style={{ background: "linear-gradient(135deg, #10b981 0%, #0ea5e9 50%, #3b82f6 100%)", fontFamily: "'Sora', sans-serif" }}
            >
              <span className="relative z-10">{loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}</span>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 w-[60%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent" style={{ animation: "shimmer 2s ease-in-out infinite" }} />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-8 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" style={{ background: "linear-gradient(135deg, #10b981, #3b82f6)" }} />
            </button>
          </div>
        </form>

        <p className="anim-fade d6 text-center text-white/20 text-[13px] mt-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          {mode === "signin" ? (
            <>No account?{" "}<button onClick={() => { setMode("signup"); setError(""); }} className="text-emerald-400/60 hover:text-emerald-400 transition-colors cursor-pointer font-medium">Create one</button></>
          ) : (
            <>Have an account?{" "}<button onClick={() => { setMode("signin"); setError(""); }} className="text-emerald-400/60 hover:text-emerald-400 transition-colors cursor-pointer font-medium">Sign in</button></>
          )}
        </p>

        <div className="anim-fade d7 flex items-center justify-center gap-5 mt-7">
          {["Privacy", "Terms", "Docs"].map((link) => (
            <a key={link} href="#" className="text-white/15 text-[11px] hover:text-white/40 transition-colors tracking-wide uppercase" style={{ fontFamily: "'Sora', sans-serif" }}>{link}</a>
          ))}
        </div>
      </FormPanel>
    </main>
  );
}

/* ─── Logo ─── */
function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(59,130,246,0.2))" }} />
        <svg className="w-5 h-5 text-emerald-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
      </div>
      <span className="text-white/80 font-semibold text-[16px] tracking-[-0.01em]" style={{ fontFamily: "'Sora', sans-serif" }}>EdgeSpark</span>
    </div>
  );
}

/* ─── App ─── */
function App() {
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    client.auth.getSession().then((s) => {
      setLoggedIn(!!s?.data?.session);
      setChecking(false);
    }).catch(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "#040b14" }}>
        <div className="text-white/20 text-[13px] tracking-[0.15em] uppercase animate-pulse" style={{ fontFamily: "'Sora', sans-serif" }}>Loading</div>
      </main>
    );
  }

  return loggedIn ? <Dashboard /> : <LoginPage />;
}

export default App;
