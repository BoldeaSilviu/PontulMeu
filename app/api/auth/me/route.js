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
      plan: user.plan,
      isPremium,
      trialEndDate: user.trial_end_date,
      subscriptionEndDate: user.subscription_end_date,
    },
    quota: {
      used: todayCount,
      limit: isPremium ? null : FREE_DAILY_LIMIT, // null = unlimited
      remaining: isPremium ? null : Math.max(0, FREE_DAILY_LIMIT - todayCount),
    },
  });
}
