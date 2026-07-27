export type OracleTrackingEvent = {
  name: string;
  properties: Record<string, unknown>;
};

export const ORACLE_JOURNEY_VERSION = "oracle_conversation_v1";

function versioned(properties: Record<string, unknown>): Record<string, unknown> {
  return { ...properties, journey_version: ORACLE_JOURNEY_VERSION };
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
