"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "./components/Header";
import { useAuth } from "./components/AuthProvider";

// Leagues - match API-Football codes in lib/api-football.js
const LEAGUES = [
  { code: "ROM", name: "Superliga", flag: "🇷🇴", featured: true },
  { code: "CL",  name: "Champions League", flag: "🏆" },
  { code: "EL",  name: "Europa League", flag: "🥈" },
  { code: "PL",  name: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { code: "PD",  name: "La Liga", flag: "🇪🇸" },
  { code: "SA",  name: "Serie A", flag: "🇮🇹" },
  { code: "BL1", name: "Bundesliga", flag: "🇩🇪" },
  { code: "FL1", name: "Ligue 1", flag: "🇫🇷" },
  { code: "DED", name: "Eredivisie", flag: "🇳🇱" },
  { code: "PPL", name: "Primeira Liga", flag: "🇵🇹" },
  { code: "ELC", name: "Championship", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { code: "BSA", name: "Brasileirão", flag: "🇧🇷" },
  { code: "MLS", name: "MLS", flag: "🇺🇸" },
  { code: "TUR", name: "Süper Lig", flag: "🇹🇷" },
];

function formatDateISO(d) { return d.toISOString().split("T")[0]; }

function statusBadge(status) {
  switch (status) {
    case "LIVE":
    case "IN_PLAY":
    case "PAUSED":
      return { cls: "cv-badge-red", label: "LIVE", pulse: true };
    case "FINISHED":
      return { cls: "cv-badge-muted", label: "TERMINAT" };
    case "POSTPONED":
    case "SUSPENDED":
    case "CANCELLED":
      return { cls: "cv-badge-gold-outline", label: "AMÂNAT" };
    default:
      return { cls: "cv-badge-green", label: "PROGRAMAT" };
  }
}

function WelcomeToast({ show, onDismiss }) {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", top: 80, left: 16, right: 16, zIndex: 100, maxWidth: 460, margin: "0 auto",
      animation: "slideUp 0.4s ease"
    }} className="cv-ticket">
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <span style={{ fontSize: 26, flexShrink: 0 }}>🎉</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: "var(--green)" }}>
            Bine ai venit la CotaVerde!
          </div>
          <div style={{ fontSize: 12.5, color: "var(--muted2)", lineHeight: 1.5 }}>
            Ai <strong style={{ color: "var(--text)" }}>7 zile de Premium gratuit</strong>.
            Alege un meci și vezi prima analiză pe date reale.
          </div>
        </div>
        <button onClick={onDismiss} className="cv-btn-ghost cv-btn-sm">✕</button>
      </div>
    </div>
  );
}

function MatchCard({ match, leagueCode }) {
  const s = statusBadge(match.status);
  const dt = new Date(match.utcDate);
  const timeStr = dt.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
  const hasScore = match.score?.home !== null && match.score?.home !== undefined;

  return (
    <Link href={`/match/${match.id}?competition=${leagueCode}`} style={{ display: "block" }}>
      <div className="cv-card cv-hover" style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span className={`cv-badge ${s.cls}`}>
            {s.pulse && <span className="cv-pulse cv-pulse-red" style={{ width: 6, height: 6 }} />}
            {s.label}
          </span>
          <span className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>
            {timeStr}{match.matchday ? ` · Et. ${match.matchday}` : ""}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end", textAlign: "right" }}>
            <span style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.2 }}>{match.homeTeam.shortName}</span>
            {match.homeTeam.crest && <img src={match.homeTeam.crest} alt="" style={{ width: 30, height: 30, objectFit: "contain", flexShrink: 0 }} />}
          </div>

          <div style={{ textAlign: "center", minWidth: 62 }}>
            {hasScore ? (
              <div className="mono" style={{
                background: "var(--green-soft)", border: "1px solid rgba(43,232,121,0.3)",
                borderRadius: 8, padding: "5px 12px", fontSize: 16, fontWeight: 700, color: "var(--green)"
              }}>
                {match.score.home}-{match.score.away}
              </div>
            ) : (
              <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>vs</span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {match.awayTeam.crest && <img src={match.awayTeam.crest} alt="" style={{ width: 30, height: 30, objectFit: "contain", flexShrink: 0 }} />}
            <span style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.2 }}>{match.awayTeam.shortName}</span>
          </div>
        </div>

        <div style={{
          marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{match.venue || match.competition}</span>
          <span style={{ fontSize: 12.5, color: "var(--green)", fontWeight: 700 }}>
            Vezi verdictul →
          </span>
        </div>
      </div>
    </Link>
  );
}

function DayStrip({ selectedDate, onSelect }) {
  const days = [];
  const today = new Date();
  for (let i = -3; i <= 10; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  const DAYS_RO = ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"];
  const selISO = formatDateISO(selectedDate);
  const todayISO = formatDateISO(today);

  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, scrollbarWidth: "thin" }}>
      {days.map((d) => {
        const iso = formatDateISO(d);
        const active = iso === selISO;
        const isToday = iso === todayISO;
        return (
          <button
            key={iso}
            onClick={() => onSelect(d)}
            style={{
              flexShrink: 0, minWidth: 58, padding: "9px 6px", borderRadius: 11,
              background: active ? "var(--green)" : "var(--card)",
              border: `1px solid ${active ? "var(--green)" : isToday ? "rgba(43,232,121,0.4)" : "var(--border)"}`,
              color: active ? "#0B120E" : "var(--text)",
              textAlign: "center", transition: "all 0.15s ease"
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 600, opacity: active ? 0.8 : 0.55, marginBottom: 2 }}>
              {isToday ? "AZI" : DAYS_RO[d.getDay()]}
            </div>
            <div className="mono" style={{ fontSize: 15, fontWeight: 700 }}>{d.getDate()}</div>
          </button>
        );
      })}
    </div>
  );
}

export default function Home() {
  const { user, quota } = useAuth();
  const [selectedLeague, setSelectedLeague] = useState(LEAGUES[0]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [welcome, setWelcome] = useState(false);

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

  const tickerItems = LEAGUES.map((l) => `${l.flag} ${l.name}`).join("  ·  ");

  return (
    <div style={{ minHeight: "100vh" }}>
      <WelcomeToast show={welcome} onDismiss={() => setWelcome(false)} />
      <Header />

      <div className="cv-ticker">
        <div className="cv-ticker-inner">
          <span style={{ paddingRight: 40 }}>{tickerItems}</span>
          <span style={{ paddingRight: 40 }}>{tickerItems}</span>
        </div>
      </div>

      <main className="cv-container" style={{ paddingTop: 26 }}>
        {/* Hero */}
        {!user && (
          <div className="fade" style={{ textAlign: "center", padding: "28px 0 34px" }}>
            <h1 style={{ fontSize: "clamp(26px, 5vw, 38px)", fontWeight: 800, lineHeight: 1.2, marginBottom: 12 }}>
              Analize de fotbal pe <span style={{ color: "var(--green)" }}>date reale</span>.<br />
              Verdicte pe care le poți <span style={{ color: "var(--gold)" }}>verifica</span>.
            </h1>
            <p style={{ fontSize: 15, color: "var(--muted2)", maxWidth: 560, margin: "0 auto 22px", lineHeight: 1.7 }}>
              Formă, xG, confruntări directe și cotele caselor, analizate ca de un profesionist.
              Fără bilete șterse, fără promisiuni goale.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/register" className="cv-btn">Începe gratuit · 7 zile Premium</Link>
              <Link href="/login" className="cv-btn-ghost" style={{ display: "inline-flex", alignItems: "center" }}>Am deja cont</Link>
            </div>
          </div>
        )}

        {/* Quota bar for logged-in free users */}
        {user && quota && quota.limit && (
          <div className="fade" style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "var(--card2)", border: "1px solid var(--border)",
            borderRadius: 11, padding: "11px 15px", marginBottom: 18, fontSize: 12.5
          }}>
            <span style={{ color: "var(--muted2)" }}>
              Analize astăzi: <strong className="mono" style={{ color: "var(--text)" }}>{quota.used}/{quota.limit}</strong>
            </span>
            <Link href="/upgrade" style={{ color: "var(--gold)", fontWeight: 700, fontSize: 12.5 }}>
              Treci la Premium →
            </Link>
          </div>
        )}

        {/* League selector */}
        <div className="fade" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, letterSpacing: 1.2, marginBottom: 10 }}>
            COMPETIȚIA
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
            {LEAGUES.map((l) => {
              const active = selectedLeague?.code === l.code;
              return (
                <button
                  key={l.code}
                  onClick={() => setSelectedLeague(l)}
                  style={{
                    flexShrink: 0, display: "flex", alignItems: "center", gap: 7,
                    padding: "9px 15px", borderRadius: 999, fontSize: 13, fontWeight: 600,
                    background: active ? "var(--green)" : "var(--card)",
                    border: `1px solid ${active ? "var(--green)" : "var(--border)"}`,
                    color: active ? "#0B120E" : "var(--muted2)",
                    transition: "all 0.15s ease"
                  }}
                >
                  <span>{l.flag}</span>
                  {l.name}
                  {l.featured && !active && <span style={{ color: "var(--gold)", fontSize: 11 }}>★</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day strip */}
        <div className="fade" style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, letterSpacing: 1.2, marginBottom: 10 }}>
            ZIUA
          </div>
          <DayStrip selectedDate={selectedDate} onSelect={setSelectedDate} />
        </div>

        {/* Matches */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="cv-skeleton" style={{ height: 118, borderRadius: 14 }} />
            ))}
          </div>
        )}

        {error && <div className="cv-error">{error}</div>}

        {!loading && !error && matches.length === 0 && (
          <div className="cv-card fade" style={{ textAlign: "center", padding: 36, color: "var(--muted)" }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>📅</div>
            Niciun meci în {selectedLeague?.name} în ziua selectată.<br />
            <span style={{ fontSize: 12.5 }}>Încearcă altă zi sau altă competiție.</span>
          </div>
        )}

        {!loading && matches.length > 0 && (
          <div className="cv-stagger" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {matches.map((m) => (
              <MatchCard key={m.id} match={m} leagueCode={selectedLeague.code} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
