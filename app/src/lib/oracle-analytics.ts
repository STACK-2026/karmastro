export type OracleTrackingEvent = {
  name: string;
  properties: Record<string, unknown>;
};

export const ORACLE_JOURNEY_VERSION = "oracle_conversation_v1";
export const ORACLE_ACTIVATION_JOURNEY_VERSION = "oracle_activation_v1";
export const ETOILE_PASS_JOURNEY_VERSION = "etoile_pass_48h_v1";

function versioned(properties: Record<string, unknown>): Record<string, unknown> {
  return { ...properties, journey_version: ORACLE_JOURNEY_VERSION };
}

function activationVersioned(properties: Record<string, unknown>): Record<string, unknown> {
  return { ...properties, journey_version: ORACLE_ACTIVATION_JOURNEY_VERSION };
}

function etoilePassVersioned(properties: Record<string, unknown>): Record<string, unknown> {
  return { ...properties, journey_version: ETOILE_PASS_JOURNEY_VERSION };
}

type OracleResponseInput = {
  guide: string;
  messageLength: number;
  priorUserTurns: number;
  conversationId: string | null;
};

export function oracleResponseEvents(input: OracleResponseInput): OracleTrackingEvent[] {
  const turn = input.priorUserTurns + 1;
  const events: OracleTrackingEvent[] = [{
    name: "oracle_message_sent",
    properties: versioned({
      guide: input.guide,
      message_length: input.messageLength,
      conversation_depth: turn,
      conversation_id: input.conversationId,
    }),
  }];

  if (turn === 1) events.push({ name: "oracle_first_response", properties: versioned({ source: "app", guide: input.guide }) });
  if (turn === 2) events.push({ name: "oracle_second_turn", properties: versioned({ source: "app", guide: input.guide }) });
  return events;
}

export function oraclePaywallEvents({ isAnon, turn }: { isAnon: boolean; turn: number }): OracleTrackingEvent[] {
  return [
    { name: "oracle_limit_hit", properties: versioned({ source: "app", turn, is_anon: isAnon }) },
    { name: "paywall_viewed", properties: versioned({ source: "app", surface: "oracle", is_anon: isAnon }) },
  ];
}

export const oracleEntryViewedEvent = (): OracleTrackingEvent => ({
  name: "oracle_entry_viewed",
  properties: versioned({ source: "app" }),
});

export const oracleProfileStartedEvent = (): OracleTrackingEvent => ({
  name: "oracle_profile_started",
  properties: versioned({ source: "app", stage: "profile_form" }),
});

export const oracleProfileSubmittedEvent = ({ hasTime, hasPlace }: { hasTime: boolean; hasPlace: boolean }): OracleTrackingEvent => ({
  name: "oracle_profile_submitted",
  properties: versioned({ source: "app", has_time: hasTime, has_place: hasPlace }),
});

export const oracleHandoffClickEvent = (next: "signup" | "pricing"): OracleTrackingEvent => ({
  name: "oracle_handoff_click",
  properties: versioned({ source: "app", next }),
});

export const paywallEtoileClickEvent = (): OracleTrackingEvent => ({
  name: "paywall_etoile_click",
  properties: versioned({ source: "app", billing_cycle: "monthly" }),
});

export const oracleFirstQuestionSubmittedEvent = ({
  source,
  category,
}: {
  source: "site" | "app";
  category: string | null;
}): OracleTrackingEvent => ({
  name: "oracle_first_question_submitted",
  properties: versioned({ source, category }),
});

export const oracleCategorySelectedEvent = ({
  source,
  category,
}: {
  source: "site" | "app";
  category: string;
}): OracleTrackingEvent => ({
  name: "oracle_category_selected",
  properties: versioned({ source, category }),
});

export const oracleFeedbackSubmittedEvent = ({
  guide,
  rating,
  hasText,
}: {
  guide: string;
  rating: number;
  hasText: boolean;
}): OracleTrackingEvent => ({
  name: "oracle_feedback_submitted",
  properties: versioned({ guide, rating, has_text: hasText }),
});

export const oraclePendingTurnCreatedEvent = ({
  surface,
}: {
  surface: "anonymous_signup_wall_v1" | "authenticated_interim_limit_v1";
}): OracleTrackingEvent => ({
  name: "oracle_pending_turn_created",
  properties: activationVersioned({ source: "app", surface }),
});

export const oracleSignupWallViewedEvent = (): OracleTrackingEvent => ({
  name: "oracle_signup_wall_viewed",
  properties: activationVersioned({ source: "app" }),
});

export const oracleSignupWallCtaClickedEvent = (): OracleTrackingEvent => ({
  name: "oracle_signup_wall_cta_clicked",
  properties: activationVersioned({ source: "app" }),
});

export const oracleActivationContinuationDeliveredEvent = (): OracleTrackingEvent => ({
  name: "oracle_activation_continuation_delivered",
  properties: activationVersioned({ source: "app" }),
});

export const oraclePostContinuationMessageEvent = (): OracleTrackingEvent => ({
  name: "oracle_post_continuation_message",
  properties: activationVersioned({ source: "app", window: "30m" }),
});

export const etoilePassOfferViewedEvent = (): OracleTrackingEvent => ({
  name: "etoile_pass_offer_viewed",
  properties: etoilePassVersioned({
    source: "app",
    offer_code: "etoile_pass_48h_v1",
  }),
});

export const etoilePassActivationRequestedEvent = (): OracleTrackingEvent => ({
  name: "etoile_pass_activation_requested",
  properties: etoilePassVersioned({
    source: "app",
    offer_code: "etoile_pass_48h_v1",
  }),
});

export const etoilePassActivationSucceededEvent = (
  accessSource: "subscription" | "promo_pass" | "none",
): OracleTrackingEvent => ({
  name: "etoile_pass_activation_succeeded",
  properties: etoilePassVersioned({
    source: "app",
    offer_code: "etoile_pass_48h_v1",
    result: "activated",
    access_source: accessSource,
  }),
});

export const etoilePassActivationFailedEvent = (
  result: "unavailable" | "ineligible" | "already_used",
): OracleTrackingEvent => ({
  name: "etoile_pass_activation_failed",
  properties: etoilePassVersioned({
    source: "app",
    offer_code: "etoile_pass_48h_v1",
    result,
  }),
});
