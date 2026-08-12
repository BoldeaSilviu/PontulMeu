"use client";
import { useState, useEffect, useCallback } from "react";
import Header from "../components/Header";
import { useAuth } from "../components/AuthProvider";

function StatCard({ label, value, color = "var(--text)" }) {
  return (
    <div className="cv-card2" style={{ textAlign: "center", flex: 1, minWidth: 120 }}>
      <div className="mono" style={{ fontSize: 22, fontWeight: 700, color }}>{value ?? "-"}</div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function planBadge(u) {
  if (u.role === "admin") return <span className="cv-badge cv-badge-red">ADMIN</span>;
  if (u.blocked) return <span className="cv-badge cv-badge-muted">BLOCAT</span>;
  if (u.plan === "premium" && u.subscription_status === "active") return <span className="cv-badge cv-badge-gold">PRO</span>;
  if (u.trial_end_date && new Date(u.trial_end_date) > new Date()) return <span className="cv-badge cv-badge-green">TRIAL</span>;
  return <span className="cv-badge cv-badge-muted">FREE</span>;
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);

  const load = useCallback(async (q = "") => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Eroare la încărcare");
      } else {
        setUsers(data.users || []);
        setStats(data.stats || null);
      }
    } catch {
      setError("Eroare de rețea");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => load(search), 350);
    return () => clearTimeout(t);
  }, [search, load]);

  async function action(userId, act) {
    setBusy(userId + act);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: act }),
      });
      if (res.ok) await load(search);
      else {
        const d = await res.json();
        alert(d.error || "Eroare");
      }
    } catch {
      alert("Eroare de rețea");
    }
    setBusy(null);
  }

  if (!authLoading && (!user || user.role !== "admin")) {
    return (
      <>
        <Header />
        <main className="cv-container" style={{ paddingTop: 60, textAlign: "center" }}>
          <div className="cv-error" style={{ display: "inline-block" }}>
            Acces interzis. Pagina este disponibilă doar administratorilor.
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="cv-container-wide" style={{ paddingTop: 28 }}>
        <div className="fade" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>
            Administrare <span style={{ color: "var(--green)" }}>utilizatori</span>
          </h1>
          <span style={{ fontSize: 12, color: "var(--muted)" }} className="mono">
            {users.length} afișați
          </span>
        </div>

        <div className="fade" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          <StatCard label="Total utilizatori" value={stats?.total_users} />
          <StatCard label="Premium activ" value={stats?.premium_users} color="var(--gold)" />
          <StatCard label="Noi (7 zile)" value={stats?.new_7d} color="var(--green)" />
          <StatCard label="Analize total" value={stats?.total_analyses} />
          <StatCard label="Analize azi" value={stats?.analyses_today} color="var(--green)" />
        </div>

        <input
          className="cv-input fade"
          placeholder="Caută după email, nume sau telefon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: 16, maxWidth: 420 }}
        />

        {error && <div className="cv-error" style={{ marginBottom: 14 }}>{error}</div>}

        <div className="cv-card fade" style={{ padding: 0, overflowX: "auto" }}>
          {loading ? (
            <div style={{ padding: 20 }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="cv-skeleton" style={{ height: 42, marginBottom: 10 }} />
              ))}
            </div>
          ) : (
            <table className="cv-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>Utilizator</th>
                  <th>Telefon</th>
                  <th>Născut</th>
                  <th>Statut</th>
                  <th>Analize</th>
                  <th>Înscris</th>
                  <th style={{ textAlign: "right" }}>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isPro = u.plan === "premium" && u.subscription_status === "active";
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {u.first_name || u.last_name ? `${u.first_name || ""} ${u.last_name || ""}`.trim() : (u.name || "-")}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>{u.email}</div>
                      </td>
                      <td className="mono" style={{ fontSize: 12 }}>{u.phone || "-"}</td>
                      <td className="mono" style={{ fontSize: 12 }}>
                        {u.birth_date ? new Date(u.birth_date).toLocaleDateString("ro-RO") : "-"}
                      </td>
                      <td>{planBadge(u)}</td>
                      <td className="mono" style={{ fontSize: 12 }}>{u.analyses_count}</td>
                      <td className="mono" style={{ fontSize: 12 }}>
                        {new Date(u.created_at).toLocaleDateString("ro-RO")}
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        {u.role !== "admin" && (
                          <>
                            <button
                              className="cv-btn-ghost cv-btn-sm"
                              disabled={busy === u.id + (isPro ? "premium_off" : "premium_on")}
                              onClick={() => action(u.id, isPro ? "premium_off" : "premium_on")}
                              style={{ marginRight: 6, color: isPro ? "var(--muted)" : "var(--gold)" }}
                            >
                              {isPro ? "Scoate PRO" : "Dă PRO"}
                            </button>
                            <button
                              className="cv-btn-ghost cv-btn-sm"
                              disabled={busy === u.id + (u.blocked ? "unblock" : "block")}
                              onClick={() => action(u.id, u.blocked ? "unblock" : "block")}
                              style={{ color: u.blocked ? "var(--green)" : "var(--red)" }}
                            >
                              {u.blocked ? "Deblochează" : "Blochează"}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--muted)", padding: 30 }}>
                    Niciun utilizator găsit.
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </>
  );
}
