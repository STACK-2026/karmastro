import { describe, expect, it } from "vitest";
import {
  ORACLE_ACTIVATION_JOURNEY_VERSION,
  ORACLE_JOURNEY_VERSION,
  oracleActivationContinuationDeliveredEvent,
  oracleFirstQuestionSubmittedEvent,
  oraclePaywallEvents,
  oraclePendingTurnCreatedEvent,
  oraclePostContinuationMessageEvent,
  oracleResponseEvents,
} from "@/lib/oracle-analytics";

describe("Oracle analytics", () => {
  it("measures the first successful response without message content", () => {
    expect(oracleResponseEvents({
      guide: "oracle",
      messageLength: 42,
      priorUserTurns: 0,
      conversationId: "conversation-1",
    })).toEqual([
      {
        name: "oracle_message_sent",
        properties: {
          guide: "oracle",
          message_length: 42,
          conversation_depth: 1,
          conversation_id: "conversation-1",
          journey_version: ORACLE_JOURNEY_VERSION,
        },
      },
      {
        name: "oracle_first_response",
        properties: {
          source: "app",
          guide: "oracle",
          journey_version: ORACLE_JOURNEY_VERSION,
        },
      },
    ]);
  });

  it("measures a second turn and an anonymous paywall with the site taxonomy", () => {
    expect(oracleResponseEvents({
      guide: "oracle",
      messageLength: 10,
      priorUserTurns: 1,
      conversationId: null,
    }).map((event) => event.name)).toEqual(["oracle_message_sent", "oracle_second_turn"]);

    expect(oraclePaywallEvents({ isAnon: true, turn: 2 })).toEqual([
      {
        name: "oracle_limit_hit",
        properties: {
          source: "app",
          turn: 2,
          is_anon: true,
          journey_version: ORACLE_JOURNEY_VERSION,
        },
      },
      {
        name: "paywall_viewed",
        properties: {
          source: "app",
          surface: "oracle",
          is_anon: true,
          journey_version: ORACLE_JOURNEY_VERSION,
        },
      },
    ]);
  });

  it("records the first submitted question without its text", () => {
    expect(oracleFirstQuestionSubmittedEvent({
      source: "app",
      category: "relationship",
    })).toEqual({
      name: "oracle_first_question_submitted",
      properties: {
        source: "app",
        category: "relationship",
        journey_version: ORACLE_JOURNEY_VERSION,
      },
    });
  });

  it("measures pending activation and continuation without question text", () => {
    expect(oraclePendingTurnCreatedEvent({
      surface: "anonymous_signup_wall_v1",
    })).toEqual({
      name: "oracle_pending_turn_created",
      properties: {
        source: "app",
        surface: "anonymous_signup_wall_v1",
        journey_version: ORACLE_ACTIVATION_JOURNEY_VERSION,
      },
    });
    expect(oracleActivationContinuationDeliveredEvent().properties).toEqual({
      source: "app",
      journey_version: ORACLE_ACTIVATION_JOURNEY_VERSION,
    });
    expect(oraclePostContinuationMessageEvent().properties).toEqual({
      source: "app",
      window: "30m",
      journey_version: ORACLE_ACTIVATION_JOURNEY_VERSION,
    });
  });
});
