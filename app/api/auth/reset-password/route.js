import { NextResponse } from "next/server";
import { initDatabase, findValidResetToken, consumeResetToken } from "@/lib/db";
import { hashPassword, isValidPassword } from "@/lib/auth";

export async function POST(request) {
  try {
    await initDatabase();
    const { token, password } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token lipsă" }, { status: 400 });
    }
    if (!isValidPassword(password)) {
      return NextResponse.json({ error: "Parola trebuie să aibă minim 8 caractere" }, { status: 400 });
    }

    const row = await findValidResetToken(token);
    if (!row) {
      return NextResponse.json({
        error: "Linkul de resetare este invalid sau a expirat. Cere unul nou."
      }, { status: 400 });
    }

    const newHash = await hashPassword(password);
    await consumeResetToken(row.id, row.user_id, newHash);

    return NextResponse.json({ message: "Parola a fost schimbată. Te poți autentifica." });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Eroare la resetare" }, { status: 500 });
  }
}
