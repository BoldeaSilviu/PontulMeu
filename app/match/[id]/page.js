"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Header from "../../components/Header";
import { useAuth } from "../../components/AuthProvider";

/* ─── Small UI pieces ──────────────────────────────────────── */

function CountUp({ value, suffix = "", duration = 1200, className = "", style = {} }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const end = Number(value) || 0;
    let start = null;
    let raf;
    function step(t) {
      if (!start) start = t;
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(end * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span ref={ref} className={`mono ${className}`} style={style}>{display}{suffix}</span>;
}

function ProbBar({ label, pct, highlight = false, delay = 0 }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 12.5, color: highlight ? "var(--text)" : "var(--muted)", fontWeight: highlight ? 600 : 400 }}>
          {label}
        </span>
        <CountUp value={pct} suffix="%" style={{ fontSize: 13, fontWeight: 700, color: highlight ? "var(--green)" : "var(--muted2)" }} />
      </div>
      <div className="cv-bar-track">
        <div
          className="cv-bar-fill"
          style={{
            "--w": `${pct}%`,
            background: highlight ? "var(--green)" : "#3A5548",
            animationDelay: `${delay}ms`
          }}
        />
      </div>
    </div>
  );
}

function FormDots({ seq = [] }) {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {seq.map((r, i) => {
        const cls = r === "W" ? "cv-dot-w" : r === "L" ? "cv-dot-l" : "cv-dot-d";
        const label = r === "W" ? "V" : r === "L" ? "Î" : "E";
        return <span key={i} className={`cv-form-dot ${cls}`}>{label}</span>;
      })}
    </div>
  );
}

function SectionTitle({ children, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
      <h2 style={{ fontSize: 16.5, fontWeight: 800 }}>{children}</h2>
      {right}
    </div>
  );
}

function PremiumGate({ children, title }) {
  return (
    <div style={{ position: "relative", marginBottom: 16 }}>
      <div style={{ filter: "blur(7px)", pointerEvents: "none", userSelect: "none", opacity: 0.45 }}>
        {children}
      </div>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        alignItems: "center", justifyContent: "center", borderRadius: 14
      }}>
        <div className="cv-card" style={{
          border: "1px solid rgba(232,179,59,0.4)", textAlign: "center",
          maxWidth: 300, background: "rgba(17,27,21,0.92)", backdropFilter: "blur(8px)"
        }}>
          <div style={{ fontSize: 26, marginBottom: 8 }}>🔒</div>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, color: "var(--gold)" }}>{title}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14, lineHeight: 1.5 }}>
            Deschide tot cu CotaVerde Premium
          </div>
          <Link href="/upgrade" className="cv-btn cv-btn-gold cv-btn-sm" style={{ display: "inline-flex" }}>
            Treci la Premium
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────── */

export default function MatchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, refresh } = useAuth();
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
    "Citesc ultimele meciuri jucate...",
    "Calculez forma reală din xG și șuturi...",
    "Verific clasamentul și absențele...",
    "Studiez confruntările directe...",
    "Compar probabilitățile cu cotele caselor...",
    "Caut marginile de valoare...",
    "Scriu verdictul final..."
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
    const interval = setInterval(() => setStageIdx((s) => Math.min(s + 1, stages.length - 1)), 2400);
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
        refresh();
      }
    } catch (e) {
      setError(e.message);
    }
    clearInterval(interval);
    setLoadingAnalysis(false);
  }

  const p = analysis?.predictions;
  const bestBet = p?.recommendedBet;
  const verdictLabel = bestBet === "1" ? `1 · ${match?.homeTeam?.shortName}` : bestBet === "X" ? "X · Egal" : `2 · ${match?.awayTeam?.shortName}`;

  return (
    <div style={{ minHeight: "100vh" }}>
      <Header />
      <main className="cv-container" style={{ paddingTop: 20 }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--muted2)", marginBottom: 16 }}>
          ← Înapoi la meciuri
        </Link>

        {loadingMatch && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="cv-skeleton" style={{ height: 150, borderRadius: 16 }} />
            <div className="cv-skeleton" style={{ height: 60, borderRadius: 14 }} />
          </div>
        )}

        {error && !match && <div className="cv-error">{error}</div>}

        {match && (
          <div className="fade">
            {/* Match header */}
            <div className="cv-card" style={{ textAlign: "center", marginBottom: 16 }}>
              <div className="mono" style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 1.5, marginBottom: 14 }}>
                {match.competition?.toUpperCase()} · {new Date(match.utcDate).toLocaleString("ro-RO", { dateStyle: "medium", timeStyle: "short" })}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 14, alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  {match.homeTeam.crest && <img src={match.homeTeam.crest} alt="" style={{ width: 54, height: 54, objectFit: "contain" }} />}
                  <div style={{ fontSize: "clamp(14px,3.5vw,19px)", fontWeight: 800, lineHeight: 1.2 }}>{match.homeTeam.name}</div>
                  <span className="cv-badge cv-badge-green">GAZDĂ</span>
                </div>

                <div>
                  {match.score?.home !== null && match.score?.home !== undefined ? (
                    <div className="mono" style={{ fontSize: 30, fontWeight: 800, color: "var(--green)" }}>
                      {match.score.home}-{match.score.away}
                    </div>
                  ) : (
                    <div style={{ fontSize: 18, fontWeight: 700, color: "var(--muted)" }}>vs</div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  {match.awayTeam.crest && <img src={match.awayTeam.crest} alt="" style={{ width: 54, height: 54, objectFit: "contain" }} />}
                  <div style={{ fontSize: "clamp(14px,3.5vw,19px)", fontWeight: 800, lineHeight: 1.2 }}>{match.awayTeam.name}</div>
                  <span className="cv-badge cv-badge-gold-outline">OASPETE</span>
                </div>
              </div>

              {match.venue && (
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 12 }}>{match.venue}</div>
              )}
            </div>

            {/* Run analysis */}
            {!analysis && !loadingAnalysis && !quotaExceeded && (
              <div className="cv-card-accent" style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span className="cv-pulse" />
                  <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--green)", letterSpacing: 1.5 }}>
                    VERDICTUL COTAVERDE
                  </span>
                </div>
                <p style={{ fontSize: 14, color: "var(--muted2)", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 18px" }}>
                  Ultimele meciuri cu xG și statistici, clasament, confruntări directe, absențe și cotele caselor,
                  analizate piață cu piață în căutarea valorii reale.
                </p>
                <button onClick={runAnalysis} className="cv-btn">
                  Generează analiza completă
                </button>
              </div>
            )}

            {loadingAnalysis && (
              <div className="cv-card-accent" style={{ textAlign: "center", marginBottom: 16, padding: 32 }}>
                <div style={{
                  width: 40, height: 40, border: "3px solid var(--green-dim)",
                  borderTop: "3px solid var(--green)", borderRadius: "50%",
                  animation: "spin 0.8s linear infinite", margin: "0 auto 18px"
                }} />
                <div className="mono" style={{ fontSize: 13.5, color: "var(--green)", marginBottom: 14, minHeight: 20 }}>
                  {stages[stageIdx]}
                </div>
                <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
                  {stages.map((_, i) => (
                    <span key={i} style={{
                      width: 22, height: 4, borderRadius: 2,
                      background: i <= stageIdx ? "var(--green)" : "var(--green-dim)",
                      transition: "background 0.4s ease"
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 16 }}>
                  Durează 20-40 de secunde, strângem date reale din mai multe surse.
                </div>
              </div>
            )}

            {quotaExceeded && (
              <div className="cv-card" style={{ border: "1px solid rgba(232,179,59,0.4)", textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>Ți-ai folosit analiza gratuită de azi</div>
                <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16, lineHeight: 1.6 }}>
                  Planul gratuit include 1 analiză pe zi. Cu Premium ai analize nelimitate, toate piețele și Biletul Verde.
                </p>
                <Link href="/upgrade" className="cv-btn cv-btn-gold" style={{ display: "inline-flex" }}>
                  Vezi Premium
                </Link>
              </div>
            )}

            {error && match && <div className="cv-error" style={{ marginBottom: 16 }}>{error}</div>}

            {/* ═══ ANALYSIS ═══ */}
            {analysis && (
              <div className="cv-stagger">

                {/* Verdict */}
                <div className="cv-card-accent" style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span className="cv-pulse" />
                      <span className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: "var(--green)", letterSpacing: 1.5 }}>
                        VERDICTUL COTAVERDE
                      </span>
                    </span>
                    <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
                      încredere <CountUp value={p?.confidence} suffix="%" style={{ color: "var(--text)", fontWeight: 700 }} />
                    </span>
                  </div>

                  <ProbBar label={`1 · ${match.homeTeam.shortName}`} pct={p?.result1X2?.home || 0} highlight={bestBet === "1"} delay={0} />
                  <ProbBar label="X · Egal" pct={p?.result1X2?.draw || 0} highlight={bestBet === "X"} delay={120} />
                  <ProbBar label={`2 · ${match.awayTeam.shortName}`} pct={p?.result1X2?.away || 0} highlight={bestBet === "2"} delay={240} />

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 16 }}>
                    <div className="cv-card2" style={{ textAlign: "center" }}>
                      <div className="mono" style={{ fontSize: 17, fontWeight: 700 }}>{p?.predictedScore || "-"}</div>
                      <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 3 }}>Scor estimat</div>
                    </div>
                    <div className="cv-card2" style={{ textAlign: "center" }}>
                      <CountUp value={p?.overUnder?.over25 || 0} suffix="%" style={{ fontSize: 17, fontWeight: 700, color: "var(--green)" }} />
                      <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 3 }}>Peste 2.5</div>
                    </div>
                    <div className="cv-card2" style={{ textAlign: "center" }}>
                      <CountUp value={p?.bothTeamsScore?.yes || 0} suffix="%" style={{ fontSize: 17, fontWeight: 700 }} />
                      <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 3 }}>Ambele marchează</div>
                    </div>
                  </div>

                  {analysis.finalVerdict && (
                    <div style={{
                      marginTop: 16, padding: "13px 15px", borderRadius: 11,
                      background: analysis.finalVerdict.decision === "PARIAZĂ" ? "var(--green-soft)" : "var(--gold-soft)",
                      border: `1px solid ${analysis.finalVerdict.decision === "PARIAZĂ" ? "rgba(43,232,121,0.3)" : "rgba(232,179,59,0.3)"}`
                    }}>
                      <span className="mono" style={{
                        fontSize: 11, fontWeight: 700, letterSpacing: 1,
                        color: analysis.finalVerdict.decision === "PARIAZĂ" ? "var(--green)" : "var(--gold)"
                      }}>
                        {analysis.finalVerdict.decision === "PARIAZĂ" ? "▶ PARIAZĂ" : "◼ ABȚINERE"}
                      </span>
                      <p style={{ fontSize: 13.5, color: "var(--muted2)", lineHeight: 1.65, marginTop: 6 }}>
                        {analysis.finalVerdict.summary}
                      </p>
                    </div>
                  )}
                </div>

                {/* Biletul Verde */}
                {(analysis.valueBets || []).length > 0 && (
                  isPremium ? (
                    <div style={{ marginBottom: 16 }}>
                      <SectionTitle right={<span className="cv-badge cv-badge-gold-outline">VALOARE MATEMATICĂ</span>}>
                        🎫 Biletul Verde
                      </SectionTitle>
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {analysis.valueBets.map((b, i) => (
                          <div key={i} className="cv-ticket">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                              <span style={{ fontWeight: 800, fontSize: 15 }}>{b.market}</span>
                              <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--green)", whiteSpace: "nowrap" }}>
                                @ {b.odds}
                              </span>
                            </div>
                            {(b.myProbability || b.impliedProbability) && (
                              <div className="mono" style={{ fontSize: 11.5, color: "var(--muted2)", marginTop: 4 }}>
                                verdict {b.myProbability}% vs casă {b.impliedProbability}%
                              </div>
                            )}
                            <hr className="cv-ticket-divider" />
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 12.5, color: "var(--muted2)", lineHeight: 1.5, flex: 1, minWidth: 180 }}>{b.reason}</span>
                              <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                {b.stakeUnits ? (
                                  <span className="cv-badge cv-badge-green">MIZĂ {b.stakeUnits}u</span>
                                ) : null}
                                {b.edge ? (
                                  <span className="cv-badge cv-badge-gold">+{b.edge}%</span>
                                ) : (
                                  <span className="cv-badge cv-badge-gold">{b.value}</span>
                                )}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <PremiumGate title="Biletul Verde">
                      <div className="cv-ticket" style={{ height: 130 }} />
                    </PremiumGate>
                  )
                )}

                {/* Markets table */}
                {(analysis.markets || []).length > 0 && (
                  isPremium ? (
                    <div className="cv-card" style={{ marginBottom: 16 }}>
                      <SectionTitle>📊 Piețele, una câte una</SectionTitle>
                      <div style={{ overflowX: "auto" }}>
                        <table className="cv-table" style={{ minWidth: 560 }}>
                          <thead>
                            <tr>
                              <th>Piața</th>
                              <th>Verdict %</th>
                              <th>Cota</th>
                              <th>Cota justă</th>
                              <th>Margine</th>
                              <th>Concluzie</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analysis.markets.map((m, i) => {
                              const good = m.verdict === "VALOARE";
                              const bad = m.verdict === "DE EVITAT";
                              return (
                                <tr key={i}>
                                  <td style={{ fontWeight: 600, fontSize: 12.5 }}>{m.market}</td>
                                  <td className="mono">{m.myProbability}%</td>
                                  <td className="mono">{m.bookOdds || "-"}</td>
                                  <td className="mono" style={{ color: "var(--muted)" }}>{m.fairOdds || "-"}</td>
                                  <td className="mono" style={{ color: m.edge > 0 ? "var(--green)" : "var(--muted)", fontWeight: 700 }}>
                                    {m.edge > 0 ? `+${m.edge}%` : `${m.edge || 0}%`}
                                  </td>
                                  <td>
                                    <span className={`cv-badge ${good ? "cv-badge-green" : bad ? "cv-badge-red" : "cv-badge-muted"}`}>
                                      {m.verdict}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <PremiumGate title="Analiza pe piețe">
                      <div className="cv-card" style={{ height: 190 }} />
                    </PremiumGate>
                  )
                )}

                {/* Avoid / traps */}
                {(analysis.avoid || []).length > 0 && (
                  isPremium ? (
                    <div style={{ marginBottom: 16 }}>
                      <SectionTitle>🚫 Capcanele meciului</SectionTitle>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {analysis.avoid.map((a, i) => (
                          <div key={i} className="cv-ticket cv-ticket-red">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--red)" }}>{a.market}</span>
                              {a.odds && <span className="mono" style={{ fontSize: 13, color: "var(--muted)" }}>@ {a.odds}</span>}
                            </div>
                            <p style={{ fontSize: 12.5, color: "var(--muted2)", lineHeight: 1.55, marginTop: 6 }}>{a.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <PremiumGate title="Capcanele meciului">
                      <div className="cv-ticket cv-ticket-red" style={{ height: 100 }} />
                    </PremiumGate>
                  )
                )}

                {/* Teams form */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 16 }}>
                  {[
                    { team: analysis.homeTeam, name: match.homeTeam.name, label: "GAZDĂ", badgeCls: "cv-badge-green" },
                    { team: analysis.awayTeam, name: match.awayTeam.name, label: "OASPETE", badgeCls: "cv-badge-gold-outline" },
                  ].map(({ team, name, label, badgeCls }, idx) => team && (
                    <div key={idx} className="cv-card">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <span style={{ fontWeight: 800, fontSize: 14.5 }}>{name}</span>
                        <span className={`cv-badge ${badgeCls}`}>{label}</span>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Forma · ultimele {team.recentForm?.length || 5}</div>
                        <FormDots seq={team.recentForm || []} />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                        <div className="cv-card2" style={{ textAlign: "center", padding: 10 }}>
                          <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--green)" }}>{team.goalsScored ?? "-"}</div>
                          <div style={{ fontSize: 10, color: "var(--muted)" }}>marcate/meci</div>
                        </div>
                        <div className="cv-card2" style={{ textAlign: "center", padding: 10 }}>
                          <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--red)" }}>{team.goalsConceded ?? "-"}</div>
                          <div style={{ fontSize: 10, color: "var(--muted)" }}>primite/meci</div>
                        </div>
                        <div className="cv-card2" style={{ textAlign: "center", padding: 10 }}>
                          <div className="mono" style={{ fontSize: 15, fontWeight: 700 }}>{team.xG ?? "-"}</div>
                          <div style={{ fontSize: 10, color: "var(--muted)" }}>xG mediu</div>
                        </div>
                      </div>

                      {(team.injuries?.length > 0 || team.suspended?.length > 0) && (
                        <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 10, lineHeight: 1.6 }}>
                          {team.injuries?.length > 0 && <div>🏥 Absenți: {team.injuries.join(", ")}</div>}
                          {team.suspended?.length > 0 && <div>🟥 Suspendați: {team.suspended.join(", ")}</div>}
                        </div>
                      )}

                      <p style={{ fontSize: 12.5, color: "var(--muted2)", lineHeight: 1.6 }}>{team.motivation}</p>
                    </div>
                  ))}
                </div>

                {/* H2H */}
                {analysis.h2h && analysis.h2h.totalMatches > 0 && (
                  <div className="cv-card" style={{ marginBottom: 16 }}>
                    <SectionTitle>⚔️ Confruntări directe</SectionTitle>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
                      <div className="cv-card2" style={{ textAlign: "center" }}>
                        <CountUp value={analysis.h2h.homeWins} style={{ fontSize: 20, fontWeight: 700, color: "var(--green)" }} />
                        <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 3 }}>{match.homeTeam.shortName}</div>
                      </div>
                      <div className="cv-card2" style={{ textAlign: "center" }}>
                        <CountUp value={analysis.h2h.draws} style={{ fontSize: 20, fontWeight: 700, color: "var(--gold)" }} />
                        <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 3 }}>Egaluri</div>
                      </div>
                      <div className="cv-card2" style={{ textAlign: "center" }}>
                        <CountUp value={analysis.h2h.awayWins} style={{ fontSize: 20, fontWeight: 700, color: "var(--red)" }} />
                        <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 3 }}>{match.awayTeam.shortName}</div>
                      </div>
                    </div>
                    {(analysis.h2h.lastMatches || []).slice(0, 5).map((m, i) => (
                      <div key={i} style={{
                        display: "flex", justifyContent: "space-between", padding: "8px 2px",
                        borderBottom: "1px solid var(--border)", fontSize: 12.5
                      }}>
                        <span className="mono" style={{ color: "var(--muted)" }}>{m.date}</span>
                        <span className="mono" style={{ fontWeight: 700 }}>{m.score}</span>
                        <span className={`cv-badge ${m.winner === "home" ? "cv-badge-green" : m.winner === "away" ? "cv-badge-red" : "cv-badge-muted"}`}>
                          {m.winner === "home" ? "GAZDĂ" : m.winner === "away" ? "OASPETE" : "EGAL"}
                        </span>
                      </div>
                    ))}
                    <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 10, textAlign: "center" }}>
                      Medie: <strong className="mono" style={{ color: "var(--text)" }}>{analysis.h2h.avgGoals}</strong> goluri / meci
                    </div>
                  </div>
                )}

                {/* Goals & specials */}
                <div className="cv-card" style={{ marginBottom: 16 }}>
                  <SectionTitle>🥅 Goluri și piețe speciale</SectionTitle>
                  <ProbBar label="Peste 1.5 goluri" pct={Math.min(99, (p?.overUnder?.over25 || 52) + 20)} highlight delay={0} />
                  <ProbBar label="Peste 2.5 goluri" pct={p?.overUnder?.over25 || 0} delay={100} />
                  <ProbBar label="Peste 3.5 goluri" pct={p?.overUnder?.over35 || 0} delay={200} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
                    {[
                      { l: "Repriza 1", v: p?.firstHalf },
                      { l: "Cornere", v: p?.corners },
                      { l: "Cartonașe", v: p?.cards },
                    ].map((row, i) => row.v && (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "7px 2px", borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
                        <span style={{ color: "var(--muted)" }}>{row.l}</span>
                        <span style={{ fontWeight: 600 }}>{row.v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conclusion */}
                <div className="cv-card" style={{ marginBottom: 16 }}>
                  <SectionTitle right={
                    <span className={`cv-badge ${analysis.riskLevel === "SCĂZUT" ? "cv-badge-green" : analysis.riskLevel === "RIDICAT" ? "cv-badge-red" : "cv-badge-gold-outline"}`}>
                      RISC {analysis.riskLevel}
                    </span>
                  }>
                    📋 Concluzia analistului
                  </SectionTitle>
                  <p style={{ color: "var(--muted2)", lineHeight: 1.8, fontSize: 14 }}>{analysis.analysisText}</p>
                  {analysis._meta?.dataGrounded === false && (
                    <div style={{ marginTop: 12, fontSize: 12, color: "var(--gold)" }}>
                      ⚠ Analiză orientativă: nu am avut date live pentru acest meci.
                    </div>
                  )}
                </div>

                <div style={{
                  fontSize: 11.5, color: "var(--muted)", textAlign: "center", lineHeight: 1.7,
                  padding: "12px 16px", background: "var(--red-soft)", border: "1px solid rgba(232,91,91,0.2)", borderRadius: 10
                }}>
                  {analysis.disclaimer || "Analiza este strict informativă. Pariurile implică riscuri financiare reale."} Joacă responsabil, 18+.
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
