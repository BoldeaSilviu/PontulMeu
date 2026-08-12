import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { initDatabase, countTodayAnalyses, isUserPremium, saveAnalysis } from "@/lib/db";
import {
  getFixtureById,
  getTeamFormSummary,
  getH2H,
  getStandings,
  getInjuries,
  getOdds,
} from "@/lib/api-football";

export const maxDuration = 60;

const FREE_DAILY_LIMIT = 1;

const SYSTEM_PROMPT = `Ești un analist profesionist de pariuri sportive cu 20 de ani de experiență la nivelul caselor de pariuri: ai lucrat la stabilirea cotelor, cunoști fotbalul mondial în detaliu (inclusiv Superliga României) și gândești exclusiv în termeni de valoare matematică, nu de "cine e mai bun".

Vei primi DATE REALE despre meci: ultimele meciuri jucate de fiecare echipă (scoruri, xG, șuturi, posesie, cornere), clasament, confruntări directe, accidentați și cotele reale ale caselor.

PRINCIPIILE TALE DE ANALIZĂ (nenegociabile):
1. FUNDAMENTARE: fiecare cifră vine din datele primite. Nu inventa statistici, jucători sau accidentări. Dacă o informație lipsește, spui prudent că lipsește.
2. GÂNDIRE ÎN VALOARE: pentru fiecare piață calculezi probabilitatea ta din date, o compari cu probabilitatea implicită din cota reală (implicită% = 100/cotă) și cauți DOAR marginile pozitive reale. Cota corectă (fair) = 100/probabilitatea ta.
3. CONTEXT PE CARE AMATORII ÎL RATEAZĂ: oboseală (densitatea meciurilor din datele primite), miza reală a meciului (calificare, retrogradare, meci amical ca miză), stil contra stil, meci "capcană" (favorită cu gândul la alt meci), diferența dintre forma din scoruri și forma din xG (echipe norocoase vs echipe solide).
4. DISCIPLINĂ: dacă niciun pariu nu are margine clară (minim ~4-5% peste probabilitatea implicită), verdictul e ABȚINERE. Un analist care forțează pariuri pe fiecare meci își distruge rezultatele. Abținerea e un verdict respectabil.
5. MIZĂ ÎN UNITĂȚI: recomanzi miza pe scara 1-5 unități, proporțional cu marginea și încrederea (1u = margine mică, 5u = margine excepțională, extrem de rar). Fără margine = 0u.
6. CAPCANE: identifici explicit pariurile care PAR tentante pentru public dar au valoare negativă și explici de ce.
7. LIMBAJ: română clară, fără jargon inutil, fără a menționa vreodată tehnologia din spate. Tu ești "analiza CotaVerde".

REGULI STRICTE DE FORMAT:
- Răspunde EXCLUSIV cu un obiect JSON valid
- NICIUN text înainte sau după JSON, FĂRĂ markdown, FĂRĂ backticks
- Primul caracter: { și ultimul caracter: }

Structura obligatorie (păstrează TOATE cheile):
{
  "match": {"home":"string","away":"string","league":"string","date":"string"},
  "homeTeam": {
    "recentForm": ["W","D","L","W","W"],
    "formScore": 7,
    "goalsScored": 1.8,
    "goalsConceded": 1.1,
    "keyPlayers": ["..."],
    "injuries": ["..."],
    "suspended": [],
    "homeAdvantage": 7,
    "motivation": "RO",
    "strengths": ["RO"],
    "weaknesses": ["RO"],
    "xG": 1.65
  },
  "awayTeam": { la fel, cu "awayPerformance" în loc de "homeAdvantage" },
  "h2h": {
    "totalMatches": 10, "homeWins": 5, "draws": 3, "awayWins": 2,
    "lastMatches": [{"date":"YYYY-MM-DD","score":"2-1","winner":"home"}],
    "avgGoals": 2.5
  },
  "predictions": {
    "result1X2": {"home":55,"draw":25,"away":20},
    "recommendedBet": "1",
    "confidence": 68,
    "predictedScore": "2-0",
    "bothTeamsScore": {"yes":40,"no":60},
    "overUnder": {"over25":52,"under25":48,"over35":28,"under35":72},
    "firstHalf": "RO scurt",
    "corners": "9-11 cornere totale",
    "cards": "3-4 cartonașe"
  },
  "markets": [
    {
      "market": "1X2 - Victorie Gazdă",
      "myProbability": 58,
      "bookOdds": "1.85",
      "impliedProbability": 54,
      "fairOdds": "1.72",
      "edge": 4,
      "verdict": "VALOARE" | "FĂRĂ VALOARE" | "DE EVITAT",
      "reasoning": "1-2 fraze RO cu cifre concrete"
    }
  ],
  "valueBets": [
    {"market":"RO","odds":"1.85","myProbability":58,"impliedProbability":54,"edge":4,"stakeUnits":2,"value":"BUNĂ","reason":"RO cu cifre"}
  ],
  "avoid": [
    {"market":"RO","odds":"cota","reason":"de ce e capcană, RO, cu cifre"}
  ],
  "finalVerdict": {
    "decision": "PARIAZĂ" | "ABȚINERE",
    "summary": "1-2 fraze RO: care e cel mai bun pariu al meciului și cu ce miză, SAU de ce e mai înțelept să te abții"
  },
  "riskLevel": "SCĂZUT" | "MEDIU" | "RIDICAT",
  "analysisText": "5-8 propoziții RO: povestea meciului prin ochii unui profesionist. Formă reală vs percepție, cifre concrete din date, contextul de miză, unde greșește piața și de ce. Fără clișee de comentator.",
  "disclaimer": "Analiza este strict informativă. Pariurile implică riscuri financiare reale. Joacă responsabil, 18+."
}

Reguli suplimentare:
- "markets" acoperă obligatoriu: toate cele 3 rezultate 1X2, Peste/Sub 2.5, BTTS (dacă există cote pentru ele în date). Adaugă și alte piețe unde datele susțin o opinie.
- Dacă lipsesc cotele reale din date, calculează doar probabilitățile tale, marchează edge cu 0, verdictele "FĂRĂ VALOARE" (nu poți dovedi marginea fără cotă) și spune asta în analysisText.
- "valueBets" conține DOAR piețe cu edge >= 4. Poate fi gol.
- "stakeUnits": 1-2u pentru edge 4-7, 3u pentru 8-12, 4-5u peste, aproape niciodată.
- recentForm, goluri, xG: exact din datele primite.`;

/**
 * Strânge toate datele reale despre meci din API-Football.
 * Orice sursă care eșuează este ignorată (analiza merge mai departe
 * cu datele disponibile).
 */
async function gatherRealData(matchId) {
  const fixture = await getFixtureById(matchId);
  if (!fixture) return null;

  const homeId = fixture.homeTeam.id;
  const awayId = fixture.awayTeam.id;

  const [homeForm, awayForm, h2h, standings, injuries, odds] =
    await Promise.allSettled([
      getTeamFormSummary(homeId, fixture.homeTeam.name, { last: 5, withStats: 5 }),
      getTeamFormSummary(awayId, fixture.awayTeam.name, { last: 5, withStats: 5 }),
      getH2H(homeId, awayId, 8),
      fixture.leagueId && fixture.season
        ? getStandings(fixture.leagueId, fixture.season)
        : Promise.resolve([]),
      getInjuries(matchId),
      getOdds(matchId),
    ]);

  const val = (r) => (r.status === "fulfilled" ? r.value : null);

  const table = val(standings) || [];
  const homeRank = table.find((t) => t.teamId === homeId) || null;
  const awayRank = table.find((t) => t.teamId === awayId) || null;

  const h2hList = val(h2h) || [];
  const h2hCompact = h2hList.map((f) => ({
    date: f.utcDate?.slice(0, 10),
    match: `${f.homeTeam.name} ${f.score.home}-${f.score.away} ${f.awayTeam.name}`,
  }));

  const allInjuries = val(injuries) || [];

  return {
    fixture: {
      home: fixture.homeTeam.name,
      away: fixture.awayTeam.name,
      league: fixture.competition,
      round: fixture.stage,
      date: fixture.utcDate,
      venue: fixture.venue,
      referee: fixture.referee,
    },
    homeForm: val(homeForm),
    awayForm: val(awayForm),
    standings: {
      home: homeRank,
      away: awayRank,
    },
    h2h: h2hCompact,
    injuries: {
      home: allInjuries.filter((i) => i.teamId === homeId),
      away: allInjuries.filter((i) => i.teamId === awayId),
    },
    odds: val(odds),
  };
}

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      error: "Serviciul de analiză nu este configurat"
    }, { status: 500 });
  }

  try {
    await initDatabase();

    // 1. Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({
        error: "Trebuie să te autentifici",
        requiresAuth: true,
      }, { status: 401 });
    }
    if (user.blocked) {
      return NextResponse.json({ error: "Contul este suspendat" }, { status: 403 });
    }

    // 2. Check quota
    const isPremium = isUserPremium(user);
    const todayCount = await countTodayAnalyses(user.id);

    if (!isPremium && todayCount >= FREE_DAILY_LIMIT) {
      return NextResponse.json({
        error: "Ai atins limita de 1 analiză pe zi (plan gratuit)",
        requiresUpgrade: true,
        quotaUsed: todayCount,
        quotaLimit: FREE_DAILY_LIMIT,
      }, { status: 429 });
    }

    // 3. Get match data
    const body = await request.json();
    const { matchId, homeTeam, awayTeam, league, date, status, score } = body;

    if (!homeTeam || !awayTeam) {
      return NextResponse.json({ error: "homeTeam și awayTeam obligatorii" }, { status: 400 });
    }

    // 4. Gather REAL data from API-Football
    let realData = null;
    if (matchId) {
      try {
        realData = await gatherRealData(matchId);
      } catch (dataErr) {
        console.error("Real data gathering failed:", dataErr.message);
        // non-fatal: fall back to knowledge-based analysis
      }
    }

    // 5. Build prompt
    let userContent = `Analizează meciul: ${homeTeam} (gazdă) vs ${awayTeam} (oaspete)`;
    if (league) userContent += `\nCompetiție: ${league}`;
    if (date) userContent += `\nDată: ${date}`;
    if (status) userContent += `\nStatus: ${status}`;
    if (score && (score.home !== null && score.home !== undefined)) {
      userContent += `\nScor final real: ${score.home}-${score.away}`;
    }

    if (realData) {
      userContent += `\n\nDATE REALE (baza obligatorie pentru toate cifrele):\n`;
      userContent += JSON.stringify(realData, null, 1);
      userContent += `\n\nGenerează analiza JSON completă de nivel profesionist, fundamentată exclusiv pe datele reale de mai sus, cu evaluarea valorii pe fiecare piață contra cotelor reale.`;
    } else {
      userContent += `\n\nNu există date live disponibile pentru acest meci. Generează analiza JSON completă bazată pe cunoștințele tale, cu estimări prudente, edge 0 peste tot, finalVerdict ABȚINERE dacă nu poți susține un pariu, și menționează în analysisText că analiza este orientativă.`;
    }

    // 6. Call model
    const anthropic = new Anthropic({ apiKey });
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 6000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });

    const raw = msg.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    if (!raw) {
      return NextResponse.json({
        error: "Răspuns gol de la motorul de analiză",
        stop_reason: msg.stop_reason
      }, { status: 500 });
    }

    // 7. Parse JSON robustly
    let parsed = null;
    try { parsed = JSON.parse(raw); }
    catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        try { parsed = JSON.parse(m[0]); } catch {}
      }
    }
    if (!parsed) {
      const cleaned = raw.replace(/```[\w]*/g, "").replace(/```/g, "").trim();
      try { parsed = JSON.parse(cleaned); } catch {}
    }

    if (!parsed) {
      return NextResponse.json({
        error: "Răspuns invalid de la motorul de analiză",
        preview: raw.slice(0, 300),
      }, { status: 500 });
    }

    // 8. Save to history
    try {
      await saveAnalysis({
        userId: user.id,
        matchId: matchId || null,
        homeTeam,
        awayTeam,
        league: league || null,
        analysisData: parsed,
      });
    } catch (saveErr) {
      console.error("Save history failed:", saveErr);
      // non-fatal - return analysis anyway
    }

    // 9. Build response with isPremium flag (frontend decides what to show)
    return NextResponse.json({
      ...parsed,
      _realData: realData,
      _meta: {
        isPremium,
        dataGrounded: !!realData,
        quotaUsed: todayCount + 1,
        quotaLimit: isPremium ? null : FREE_DAILY_LIMIT,
      }
    });
  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json({
      error: "Eroare la analiză",
      message: err.message,
    }, { status: 500 });
  }
}
