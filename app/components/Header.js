"use client";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

export default function Header({ back }) {
  const { user } = useAuth();

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "18px 16px 24px", gap: 12, position: "relative"
    }}>
      {back && (
        <Link href={back} style={{
          position: "absolute", left: 16, top: "50%", transform: "translateY(-30%)",
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 9, padding: "8px 12px", fontSize: 13, color: "rgba(255,255,255,0.7)",
          display: "flex", alignItems: "center", gap: 4, zIndex: 2
        }}>
          ←
        </Link>
      )}

      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 32 }}>⚽</span>
        <div>
          <div style={{
            fontSize: "clamp(20px,4vw,30px)", fontWeight: 900, letterSpacing: -1,
            background: "linear-gradient(135deg,#10b981,#6ee7b7)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1
          }}>
            Pontul Meu
          </div>
          <div style={{ color: "rgba(255,255,255,.3)", fontSize: 10, letterSpacing: 3, textTransform: "uppercase", marginTop: 2 }}>
            Analize Fotbal AI
          </div>
        </div>
      </Link>

      {/* User badge - right side */}
      <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-30%)" }}>
        {user ? (
          <Link href="/dashboard" style={{
            background: user.isPremium
              ? "linear-gradient(135deg,#fbbf24,#f59e0b)"
              : "rgba(16,185,129,0.1)",
            border: user.isPremium ? "none" : "1px solid rgba(16,185,129,0.3)",
            borderRadius: 99, padding: "6px 12px", fontSize: 12, fontWeight: 700,
            color: user.isPremium ? "#1a1a1a" : "#6ee7b7",
            display: "inline-flex", alignItems: "center", gap: 5
          }}>
            {user.isPremium ? "💎" : "👤"} {user.name?.split(" ")[0] || "Cont"}
          </Link>
        ) : (
          <Link href="/login" style={{
            background: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: 9, padding: "7px 12px", fontSize: 12, fontWeight: 600,
            color: "#6ee7b7"
          }}>
            Autentificare
          </Link>
        )}
      </div>
    </div>
  );
}
