export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDatabase, verifyEmailByToken } from "@/lib/db";

export async function GET(request) {
  try {
    await initDatabase();
    const token = new URL(request.url).searchParams.get("token");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cotaverde.ro";

    if (!token) {
      return NextResponse.redirect(`${appUrl}/?verified=0`);
    }

    const userId = await verifyEmailByToken(token);
    return NextResponse.redirect(`${appUrl}/?verified=${userId ? 1 : 0}`);
  } catch (err) {
    console.error("Verify email error:", err);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cotaverde.ro";
    return NextResponse.redirect(`${appUrl}/?verified=0`);
  }
}
