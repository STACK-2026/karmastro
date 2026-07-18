export type OracleTrackingEvent = {
  name: string;
  properties: Record<string, unknown>;
};

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
    properties: {
      guide: input.guide,
      message_length: input.messageLength,
      conversation_depth: turn,
      conversation_id: input.conversationId,
    },
  }];

  if (turn === 1) events.push({ name: "oracle_first_response", properties: { source: "app", guide: input.guide } });
  if (turn === 2) events.push({ name: "oracle_second_turn", properties: { source: "app", guide: input.guide } });
  return events;
}

export function oraclePaywallEvents({ isAnon, turn }: { isAnon: boolean; turn: number }): OracleTrackingEvent[] {
  return [
    { name: "oracle_limit_hit", properties: { source: "app", turn, is_anon: isAnon } },
    { name: "paywall_viewed", properties: { source: "app", surface: "oracle", is_anon: isAnon } },
  ];
}

export const oracleEntryViewedEvent = (): OracleTrackingEvent => ({
  name: "oracle_entry_viewed",
  properties: { source: "app" },
});

export const oracleProfileStartedEvent = (): OracleTrackingEvent => ({
  name: "oracle_profile_started",
  properties: { source: "app", stage: "profile_form" },
});

export const oracleProfileSubmittedEvent = ({ hasTime, hasPlace }: { hasTime: boolean; hasPlace: boolean }): OracleTrackingEvent => ({
  name: "oracle_profile_submitted",
  properties: { source: "app", has_time: hasTime, has_place: hasPlace },
});

export const oracleHandoffClickEvent = (next: "signup" | "pricing"): OracleTrackingEvent => ({
  name: "oracle_handoff_click",
  properties: { source: "app", next },
});

export const paywallEtoileClickEvent = (): OracleTrackingEvent => ({
  name: "paywall_etoile_click",
  properties: { source: "app", billing_cycle: "monthly" },
});
