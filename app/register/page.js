"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import { useAuth } from "../components/AuthProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", birthDate: "", password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Eroare la înregistrare");
        setLoading(false);
        return;
      }
      if (refresh) await refresh();
      router.push("/?welcome=1");
    } catch {
      setError("Eroare de rețea. Încearcă din nou.");
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="cv-container" style={{ maxWidth: 480, paddingTop: 36 }}>
        <div className="fade" style={{ textAlign: "center", marginBottom: 26 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
            Deschide-ți contul <span style={{ color: "var(--green)" }}>CotaVerde</span>
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>
            7 zile de acces Premium gratuit. Fără card.
          </p>
        </div>

        <form onSubmit={submit} className="cv-card fade" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="cv-label">Prenume *</label>
              <input className="cv-input" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Andrei" required />
            </div>
            <div>
              <label className="cv-label">Nume *</label>
              <input className="cv-input" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Popescu" required />
            </div>
          </div>

          <div>
            <label className="cv-label">Email *</label>
            <input className="cv-input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="andrei@email.com" required />
          </div>

          <div>
            <label className="cv-label">Telefon *</label>
            <input className="cv-input" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="07xx xxx xxx" required />
          </div>

          <div>
            <label className="cv-label">Data nașterii * <span style={{ color: "var(--gold)" }}>(minim 18 ani)</span></label>
            <input className="cv-input" type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} max={new Date().toISOString().slice(0, 10)} required />
          </div>

          <div>
            <label className="cv-label">Parolă * (minim 8 caractere)</label>
            <input className="cv-input" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" minLength={8} required />
          </div>

          {error && <div className="cv-error">{error}</div>}

          <button type="submit" className="cv-btn" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? "Se creează contul..." : "Creează cont gratuit"}
          </button>

          <p style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.6, textAlign: "center" }}>
            Prin crearea contului confirmi că ai peste 18 ani și accepți{" "}
            <Link href="/termeni" style={{ color: "var(--muted2)", textDecoration: "underline" }}>Termenii</Link> și{" "}
            <Link href="/confidentialitate" style={{ color: "var(--muted2)", textDecoration: "underline" }}>Politica de confidențialitate</Link>.
            Conținutul despre pariuri este destinat exclusiv adulților.
          </p>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--muted)" }}>
          Ai deja cont?{" "}
          <Link href="/login" style={{ color: "var(--green)", fontWeight: 600 }}>Intră în cont</Link>
        </p>
      </main>
    </>
  );
}
