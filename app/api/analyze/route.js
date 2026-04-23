import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { initDatabase, countTodayAnalyses, isUserPremium, saveAnalysis } from "@/lib/db";

const FREE_DAILY_LIMIT = 1;

const SYSTEM_PROMPT = `Ești un analist expert în pariuri sportive cu peste 20 de ani de experiență. Cunoști fotbalul mondial în detaliu: echipe, jucători, forme, statistici, stiluri de joc, inclusiv Liga 1 România (Superliga).

Când primești date despre un meci, generezi o analiză completă și realistă bazată pe cunoștințele tale.

Respectă REGULI STRICTE:
- Răspunde EXCLUSIV cu un obiect JSON valid
- NICIUN text înainte sau după JSON
- FĂRĂ markdown, FĂRĂ backticks
- Primul caracter: {
- Ultimul caracter: }

Structura obligatorie:
{
  "match": {"home":"string","away":"string","league":"string","date":"string"},
  "homeTeam": {
    "recentForm": ["W","D","L","W","W"],
    "formScore": 7,
    "goalsScored": 1.8,
    "goalsConceded": 1.1,
    "keyPlayers": ["Player1","Player2","Player3"],
    "injuries": ["Player"],
    "suspended": [],
    "homeAdvantage": 7,
    "motivation": "Descriere motivație (RO)",
    "strengths": ["Puncte forte (RO)"],
    "weaknesses": ["Puncte slabe (RO)"],
    "xG": 1.65
  },
  "awayTeam": {
    "recentForm": ["L","W","D","L","W"],
    "formScore": 5,
    "goalsScored": 1.3,
    "goalsConceded": 1.7,
    "keyPlayers": ["Player A"],
    "injuries": [],
    "suspended": ["Player B"],
    "awayPerformance": 4,
    "motivation": "Descriere (RO)",
    "strengths": ["..."],
    "weaknesses": ["..."],
    "xG": 1.25
  },
  "h2h": {
    "totalMatches": 10,
    "homeWins": 5,
    "draws": 3,
    "awayWins": 2,
    "lastMatches": [
      {"date":"2024-11-10","score":"2-1","winner":"home"}
    ],
    "avgGoals": 2.5
  },
  "predictions": {
    "result1X2": {"home":55,"draw":25,"away":20},
    "recommendedBet": "1",
    "confidence": 68,
    "predictedScore": "2-0",
    "bothTeamsScore": {"yes":40,"no":60},
    "overUnder": {"over25":52,"under25":48,"over35":28,"under35":72},
    "firstHalf": "0-0 sau 1-0 gazdă",
    "corners": "9-11 cornere totale",
    "cards": "3-4 cartonașe"
  },
  "valueBets": [
    {"market":"Victorie Gazdă","odds":"1.85","value":"BUNĂ","reason":"Motiv (RO)"}
  ],
  "riskLevel": "MEDIU",
  "analysisText": "4 propoziții în română despre context, formă, motivație și pronostic.",
  "disclaimer": "Analiza este strict informativă. Pariurile implică riscuri financiare reale."
}

Valori posibile:
- recentForm: "W" (victorie), "D" (egal), "L" (înfrângere)
- winner în h2h: "home", "draw", "away"
- recommendedBet: "1", "X", sau "2"
- riskLevel: "SCĂZUT", "MEDIU", sau "RIDICAT"
- value în valueBets: "EXCELENTĂ", "BUNĂ", "MEDIE"`;

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      error: "ANTHROPIC_API_KEY nu este configurată"
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

    // 4. Build prompt
    let userContent = `Analizează meciul: ${homeTeam} (gazdă) vs ${awayTeam} (oaspete)`;
    if (league) userContent += `\nCompetiție: ${league}`;
    if (date) userContent += `\nDată: ${date}`;
    if (status) userContent += `\nStatus: ${status}`;
    if (score && (score.home !== null && score.home !== undefined)) {
      userContent += `\nScor final real: ${score.home}-${score.away}`;
    }
    userContent += `\n\nGenerează analiza JSON completă bazată pe cunoștințele tale despre aceste echipe.`;

    // 5. Call Claude
    const anthropic = new Anthropic({ apiKey });
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 3000,
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
        error: "Răspuns gol de la AI",
        stop_reason: msg.stop_reason
      }, { status: 500 });
    }

    // 6. Parse JSON robustly
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
        error: "Răspuns AI invalid",
        preview: raw.slice(0, 300),
      }, { status: 500 });
    }

    // 7. Save to history
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

    // 8. Build response with isPremium flag (frontend decides what to show)
    return NextResponse.json({
      ...parsed,
      _meta: {
        isPremium,
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
