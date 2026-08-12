import crypto from "crypto";
import { NextResponse } from "next/server";
import {
  initDatabase,
  findUserByEmail,
  createUser,
  createEmailVerificationToken,
} from "@/lib/db";
import { hashPassword, createToken, setAuthCookie, isValidEmail, isValidPassword } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

function isValidPhone(phone) {
  // Cifre, spații, +, minim 9 cifre (acceptă formate RO și internaționale)
  if (typeof phone !== "string") return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
}

function ageFromBirthDate(birthDate) {
  const bd = new Date(birthDate);
  if (isNaN(bd.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - bd.getFullYear();
  const m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
  return age;
}

export async function POST(request) {
  try {
    await initDatabase();

    const body = await request.json();
    const { email, password, firstName, lastName, phone, birthDate } = body;

    // Toate câmpurile sunt obligatorii
    if (!firstName || firstName.trim().length < 2) {
      return NextResponse.json({ error: "Prenumele este obligatoriu (minim 2 caractere)" }, { status: 400 });
    }
    if (!lastName || lastName.trim().length < 2) {
      return NextResponse.json({ error: "Numele este obligatoriu (minim 2 caractere)" }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Adresă email invalidă" }, { status: 400 });
    }
    if (!isValidPhone(phone)) {
      return NextResponse.json({ error: "Număr de telefon invalid" }, { status: 400 });
    }
    if (!birthDate) {
      return NextResponse.json({ error: "Data nașterii este obligatorie" }, { status: 400 });
    }

    const age = ageFromBirthDate(birthDate);
    if (age === null) {
      return NextResponse.json({ error: "Data nașterii este invalidă" }, { status: 400 });
    }
    if (age < 18) {
      return NextResponse.json({
        error: "Trebuie să ai cel puțin 18 ani pentru a folosi CotaVerde. Conținutul despre pariuri este destinat exclusiv adulților."
      }, { status: 403 });
    }
    if (age > 120) {
      return NextResponse.json({ error: "Data nașterii este invalidă" }, { status: 400 });
    }

    if (!isValidPassword(password)) {
      return NextResponse.json({ error: "Parola trebuie să aibă minim 8 caractere" }, { status: 400 });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Există deja un cont cu acest email" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      email,
      passwordHash,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      birthDate,
    });

    // Email de confirmare (nu blocăm înregistrarea dacă emailul eșuează)
    try {
      const verifyToken = crypto.randomBytes(32).toString("hex");
      await createEmailVerificationToken(user.id, verifyToken);
      await sendVerificationEmail(user.email, user.first_name, verifyToken);
    } catch (mailErr) {
      console.error("Verification email failed:", mailErr.message);
    }

    const token = createToken(user.id);
    setAuthCookie(token);

    const { password_hash, ...safeUser } = user;
    return NextResponse.json({
      user: safeUser,
      message: "Cont creat! Verifică-ți emailul pentru confirmare. Ai 7 zile de Premium gratuit."
    });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({
      error: "Eroare la înregistrare",
      details: err.message
    }, { status: 500 });
  }
}
