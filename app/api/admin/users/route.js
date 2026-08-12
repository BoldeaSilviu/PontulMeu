export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { initDatabase, isUserAdmin, listUsers, adminStats, setUserBlocked, setUserPremium } from "@/lib/db";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !isUserAdmin(user)) return null;
  return user;
}

export async function GET(request) {
  try {
    await initDatabase();
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Acces interzis" }, { status: 403 });
    }

    const search = new URL(request.url).searchParams.get("search") || "";
    const [users, stats] = await Promise.all([listUsers({ search }), adminStats()]);

    return NextResponse.json({ users, stats });
  } catch (err) {
    console.error("Admin users GET error:", err);
    return NextResponse.json({ error: "Eroare la încărcare" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await initDatabase();
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Acces interzis" }, { status: 403 });
    }

    const { userId, action } = await request.json();
    if (!userId || !action) {
      return NextResponse.json({ error: "userId și action obligatorii" }, { status: 400 });
    }
    if (Number(userId) === Number(admin.id) && (action === "block")) {
      return NextResponse.json({ error: "Nu îți poți bloca propriul cont" }, { status: 400 });
    }

    switch (action) {
      case "block":
        await setUserBlocked(userId, true);
        break;
      case "unblock":
        await setUserBlocked(userId, false);
        break;
      case "premium_on":
        await setUserPremium(userId, true);
        break;
      case "premium_off":
        await setUserPremium(userId, false);
        break;
      default:
        return NextResponse.json({ error: "Acțiune necunoscută" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin users PATCH error:", err);
    return NextResponse.json({ error: "Eroare la acțiune" }, { status: 500 });
  }
}
