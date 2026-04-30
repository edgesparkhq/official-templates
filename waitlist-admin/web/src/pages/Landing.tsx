import { useState, useEffect } from "react";
import { client } from "@/lib/edgespark";
import { BrandMark } from "../components/BrandMark";

export function Landing() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "already" | "error"
  >("idle");
  const [position, setPosition] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    client.api
      .fetch("/api/public/signups/count")
      .then((r) => r.json())
      .then((d: { count: number }) => setTotalCount(d.count))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await client.api.fetch("/api/public/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "landing" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Something went wrong");
        return;
      }
      setPosition(data.position);
      setTotalCount(data.position);
      setStatus(data.alreadySignedUp ? "already" : "success");
    } catch {
      setStatus("error");
      setErrorMsg("Network error — please try again");
    }
  }

  return (
    <div className="film-grain scanlines vignette min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px]" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-sm">◆</span>
          </div>
          <span className="font-display font-semibold text-foreground text-lg tracking-tight">
            Your Project
          </span>
        </div>
        {totalCount !== null && totalCount > 0 && (
          <div className="hidden sm:flex items-center gap-2 text-muted text-sm font-body">
            <span className="inline-block w-2 h-2 rounded-full bg-success animate-pulse" />
            {totalCount.toLocaleString()} on the waitlist
          </div>
        )}
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-12 md:pt-24 pb-16">
        {/* Brand silhouette */}
        <div className="hero-reveal mb-8 md:mb-12 relative">
          <BrandMark className="w-48 h-48 md:w-64 md:h-64" />
          {/* Scanline overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(245,166,35,0.06) 3px, rgba(245,166,35,0.06) 6px)",
            }}
          />
        </div>

        {/* Headline — replace with your own product copy */}
        <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-7xl text-center leading-[1.1] mb-6 max-w-4xl">
          <span className="text-foreground">Something exciting is </span>
          <span className="text-gradient">on the way</span>
        </h1>

        <p className="font-body text-muted text-base md:text-lg text-center max-w-2xl mb-10 leading-relaxed">
          Replace this paragraph with the pitch for your product.
          Tell visitors what you are building and why they should care.
          <br />
          <span className="text-foreground/70">
            Sign up below for early access. First come, first served.
          </span>
        </p>

        {/* Signup form */}
        {status === "success" || status === "already" ? (
          <div className="bg-card border border-border rounded-[var(--radius-lg)] p-8 text-center max-w-md w-full border-glow">
            <div className="text-3xl mb-3">
              {status === "already" ? "👋" : "🎬"}
            </div>
            <h2 className="font-display font-semibold text-xl text-foreground mb-2">
              {status === "already"
                ? "You're already on the list!"
                : "You're in!"}
            </h2>
            <p className="text-muted text-sm mb-4">
              {status === "already"
                ? "We already have your email. Sit tight — we'll reach out soon."
                : "Welcome to the waitlist."}
            </p>
            {position && (
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2">
                <span className="text-primary font-display font-bold text-lg">
                  #{position}
                </span>
                <span className="text-muted text-sm">in line</span>
              </div>
            )}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 bg-card border border-border rounded-[var(--radius)] px-4 py-3 text-foreground font-body text-sm placeholder:text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="glow-cta bg-primary text-primary-foreground font-display font-semibold px-6 py-3 rounded-[var(--radius)] hover:brightness-110 transition-all disabled:opacity-50 disabled:animate-none whitespace-nowrap"
            >
              {status === "loading" ? "Joining..." : "Get Early Access"}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="text-destructive text-sm mt-3 font-body">{errorMsg}</p>
        )}

        {/* Feature pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-20 max-w-3xl w-full">
          {[
            {
              icon: "▶",
              title: "Feature One",
              desc: "Describe a key feature of your product in one short sentence.",
            },
            {
              icon: "◈",
              title: "Feature Two",
              desc: "Highlight what makes your offering different from alternatives.",
            },
            {
              icon: "⚡",
              title: "Feature Three",
              desc: "Land on the outcome users get — speed, control, savings, etc.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-card/50 border border-border rounded-[var(--radius-lg)] p-6 hover:bg-card-hover transition-colors"
            >
              <div className="text-primary text-2xl mb-3 font-mono">
                {f.icon}
              </div>
              <h3 className="font-display font-semibold text-foreground text-sm mb-2">
                {f.title}
              </h3>
              <p className="text-muted text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-6 px-6 md:px-12 flex items-center justify-between text-muted text-xs font-body">
        <span>&copy; 2026 Your Project. All rights reserved.</span>
        <span className="text-muted/50">Built on the edge.</span>
      </footer>
    </div>
  );
}
