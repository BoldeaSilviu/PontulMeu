"use client";
import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import { useAuth } from "../../components/AuthProvider";

// ─── Sub-components ─────────────────────────────────────────────────────────
function Radar({ vals }) {
  const sz = 160, cx = 80, cy = 80, r = 55;
  const cats = ["Formă", "Atac", "Apărare", "Motivație", "Acasă/D"];
  const angle = (i) => (i * 2 * Math.PI) / cats.length - Math.PI / 2;
  const grid = (f) => cats.map((_, i) => `${cx + f * r * Math.cos(angle(i))},${cy + f * r * Math.sin(angle(i))}`).join(" ");
  const dataStr = (vals || []).map((v, i) => {
    const rv = (Math.min(10, Math.max(0, v || 0)) / 10) * r;
    return `${cx + rv * Math.cos(angle(i))},${cy + rv * Math.sin(angle(i))}`;
  }).join(" ");
  return (
    <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} style={{ flexShrink: 0 }}>
      {[.25,.5,.75,1].map(f => <polygon key={f} points={grid(f)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />)}
      {cats.map((_, i) => <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle(i))} y2={cy + r * Math.sin(angle(i))} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />)}
      {dataStr && <polygon points={dataStr} fill="rgba(16,185,129,0.22)" stroke="#10b981" strokeWidth="2" />}
      {(vals || []).map((v, i) => {
        const rv = (Math.min(10, Math.max(0, v || 0)) / 10) * r;
        return <circle key={i} cx={cx + rv * Math.cos(angle(i))} cy={cy + rv * Math.sin(angle(i))} r="3" fill="#10b981" />;
      })}
      {cats.map((c, i) => <text key={i} x={cx + (r + 18) * Math.cos(angle(i))} y={cy + (r + 18) * Math.sin(angle(i))} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="rgba(255,255,255,0.5)">{c}</text>)}
    </svg>
  );
}

function FormBadge({ r: result }) {
  const s = { W: { bg: "#10b981", t: "V" }, D: { bg: "#f59e0b", t: "E" }, L: { bg: "#ef4444", t: "Î" } }[result] || { bg: "#6b7280", t: "?" };
  return <span style={{ background: s.bg, color: "white", width: 26, height: 26, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{s.t}</span>;
}

function Bar({ label, sub, pct, color = "#10b981" }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{label}</span>
        <span style={{ fontSize: 11, color: "white", fontWeight: 700 }}>{sub}</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 99, height: 7, overflow: "hidden" }}>
        <div style={{ width: Math.min(100, Math.max(0, pct)) + "%", background: color, height: "100%", borderRadius: 99, transition: "width 1.2s ease" }} />
      </div>
    </div>
  );
}

function Gauge({ pct, label }) {
  const v = Math.min(100, Math.max(0, pct || 0));
  const color = v > 60 ? "#10b981" : v > 40 ? "#f59e0b" : "#ef4444";
  const ang = (v / 100) * 180 - 90;
  const rad = (ang * Math.PI) / 180;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: 115, height: 62, overflow: "hidden", margin: "0 auto" }}>
        <svg width="115" height="125" viewBox="0 0 115 125" style={{ position: "absolute", top: 0, left: 0 }}>
          <path d="M8,62 A50,50 0 0,1 107,62" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="11" strokeLinecap="round" />
          <path d="M8,62 A50,50 0 0,1 107,62" fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
            strokeDasharray={`${(v / 100) * 155} 155`} />
          <line x1="57.5" y1="62" x2={57.5 + 33 * Math.cos(rad)} y2={62 + 33 * Math.sin(rad)} stroke="white" strokeWidth="2" strokeLinecap="round" />
          <circle cx="57.5" cy="62" r="3.5" fill="white" />
        </svg>
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color, marginTop: -6 }}>{v}%</div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", lineHeight: 1.3, marginTop: 2 }}>{label}</div>
    </div>
  );
}

/**
 * Blurred section with upgrade call-to-action overlay
 */
function PremiumGate({ children, title }) {
  return (
    <div style={{ position: "relative", marginBottom: 16 }}>
      <div style={{
        filter: "blur(6px)", pointerEvents: "none", userSelect: "none",
        opacity: 0.5
      }}>
        {children}
      </div>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        alignItems: "center", justifyContent: "center",
        background: "radial-gradient(circle at center, rgba(6,12,24,0.85) 0%, rgba(6,12,24,0.5) 100%)",
        borderRadius: 14
      }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(251,191,36,0.12), rgba(245,158,11,0.08))",
          border: "1px solid rgba(251,191,36,0.35)",
          borderRadius: 14, padding: "18px 22px", textAlign: "center",
          maxWidth: 300, backdropFilter: "blur(8px)"
        }}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>🔒</div>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, color: "#fbbf24" }}>
            {title}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 14, lineHeight: 1.5 }}>
            Deblochează cu Premium — de la $6.58/lună
          </div>
          <Link href="/upgrade" style={{
            display: "inline-block", padding: "9px 18px", borderRadius: 8,
            background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
            color: "#1a1a1a", fontSize: 12, fontWeight: 800, fontFamily: "Georgia,serif"
          }}>
            💎 Upgrade
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function MatchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, quota, refresh } = useAuth();
  const matchId = params.id;
  const competition = searchParams.get("competition");

  const [match, setMatch] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loadingMatch, setLoadingMatch] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState("");
  const [stageIdx, setStageIdx] = useState(0);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const isPremium = user?.isPremium;

  const stages = [
    "Analizez echipele...",
    "Calculez forma recentă...",
    "Studiez confruntările directe...",
    "Evaluez contextul...",
    "Generez pronosticul...",
    "Finalizez raportul..."
  ];

  useEffect(() => {
    async function load() {
      setLoadingMatch(true); setError("");
      try {
        const res = await fetch(`/api/match/${matchId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Meciul nu a fost găsit");
        if (!data.match) throw new Error("Meciul nu a fost găsit");
        setMatch(data.match);
      } catch (e) {
        setError(e.message);
      }
      setLoadingMatch(false);
    }
    if (matchId) load();
  }, [matchId]);

  async function runAnalysis() {
    if (!user) {
      router.push(`/login?redirect=/match/${matchId}?competition=${competition}`);
      return;
    }
    if (!match) return;

    setLoadingAnalysis(true); setError(""); setAnalysis(null); setStageIdx(0); setQuotaExceeded(false);
    const interval = setInterval(() => setStageIdx((s) => Math.min(s + 1, stages.length - 1)), 900);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          homeTeam: match.homeTeam.name,
          awayTeam: match.awayTeam.name,
          league: match.competition,
          date: new Date(match.utcDate).toLocaleDateString("ro-RO"),
          status: match.status,
          score: match.score,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requiresUpgrade) {
          setQuotaExceeded(true);
        } else {
          throw new Error(data.error || data.message || "Eroare la analiză");
        }
      } else {
        setAnalysis(data);
        refresh(); // update quota counter
      }
    } catch (e) {
      setError(e.message);
    }
    clearInterval(interval);
    setLoadingAnalysis(false);
  }

  const betColor = (b) => b === "1" ? "#10b981" : b === "X" ? "#f59e0b" : "#ef4444";
  const riskColor = (r) => r === "SCĂZUT" ? "#10b981" : r === "MEDIU" ? "#f59e0b" : "#ef4444";

  const C = {
    card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 18, marginBottom: 16 },
    tag: (color) => ({ display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: color + "1a", border: `1px solid ${color}44`, color })
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#060c18 0%,#0a1628 50%,#07111e 100%)" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 16px 60px" }}>
        <Header back="/" />

        {loadingMatch && (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.5)" }}>
            <div style={{ width: 36, height: 36, border: "3px solid rgba(16,185,129,0.2)", borderTop: "3px solid #10b981", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
            Se încarcă meciul...
          </div>
        )}

        {error && !match && (
          <div style={{ padding: "14px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, color: "#fca5a5", fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}

        {match && (
          <div className="fade">
            {/* Match Header */}
            <div style={{ ...C.card, textAlign: "center", background: "linear-gradient(135deg,rgba(16,185,129,0.06),rgba(99,102,241,0.06))", border: "1px solid rgba(16,185,129,0.2)" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                {match.competition} · {new Date(match.utcDate).toLocaleString("ro-RO", { dateStyle: "medium", timeStyle: "short" })}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 14, alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  {match.homeTeam.crest && <img src={match.homeTeam.crest} alt="" style={{ width: 56, height: 56, objectFit: "contain" }} />}
                  <div style={{ fontSize: "clamp(14px,3.5vw,20px)", fontWeight: 900, lineHeight: 1.2 }}>{match.homeTeam.name}</div>
                  <span style={C.tag("#10b981")}>🏠 Gazdă</span>
                </div>

                <div style={{ textAlign: "center", minWidth: 80 }}>
                  {match.score?.home !== null && match.score?.home !== undefined ? (
                    <div>
                      <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: 4, color: "#6ee7b7" }}>
                        {match.score.home} - {match.score.away}
                      </div>
                      {match.score.halfTimeHome !== null && match.score.halfTimeHome !== undefined && (
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                          Pauză: {match.score.halfTimeHome}-{match.score.halfTimeAway}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: 28, fontWeight: 900, color: "rgba(255,255,255,0.2)" }}>VS</div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  {match.awayTeam.crest && <img src={match.awayTeam.crest} alt="" style={{ width: 56, height: 56, objectFit: "contain" }} />}
                  <div style={{ fontSize: "clamp(14px,3.5vw,20px)", fontWeight: 900, lineHeight: 1.2 }}>{match.awayTeam.name}</div>
                  <span style={C.tag("#f59e0b")}>✈ Oaspete</span>
                </div>
              </div>

              {(match.venue || match.matchday || match.referee) && (
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
                  {match.venue && <span>🏟 {match.venue}</span>}
                  {match.matchday && <span>📅 Etapa {match.matchday}</span>}
                  {match.referee && <span>👨‍⚖️ {match.referee}</span>}
                </div>
              )}
            </div>

            {/* Quota exceeded warning */}
            {quotaExceeded && (
              <div style={{
                ...C.card,
                background: "linear-gradient(135deg,rgba(251,191,36,0.12),rgba(245,158,11,0.05))",
                border: "1px solid rgba(251,191,36,0.35)",
                textAlign: "center"
              }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🎯</div>
                <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 8, color: "#fbbf24" }}>
                  Ai folosit analiza de astăzi!
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginBottom: 18, lineHeight: 1.6 }}>
                  Ai primit 1 analiză gratuită pe zi. Revino mâine,<br/>
                  sau fă upgrade pentru analize <strong>nelimitate</strong>.
                </div>
                <Link href="/upgrade" style={{
                  display: "inline-block", padding: "12px 24px", borderRadius: 10,
                  background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
                  color: "#1a1a1a", fontSize: 14, fontWeight: 800
                }}>
                  💎 Deblochează Premium — $9.99/lună
                </Link>
              </div>
            )}

            {/* Action button */}
            {!analysis && !quotaExceeded && (
              <button onClick={runAnalysis} disabled={loadingAnalysis} style={{
                width: "100%", padding: "16px", borderRadius: 12, border: "none", marginBottom: 20,
                cursor: loadingAnalysis ? "not-allowed" : "pointer",
                background: loadingAnalysis ? "rgba(16,185,129,0.2)" : "linear-gradient(135deg,#10b981,#059669)",
                color: "white", fontSize: 15, fontWeight: 800, fontFamily: "Georgia,serif",
                boxShadow: loadingAnalysis ? "none" : "0 4px 24px rgba(16,185,129,0.3)"
              }}>
                {loadingAnalysis ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                    {stages[stageIdx]}
                  </span>
                ) : !user ? "🔑 Autentifică-te pentru analiză" : "🔮 Generează Analiză AI"}
              </button>
            )}

            {error && (
              <div style={{ padding: "14px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, color: "#fca5a5", fontSize: 13, marginBottom: 16, wordBreak: "break-word" }}>
                ⚠️ {error}
              </div>
            )}

            {/* Analysis results */}
            {analysis && (
              <div className="fade">

                {/* Main Prediction — FREE shows this */}
                <div style={{ ...C.card, border: "1px solid rgba(16,185,129,0.25)", background: "rgba(16,185,129,0.03)" }}>
                  <div style={{ color: "#6ee7b7", fontWeight: 700, fontSize: 15, marginBottom: 20, textAlign: "center" }}>🎯 Pronostic Principal</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
                    <Gauge pct={analysis.predictions?.result1X2?.home} label={match.homeTeam.shortName} />
                    <Gauge pct={analysis.predictions?.result1X2?.draw} label="Egal" />
                    <Gauge pct={analysis.predictions?.result1X2?.away} label={match.awayTeam.shortName} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                    {[
                      { l: "Pariu Recomandat", v: analysis.predictions?.recommendedBet, c: betColor(analysis.predictions?.recommendedBet), s: "1=Gazdă · X=Egal · 2=Oaspete" },
                      { l: "Scor Prezis", v: analysis.predictions?.predictedScore, c: "#f59e0b", s: "Cel mai probabil" },
                      { l: "Nivel Risc", v: analysis.riskLevel, c: riskColor(analysis.riskLevel), s: `Încredere: ${analysis.predictions?.confidence}%` },
                    ].map((x, i) => (
                      <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 11, padding: 12, textAlign: "center", border: `1px solid ${x.c}33` }}>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>{x.l}</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: x.c }}>{x.v}</div>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{x.s}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Teams — FREE shows this (without xG badge) */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: 14, marginBottom: 16 }}>
                  {[
                    { team: analysis.homeTeam, name: match.homeTeam.name, label: "🏠 Gazdă", accent: "#10b981", perfKey: "homeAdvantage" },
                    { team: analysis.awayTeam, name: match.awayTeam.name, label: "✈ Oaspete", accent: "#f59e0b", perfKey: "awayPerformance" }
                  ].map(({ team, name, label, accent, perfKey }, idx) => (
                    <div key={idx} style={{ ...C.card, border: `1px solid ${accent}33` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <div style={{ color: accent, fontWeight: 700, fontSize: 14 }}>{label} {name}</div>
                        {isPremium && team?.xG && (
                          <span style={{ ...C.tag("#a5b4fc"), fontSize: 10 }}>xG: {team.xG.toFixed(2)}</span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
                        <Radar vals={[
                          team?.formScore || 5,
                          Math.min(10, (team?.goalsScored || 1) * 2.2),
                          Math.max(1, 10 - (team?.goalsConceded || 2) * 2),
                          team?.[perfKey] || 5,
                          team?.formScore || 5
                        ]} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 5, letterSpacing: 1, textTransform: "uppercase" }}>Formă recentă</div>
                          <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 12 }}>
                            {(team?.recentForm || []).map((r, i) => <FormBadge key={i} r={r} />)}
                          </div>
                          <Bar label="Goluri/meci" sub={(team?.goalsScored || 0).toFixed(1)} pct={(team?.goalsScored || 0) * 22} color={accent} />
                          <Bar label="Primite/meci" sub={(team?.goalsConceded || 0).toFixed(1)} pct={Math.max(0, 100 - (team?.goalsConceded || 0) * 25)} color="#6366f1" />
                        </div>
                      </div>
                      {team?.keyPlayers?.filter(Boolean).length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 5 }}>⭐ Jucători cheie</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {team.keyPlayers.slice(0, 4).map((p, i) => <span key={i} style={C.tag(accent)}>{p}</span>)}
                          </div>
                        </div>
                      )}
                      {team?.injuries?.filter(Boolean).length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 5 }}>🤕 Accidentați</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {team.injuries.map((p, i) => <span key={i} style={C.tag("#ef4444")}>{p}</span>)}
                          </div>
                        </div>
                      )}
                      {team?.suspended?.filter(Boolean).length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 5 }}>🟥 Suspendați</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {team.suspended.map((p, i) => <span key={i} style={C.tag("#f59e0b")}>{p}</span>)}
                          </div>
                        </div>
                      )}
                      <div style={{ marginTop: 8, padding: "10px 12px", background: accent + "0a", borderRadius: 8, fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
                        💡 {team?.motivation}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ═══ PREMIUM SECTIONS - gated for free users ═══ */}

                {/* H2H */}
                {isPremium ? (
                  <div style={C.card}>
                    <div style={{ color: "#6ee7b7", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>⚔ Confruntări Directe</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18, textAlign: "center" }}>
                      {[
                        { l: match.homeTeam.shortName, v: analysis.h2h?.homeWins, c: "#10b981" },
                        { l: "Egaluri", v: analysis.h2h?.draws, c: "#f59e0b" },
                        { l: match.awayTeam.shortName, v: analysis.h2h?.awayWins, c: "#ef4444" }
                      ].map((s, i) => (
                        <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 12 }}>
                          <div style={{ fontSize: 30, fontWeight: 900, color: s.c }}>{s.v}</div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                    {(analysis.h2h?.lastMatches || []).map((m, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 11px", marginBottom: 6, background: "rgba(255,255,255,0.03)", borderRadius: 7, borderLeft: `3px solid ${m.winner === "home" ? "#10b981" : m.winner === "draw" ? "#f59e0b" : "#ef4444"}` }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{m.date}</span>
                        <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: 2 }}>{m.score}</span>
                        <span style={C.tag(m.winner === "home" ? "#10b981" : m.winner === "draw" ? "#f59e0b" : "#ef4444")}>
                          {m.winner === "home" ? match.homeTeam.shortName : m.winner === "draw" ? "Egal" : match.awayTeam.shortName}
                        </span>
                      </div>
                    ))}
                    <div style={{ marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
                      Medie goluri: <strong style={{ color: "white" }}>{analysis.h2h?.avgGoals}</strong> goluri / meci
                    </div>
                  </div>
                ) : (
                  <PremiumGate title="Confruntări Directe">
                    <div style={C.card}>
                      <div style={{ color: "#6ee7b7", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>⚔ Confruntări Directe</div>
                      <div style={{ height: 240, background: "rgba(255,255,255,0.02)" }} />
                    </div>
                  </PremiumGate>
                )}

                {/* Peste/Sub & Piețe Speciale */}
                {isPremium ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14, marginBottom: 16 }}>
                    <div style={C.card}>
                      <div style={{ color: "#6ee7b7", fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📈 Peste / Sub Goluri</div>
                      <Bar label="Peste 1.5 goluri" sub={`${Math.min(99, (analysis.predictions?.overUnder?.over25 || 52) + 20)}%`} pct={Math.min(99, (analysis.predictions?.overUnder?.over25 || 52) + 20)} color="#10b981" />
                      <Bar label="Peste 2.5 goluri" sub={`${analysis.predictions?.overUnder?.over25 || 52}%`} pct={analysis.predictions?.overUnder?.over25 || 52} color="#6ee7b7" />
                      <Bar label="Peste 3.5 goluri" sub={`${analysis.predictions?.overUnder?.over35 || 28}%`} pct={analysis.predictions?.overUnder?.over35 || 28} color="#f59e0b" />
                    </div>
                    <div style={C.card}>
                      <div style={{ color: "#6ee7b7", fontWeight: 700, fontSize: 14, marginBottom: 14 }}>🥅 Pariuri Speciale</div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                        {[
                          { l: "BTTS Da", v: analysis.predictions?.bothTeamsScore?.yes + "%", c: "#10b981" },
                          { l: "BTTS Nu", v: analysis.predictions?.bothTeamsScore?.no + "%", c: "#ef4444" }
                        ].map((x, i) => (
                          <div key={i} style={{ flex: 1, textAlign: "center", padding: "10px 6px", background: x.c + "12", borderRadius: 8, border: `1px solid ${x.c}33` }}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: x.c }}>{x.v}</div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{x.l}</div>
                          </div>
                        ))}
                      </div>
                      {[
                        { e: "🔄", l: "Repriza 1", v: analysis.predictions?.firstHalf },
                        { e: "⛳", l: "Cornere", v: analysis.predictions?.corners },
                        { e: "🟨", l: "Cartonașe", v: analysis.predictions?.cards }
                      ].map((x, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{x.e} {x.l}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "white", maxWidth: "58%", textAlign: "right" }}>{x.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <PremiumGate title="Peste/Sub, BTTS și alte pariuri">
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
                      <div style={C.card}><div style={{ height: 180 }}/></div>
                      <div style={C.card}><div style={{ height: 180 }}/></div>
                    </div>
                  </PremiumGate>
                )}

                {/* Value Bets - Premium */}
                {isPremium ? (
                  (analysis.valueBets || []).length > 0 && (
                    <div style={{ ...C.card, border: "1px solid rgba(99,102,241,0.2)", background: "rgba(99,102,241,0.03)" }}>
                      <div style={{ color: "#a5b4fc", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>💎 Cele Mai Bune Pariuri</div>
                      {analysis.valueBets.map((b, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", marginBottom: 8, background: "rgba(99,102,241,0.07)", borderRadius: 9, border: "1px solid rgba(99,102,241,0.15)" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{b.market}</div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{b.reason}</div>
                          </div>
                          <div style={{ textAlign: "center", flexShrink: 0 }}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: "#a5b4fc" }}>@ {b.odds}</div>
                            <span style={C.tag("#10b981")}>{b.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <PremiumGate title="💎 Cele Mai Bune Pariuri">
                    <div style={{ ...C.card, border: "1px solid rgba(99,102,241,0.2)" }}>
                      <div style={{ color: "#a5b4fc", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>💎 Cele Mai Bune Pariuri</div>
                      <div style={{ height: 200 }} />
                    </div>
                  </PremiumGate>
                )}

                {/* Analysis text - Premium */}
                {isPremium ? (
                  <div style={C.card}>
                    <div style={{ color: "#6ee7b7", fontWeight: 700, fontSize: 15, marginBottom: 12 }}>📋 Concluzia Analizei</div>
                    <p style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.75, fontSize: 14, margin: 0 }}>{analysis.analysisText}</p>
                  </div>
                ) : (
                  <PremiumGate title="Concluzia Analizei">
                    <div style={C.card}>
                      <div style={{ height: 120 }} />
                    </div>
                  </PremiumGate>
                )}

                {/* Upgrade CTA for free users */}
                {!isPremium && (
                  <div style={{
                    ...C.card,
                    background: "linear-gradient(135deg, rgba(251,191,36,0.1), rgba(245,158,11,0.05))",
                    border: "1px solid rgba(251,191,36,0.3)",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>💎</div>
                    <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8, color: "#fbbf24" }}>
                      Deblochează întreaga analiză
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 16, lineHeight: 1.6 }}>
                      Confruntări Directe · Peste/Sub · BTTS · Cele Mai Bune Pariuri<br/>
                      + analize nelimitate · Pontul Zilei · ROI Tracker · xG
                    </div>
                    <Link href="/upgrade" style={{
                      display: "inline-block", padding: "12px 24px", borderRadius: 10,
                      background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
                      color: "#1a1a1a", fontSize: 14, fontWeight: 800
                    }}>
                      💎 Upgrade Premium — $9.99/lună
                    </Link>
                  </div>
                )}

                {/* Disclaimer */}
                <div style={{ padding: "13px 16px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 11, textAlign: "center" }}>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0, lineHeight: 1.6 }}>
                    ⚠️ <strong style={{ color: "rgba(239,68,68,0.65)" }}>Atenție:</strong> {analysis.disclaimer || "Analiza este strict informativă. Pariurile implică riscuri financiare reale."} Jucați responsabil.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 40, color: "rgba(255,255,255,0.2)", fontSize: 11 }}>
          Pontul Meu 2026 · Operat de PDF 33 LLC
        </div>
      </div>
    </div>
  );
}
