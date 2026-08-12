/**
 * API-Football integration
 * Docs: https://www.api-football.com/documentation-v3
 * Plan PRO: 7.500 req/zi, toate ligile + toate endpoint-urile
 */

const API_BASE = "https://v3.football.api-sports.io";

// League IDs - API-Football uses different IDs than football-data.org
export const LEAGUES = {
  // Europa majoră
  CL:  { id: 2,   name: "UEFA Champions League",    flag: "🌍", color: "#1e40af" },
  EL:  { id: 3,   name: "UEFA Europa League",       flag: "🌍", color: "#1e40af" },
  PL:  { id: 39,  name: "Premier League",           flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", color: "#3d195b" },
  PD:  { id: 140, name: "La Liga",                  flag: "🇪🇸", color: "#ee8707" },
  SA:  { id: 135, name: "Serie A",                  flag: "🇮🇹", color: "#024494" },
  BL1: { id: 78,  name: "Bundesliga",               flag: "🇩🇪", color: "#d20515" },
  FL1: { id: 61,  name: "Ligue 1",                  flag: "🇫🇷", color: "#091c3e" },
  DED: { id: 88,  name: "Eredivisie",               flag: "🇳🇱", color: "#e4002b" },
  PPL: { id: 94,  name: "Primeira Liga",            flag: "🇵🇹", color: "#006600" },
  ELC: { id: 40,  name: "Championship",             flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", color: "#ed1c24" },

  // LIGA 1 ROMÂNIA ⭐
  ROM: { id: 283, name: "Superliga România",        flag: "🇷🇴", color: "#fcd116" },

  // Alte populare
  BSA: { id: 71,  name: "Brasileirão",              flag: "🇧🇷", color: "#009c3b" },
  MLS: { id: 253, name: "Major League Soccer",      flag: "🇺🇸", color: "#002e5f" },
  MX:  { id: 262, name: "Liga MX",                  flag: "🇲🇽", color: "#006847" },
  AR:  { id: 128, name: "Liga Profesional Argentina", flag: "🇦🇷", color: "#74acdf" },
  TUR: { id: 203, name: "Süper Lig",                flag: "🇹🇷", color: "#e30a17" },
  SAU: { id: 307, name: "Saudi Pro League",         flag: "🇸🇦", color: "#006c35" },

  // Competiții naționale
  WC:  { id: 1,   name: "FIFA World Cup",           flag: "🏆", color: "#6b21a8" },
  EC:  { id: 4,   name: "UEFA Euro",                flag: "🇪🇺", color: "#003399" },
  NL:  { id: 5,   name: "UEFA Nations League",      flag: "🇪🇺", color: "#003399" },
};

/**
 * Base fetch helper with error handling
 */
async function apiFetch(endpoint, params = {}) {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    throw new Error("API_FOOTBALL_KEY nu este configurată");
  }

  const url = new URL(API_BASE + endpoint);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString(), {
    headers: {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": "v3.football.api-sports.io"
    },
    next: { revalidate: 60 }, // cache 1 min
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API-Football ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(`API-Football errors: ${JSON.stringify(data.errors)}`);
  }

  return data;
}

/**
 * Get fixtures (matches) for a league on a specific date
 */
export async function getFixtures({ leagueId, date, season }) {
  const params = {
    league: leagueId,
    date: date, // YYYY-MM-DD
  };
  if (season) params.season = season;
  else {
    // Auto-determine season
    const d = new Date(date);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    // European season runs Aug-May, so Jan-Jul is "year-1" season
    params.season = m >= 7 ? y : y - 1;
  }

  const data = await apiFetch("/fixtures", params);

  return (data.response || []).map((f) => formatFixture(f));
}

/**
 * Normalize a fixture response into our internal format
 */
function formatFixture(f) {
  const status = f.fixture.status?.short;
  let ourStatus = "SCHEDULED";
  if (["1H", "2H", "HT", "ET", "BT", "P", "LIVE"].includes(status)) ourStatus = "LIVE";
  else if (["FT", "AET", "PEN"].includes(status)) ourStatus = "FINISHED";
  else if (["PST", "CANC", "ABD", "AWD", "WO"].includes(status)) ourStatus = "POSTPONED";

  return {
    id: f.fixture.id,
    competition: f.league.name,
    leagueId: f.league.id,
    season: f.league.season,
    flag: null,
    utcDate: f.fixture.date,
    status: ourStatus,
    matchday: f.league.round?.match(/\d+/)?.[0] || null,
    stage: f.league.round,
    homeTeam: {
      id: f.teams.home.id,
      name: f.teams.home.name,
      shortName: shortenName(f.teams.home.name),
      crest: f.teams.home.logo,
      winner: f.teams.home.winner,
    },
    awayTeam: {
      id: f.teams.away.id,
      name: f.teams.away.name,
      shortName: shortenName(f.teams.away.name),
      crest: f.teams.away.logo,
      winner: f.teams.away.winner,
    },
    score: {
      home: f.goals.home,
      away: f.goals.away,
      halfTimeHome: f.score?.halftime?.home,
      halfTimeAway: f.score?.halftime?.away,
    },
    venue: f.fixture.venue?.name,
    referee: f.fixture.referee,
  };
}

/**
 * Shorten long team names for UI display
 */
function shortenName(name) {
  if (!name) return "TBD";
  return name
    .replace(/\bFC\b/g, "")
    .replace(/\bCF\b/g, "")
    .replace(/\bAC\b/g, "")
    .replace(/\bAFC\b/g, "")
    .replace(/\bSK\b/g, "")
    .replace(/\bCSM\b/g, "")
    .replace(/Club de /g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Get single fixture details by ID
 */
export async function getFixtureById(fixtureId) {
  const data = await apiFetch("/fixtures", { id: fixtureId });
  const f = data.response?.[0];
  if (!f) return null;
  return formatFixture(f);
}

/* ============================================================
 * DATE REALE PENTRU ANALIZA AI (Pontul Meu 2.0)
 * ============================================================ */

/**
 * Ultimele N meciuri jucate de o echipă (doar terminate)
 */
export async function getTeamLastFixtures(teamId, last = 5) {
  const data = await apiFetch("/fixtures", {
    team: teamId,
    last: last,
    status: "FT-AET-PEN",
  });
  return (data.response || []).map((f) => formatFixture(f));
}

/**
 * Statistici detaliate pentru un meci jucat (șuturi, posesie, cornere, xG)
 * Returnează { home: {...}, away: {...} } sau null
 */
export async function getFixtureStatistics(fixtureId) {
  try {
    const data = await apiFetch("/fixtures/statistics", { fixture: fixtureId });
    const resp = data.response || [];
    if (resp.length < 2) return null;

    const pick = (teamStats) => {
      const out = { teamId: teamStats.team?.id, teamName: teamStats.team?.name };
      (teamStats.statistics || []).forEach((s) => {
        const key = (s.type || "").toLowerCase();
        if (key === "total shots") out.shots = s.value;
        if (key === "shots on goal") out.shotsOnGoal = s.value;
        if (key === "ball possession") out.possession = s.value;
        if (key === "corner kicks") out.corners = s.value;
        if (key === "yellow cards") out.yellowCards = s.value;
        if (key === "red cards") out.redCards = s.value;
        if (key === "expected_goals") out.xG = s.value;
        if (key === "fouls") out.fouls = s.value;
      });
      return out;
    };

    return { home: pick(resp[0]), away: pick(resp[1]) };
  } catch {
    return null;
  }
}

/**
 * Confruntări directe între două echipe
 */
export async function getH2H(homeId, awayId, last = 8) {
  try {
    const data = await apiFetch("/fixtures/headtohead", {
      h2h: `${homeId}-${awayId}`,
      last: last,
    });
    return (data.response || []).map((f) => formatFixture(f));
  } catch {
    return [];
  }
}

/**
 * Clasamentul ligii. Returnează lista de echipe cu poziție, puncte, formă
 */
export async function getStandings(leagueId, season) {
  try {
    const data = await apiFetch("/standings", { league: leagueId, season });
    const table = data.response?.[0]?.league?.standings?.[0] || [];
    return table.map((row) => ({
      rank: row.rank,
      teamId: row.team?.id,
      teamName: row.team?.name,
      points: row.points,
      played: row.all?.played,
      win: row.all?.win,
      draw: row.all?.draw,
      lose: row.all?.lose,
      goalsFor: row.all?.goals?.for,
      goalsAgainst: row.all?.goals?.against,
      form: row.form, // ex: "WWDLW"
    }));
  } catch {
    return [];
  }
}

/**
 * Accidentați / indisponibili pentru un meci
 */
export async function getInjuries(fixtureId) {
  try {
    const data = await apiFetch("/injuries", { fixture: fixtureId });
    return (data.response || []).map((i) => ({
      teamId: i.team?.id,
      teamName: i.team?.name,
      player: i.player?.name,
      type: i.player?.type,   // "Missing Fixture"
      reason: i.player?.reason, // "Knee Injury", "Suspended", etc.
    }));
  } catch {
    return [];
  }
}

/**
 * Cote reale pentru un meci (1X2, Peste/Sub, BTTS)
 * Ia primul bookmaker disponibil din răspuns
 */
export async function getOdds(fixtureId) {
  try {
    const data = await apiFetch("/odds", { fixture: fixtureId });
    const entry = data.response?.[0];
    if (!entry) return null;

    const bookmaker = entry.bookmakers?.[0];
    if (!bookmaker) return null;

    const out = { bookmaker: bookmaker.name };

    (bookmaker.bets || []).forEach((bet) => {
      const name = (bet.name || "").toLowerCase();
      const vals = bet.values || [];
      const find = (v) =>
        vals.find((x) => String(x.value).toLowerCase() === v)?.odd;

      if (name === "match winner") {
        out.matchWinner = { home: find("home"), draw: find("draw"), away: find("away") };
      }
      if (name === "goals over/under") {
        out.overUnder = {
          over25: vals.find((x) => String(x.value) === "Over 2.5")?.odd,
          under25: vals.find((x) => String(x.value) === "Under 2.5")?.odd,
          over35: vals.find((x) => String(x.value) === "Over 3.5")?.odd,
          under35: vals.find((x) => String(x.value) === "Under 3.5")?.odd,
        };
      }
      if (name === "both teams score") {
        out.btts = { yes: find("yes"), no: find("no") };
      }
    });

    return out;
  } catch {
    return null;
  }
}

/**
 * Agregă ultimele meciuri ale unei echipe într-un rezumat compact,
 * cu statistici per meci (limitat la primele `withStats` meciuri pentru
 * a controla numărul de request-uri)
 */
export async function getTeamFormSummary(teamId, teamName, { last = 5, withStats = 5 } = {}) {
  const fixtures = await getTeamLastFixtures(teamId, last);

  const matches = [];
  let scored = 0;
  let conceded = 0;
  let btts = 0;
  let over25 = 0;
  const formLetters = [];

  for (let i = 0; i < fixtures.length; i++) {
    const fx = fixtures[i];
    const isHome = fx.homeTeam.id === teamId;
    const gf = isHome ? fx.score.home : fx.score.away;
    const ga = isHome ? fx.score.away : fx.score.home;

    scored += gf ?? 0;
    conceded += ga ?? 0;
    if ((fx.score.home ?? 0) > 0 && (fx.score.away ?? 0) > 0) btts++;
    if ((fx.score.home ?? 0) + (fx.score.away ?? 0) > 2.5) over25++;

    let result = "D";
    if (gf > ga) result = "W";
    else if (gf < ga) result = "L";
    formLetters.push(result);

    const match = {
      date: fx.utcDate?.slice(0, 10),
      opponent: isHome ? fx.awayTeam.name : fx.homeTeam.name,
      venue: isHome ? "acasă" : "deplasare",
      score: `${fx.score.home}-${fx.score.away}`,
      result,
      competition: fx.competition,
    };

    // Statistici detaliate doar pentru primele `withStats` meciuri
    if (i < withStats) {
      const stats = await getFixtureStatistics(fx.id);
      if (stats) {
        const own = isHome ? stats.home : stats.away;
        const opp = isHome ? stats.away : stats.home;
        match.stats = {
          shots: own?.shots,
          shotsOnGoal: own?.shotsOnGoal,
          possession: own?.possession,
          corners: own?.corners,
          xG: own?.xG,
          oppXG: opp?.xG,
          yellowCards: own?.yellowCards,
        };
      }
    }

    matches.push(match);
  }

  const n = fixtures.length || 1;
  return {
    teamId,
    teamName,
    recentForm: formLetters,
    avgScored: +(scored / n).toFixed(2),
    avgConceded: +(conceded / n).toFixed(2),
    bttsPct: Math.round((btts / n) * 100),
    over25Pct: Math.round((over25 / n) * 100),
    matches,
  };
}
