import { useState, useEffect, useRef } from "react";
import { client } from "@/lib/edgespark";

function Dashboard() {
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    client.auth.getSession().then((session) => {
      if (session?.data?.user?.email) {
        setUserEmail(session.data.user.email);
      }
    });
  }, []);

  const handleSignOut = async () => {
    await client.auth.signOut();
    window.location.href = "/";
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #0c0c1d 0%, #1a1a2e 50%, #16213e 100%)" }}
    >
      <div className="w-full max-w-2xl">
        <div className="rounded-xl overflow-hidden shadow-2xl shadow-black/60" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2 px-4 py-3" style={{ background: "rgba(30, 30, 50, 0.95)" }}>
            <div className="flex gap-[7px]">
              <div className="w-[13px] h-[13px] rounded-full bg-[#ff5f57]" />
              <div className="w-[13px] h-[13px] rounded-full bg-[#febc2e]" />
              <div className="w-[13px] h-[13px] rounded-full bg-[#28c840]" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-neutral-500 text-xs font-mono tracking-wide">edgespark — dashboard — 80×24</span>
            </div>
            <div className="w-[55px]" />
          </div>

          <div className="p-5 font-mono text-sm leading-7 min-h-[350px]" style={{ background: "rgba(13, 13, 27, 0.97)" }}>
            <div className="text-cyan-400">EdgeSpark CLI v2.4.0</div>
            <div className="text-emerald-400">✓ Authenticated as {userEmail || "..."}</div>
            <div className="text-neutral-400">&nbsp;</div>
            <div className="text-neutral-400">Session active. Available commands:</div>
            <div className="text-neutral-400">&nbsp;</div>
            <div className="text-amber-300">  edgespark deploy      <span className="text-neutral-600">— deploy your project</span></div>
            <div className="text-amber-300">  edgespark db migrate   <span className="text-neutral-600">— run database migrations</span></div>
            <div className="text-amber-300">  edgespark logs         <span className="text-neutral-600">— stream live logs</span></div>
            <div className="text-amber-300">  edgespark auth get     <span className="text-neutral-600">— view auth config</span></div>
            <div className="text-amber-300">  edgespark secret set   <span className="text-neutral-600">— manage secrets</span></div>
            <div className="text-neutral-400">&nbsp;</div>
            <div className="text-neutral-500">Run `edgespark --help` for all commands.</div>
            <div className="text-neutral-400">&nbsp;</div>
            <div className="text-emerald-400 flex items-center">
              <span className="mr-2">$</span>
              <span className="inline-block w-[8px] h-[17px] bg-[#28c840] animate-pulse" />
            </div>
          </div>

          <div className="px-5 py-4 flex justify-end" style={{ background: "rgba(18, 18, 35, 0.95)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-lg font-mono text-sm text-neutral-400 transition-all hover:text-red-400 cursor-pointer"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              $ edgespark logout
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "password" | "loading">("email");
  const [lines, setLines] = useState<{ text: string; type: "system" | "input" | "success" | "error" | "info" }[]>([]);
  const [cursorVisible, setCursorVisible] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setLines([
      { text: "EdgeSpark CLI v2.4.0", type: "info" },
      { text: "Copyright (c) 2026 EdgeSpark Inc.", type: "system" },
      { text: "", type: "system" },
      { text: "Connecting to edgespark.app...", type: "system" },
      { text: "Connection established. TLS 1.3 ✓", type: "success" },
      { text: "", type: "system" },
      { text: "Authentication required.", type: "system" },
      { text: "Enter your credentials to continue.", type: "system" },
      { text: "", type: "system" },
    ]);
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const focusInput = () => inputRef.current?.focus();

  const handleEmailSubmit = () => {
    if (!email.trim()) return;
    setLines((prev) => [
      ...prev,
      { text: `email: ${email}`, type: "input" },
      { text: "", type: "system" },
    ]);
    setStep("password");
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) return;
    setLines((prev) => [
      ...prev,
      { text: `password: ${"•".repeat(password.length)}`, type: "input" },
      { text: "", type: "system" },
      { text: "Authenticating...", type: "system" },
    ]);
    setStep("loading");

    try {
      // Try sign-in first
      const signInResult = await client.auth.signIn.email({ email, password });
      if (!signInResult.error) {
        setLines((prev) => [
          ...prev,
          { text: "✓ Authentication successful", type: "success" },
          { text: `  Welcome back, ${email}`, type: "success" },
          { text: "", type: "system" },
          { text: "Redirecting to dashboard...", type: "info" },
        ]);
        setTimeout(() => { window.location.href = "/"; }, 1000);
        return;
      }

      // Sign-in failed → auto sign-up
      setLines((prev) => [
        ...prev,
        { text: "Account not found. Creating new account...", type: "info" },
      ]);

      const signUpResult = await client.auth.signUp.email({ name: email.split("@")[0], email, password });
      if (signUpResult.error) {
        setLines((prev) => [
          ...prev,
          { text: `✗ ${signUpResult.error.message ?? "Sign-up failed"}`, type: "error" },
          { text: "  Password must be at least 8 characters.", type: "system" },
          { text: "", type: "system" },
        ]);
        setStep("email");
        setEmail("");
        setPassword("");
      } else {
        setLines((prev) => [
          ...prev,
          { text: "✓ Account created & signed in", type: "success" },
          { text: `  Welcome, ${email}`, type: "success" },
          { text: "", type: "system" },
          { text: "Redirecting to dashboard...", type: "info" },
        ]);
        setTimeout(() => { window.location.href = "/"; }, 1000);
      }
    } catch {
      setLines((prev) => [
        ...prev,
        { text: "✗ Connection error. Please try again.", type: "error" },
        { text: "", type: "system" },
      ]);
      setStep("email");
      setEmail("");
      setPassword("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (step === "email") handleEmailSubmit();
      else if (step === "password") handlePasswordSubmit();
    }
  };

  const getLineColor = (type: string) => {
    switch (type) {
      case "success": return "text-emerald-400";
      case "error": return "text-red-400";
      case "input": return "text-amber-300";
      case "info": return "text-cyan-400";
      default: return "text-neutral-400";
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #0c0c1d 0%, #1a1a2e 50%, #16213e 100%)" }}
      onClick={focusInput}
    >
      <div
        className="fixed inset-0 pointer-events-none z-10 opacity-[0.03]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,255,0,0.03) 1px, rgba(0,255,0,0.03) 2px)",
        }}
      />

      <div className="w-full max-w-2xl">
        <div className="rounded-xl overflow-hidden shadow-2xl shadow-black/60" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-3" style={{ background: "rgba(30, 30, 50, 0.95)" }}>
            <div className="flex gap-[7px]">
              <div className="w-[13px] h-[13px] rounded-full bg-[#ff5f57]" />
              <div className="w-[13px] h-[13px] rounded-full bg-[#febc2e]" />
              <div className="w-[13px] h-[13px] rounded-full bg-[#28c840]" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-neutral-500 text-xs font-mono tracking-wide">edgespark — login — 80×24</span>
            </div>
            <div className="w-[55px]" />
          </div>

          {/* Terminal body */}
          <div
            ref={terminalRef}
            className="p-5 font-mono text-sm leading-6 min-h-[420px] max-h-[520px] overflow-y-auto"
            style={{ background: "rgba(13, 13, 27, 0.97)" }}
          >
            {lines.map((line, i) => (
              <div key={i} className={getLineColor(line.type)}>
                {line.text || "\u00A0"}
              </div>
            ))}

            {step !== "loading" && (
              <div className="flex items-center">
                <span className="text-emerald-400 mr-1">
                  {step === "email" ? "email:" : "password:"}
                </span>
                <span className="text-amber-300 relative">
                  {step === "password" ? "•".repeat(password.length) : email}
                  <span
                    className={`inline-block w-[8px] h-[17px] ml-[1px] align-middle transition-opacity ${cursorVisible ? "opacity-100" : "opacity-0"}`}
                    style={{ background: "#28c840" }}
                  />
                </span>
                <input
                  ref={inputRef}
                  type={step === "password" ? "password" : "text"}
                  value={step === "password" ? password : email}
                  onChange={(e) => step === "password" ? setPassword(e.target.value) : setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="absolute opacity-0 w-0 h-0"
                  autoFocus
                />
              </div>
            )}

            {step === "loading" && (
              <div className="flex items-center text-cyan-400">
                <span className="animate-pulse">▌</span>
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div className="px-5 py-3" style={{ background: "rgba(18, 18, 35, 0.95)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-neutral-600 text-xs font-mono text-center">
              New account? Just enter email + password (min 8 chars) and press Enter — auto sign-up if no account exists
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-neutral-700 text-xs font-mono">
            Secured by EdgeSpark · Deployed on the Edge
          </p>
        </div>
      </div>
    </main>
  );
}

function App() {
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    client.auth.getSession().then((session) => {
      setLoggedIn(!!session?.data?.session);
      setChecking(false);
    }).catch(() => {
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "#0c0c1d" }}>
        <div className="font-mono text-neutral-500 text-sm animate-pulse">Connecting...</div>
      </main>
    );
  }

  return loggedIn ? <Dashboard /> : <LoginPage />;
}

export default App;
