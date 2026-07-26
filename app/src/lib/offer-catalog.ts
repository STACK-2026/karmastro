export const OFFER_CATALOG = {
  etoile_monthly: {
    amount: 5.99,
    kind: "subscription",
    period: "month",
  },
  etoile_annual: {
    amount: 49.99,
    kind: "subscription",
    period: "year",
  },
  ame_soeur: {
    amount: 3.99,
    kind: "one_time",
    period: null,
  },
} as const;

export type VisibleOfferKey = keyof typeof OFFER_CATALOG;
