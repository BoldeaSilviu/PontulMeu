import { NextResponse } from "next/server";
import { initDatabase, findUserByEmail } from "@/lib/db";
import { verifyPassword, createToken, setAuthCookie } from "@/lib/auth";

export async function POST(request) {
  try {
    await initDatabase();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email și parolă obligatorii" }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user || !user.password_hash) {
      return NextResponse.json({ error: "Email sau parolă incorecte" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Email sau parolă incorecte" }, { status: 401 });
    }

    const token = createToken(user.id);
    setAuthCookie(token);

    const { password_hash, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Eroare la autentificare" }, { status: 500 });
  }
}
