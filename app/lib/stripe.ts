import "server-only";
import Stripe from "stripe";

export type StripeCheckoutPlan =
  | "ESSENTIAL_MONTHLY"
  | "FULL_MONTHLY"
  | "FULL_YEARLY";

type StripePlanConfig = {
  priceId: string;
  billingCycle: "MONTHLY" | "YEARLY";
  internalPlan: "ESSENTIAL" | "FULL";
  label: StripeCheckoutPlan;
};

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY manquante.");
  }

  return new Stripe(secretKey, {
    apiVersion: "2026-04-22.dahlia",
  });
}

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variable d’environnement manquante: ${name}`);
  }

  return value;
}

export function getStripePlanConfig(plan: string): StripePlanConfig {
  switch (plan) {
    case "ESSENTIAL_MONTHLY":
      return {
        label: "ESSENTIAL_MONTHLY",
        priceId: requireEnv("STRIPE_PRICE_ESSENTIAL_MONTHLY"),
        billingCycle: "MONTHLY",
        internalPlan: "ESSENTIAL",
      };

    case "FULL_MONTHLY":
      return {
        label: "FULL_MONTHLY",
        priceId: requireEnv("STRIPE_PRICE_FULL_MONTHLY"),
        billingCycle: "MONTHLY",
        internalPlan: "FULL",
      };

    case "FULL_YEARLY":
      return {
        label: "FULL_YEARLY",
        priceId: requireEnv("STRIPE_PRICE_FULL_YEARLY"),
        billingCycle: "YEARLY",
        internalPlan: "FULL",
      };

    default:
      throw new Error("Plan Stripe invalide.");
  }
}

export function getPublicStripePriceIds() {
  return {
    essentialMonthly:
      process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIAL_MONTHLY || "",
    fullMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_FULL_MONTHLY || "",
    fullYearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_FULL_YEARLY || "",
  };
}