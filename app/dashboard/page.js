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
      <div style={{ minHeight: "100vh", background: "#060c18", color: "white", display: "flex",
        alignItems: "center", justifyContent: "center", fontFamily: "Georgia,serif" }}>
        Se încarcă...
      </div>
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
  const onTrial = user.trialEndDate && new Date(user.trialEndDate) > new Date() && user.plan === "free";
  const trialDaysLeft = onTrial
    ? Math.ceil((new Date(user.trialEndDate) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  const C = {
    card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 20, marginBottom: 16 },
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#060c18 0%,#0a1628 50%,#07111e 100%)", color: "white", fontFamily: "Georgia,serif" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "20px 16px 60px" }}>
        <Header back="/" />

        {/* User Info */}
        <div style={{ ...C.card, background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(99,102,241,0.06))",
          border: "1px solid rgba(16,185,129,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%",
              background: "linear-gradient(135deg,#10b981,#6ee7b7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 900, color: "#060c18" }}>
              {(user.name || user.email)[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{user.name || "Utilizator"}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{user.email}</div>
            </div>
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px",
            borderRadius: 99, fontSize: 12, fontWeight: 700,
            background: isPremium ? "linear-gradient(135deg,#fbbf24,#f59e0b)" : "rgba(255,255,255,0.08)",
            color: isPremium ? "#1a1a1a" : "rgba(255,255,255,0.7)",
            border: isPremium ? "none" : "1px solid rgba(255,255,255,0.15)"
          }}>
            {isPremium ? "💎 PREMIUM" : "🆓 GRATUIT"}
          </div>

          {onTrial && (
            <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(251,191,36,0.1)",
              border: "1px solid rgba(251,191,36,0.3)", borderRadius: 8, fontSize: 12, color: "#fde68a" }}>
              🎁 Ai {trialDaysLeft} {trialDaysLeft === 1 ? "zi" : "zile"} de probă Premium rămase
            </div>
          )}
        </div>

        {/* Quota */}
        <div style={C.card}>
          <div style={{ color: "#6ee7b7", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>📊 Analize astăzi</div>
          {quota?.limit === null ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14 }}>Analize făcute: <strong>{quota.used}</strong></span>
              <span style={{ padding: "4px 10px", background: "rgba(16,185,129,0.12)",
                border: "1px solid rgba(16,185,129,0.3)", borderRadius: 99, fontSize: 11,
                color: "#6ee7b7", fontWeight: 700 }}>
                ∞ NELIMITAT
              </span>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                  Analize folosite: {quota?.used || 0} / {quota?.limit || 1}
                </span>
                <span style={{ fontSize: 13, color: quota?.remaining === 0 ? "#fca5a5" : "#6ee7b7", fontWeight: 700 }}>
                  {quota?.remaining === 0 ? "Epuizat" : `${quota?.remaining} rămase`}
                </span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 99, height: 7, overflow: "hidden" }}>
                <div style={{
                  width: `${Math.min(100, ((quota?.used || 0) / (quota?.limit || 1)) * 100)}%`,
                  background: "linear-gradient(90deg,#10b981,#6ee7b7)",
                  height: "100%", borderRadius: 99, transition: "width 0.5s"
                }} />
              </div>
              {quota?.remaining === 0 && (
                <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, fontSize: 12, color: "#fca5a5" }}>
                  ⏳ Revino mâine pentru încă o analiză gratuită, sau fă upgrade pentru nelimitat.
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
          {!isPremium && (
            <Link href="/upgrade" style={{
              display: "block", padding: 16, borderRadius: 12, textAlign: "center",
              background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
              color: "#1a1a1a", fontWeight: 800, fontSize: 15,
              boxShadow: "0 4px 16px rgba(251,191,36,0.3)"
            }}>
              💎 Upgrade la Premium — $9.99/lună
            </Link>
          )}
          {isPremium && user.stripe_customer_id && (
            <button onClick={openPortal} disabled={portalLoading} style={{
              padding: 14, borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.04)", color: "white", fontSize: 14, fontWeight: 600,
              fontFamily: "Georgia,serif", cursor: portalLoading ? "not-allowed" : "pointer"
            }}>
              {portalLoading ? "Se încarcă..." : "⚙️ Gestionează Abonamentul"}
            </button>
          )}
          <Link href="/" style={{
            display: "block", padding: 14, borderRadius: 10, textAlign: "center",
            border: "1px solid rgba(16,185,129,0.3)",
            background: "rgba(16,185,129,0.08)", color: "#6ee7b7", fontSize: 14, fontWeight: 600
          }}>
            ⚽ Vezi meciuri
          </Link>
          <button onClick={logout} style={{
            padding: 12, borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)",
            background: "rgba(239,68,68,0.04)", color: "#fca5a5", fontSize: 13,
            fontFamily: "Georgia,serif", cursor: "pointer"
          }}>
            Deconectare
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, color: "rgba(255,255,255,0.2)", fontSize: 11 }}>
          Pontul Meu 2026 · Operat de PDF 33 LLC
        </div>
      </div>
    </div>
  );
}
