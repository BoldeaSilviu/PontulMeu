import { NextResponse } from "next/server";
import { getFixtureById } from "@/lib/api-football";

export async function GET(request, { params }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "ID meci lipsă" }, { status: 400 });
  }

  try {
    const match = await getFixtureById(id);
    if (!match) {
      return NextResponse.json({ error: "Meciul nu a fost găsit" }, { status: 404 });
    }
    return NextResponse.json({ match });
  } catch (err) {
    console.error("Match fetch error:", err);
    return NextResponse.json({
      error: err.message || "Eroare la încărcare meci",
    }, { status: 500 });
  }
}
