"use client";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

export default function Header() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const isPremium = isAdmin ||
    (user?.plan === "premium" && user?.subscription_status === "active") ||
    (user?.trial_end_date && new Date(user.trial_end_date) > new Date());

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(11,18,14,0.85)", backdropFilter: "blur(14px)",
      borderBottom: "1px solid var(--border)"
    }}>
      <div style={{
        maxWidth: 1180, margin: "0 auto", padding: "14px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 21, fontWeight: 800, letterSpacing: -0.3 }}>
            Cota<span style={{ color: "var(--green)" }}>Verde</span>
          </span>
          <span className="cv-pulse" style={{ marginTop: 2 }} />
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user ? (
            <>
              {isAdmin && (
                <Link href="/admin" className="cv-badge cv-badge-red" style={{ textDecoration: "none" }}>
                  ADMIN
                </Link>
              )}
              {isPremium ? (
                <span className="cv-badge cv-badge-gold">PRO</span>
              ) : (
                <Link href="/upgrade" className="cv-badge cv-badge-gold-outline">UPGRADE</Link>
              )}
              <Link href="/dashboard" className="cv-btn-ghost cv-btn-sm" style={{ display: "inline-flex" }}>
                {user.first_name || user.name?.split(" ")[0] || "Contul meu"}
              </Link>
              <button onClick={logout} className="cv-btn-ghost cv-btn-sm" title="Deconectare">
                Ieși
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="cv-btn-ghost cv-btn-sm" style={{ display: "inline-flex" }}>Intră în cont</Link>
              <Link href="/register" className="cv-btn cv-btn-sm" style={{ display: "inline-flex" }}>Cont nou</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
