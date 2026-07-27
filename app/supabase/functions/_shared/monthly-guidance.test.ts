import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  canExecuteGuidanceSend,
  classifyStripeSubscription,
  guidanceRunHttpStatus,
  hydrateGuidanceSubscriber,
  shouldPersistGuidanceChanges,
} from "./monthly-guidance.ts";

const subscriber = {
  email: "lea@example.test",
  birth_date: null,
  full_name: null,
  locale: null,
};

Deno.test("hydrates only missing monthly-guidance fields", () => {
  assertEquals(hydrateGuidanceSubscriber(subscriber, {
    first_name: "Léa",
    birth_date: "1990-02-14",
    language: "fr",
  }), {
    subscriber: {
      email: "lea@example.test",
      birth_date: "1990-02-14",
      full_name: "Léa",
      locale: "fr",
    },
    patch: {
      birth_date: "1990-02-14",
      full_name: "Léa",
      locale: "fr",
    },
    recovered: true,
  });
});

Deno.test("never overwrites complete subscriber fields", () => {
  assertEquals(hydrateGuidanceSubscriber({
    email: "original@example.test",
    birth_date: "1980-01-01",
    full_name: "Original",
    locale: "en",
  }, {
    first_name: "Replacement",
    birth_date: "1990-02-14",
    language: "fr",
  }), {
    subscriber: {
      email: "original@example.test",
      birth_date: "1980-01-01",
      full_name: "Original",
      locale: "en",
    },
    patch: {},
    recovered: false,
  });
});

Deno.test("keeps an unrecoverable birth date blocked", () => {
  assertEquals(hydrateGuidanceSubscriber(subscriber, {
    first_name: "Léa",
    birth_date: null,
    language: "fr",
  }).subscriber.birth_date, null);
});

Deno.test("dry-run forbids every persistence side effect", () => {
  assertEquals(shouldPersistGuidanceChanges(true), false);
  assertEquals(shouldPersistGuidanceChanges(false), true);
});

Deno.test("Stripe status classification fails closed", () => {
  assertEquals(classifyStripeSubscription("active"), "eligible");
  assertEquals(classifyStripeSubscription("trialing"), "eligible");
  assertEquals(classifyStripeSubscription("canceled"), "inactive");
  assertEquals(classifyStripeSubscription(null), "verification_failed");
});

Deno.test("real monthly-guidance sends require the explicit kill switch", () => {
  assertEquals(canExecuteGuidanceSend({ dry: false, sendEnabled: null }), false);
  assertEquals(canExecuteGuidanceSend({ dry: false, sendEnabled: "" }), false);
  assertEquals(canExecuteGuidanceSend({ dry: false, sendEnabled: "false" }), false);
  assertEquals(canExecuteGuidanceSend({ dry: false, sendEnabled: "TRUE" }), false);
  assertEquals(canExecuteGuidanceSend({ dry: false, sendEnabled: "true" }), true);
  assertEquals(canExecuteGuidanceSend({ dry: true, sendEnabled: null }), true);
});

Deno.test("an incomplete paid-benefit run fails the scheduler visibly", () => {
  const healthy = {
    blocked_missing_profile: 0,
    blocked_missing_email: 0,
    blocked_stripe_error: 0,
    failed_generation: 0,
    failed_resend: 0,
    failed_state_update: 0,
  };
  assertEquals(guidanceRunHttpStatus(healthy), 200);

  for (const key of Object.keys(healthy) as Array<keyof typeof healthy>) {
    assertEquals(guidanceRunHttpStatus({ ...healthy, [key]: 1 }), 503);
  }
});
