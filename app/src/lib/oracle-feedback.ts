export const ORACLE_FEEDBACK_CONTRACT_VERSION = 1 as const;
export const ORACLE_FEEDBACK_INTRODUCED_AT = "2026-08-02T13:34:17.000Z" as const;

export type OracleFeedbackRating = 1 | 2 | 3;

type BuildOracleFeedbackInsertInput = {
  userId: string | null;
  sessionId: string | null;
  conversationId: string;
  rating: OracleFeedbackRating;
  turnIndex: number;
  locale: string;
};

export function oracleFeedbackRatingLabel(
  rating: OracleFeedbackRating,
): "useful" | "unsure" | "not_useful" {
  if (rating === 3) return "useful";
  if (rating === 2) return "unsure";
  return "not_useful";
}

export function buildOracleFeedbackInsert({
  userId,
  sessionId,
  conversationId,
  rating,
  turnIndex,
  locale,
}: BuildOracleFeedbackInsertInput) {
  return {
    user_id: userId,
    session_id: userId ? null : sessionId,
    conversation_id: conversationId,
    guide: "oracle" as const,
    rating,
    turn_index: turnIndex,
    surface: "app" as const,
    locale,
    contract_version: ORACLE_FEEDBACK_CONTRACT_VERSION,
    introduced_at: ORACLE_FEEDBACK_INTRODUCED_AT,
  };
}
