"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "./components/Header";
import { useAuth } from "./components/AuthProvider";

// Leagues - match API-Football codes in lib/api-football.js
const LEAGUES = [
  { code: "ROM", name: "Superliga România",        flag: "🇷🇴", color: "#fcd116", featured: true },
  { code: "CL",  name: "UEFA Champions League",    flag: "🌍", color: "#1e40af" },
  { code: "EL",  name: "UEFA Europa League",       flag: "🌍", color: "#1e40af" },
  { code: "PL",  name: "Premier League",           flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", color: "#3d195b" },
  { code: "PD",  name: "La Liga",                  flag: "🇪🇸", color: "#ee8707" },
  { code: "SA",  name: "Serie A",                  flag: "🇮🇹", color: "#024494" },
  { code: "BL1", name: "Bundesliga",               flag: "🇩🇪", color: "#d20515" },
  { code: "FL1", name: "Ligue 1",                  flag: "🇫🇷", color: "#091c3e" },
  { code: "DED", name: "Eredivisie",               flag: "🇳🇱", color: "#e4002b" },
  { code: "PPL", name: "Primeira Liga",            flag: "🇵🇹", color: "#006600" },
  { code: "ELC", name: "Championship",             flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", color: "#ed1c24" },
  { code: "BSA", name: "Brasileirão",              flag: "🇧🇷", color: "#009c3b" },
  { code: "MLS", name: "MLS",                      flag: "🇺🇸", color: "#002e5f" },
  { code: "TUR", name: "Süper Lig",                flag: "🇹🇷", color: "#e30a17" },
];

function formatDateISO(d) { return d.toISOString().split("T")[0]; }

function statusStyle(status) {
  switch (status) {
    case "LIVE":
    case "IN_PLAY":
    case "PAUSED":
      return { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)", color: "#fca5a5", label: "🔴 LIVE", pulse: true };
    case "FINISHED":
      return { bg: "rgba(107,114,128,0.15)", border: "rgba(107,114,128,0.3)", color: "#d1d5db", label: "✓ TERMINAT" };
    case "POSTPONED":
    case "SUSPENDED":
    case "CANCELLED":
      return { bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.3)", color: "#fde68a", label: "⚠ AMÂNAT" };
    default:
      return { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)", color: "#6ee7b7", label: "⏱ PROGRAMAT" };
  }
}

function WelcomeToast({ show, onDismiss }) {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", top: 80, left: 16, right: 16, zIndex: 100, maxWidth: 500, margin: "0 auto",
      background: "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(99,102,241,0.15))",
      backdropFilter: "blur(12px)", border: "1px solid rgba(16,185,129,0.35)",
      borderRadius: 14, padding: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      animation: "slideUp 0.4s ease"
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <span style={{ fontSize: 30, flexShrink: 0 }}>🎉</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: "#6ee7b7" }}>
            Bine ai venit!
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
            Ai primit <strong>7 zile Premium GRATUIT</strong> pentru a testa toate funcțiile.
          </div>
        </div>
        <button onClick={onDismiss} style={{
          background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 7, padding: "6px 10px", color: "rgba(255,255,255,0.7)",
          fontSize: 12, cursor: "pointer"
        }}>✕</button>
      </div>
    </div>
  );
}

function MatchCard({ match, leagueCode }) {
  const s = statusStyle(match.status);
  const dt = new Date(match.utcDate);
  const timeStr = dt.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
  const hasScore = match.score?.home !== null && match.score?.home !== undefined;

  return (
    <Link href={`/match/${match.id}?competition=${leagueCode}`} style={{ display: "block", marginBottom: 10 }}>
      <div style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12, padding: "14px 16px", transition: "all 0.2s", cursor: "pointer"
      }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(16,185,129,0.06)";
          e.currentTarget.style.borderColor = "rgba(16,185,129,0.3)";
          e.currentTarget.style.transform = "translateX(4px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          e.currentTarget.style.transform = "translateX(0)";
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{
            background: s.bg, border: `1px solid ${s.border}`, color: s.color,
            padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
            animation: s.pulse ? "pulse 1.5s ease-in-out infinite" : "none"
          }}>{s.label}</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
            {timeStr}{match.matchday ? ` · Etapa ${match.matchday}` : ""}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end", textAlign: "right" }}>
            <span style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{match.homeTeam.shortName}</span>
            {match.homeTeam.crest && <img src={match.homeTeam.crest} alt="" style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }} />}
          </div>

          <div style={{ textAlign: "center", minWidth: 60 }}>
            {hasScore ? (
              <div style={{
                background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                borderRadius: 7, padding: "4px 10px", fontSize: 16, fontWeight: 900, letterSpacing: 1
              }}>
                {match.score.home} - {match.score.away}
              </div>
            ) : (
              <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 14, fontWeight: 900 }}>VS</span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {match.awayTeam.crest && <img src={match.awayTeam.crest} alt="" style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }} />}
            <span style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{match.awayTeam.shortName}</span>
          </div>
        </div>

        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)",
                      display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
            {match.venue || match.stage || "—"}
          </span>
          <span style={{ fontSize: 11, color: "#6ee7b7", fontWeight: 600 }}>
            Analiză AI →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const { user, quota } = useAuth();
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [welcome, setWelcome] = useState(false);

  // Calendar state
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  const MONTHS_RO = ["Ianuarie","Februarie","Martie","Aprilie","Mai","Iunie","Iulie","August","Septembrie","Octombrie","Noiembrie","Decembrie"];
  const DAYS_RO = ["L","Ma","Mi","J","V","S","D"];

  function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
  function firstDayOffset(y, m) { const d = new Date(y, m, 1).getDay(); return (d + 6) % 7; }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  const todayISO = formatDateISO(new Date());

  // Show welcome if URL has ?welcome=1
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("welcome")) {
      setWelcome(true);
      window.history.replaceState({}, "", "/");
      setTimeout(() => setWelcome(false), 8000);
    }
  }, []);

  async function fetchMatches(leagueCode, date) {
    setLoading(true); setError(""); setMatches([]);
    try {
      const iso = formatDateISO(date);
      const params = new URLSearchParams({ competition: leagueCode, dateFrom: iso, dateTo: iso });
      const res = await fetch(`/api/matches?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Eroare la încărcare");
      setMatches(data.matches || []);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (selectedLeague) fetchMatches(selectedLeague.code, selectedDate);
  }, [selectedLeague, selectedDate]);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#060c18 0%,#0a1628 50%,#07111e 100%)" }}>
      <WelcomeToast show={welcome} onDismiss={() => setWelcome(false)} />

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 16px 60px" }}>
        <Header />

        {/* Quota bar for logged-in free users */}
        {user && !user.isPremium && quota && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)",
            borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12
          }}>
            <span style={{ color: "rgba(255,255,255,0.7)" }}>
              📊 Analize astăzi: <strong style={{ color: "white" }}>{quota.used}/{quota.limit}</strong>
            </span>
            <Link href="/upgrade" style={{
              color: "#fbbf24", fontWeight: 700, fontSize: 12,
              display: "flex", alignItems: "center", gap: 4
            }}>
              💎 Upgrade
            </Link>
          </div>
        )}

        {!selectedLeague && (
          <div className="fade">
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
                Alege o competiție pentru a vedea meciurile disponibile. Apoi selectează data și meciul pentru analiza AI detaliată.
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
              {LEAGUES.map((l) => (
                <button key={l.code}
                  onClick={() => setSelectedLeague(l)}
                  style={{
                    background: l.featured
                      ? "linear-gradient(135deg, rgba(252,209,22,0.08), rgba(252,209,22,0.03))"
                      : "rgba(255,255,255,0.04)",
                    border: l.featured
                      ? "1px solid rgba(252,209,22,0.3)"
                      : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12, padding: 16, cursor: "pointer",
                    transition: "all 0.2s", textAlign: "left", color: "white", position: "relative"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = l.color;
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = l.featured ? "rgba(252,209,22,0.3)" : "rgba(255,255,255,0.08)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {l.featured && (
                    <span style={{
                      position: "absolute", top: 8, right: 10,
                      fontSize: 9, letterSpacing: 1, fontWeight: 800, color: "#fcd116",
                      background: "rgba(252,209,22,0.1)", padding: "2px 6px", borderRadius: 99
                    }}>
                      🇷🇴 RO
                    </span>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 32 }}>{l.flag}</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{l.name}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Meciuri disponibile →</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedLeague && (
          <div className="fade">
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12, padding: "12px 16px", marginBottom: 18
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 26 }}>{selectedLeague.flag}</span>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1.5, textTransform: "uppercase" }}>Competiție</div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{selectedLeague.name}</div>
                </div>
              </div>
              <button onClick={() => { setSelectedLeague(null); setMatches([]); }}
                style={{
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, padding: "8px 14px", color: "rgba(255,255,255,0.7)",
                  fontSize: 12, cursor: "pointer", fontFamily: "Georgia,serif"
                }}>
                Schimbă
              </button>
            </div>

            {/* Calendar */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10, paddingLeft: 4 }}>
                Alege data
              </div>
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14, padding: "16px 14px"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <button onClick={prevMonth} style={{
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8, padding: "8px 12px", color: "white", cursor: "pointer",
                    fontSize: 16, fontWeight: 700
                  }}>‹</button>
                  <div style={{ textAlign: "center", fontWeight: 700, fontSize: 15 }}>
                    {MONTHS_RO[viewMonth]} {viewYear}
                  </div>
                  <button onClick={nextMonth} style={{
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8, padding: "8px 12px", color: "white", cursor: "pointer",
                    fontSize: 16, fontWeight: 700
                  }}>›</button>
                </div>

                <button onClick={() => {
                  const now = new Date();
                  setViewYear(now.getFullYear()); setViewMonth(now.getMonth()); setSelectedDate(now);
                }} style={{
                  width: "100%", marginBottom: 12, padding: "8px 12px",
                  background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
                  borderRadius: 8, color: "#6ee7b7", cursor: "pointer",
                  fontSize: 12, fontWeight: 700, fontFamily: "Georgia,serif", letterSpacing: 1
                }}>📅 AZI</button>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 6 }}>
                  {DAYS_RO.map((d, i) => (
                    <div key={i} style={{
                      textAlign: "center", fontSize: 10,
                      color: i >= 5 ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.35)",
                      fontWeight: 700, letterSpacing: 0.5, padding: "4px 0"
                    }}>{d}</div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
                  {Array.from({ length: firstDayOffset(viewYear, viewMonth) }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth(viewYear, viewMonth) }).map((_, i) => {
                    const day = i + 1;
                    const d = new Date(viewYear, viewMonth, day);
                    const dISO = formatDateISO(d);
                    const isSelected = dISO === formatDateISO(selectedDate);
                    const isToday = dISO === todayISO;
                    const dayOfWeek = d.getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    return (
                      <button key={day}
                        onClick={() => setSelectedDate(d)}
                        style={{
                          aspectRatio: "1",
                          background: isSelected
                            ? "linear-gradient(135deg,#10b981,#059669)"
                            : isToday ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${isSelected ? "#10b981" : isToday ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.06)"}`,
                          borderRadius: 8,
                          color: isSelected ? "white" : isWeekend ? "rgba(239,68,68,0.7)" : "white",
                          cursor: "pointer", fontSize: 14,
                          fontWeight: isSelected || isToday ? 800 : 500,
                          fontFamily: "Georgia,serif",
                          boxShadow: isSelected ? "0 4px 14px rgba(16,185,129,0.35)" : "none",
                          transition: "all 0.15s"
                        }}>
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              {loading && (
                <div style={{ textAlign: "center", padding: 48, color: "rgba(255,255,255,0.5)" }}>
                  <div style={{
                    width: 32, height: 32, border: "3px solid rgba(16,185,129,0.2)",
                    borderTop: "3px solid #10b981", borderRadius: "50%",
                    animation: "spin 0.8s linear infinite", margin: "0 auto 14px"
                  }} />
                  Se încarcă meciurile...
                </div>
              )}

              {error && (
                <div style={{
                  padding: "14px 16px", background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10,
                  color: "#fca5a5", fontSize: 13, lineHeight: 1.5
                }}>⚠️ {error}</div>
              )}

              {!loading && !error && matches.length === 0 && (
                <div style={{
                  textAlign: "center", padding: 48,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 12,
                  color: "rgba(255,255,255,0.5)"
                }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Niciun meci</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
                    Nu sunt meciuri programate în această zi.<br/>
                    Încearcă o altă dată sau competiție.
                  </div>
                </div>
              )}

              {!loading && matches.length > 0 && (
                <>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10, paddingLeft: 4 }}>
                    {matches.length} {matches.length === 1 ? "meci" : "meciuri"}
                  </div>
                  {matches.map((m) => <MatchCard key={m.id} match={m} leagueCode={selectedLeague.code} />)}
                </>
              )}
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 40, color: "rgba(255,255,255,0.2)", fontSize: 11 }}>
          <div style={{ marginBottom: 8 }}>
            <Link href="/termeni" style={{ color: "rgba(255,255,255,0.35)", marginRight: 16 }}>Termeni</Link>
            <Link href="/confidentialitate" style={{ color: "rgba(255,255,255,0.35)" }}>Confidențialitate</Link>
          </div>
          Pontul Meu 2026 · Operat de PDF 33 LLC
        </div>
      </div>
    </div>
  );
}
