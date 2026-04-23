import { NextResponse } from "next/server";
import { getFixtures, LEAGUES } from "@/lib/api-football";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const competition = searchParams.get("competition");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  // List competitions
  if (!competition) {
    return NextResponse.json({ competitions: LEAGUES });
  }

  const league = LEAGUES[competition];
  if (!league) {
    return NextResponse.json({ error: "Ligă invalidă" }, { status: 400 });
  }

  try {
    const date = dateFrom || dateTo || new Date().toISOString().split("T")[0];
    const matches = await getFixtures({
      leagueId: league.id,
      date,
    });

    return NextResponse.json({
      competition: league.name,
      count: matches.length,
      matches: matches.map(m => ({ ...m, flag: league.flag })),
    });
  } catch (err) {
    console.error("Matches fetch error:", err);
    return NextResponse.json({
      error: err.message || "Eroare la încărcare meciuri",
    }, { status: 500 });
  }
}
