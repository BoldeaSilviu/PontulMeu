import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getCurrentUser } from "@/lib/auth";
import { updateUserSubscription } from "@/lib/db";

export async function POST(request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ error: "Stripe nu este configurat" }, { status: 500 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Autentificare necesară" }, { status: 401 });
  }

  try {
    const { plan } = await request.json(); // "monthly" or "yearly"

    const priceId = plan === "yearly"
      ? process.env.STRIPE_PRICE_ID_YEARLY
      : process.env.STRIPE_PRICE_ID_MONTHLY;

    if (!priceId) {
      return NextResponse.json({ error: "Price ID nu este configurat" }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Reuse existing customer or create
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: String(user.id) },
      });
      customerId = customer.id;
      await updateUserSubscription(user.id, { stripe_customer_id: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?checkout=success`,
      cancel_url: `${appUrl}/upgrade?checkout=cancel`,
      metadata: { userId: String(user.id), plan },
      subscription_data: {
        metadata: { userId: String(user.id), plan },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({
      error: "Eroare la creare checkout",
      details: err.message
    }, { status: 500 });
  }
}
