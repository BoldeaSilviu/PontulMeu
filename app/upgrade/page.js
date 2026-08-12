"use client";
import { useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import { useAuth } from "../components/AuthProvider";

const FEATURES = [
  "Analize nelimitate, pe orice meci din 14 competiții",
  "Biletul Verde: pariurile cu valoare matematică reală",
  "Analiza piață cu piață contra cotelor caselor",
  "Capcanele meciului: pariurile de evitat",
  "Miză recomandată în unități, pentru bankroll sănătos",
  "Formă reală din xG, șuturi și posesie, nu doar scoruri",
];

export default function UpgradePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  async function subscribe(plan) {
    setLoading(true);
    setNotice("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setNotice("Plata online se activează în curând. Scrie-ne și îți activăm manual abonamentul.");
    } catch {
      setNotice("Plata online se activează în curând. Scrie-ne și îți activăm manual abonamentul.");
    }
    setLoading(false);
  }

  const already = user?.isPremium;

  return (
    <>
      <Header />
      <main className="cv-container" style={{ maxWidth: 780, paddingTop: 36 }}>
        <div className="fade" style={{ textAlign: "center", marginBottom: 30 }}>
          <span className="cv-badge cv-badge-gold" style={{ marginBottom: 14 }}>COTAVERDE PREMIUM</span>
          <h1 style={{ fontSize: "clamp(24px,5vw,34px)", fontWeight: 800, margin: "14px 0 10px" }}>
            Toate verdictele. <span style={{ color: "var(--green)" }}>Zero limite.</span>
          </h1>
          <p style={{ fontSize: 14.5, color: "var(--muted2)", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
            Primele 7 zile sunt gratuite la orice cont nou. Apoi alegi planul care ți se potrivește.
          </p>
        </div>

        {already && (
          <div className="cv-success fade" style={{ textAlign: "center", marginBottom: 20 }}>
            Ai deja acces Premium activ. Spor la analize!
          </div>
        )}

        {notice && (
          <div className="cv-card fade" style={{ border: "1px solid rgba(232,179,59,0.4)", textAlign: "center", marginBottom: 20, fontSize: 13.5, color: "var(--gold)" }}>
            {notice}
          </div>
        )}

        <div className="cv-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 26 }}>
          {/* Monthly */}
          <div className="cv-card" style={{ textAlign: "center", padding: 26 }}>
            <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, marginBottom: 12 }}>LUNAR</div>
            <div style={{ marginBottom: 4 }}>
              <span className="mono" style={{ fontSize: 44, fontWeight: 800 }}>49</span>
              <span style={{ fontSize: 16, color: "var(--muted)" }}> lei/lună</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20 }}>Anulezi oricând</div>
            <button onClick={() => subscribe("monthly")} disabled={loading || already} className="cv-btn" style={{ width: "100%" }}>
              {already ? "Deja abonat" : loading ? "Se încarcă..." : "Alege lunar"}
            </button>
          </div>

          {/* Yearly */}
          <div className="cv-card" style={{ textAlign: "center", padding: 26, border: "1.5px solid var(--gold)", position: "relative" }}>
            <span className="cv-badge cv-badge-gold" style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)" }}>
              ECONOMISEȘTI 20%
            </span>
            <div style={{ fontSize: 13, color: "var(--gold)", fontWeight: 600, marginBottom: 12 }}>ANUAL</div>
            <div style={{ marginBottom: 4 }}>
              <span className="mono" style={{ fontSize: 44, fontWeight: 800, color: "var(--gold)" }}>470</span>
              <span style={{ fontSize: 16, color: "var(--muted)" }}> lei/an</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20 }}>Echivalent 39 lei/lună</div>
            <button onClick={() => subscribe("yearly")} disabled={loading || already} className="cv-btn cv-btn-gold" style={{ width: "100%" }}>
              {already ? "Deja abonat" : loading ? "Se încarcă..." : "Alege anual"}
            </button>
          </div>
        </div>

        <div className="cv-card fade" style={{ marginBottom: 26 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Ce primești cu Premium</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13.5, color: "var(--muted2)", lineHeight: 1.6 }}>
                <span style={{ color: "var(--green)", fontWeight: 700, flexShrink: 0 }}>✓</span>
                {f}
              </div>
            ))}
          </div>
        </div>

        {!user && (
          <div style={{ textAlign: "center" }}>
            <Link href="/register" className="cv-btn">Creează cont · 7 zile gratuit</Link>
          </div>
        )}

        <p style={{ fontSize: 11.5, color: "var(--muted)", textAlign: "center", marginTop: 26, lineHeight: 1.7 }}>
          Analizele CotaVerde sunt strict informative și nu constituie sfaturi financiare.
          Pariurile implică riscuri reale. Joacă responsabil, 18+.
        </p>
      </main>
    </>
  );
}
