import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { countTodayAnalyses, isUserPremium } from "@/lib/db";

const FREE_DAILY_LIMIT = 1;

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ user: null });
  }

  const isPremium = isUserPremium(user);
  const todayCount = await countTodayAnalyses(user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      first_name: user.first_name,
      last_name: user.last_name,
      plan: user.plan,
      role: user.role,
      subscription_status: user.subscription_status,
      trial_end_date: user.trial_end_date,
      subscription_end_date: user.subscription_end_date,
      email_verified: user.email_verified,
      isPremium,
    },
    quota: {
      used: todayCount,
      limit: isPremium ? null : FREE_DAILY_LIMIT, // null = unlimited
      remaining: isPremium ? null : Math.max(0, FREE_DAILY_LIMIT - todayCount),
    },
  });
}
