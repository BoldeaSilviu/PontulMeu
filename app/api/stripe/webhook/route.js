import { NextResponse } from "next/server";
import Stripe from "stripe";
import { initDatabase, findUserByStripeCustomer, updateUserSubscription } from "@/lib/db";

export async function POST(request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe nu este configurat" }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });

  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Signature invalid" }, { status: 400 });
  }

  try {
    await initDatabase();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        if (userId && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          const endDate = new Date(sub.current_period_end * 1000);
          await updateUserSubscription(parseInt(userId), {
            plan: "premium",
            subscription_status: "active",
            stripe_subscription_id: sub.id,
            subscription_end_date: endDate.toISOString(),
          });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object;
        const user = await findUserByStripeCustomer(sub.customer);
        if (user) {
          const endDate = new Date(sub.current_period_end * 1000);
          const status = sub.status === "active" || sub.status === "trialing" ? "active" : sub.status;
          await updateUserSubscription(user.id, {
            plan: status === "active" ? "premium" : "free",
            subscription_status: status,
            stripe_subscription_id: sub.id,
            subscription_end_date: endDate.toISOString(),
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const user = await findUserByStripeCustomer(sub.customer);
        if (user) {
          await updateUserSubscription(user.id, {
            plan: "free",
            subscription_status: "canceled",
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        if (invoice.customer) {
          const user = await findUserByStripeCustomer(invoice.customer);
          if (user) {
            await updateUserSubscription(user.id, {
              subscription_status: "past_due",
            });
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
