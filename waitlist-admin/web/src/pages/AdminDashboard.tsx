import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { client } from "@/lib/edgespark";

interface Stats {
  total: number;
  todayCount: number;
  trend: { day: string; dayCount: number }[];
  sources: { source: string | null; sourceCount: number }[];
}

export function AdminDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Check admin status
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/admin/login");
      return;
    }
    client.api
      .fetch("/api/me")
      .then((r) => r.json())
      .then((d: { isAdmin: boolean }) => {
        setIsAdmin(d.isAdmin);
        if (!d.isAdmin) return;
        // Fetch stats
        return client.api
          .fetch("/api/admin/stats")
          .then((r) => r.json())
          .then((s: Stats) => setStats(s));
      })
      .catch(() => setError("Failed to load"));
  }, [user, authLoading, navigate]);

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted font-body text-sm animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-display font-bold text-2xl text-destructive mb-2">
            ACCESS DENIED
          </h1>
          <p className="text-muted text-sm font-body mb-4">
            You don't have admin privileges.
          </p>
          <button
            onClick={signOut}
            className="border border-border text-foreground font-body text-sm px-4 py-2 rounded-[var(--radius)] hover:bg-card transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Chart: find max for scaling
  const maxCount = stats
    ? Math.max(...stats.trend.map((t) => t.dayCount), 1)
    : 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-xs">
              ◆
            </span>
          </div>
          <span className="font-display font-semibold text-foreground text-sm">
            Project Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-muted text-xs font-body hover:text-foreground transition-colors"
          >
            View Site
          </Link>
          <button
            onClick={signOut}
            className="text-muted text-xs font-body hover:text-foreground transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="font-display font-bold text-2xl text-foreground mb-6">
          Dashboard
        </h1>

        {error && (
          <p className="text-destructive text-sm font-body mb-4">{error}</p>
        )}

        {stats && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard label="Total Signups" value={stats.total} />
              <StatCard label="Today" value={stats.todayCount} />
              <StatCard
                label="Sources"
                value={stats.sources.length}
                subtitle={stats.sources
                  .map(
                    (s) => `${s.source || "unknown"}: ${s.sourceCount}`
                  )
                  .join(", ")}
              />
            </div>

            {/* 7-day trend chart (inline SVG) */}
            <div className="bg-card border border-border rounded-[var(--radius-lg)] p-6 mb-8">
              <h2 className="font-display font-semibold text-sm text-foreground mb-4">
                Last 7 Days
              </h2>
              {stats.trend.length === 0 ? (
                <p className="text-muted text-xs font-body">
                  No signups in the last 7 days
                </p>
              ) : (
                <div className="flex items-end gap-2 h-32">
                  {stats.trend.map((t) => {
                    const pct = (t.dayCount / maxCount) * 100;
                    return (
                      <div
                        key={t.day}
                        className="flex-1 flex flex-col items-center gap-1"
                      >
                        <span className="text-primary font-display font-bold text-xs">
                          {t.dayCount}
                        </span>
                        <div
                          className="w-full bg-primary/20 rounded-t-sm relative overflow-hidden"
                          style={{
                            height: `${Math.max(pct, 4)}%`,
                          }}
                        >
                          <div className="absolute inset-0 bg-primary/60 rounded-t-sm" />
                        </div>
                        <span className="text-muted text-[10px] font-body">
                          {t.day.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Link to signups table */}
            <Link
              to="/admin/signups"
              className="inline-flex items-center gap-2 bg-card border border-border rounded-[var(--radius)] px-4 py-3 text-foreground font-body text-sm hover:bg-card-hover transition-colors"
            >
              View All Signups →
            </Link>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: number;
  subtitle?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-[var(--radius-lg)] p-5">
      <p className="text-muted text-xs font-body mb-1">{label}</p>
      <p className="text-primary font-display font-bold text-3xl">
        {value.toLocaleString()}
      </p>
      {subtitle && (
        <p className="text-muted text-xs font-body mt-1 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
}
