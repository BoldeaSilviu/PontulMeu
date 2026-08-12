import crypto from "crypto";
import { NextResponse } from "next/server";
import { initDatabase, findUserByEmail, createPasswordResetToken } from "@/lib/db";
import { isValidEmail } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request) {
  try {
    await initDatabase();
    const { email } = await request.json();

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Adresă email invalidă" }, { status: 400 });
    }

    const user = await findUserByEmail(email);

    // Răspundem la fel indiferent dacă emailul există sau nu (fără enumerare de conturi)
    if (user && !user.blocked) {
      const token = crypto.randomBytes(32).toString("hex");
      await createPasswordResetToken(user.id, token);
      await sendPasswordResetEmail(user.email, user.first_name || user.name || "", token);
    }

    return NextResponse.json({
      message: "Dacă există un cont cu acest email, vei primi un link de resetare în câteva minute."
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Eroare la procesare" }, { status: 500 });
  }
}
