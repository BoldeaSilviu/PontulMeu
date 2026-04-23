/**
 * API-Football integration
 * Docs: https://www.api-football.com/documentation-v3
 * Plan Basic: 75.000 req/zi, toate ligile majore + Liga 1 RO
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
    },
    awayTeam: {
      id: f.teams.away.id,
      name: f.teams.away.name,
      shortName: shortenName(f.teams.away.name),
      crest: f.teams.away.logo,
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
