"use client";
import { useState } from "react";
import Link from "next/link";
import Header from "../components/Header";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Eroare la procesare");
      } else {
        setMessage(data.message);
      }
    } catch {
      setError("Eroare de rețea. Încearcă din nou.");
    }
    setLoading(false);
  }

  return (
    <>
      <Header />
      <main className="cv-container" style={{ maxWidth: 440, paddingTop: 48 }}>
        <div className="fade" style={{ textAlign: "center", marginBottom: 26 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Ai uitat parola?</h1>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>
            Scrie emailul contului și îți trimitem un link de resetare, valabil 1 oră.
          </p>
        </div>

        <form onSubmit={submit} className="cv-card fade" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="cv-label">Email</label>
            <input className="cv-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplu.ro" required />
          </div>

          {error && <div className="cv-error">{error}</div>}
          {message && <div className="cv-success">{message}</div>}

          <button type="submit" className="cv-btn" disabled={loading || !!message}>
            {loading ? "Se trimite..." : "Trimite link de resetare"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--muted)" }}>
          <Link href="/login" style={{ color: "var(--green)", fontWeight: 600 }}>Înapoi la autentificare</Link>
        </p>
      </main>
    </>
  );
}
