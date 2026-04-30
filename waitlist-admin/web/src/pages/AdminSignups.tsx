import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { client } from "@/lib/edgespark";

interface SignupRow {
  id: number;
  email: string;
  source: string | null;
  created_at: string;
}

interface ListResponse {
  rows: SignupRow[];
  total: number;
  page: number;
  pages: number;
}

export function AdminSignups() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [data, setData] = useState<ListResponse | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortDesc, setSortDesc] = useState(true);
  const navigate = useNavigate();

  // Check admin
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/admin/login");
      return;
    }
    client.api
      .fetch("/api/me")
      .then((r) => r.json())
      .then((d: { isAdmin: boolean }) => setIsAdmin(d.isAdmin));
  }, [user, authLoading, navigate]);

  const fetchData = useCallback(() => {
    if (!isAdmin) return;
    const params = new URLSearchParams({
      page: page.toString(),
      ...(search && { search }),
    });
    client.api
      .fetch(`/api/admin/signups?${params}`)
      .then((r) => r.json())
      .then((d: ListResponse) => setData(d));
  }, [isAdmin, page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleExport() {
    window.open("/api/admin/signups/export", "_blank");
  }

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
          <button
            onClick={signOut}
            className="border border-border text-foreground font-body text-sm px-4 py-2 rounded-[var(--radius)] hover:bg-card transition-colors mt-4"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const rows = data?.rows ?? [];
  const sorted = sortDesc ? rows : [...rows].reverse();

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
            to="/admin"
            className="text-muted text-xs font-body hover:text-foreground transition-colors"
          >
            Dashboard
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-bold text-2xl text-foreground">
            Signups{" "}
            {data && (
              <span className="text-muted text-base font-normal">
                ({data.total})
              </span>
            )}
          </h1>
          <button
            onClick={handleExport}
            className="border border-border text-foreground font-body text-xs px-3 py-2 rounded-[var(--radius)] hover:bg-card transition-colors"
          >
            Export CSV
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by email..."
            className="w-full max-w-xs bg-card border border-border rounded-[var(--radius)] px-3 py-2 text-foreground font-body text-sm placeholder:text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-[var(--radius-lg)] overflow-hidden">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="bg-surface text-muted text-xs">
                <th className="text-left px-4 py-3 font-medium">ID</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Source</th>
                <th
                  className="text-left px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => setSortDesc(!sortDesc)}
                >
                  Joined {sortDesc ? "↓" : "↑"}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-t border-border ${
                    i % 2 === 0 ? "" : "bg-surface/50"
                  } hover:bg-card-hover transition-colors`}
                >
                  <td className="px-4 py-3 text-muted">{row.id}</td>
                  <td className="px-4 py-3 text-foreground">{row.email}</td>
                  <td className="px-4 py-3">
                    <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                      {row.source || "unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(row.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted"
                  >
                    No signups found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="border border-border text-foreground font-body text-xs px-3 py-1.5 rounded-[var(--radius)] hover:bg-card transition-colors disabled:opacity-30"
            >
              Prev
            </button>
            <span className="text-muted text-xs font-body">
              {page} / {data.pages}
            </span>
            <button
              onClick={() => setPage(Math.min(data.pages, page + 1))}
              disabled={page >= data.pages}
              className="border border-border text-foreground font-body text-xs px-3 py-1.5 rounded-[var(--radius)] hover:bg-card transition-colors disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
