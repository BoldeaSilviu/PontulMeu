"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import Header from "../components/Header";

export default function DashboardPage() {
  const router = useRouter();
  const { user, quota, loading, logout } = useAuth();
  const [portalLoading, setPortalLoading] = useState(false);

  if (loading) {
    return (
      <>
        <Header />
        <main className="cv-container" style={{ maxWidth: 640, paddingTop: 28 }}>
          <div className="cv-skeleton" style={{ height: 130, borderRadius: 14, marginBottom: 14 }} />
          <div className="cv-skeleton" style={{ height: 100, borderRadius: 14 }} />
        </main>
      </>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || "Eroare");
    } catch (err) {
      alert(err.message);
    }
    setPortalLoading(false);
  }

  const isPremium = user.isPremium;
  const isAdmin = user.role === "admin";
  const onTrial = user.trialEndDate && new Date(user.trialEndDate) > new Date() && user.plan === "free";
  const trialDaysLeft = onTrial
    ? Math.ceil((new Date(user.trialEndDate) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;
  const displayName = user.first_name || user.last_name
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
    : (user.name || "Utilizator");

  return (
    <>
      <Header />
      <main className="cv-container" style={{ maxWidth: 640, paddingTop: 28 }}>
        {/* User card */}
        <div className="cv-card-accent fade" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <div style={{
              width: 54, height: 54, borderRadius: "50%", background: "var(--green)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 800, color: "#0B120E", flexShrink: 0
            }}>
              {displayName[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 800 }}>{displayName}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
              {user.phone && <div className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>{user.phone}</div>}
            </div>
            <span className={`cv-badge ${isAdmin ? "cv-badge-red" : isPremium ? "cv-badge-gold" : "cv-badge-muted"}`}>
              {isAdmin ? "ADMIN" : isPremium ? "PRO" : "FREE"}
            </span>
          </div>

          {onTrial && (
            <div className="cv-success" style={{ fontSize: 12.5 }}>
              🎁 Mai ai {trialDaysLeft} {trialDaysLeft === 1 ? "zi" : "zile"} de probă Premium
            </div>
          )}
        </div>

        {/* Quota */}
        <div className="cv-card fade" style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 14.5, marginBottom: 14 }}>📊 Analize astăzi</div>
          {quota?.limit === null || quota?.limit === undefined ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13.5, color: "var(--muted2)" }}>
                Analize făcute: <strong className="mono" style={{ color: "var(--text)" }}>{quota?.used ?? 0}</strong>
              </span>
              <span className="cv-badge cv-badge-green">NELIMITAT</span>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>
                  Folosite: <span className="mono" style={{ color: "var(--text)" }}>{quota?.used || 0} / {quota?.limit || 1}</span>
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: quota?.remaining === 0 ? "var(--red)" : "var(--green)" }}>
                  {quota?.remaining === 0 ? "Epuizat" : `${quota?.remaining} rămase`}
                </span>
              </div>
              <div className="cv-bar-track">
                <div className="cv-bar-fill" style={{ "--w": `${Math.min(100, ((quota?.used || 0) / (quota?.limit || 1)) * 100)}%` }} />
              </div>
              {quota?.remaining === 0 && (
                <div className="cv-error" style={{ marginTop: 12, fontSize: 12.5 }}>
                  Revino mâine pentru încă o analiză gratuită, sau treci la Premium pentru nelimitat.
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="cv-stagger" style={{ display: "grid", gap: 10 }}>
          {isAdmin && (
            <Link href="/admin" className="cv-btn-ghost" style={{ display: "block", textAlign: "center", color: "var(--red)", borderColor: "rgba(232,91,91,0.3)" }}>
              Panou administrare
            </Link>
          )}
          {!isPremium && (
            <Link href="/upgrade" className="cv-btn cv-btn-gold" style={{ display: "flex" }}>
              Treci la Premium
            </Link>
          )}
          {isPremium && user.stripe_customer_id && (
            <button onClick={openPortal} disabled={portalLoading} className="cv-btn-ghost">
              {portalLoading ? "Se încarcă..." : "Gestionează abonamentul"}
            </button>
          )}
          <Link href="/" className="cv-btn" style={{ display: "flex" }}>
            Vezi meciurile de azi
          </Link>
          <button onClick={logout} className="cv-btn-ghost" style={{ color: "var(--red)", borderColor: "rgba(232,91,91,0.25)" }}>
            Deconectare
          </button>
        </div>
      </main>
    </>
  );
}
