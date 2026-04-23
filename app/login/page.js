"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import Header from "../components/Header";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Eroare la autentificare");
      } else {
        await refresh();
        router.push("/");
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#060c18 0%,#0a1628 50%,#07111e 100%)", color: "white", fontFamily: "Georgia,serif" }}>
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "20px 16px" }}>
        <Header back="/" />
        <form onSubmit={onSubmit} style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: 28, marginTop: 20
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6, color: "#6ee7b7" }}>Autentificare</h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 22 }}>
            Bine ai revenit! 👋
          </p>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "white",
                fontSize: 14, fontFamily: "Georgia,serif", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>Parolă</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "white",
                fontSize: 14, fontFamily: "Georgia,serif", boxSizing: "border-box" }}
            />
          </div>

          {error && (
            <div style={{ marginBottom: 14, padding: "10px 14px", background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#fca5a5", fontSize: 12 }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: 14, borderRadius: 10, border: "none", cursor: loading ? "not-allowed" : "pointer",
            background: loading ? "rgba(16,185,129,0.3)" : "linear-gradient(135deg,#10b981,#059669)",
            color: "white", fontSize: 15, fontWeight: 800, fontFamily: "Georgia,serif",
            boxShadow: loading ? "none" : "0 4px 14px rgba(16,185,129,0.3)"
          }}>
            {loading ? "Se autentifică..." : "Autentifică-te"}
          </button>

          <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            Nu ai cont? <Link href="/register" style={{ color: "#6ee7b7", fontWeight: 600 }}>Creează acum</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
