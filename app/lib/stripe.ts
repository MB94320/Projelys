import "server-only";

import Stripe from "stripe";

export type StripeCheckoutPlan =
  | "ESSENTIAL_MONTHLY"
  | "PRO_MONTHLY"
  | "PRO_YEARLY";

type StripePlanConfig = {
  priceId: string;
  billingCycle: "MONTHLY" | "YEARLY";
  internalPlan: "LIMITED" | "FULL";
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
        internalPlan: "LIMITED",
      };

    case "PRO_MONTHLY":
      return {
        label: "PRO_MONTHLY",
        priceId: requireEnv("STRIPE_PRICE_PRO_MONTHLY"),
        billingCycle: "MONTHLY",
        internalPlan: "FULL",
      };

    case "PRO_YEARLY":
      return {
        label: "PRO_YEARLY",
        priceId: requireEnv("STRIPE_PRICE_PRO_YEARLY"),
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
    proMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || "",
    proYearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY || "",
  };
}