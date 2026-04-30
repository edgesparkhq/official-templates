import { useState, useEffect, useRef, useCallback } from "react";
import { client } from "@/lib/edgespark";

/* ─── Water caustic background (pure WebGL, zero deps) ─── */
const VERT = `attribute vec2 a_position;void main(){gl_Position=vec4(a_position,0,1);}`;
const FRAG = `
precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_speed;
uniform float u_intensity;
uniform float u_scale;
uniform vec3 u_tint;
uniform vec3 u_base;

const float TAU=6.28318530718;
const int MAX_ITER=5;

void main(){
  float time=u_time*u_speed+23.0;
  vec2 uv=gl_FragCoord.xy/u_resolution.xy;
  vec2 p=mod(uv*TAU*u_scale,TAU)-250.0;
  vec2 i=p;
  float c=1.0;
  float inten=0.005;
  for(int n=0;n<MAX_ITER;n++){
    float t=time*(1.0-(3.5/float(n+1)));
    i=p+vec2(cos(t-i.x)+sin(t+i.y),sin(t-i.y)+cos(t+i.x));
    c+=1.0/length(vec2(p.x/(sin(i.x+t)/inten),p.y/(cos(i.y+t)/inten)));
  }
  c/=float(MAX_ITER);
  c=1.17-pow(c,1.4);
  float v=pow(abs(c),8.0);
  vec3 color=mix(u_base,u_tint,v*u_intensity);
  gl_FragColor=vec4(color,1.0);
}`;

// Debug mode: ?debug in URL
const DEBUG = new URLSearchParams(window.location.search).has("debug");

const DEFAULT_PARAMS = {
  speed: 0.27,
  intensity: 2.0,
  scale: 1.8,
  tintR: 0.68, tintG: 0.83, tintB: 0.90,
  baseR: 0.97, baseG: 0.97, baseB: 0.98,
};

function WaterCaustic({ params }: { params: typeof DEFAULT_PARAMS }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const progRef = useRef<WebGLProgram | null>(null);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) return;
    glRef.current = gl;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    progRef.current = prog;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    startRef.current = performance.now();
  }, []);

  useEffect(() => {
    init();
    const canvas = canvasRef.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      if (!canvas || !glRef.current) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      glRef.current.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      const gl = glRef.current;
      const prog = progRef.current;
      if (!gl || !prog || !canvas) return;
      const p = paramsRef.current;
      const t = (performance.now() - startRef.current) / 1000;
      gl.uniform1f(gl.getUniformLocation(prog, "u_time"), t);
      gl.uniform2f(gl.getUniformLocation(prog, "u_resolution"), canvas.width, canvas.height);
      gl.uniform1f(gl.getUniformLocation(prog, "u_speed"), p.speed);
      gl.uniform1f(gl.getUniformLocation(prog, "u_intensity"), p.intensity);
      gl.uniform1f(gl.getUniformLocation(prog, "u_scale"), p.scale);
      gl.uniform3f(gl.getUniformLocation(prog, "u_tint"), p.tintR, p.tintG, p.tintB);
      gl.uniform3f(gl.getUniformLocation(prog, "u_base"), p.baseR, p.baseG, p.baseB);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [init]);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full -z-10" />;
}

/* ─── Debug panel ─── */
function DebugPanel({ params, onChange }: { params: typeof DEFAULT_PARAMS; onChange: (p: typeof DEFAULT_PARAMS) => void }) {
  const set = (key: keyof typeof DEFAULT_PARAMS, v: number) => onChange({ ...params, [key]: v });
  const rows: { label: string; key: keyof typeof DEFAULT_PARAMS; min: number; max: number; step: number }[] = [
    { label: "Speed", key: "speed", min: 0.05, max: 1.5, step: 0.01 },
    { label: "Intensity", key: "intensity", min: 0.1, max: 2.0, step: 0.01 },
    { label: "Scale", key: "scale", min: 0.5, max: 6.0, step: 0.1 },
    { label: "Tint R", key: "tintR", min: 0, max: 1, step: 0.01 },
    { label: "Tint G", key: "tintG", min: 0, max: 1, step: 0.01 },
    { label: "Tint B", key: "tintB", min: 0, max: 1, step: 0.01 },
    { label: "Base R", key: "baseR", min: 0, max: 1, step: 0.01 },
    { label: "Base G", key: "baseG", min: 0, max: 1, step: 0.01 },
    { label: "Base B", key: "baseB", min: 0, max: 1, step: 0.01 },
  ];

  return (
    <div className="fixed top-4 right-4 z-50 rounded-xl p-4 text-[12px] w-[260px] select-none" style={{
      background: "rgba(0,0,0,0.75)",
      backdropFilter: "blur(12px)",
      color: "#fff",
      fontFamily: "monospace",
    }}>
      <div className="font-bold text-[13px] mb-3 flex justify-between items-center">
        <span>Shader Debug</span>
        <button onClick={() => onChange({ ...DEFAULT_PARAMS })} className="text-[10px] px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 cursor-pointer">Reset</button>
      </div>
      {rows.map(r => (
        <div key={r.key} className="flex items-center gap-2 mb-1.5">
          <span className="w-[60px] text-white/60 shrink-0">{r.label}</span>
          <input type="range" min={r.min} max={r.max} step={r.step} value={params[r.key]}
            onChange={e => set(r.key, parseFloat(e.target.value))}
            className="flex-1 h-1 accent-blue-400 cursor-pointer" />
          <span className="w-[36px] text-right text-white/40">{params[r.key].toFixed(2)}</span>
        </div>
      ))}
      <div className="mt-3 pt-2 border-t border-white/10 text-white/30 text-[10px] leading-relaxed">
        <div className="flex gap-1 items-center">
          <span className="w-[12px] h-[12px] rounded" style={{ background: `rgb(${Math.round(params.tintR*255)},${Math.round(params.tintG*255)},${Math.round(params.tintB*255)})` }} />
          Tint: rgb({Math.round(params.tintR*255)},{Math.round(params.tintG*255)},{Math.round(params.tintB*255)})
        </div>
        <div className="flex gap-1 items-center mt-1">
          <span className="w-[12px] h-[12px] rounded" style={{ background: `rgb(${Math.round(params.baseR*255)},${Math.round(params.baseG*255)},${Math.round(params.baseB*255)})` }} />
          Base: rgb({Math.round(params.baseR*255)},{Math.round(params.baseG*255)},{Math.round(params.baseB*255)})
        </div>
      </div>
    </div>
  );
}

/* ─── Provider SVG icons ─── */
type SocialProvider = "google" | "github" | "gitlab" | "discord";

const ProviderIcon = ({ provider }: { provider: SocialProvider }) => {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24" } as const;
  switch (provider) {
    case "google":
      return (
        <svg {...common} xmlns="http://www.w3.org/2000/svg">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.19 3.32v2.76h3.54c2.08-1.91 3.29-4.74 3.29-8.09Z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.54-2.76c-.98.66-2.23 1.05-3.74 1.05-2.87 0-5.3-1.94-6.17-4.55H2.18v2.85A11 11 0 0 0 12 23Z" />
          <path fill="#FBBC05" d="M5.83 14.08A6.6 6.6 0 0 1 5.48 12c0-.72.12-1.42.35-2.08V7.07H2.18a11 11 0 0 0 0 9.86l3.65-2.85Z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.65 2.85C6.7 7.32 9.13 5.38 12 5.38Z" />
        </svg>
      );
    case "github":
      return (
        <svg {...common} xmlns="http://www.w3.org/2000/svg" fill="var(--color-text)">
          <path d="M12 .5a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.84 2.8 1.31 3.49 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.24-3.22-.13-.31-.54-1.54.11-3.2 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0C17.18 4.4 18.19 4.72 18.19 4.72c.66 1.66.25 2.89.12 3.2.77.84 1.24 1.91 1.24 3.22 0 4.62-2.8 5.65-5.48 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z" />
        </svg>
      );
    case "gitlab":
      return (
        <svg {...common} xmlns="http://www.w3.org/2000/svg">
          <path fill="#E24329" d="m23.6 9.6-.03-.09L20.44.82a.82.82 0 0 0-1.55.03L16.78 7.3H7.22L5.11.85a.82.82 0 0 0-1.55-.03L.43 9.51l-.03.1a5.8 5.8 0 0 0 2.11 6.7l.01.01 5.56 4.17 2.76 2.09 1.68 1.27a.97.97 0 0 0 1.16 0l1.68-1.27 2.76-2.09 5.6-4.19.01-.01a5.8 5.8 0 0 0 2.11-6.7Z" />
          <path fill="#FC6D26" d="m23.6 9.6-.03-.09a10.54 10.54 0 0 0-4.2 1.89L12 17.44l4.51 3.41 5.6-4.19.01-.01a5.8 5.8 0 0 0 1.48-7.05Z" />
          <path fill="#FCA326" d="m7.49 20.85 2.76 2.09 1.68 1.27a.97.97 0 0 0 1.16 0l1.68-1.27 2.76-2.09L12 17.44l-4.51 3.41Z" />
          <path fill="#FC6D26" d="M4.63 11.4a10.54 10.54 0 0 0-4.2-1.89L.4 9.6a5.8 5.8 0 0 0 1.48 7.05l.01.01 5.6 4.19L12 17.44l-7.37-6.04Z" />
        </svg>
      );
    case "discord":
      return (
        <svg {...common} xmlns="http://www.w3.org/2000/svg" fill="#5865F2">
          <path d="M20.32 4.57A19.8 19.8 0 0 0 15.43 3l-.25.48a18.4 18.4 0 0 0-5.35 0L9.57 3a19.8 19.8 0 0 0-4.9 1.57C1.55 9.16.71 13.64 1.12 18.05a19.9 19.9 0 0 0 6.09 3.08c.5-.67.94-1.38 1.3-2.12-.71-.27-1.39-.6-2.04-1l.5-.4a14.1 14.1 0 0 0 12.06 0l.5.4c-.65.4-1.33.73-2.04 1 .37.74.8 1.45 1.3 2.12a19.9 19.9 0 0 0 6.09-3.08c.48-5.1-.83-9.56-4.56-13.48ZM8.52 15.36c-1.2 0-2.19-1.1-2.19-2.46 0-1.36.97-2.46 2.19-2.46 1.22 0 2.21 1.12 2.19 2.46 0 1.36-.98 2.46-2.19 2.46Zm6.96 0c-1.2 0-2.19-1.1-2.19-2.46 0-1.36.97-2.46 2.19-2.46 1.22 0 2.21 1.12 2.19 2.46 0 1.36-.97 2.46-2.19 2.46Z" />
        </svg>
      );
  }
};

const PROVIDERS: { id: SocialProvider; label: string }[] = [
  { id: "google", label: "Google" },
  { id: "github", label: "GitHub" },
  { id: "gitlab", label: "GitLab" },
  { id: "discord", label: "Discord" },
];

/* ─── Flow-field particle animation (dashboard background) ─── */
function FlowField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const noise = (x: number, y: number, t: number) =>
      Math.sin(x * 0.9 + t) * 0.5 +
      Math.sin(y * 1.1 + t * 0.7) * 0.5 +
      Math.sin((x + y) * 0.5 - t * 0.5) * 0.5;

    type Particle = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; hue: number };
    const particles: Particle[] = [];
    const MAX = 240;

    const spawn = (p?: Particle) => {
      const np = p ?? ({} as Particle);
      np.x = Math.random() * width;
      np.y = Math.random() * height;
      np.vx = 0;
      np.vy = 0;
      np.life = 0;
      np.maxLife = 120 + Math.random() * 180;
      np.hue = 210 + Math.random() * 30; // blue tones
      return np;
    };

    for (let i = 0; i < MAX; i++) particles.push(spawn());
    let raf = 0;
    let t = 0;

    const tick = () => {
      t += 0.004;
      ctx.fillStyle = "rgba(245, 245, 247, 0.1)";
      ctx.fillRect(0, 0, width, height);

      for (const p of particles) {
        const nx = p.x / width - 0.5;
        const ny = p.y / height - 0.5;
        const angle = noise(nx * 3, ny * 3, t) * Math.PI * 2;
        p.vx += Math.cos(angle) * 0.05;
        p.vy += Math.sin(angle) * 0.05;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        const alpha = Math.min(1, p.life / 30) * Math.max(0, 1 - p.life / p.maxLife);
        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue}, 60%, 55%, ${alpha * 0.5})`;
        ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
        if (p.life > p.maxLife || p.x < -10 || p.x > width + 10 || p.y < -10 || p.y > height + 10) spawn(p);
      }
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

/* ─── Dashboard ─── */
function Dashboard() {
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [provider, setProvider] = useState("");

  useEffect(() => {
    client.auth.getSession().then((s) => {
      const u = s?.data?.user as (typeof s)["data"] extends { user: infer U } ? U : { email?: string; name?: string } | undefined;
      if (u) {
        if ((u as { email?: string }).email) setUserEmail((u as { email?: string }).email!);
        if ((u as { name?: string }).name) setUserName((u as { name?: string }).name!);
      }
    });
    (async () => {
      try {
        const anyAuth = client.auth as unknown as {
          listAccounts?: () => Promise<{ data?: Array<{ providerId?: string; provider?: string }> }>;
        };
        const res = await anyAuth.listAccounts?.();
        const first = res?.data?.[0];
        const p = first?.providerId || first?.provider;
        if (p) setProvider(p);
      } catch { /* noop */ }
    })();
  }, []);

  const handleSignOut = async () => {
    await client.auth.signOut();
    window.location.href = "/";
  };

  return (
    <main className="min-h-screen relative overflow-hidden" style={{ background: "var(--color-bg)" }}>
      <div className="fixed inset-0"><FlowField /></div>
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        <div className="anim-scale d0 w-full max-w-[420px] rounded-2xl bg-white/80 backdrop-blur-xl" style={{
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 40px rgba(0,0,0,0.04)",
        }}>
          <div className="p-10 text-center">
            <div className="anim-up d1 w-14 h-14 mx-auto mb-5 rounded-full flex items-center justify-center" style={{
              background: "var(--color-accent)",
            }}>
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="anim-up d2 text-[28px] font-bold tracking-[-0.03em]" style={{ color: "var(--color-text)" }}>
              Welcome{userName ? `, ${userName}` : ""}
            </h1>
            <p className="anim-up d3 text-[15px] mt-1" style={{ color: "var(--color-text-secondary)" }}>{userEmail || "\u2026"}</p>
            {provider && (
              <p className="anim-up d4 text-[12px] mt-2 tracking-wide uppercase" style={{ color: "var(--color-text-tertiary)" }}>
                via {provider}
              </p>
            )}
            <p className="anim-up d5 text-[14px] mt-7 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              The animation behind this card is a flow field of particles driven by
              curl noise, rendered to{" "}
              <code className="px-1.5 py-0.5 rounded-md text-[13px] bg-black/[0.04]" style={{ color: "var(--color-accent)" }}>&lt;canvas&gt;</code>.
            </p>
            <button
              onClick={handleSignOut}
              className="anim-up d6 mt-8 px-5 py-2 rounded-full text-[14px] font-medium transition-all duration-200 cursor-pointer hover:bg-red-50"
              style={{ color: "var(--color-destructive)", border: "1px solid rgba(255,59,48,0.2)" }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ─── Login page ─── */
function LoginPage() {
  const [shaderParams, setShaderParams] = useState(DEFAULT_PARAMS);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<SocialProvider | null>(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signup");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
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

  const handleSocial = async (provider: SocialProvider) => {
    setError("");
    setOauthLoading(provider);
    try {
      const r = await client.auth.signIn.social({ provider, callbackURL: "/" });
      if (r && typeof r === "object" && "error" in r && r.error) {
        setError((r.error as { message?: string })?.message ?? `${provider} is not configured yet`);
        setOauthLoading(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : `${provider} is not configured yet`);
      setOauthLoading(null);
    }
  };

  const inputStyle = {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text)",
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <WaterCaustic params={shaderParams} />
      {DEBUG && <DebugPanel params={shaderParams} onChange={setShaderParams} />}
      <div className="w-full max-w-[380px]">
        {/* Header */}
        <div className="text-center mb-8 anim-up d0">
          <h1 className="text-[32px] font-bold tracking-[-0.04em]" style={{ color: "var(--color-text)" }}>
            {mode === "signin" ? "Welcome back." : "Get started."}
          </h1>
          <p className="text-[16px] mt-2" style={{ color: "var(--color-text-secondary)" }}>
            {mode === "signin" ? "Sign in to your account." : "Create your free account."}
          </p>
        </div>

        {/* Card */}
        <div className="anim-scale d1 rounded-2xl" style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)",
        }}>
          <div className="p-7">
            {/* Error */}
            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl text-[13px] flex items-center gap-2" style={{
                background: "rgba(255, 59, 48, 0.06)",
                color: "var(--color-destructive)",
              }}>
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {error}
              </div>
            )}

            {/* OAuth buttons */}
            <div className="anim-up d2 space-y-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSocial(p.id)}
                  disabled={oauthLoading !== null && oauthLoading !== p.id}
                  className="w-full flex items-center justify-center gap-2.5 h-[44px] rounded-xl text-[14px] font-medium transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    color: "var(--color-text)",
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                  }}
                  onMouseEnter={(e) => {
                    if (oauthLoading !== null && oauthLoading !== p.id) return;
                    e.currentTarget.style.background = "#ebebed";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--color-bg)";
                  }}
                  aria-label={`Continue with ${p.label}`}
                >
                  <ProviderIcon provider={p.id} />
                  <span>Continue with {p.label}</span>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="anim-up d3 flex items-center gap-4 my-6">
              <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
              <span className="text-[12px] font-medium" style={{ color: "var(--color-text-tertiary)" }}>or</span>
              <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="anim-up d4">
                <label className="block text-[13px] font-medium mb-1.5" style={{ color: "var(--color-text)" }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full h-[44px] px-3.5 rounded-xl text-[15px] outline-none transition-shadow duration-200 placeholder:text-black/20"
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0, 113, 227, 0.15)"; e.currentTarget.style.borderColor = "var(--color-accent)"; }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "var(--color-border)"; }}
                />
              </div>

              <div className="anim-up d5">
                <div className="flex justify-between items-baseline mb-1.5">
                  <label className="text-[13px] font-medium" style={{ color: "var(--color-text)" }}>Password</label>
                  <span className="text-[12px]" style={{ color: "var(--color-text-tertiary)" }}>Min 8 characters</span>
                </div>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full h-[44px] px-3.5 pr-10 rounded-xl text-[15px] outline-none transition-shadow duration-200 placeholder:text-black/20"
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0, 113, 227, 0.15)"; e.currentTarget.style.borderColor = "var(--color-accent)"; }}
                    onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "var(--color-border)"; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer transition-colors"
                    style={{ color: "var(--color-text-tertiary)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-text-secondary)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-tertiary)"; }}
                  >
                    {showPw ? (
                      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="anim-up d6 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[44px] rounded-xl text-white font-semibold text-[15px] transition-all duration-200 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "var(--color-accent)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-accent-hover)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-accent)"; }}
                >
                  {loading ? "Please wait\u2026" : mode === "signin" ? "Sign in" : "Create account"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Toggle */}
        <p className="anim-up d7 text-center text-[14px] mt-6" style={{ color: "var(--color-text-secondary)" }}>
          {mode === "signin" ? (
            <>No account?{" "}<button onClick={() => { setMode("signup"); setError(""); }} className="font-semibold cursor-pointer transition-colors" style={{ color: "var(--color-accent)" }} onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-accent-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-accent)"; }}>Create one</button></>
          ) : (
            <>Have an account?{" "}<button onClick={() => { setMode("signin"); setError(""); }} className="font-semibold cursor-pointer transition-colors" style={{ color: "var(--color-accent)" }} onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-accent-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-accent)"; }}>Sign in</button></>
          )}
        </p>
      </div>
    </main>
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
      <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <div className="text-[14px] animate-pulse" style={{ color: "var(--color-text-tertiary)" }}>Loading</div>
      </main>
    );
  }

  return loggedIn ? <Dashboard /> : <LoginPage />;
}

export default App;
