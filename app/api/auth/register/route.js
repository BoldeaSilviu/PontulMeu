import { NextResponse } from "next/server";
import { initDatabase, findUserByEmail, createUser } from "@/lib/db";
import { hashPassword, createToken, setAuthCookie, isValidEmail, isValidPassword } from "@/lib/auth";

export async function POST(request) {
  try {
    await initDatabase();

    const body = await request.json();
    const { email, password, name } = body;

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Adresă email invalidă" }, { status: 400 });
    }
    if (!isValidPassword(password)) {
      return NextResponse.json({ error: "Parola trebuie să aibă minim 8 caractere" }, { status: 400 });
    }
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Numele trebuie să aibă minim 2 caractere" }, { status: 400 });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Există deja un cont cu acest email" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({ email, passwordHash, name: name.trim() });

    const token = createToken(user.id);
    setAuthCookie(token);

    const { password_hash, ...safeUser } = user;
    return NextResponse.json({
      user: safeUser,
      message: "Cont creat! Ai 7 zile de încercare Premium gratuit."
    });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({
      error: "Eroare la înregistrare",
      details: err.message
    }, { status: 500 });
  }
}
