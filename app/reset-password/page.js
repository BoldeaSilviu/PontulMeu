"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "../components/Header";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Parolele nu coincid");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Eroare la resetare");
        setLoading(false);
        return;
      }
      setMessage(data.message);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError("Eroare de rețea. Încearcă din nou.");
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="cv-card fade" style={{ textAlign: "center" }}>
        <div className="cv-error">Link invalid. Cere un nou link de resetare.</div>
        <p style={{ marginTop: 16 }}>
          <Link href="/forgot-password" style={{ color: "var(--green)", fontWeight: 600 }}>Cere link nou</Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="cv-card fade" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label className="cv-label">Parola nouă (minim 8 caractere)</label>
        <input className="cv-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
      </div>
      <div>
        <label className="cv-label">Repetă parola nouă</label>
        <input className="cv-input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} required />
      </div>

      {error && <div className="cv-error">{error}</div>}
      {message && <div className="cv-success">{message} Te redirecționăm...</div>}

      <button type="submit" className="cv-btn" disabled={loading || !!message}>
        {loading ? "Se salvează..." : "Salvează parola nouă"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <Header />
      <main className="cv-container" style={{ maxWidth: 440, paddingTop: 48 }}>
        <div className="fade" style={{ textAlign: "center", marginBottom: 26 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Setează o parolă nouă</h1>
        </div>
        <Suspense fallback={<div className="cv-skeleton" style={{ height: 220 }} />}>
          <ResetForm />
        </Suspense>
      </main>
    </>
  );
}
