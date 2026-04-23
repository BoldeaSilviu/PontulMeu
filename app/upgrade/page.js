"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import Header from "../components/Header";

export default function UpgradePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function subscribe(plan) {
    if (!user) {
      router.push("/register?upgrade=1");
      return;
    }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Eroare");
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  const features = [
    { icon: "♾️", text: "Analize nelimitate (vs. 1/zi gratuit)" },
    { icon: "💎", text: "Cele Mai Bune Pariuri (Value Bets)" },
    { icon: "📊", text: "Toate piețele: Peste/Sub, BTTS, Cornere, Cartonașe" },
    { icon: "⚔️", text: "Confruntări Directe complete (H2H)" },
    { icon: "⭐", text: "Pontul Zilei — cel mai bun pariu al zilei" },
    { icon: "🏆", text: "Ponturi VIP (încredere peste 80%)" },
    { icon: "🔔", text: "Notificări push pentru meciurile favorite" },
    { icon: "📈", text: "Statistici xG (Expected Goals)" },
    { icon: "🎯", text: "Pariuri combinate generate de AI" },
    { icon: "💰", text: "Money Management + Kelly Criterion" },
    { icon: "📱", text: "ROI Tracker personal" },
    { icon: "🌍", text: "Ligi extinse: MLS, Argentina, Mexico, Liga 1 RO" },
    { icon: "📧", text: "Newsletter zilnic + Analiza săptămânii" },
    { icon: "💾", text: "Istoric nelimitat + Export PDF" },
    { icon: "🎨", text: "Temă Gold exclusivă" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#060c18 0%,#0a1628 50%,#07111e 100%)", color: "white", fontFamily: "Georgia,serif" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px 16px 60px" }}>
        <Header back="/" />

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💎</div>
          <h1 style={{ fontSize: "clamp(26px,5vw,36px)", fontWeight: 900, marginBottom: 10,
            background: "linear-gradient(135deg,#fbbf24,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>
            Pontul Meu Premium
          </h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
            Deblochează întreaga putere a AI-ului. Analize nelimitate, Pontul Zilei, Value Bets și mult mai mult.
          </p>
          {user?.isPremium && (
            <div style={{ marginTop: 20, padding: "12px 20px", background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, display: "inline-block",
              color: "#6ee7b7", fontSize: 13, fontWeight: 600 }}>
              ✅ Ai deja acces Premium activ
            </div>
          )}
        </div>

        {error && (
          <div style={{ marginBottom: 20, padding: "12px 16px", background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, color: "#fca5a5", fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Pricing */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: 16, marginBottom: 36 }}>

          {/* Monthly */}
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 18, padding: 28, position: "relative"
          }}>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
              LUNAR
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 48, fontWeight: 900 }}>$9.99</span>
              <span style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", marginLeft: 8 }}>/lună</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>
              Anulează oricând
            </div>
            <button onClick={() => subscribe("monthly")} disabled={loading || user?.isPremium}
              style={{
                width: "100%", padding: 14, borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.06)", color: "white", fontSize: 14, fontWeight: 700,
                fontFamily: "Georgia,serif", cursor: (loading || user?.isPremium) ? "not-allowed" : "pointer",
                opacity: user?.isPremium ? 0.5 : 1
              }}>
              {loading ? "Se încarcă..." : "Alege planul lunar"}
            </button>
          </div>

          {/* Yearly - HIGHLIGHT */}
          <div style={{
            background: "linear-gradient(135deg, rgba(251,191,36,0.08), rgba(245,158,11,0.05))",
            border: "2px solid rgba(251,191,36,0.4)",
            borderRadius: 18, padding: 28, position: "relative",
            boxShadow: "0 8px 28px rgba(251,191,36,0.15)"
          }}>
            <div style={{ position: "absolute", top: -12, right: 20,
              background: "linear-gradient(135deg,#fbbf24,#f59e0b)", padding: "5px 14px",
              borderRadius: 99, fontSize: 11, fontWeight: 800, letterSpacing: 1, color: "#1a1a1a" }}>
              ECONOMIE 34%
            </div>
            <div style={{ fontSize: 14, color: "#fbbf24", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10, fontWeight: 700 }}>
              ANUAL ⭐
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 48, fontWeight: 900, color: "#fbbf24" }}>$79</span>
              <span style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", marginLeft: 8 }}>/an</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
              <span style={{ textDecoration: "line-through" }}>$119.88</span> → doar <strong style={{ color: "#fbbf24" }}>$6.58/lună</strong>
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>
              🎁 7 zile gratuit · Anulează oricând
            </div>
            <button onClick={() => subscribe("yearly")} disabled={loading || user?.isPremium}
              style={{
                width: "100%", padding: 14, borderRadius: 10, border: "none",
                background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
                color: "#1a1a1a", fontSize: 14, fontWeight: 800,
                fontFamily: "Georgia,serif", cursor: (loading || user?.isPremium) ? "not-allowed" : "pointer",
                boxShadow: "0 4px 16px rgba(251,191,36,0.3)",
                opacity: user?.isPremium ? 0.5 : 1
              }}>
              {loading ? "Se încarcă..." : user?.isPremium ? "Deja abonat" : "Abonează-te anual ⭐"}
            </button>
          </div>
        </div>

        {/* Features */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: 24, marginBottom: 24
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#6ee7b7", marginBottom: 18 }}>
            🎁 Tot ce primești cu Premium:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 10 }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                background: "rgba(255,255,255,0.02)", borderRadius: 8, fontSize: 13 }}>
                <span style={{ fontSize: 16 }}>{f.icon}</span>
                <span style={{ color: "rgba(255,255,255,0.8)" }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Why Premium */}
        <div style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.05), rgba(16,185,129,0.05))",
          border: "1px solid rgba(99,102,241,0.15)",
          borderRadius: 16, padding: 24, marginBottom: 24
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#a5b4fc", marginBottom: 14 }}>
            💡 De ce Premium merită?
          </div>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13.5, lineHeight: 1.7, margin: 0 }}>
            Un singur pont Value Bets câștigător pe lună <strong>acoperă costul abonamentului</strong>.
            Un pariu de $50 la cota 1.85 îți aduce $42.5 profit. Sunt deja $32 profit net peste
            abonamentul lunar. Dar cei mai mulți dintre utilizatori pariază mai mult, iar AI-ul
            identifică zilnic 3-5 oportunități cu valoare matematică reală.
          </p>
        </div>

        {/* Money back / Security */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { icon: "🔒", t: "Plăți Securizate", s: "Procesate de Stripe (același ca Spotify, Netflix)" },
            { icon: "🚫", t: "Anulare Oricând", s: "Din contul tău, fără condiții" },
            { icon: "🎁", t: "7 Zile Gratuit", s: "Testezi Premium fără să plătești" },
          ].map((x, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{x.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{x.t}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>{x.s}</div>
            </div>
          ))}
        </div>

        {!user && (
          <div style={{ textAlign: "center", padding: 16, background: "rgba(16,185,129,0.05)",
            border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12 }}>
            <Link href="/register" style={{ color: "#6ee7b7", fontWeight: 700, fontSize: 14 }}>
              📝 Creează cont gratuit întâi →
            </Link>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 30, color: "rgba(255,255,255,0.2)", fontSize: 11 }}>
          Pontul Meu 2026 · Operat de PDF 33 LLC
        </div>
      </div>
    </div>
  );
}
