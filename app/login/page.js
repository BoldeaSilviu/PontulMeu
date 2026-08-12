"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import { useAuth } from "../components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Eroare la autentificare");
        setLoading(false);
        return;
      }
      if (refresh) await refresh();
      router.push("/");
    } catch {
      setError("Eroare de rețea. Încearcă din nou.");
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="cv-container" style={{ maxWidth: 440, paddingTop: 48 }}>
        <div className="fade" style={{ textAlign: "center", marginBottom: 26 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
            Bine ai revenit
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>
            Intră în contul tău CotaVerde
          </p>
        </div>

        <form onSubmit={submit} className="cv-card fade" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="cv-label">Email</label>
            <input className="cv-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplu.ro" required />
          </div>
          <div>
            <label className="cv-label">Parolă</label>
            <input className="cv-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>

          {error && <div className="cv-error">{error}</div>}

          <button type="submit" className="cv-btn" disabled={loading}>
            {loading ? "Se verifică..." : "Intră în cont"}
          </button>

          <p style={{ textAlign: "center", fontSize: 13 }}>
            <Link href="/forgot-password" style={{ color: "var(--muted2)" }}>Am uitat parola</Link>
          </p>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--muted)" }}>
          Nu ai cont?{" "}
          <Link href="/register" style={{ color: "var(--green)", fontWeight: 600 }}>Creează unul gratuit</Link>
        </p>
      </main>
    </>
  );
}
