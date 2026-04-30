import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { client } from "@/lib/edgespark";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await client.auth.signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message || "Invalid credentials");
        setLoading(false);
        return;
      }
      navigate("/admin");
    } catch {
      setError("Login failed — check your credentials");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-display font-bold text-lg">
              ◆
            </span>
          </div>
          <h1 className="font-display font-semibold text-xl text-foreground">
            Admin Access
          </h1>
          <p className="text-muted text-sm mt-1 font-body">
            Project Control Room
          </p>
        </div>

        {/* Login form — NO register link */}
        <form
          onSubmit={handleLogin}
          className="bg-card border border-border rounded-[var(--radius-lg)] p-6 space-y-4"
        >
          <div>
            <label className="block text-muted text-xs font-body mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-background border border-border rounded-[var(--radius)] px-3 py-2.5 text-foreground font-body text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>
          <div>
            <label className="block text-muted text-xs font-body mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-background border border-border rounded-[var(--radius)] px-3 py-2.5 text-foreground font-body text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>

          {error && (
            <p className="text-destructive text-xs font-body">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-display font-semibold py-2.5 rounded-[var(--radius)] hover:brightness-110 transition-all disabled:opacity-50 text-sm"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-muted/40 text-xs mt-6 font-body">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
}
