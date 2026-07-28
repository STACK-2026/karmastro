export const PROMOTION_PASS_OFFER_CODE = "etoile_pass_48h_v1";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class PromotionPassRequestError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "PromotionPassRequestError";
    this.status = status;
  }
}

export type PromotionPassRequest =
  | { action: "status"; offerCode: typeof PROMOTION_PASS_OFFER_CODE; idempotencyKey: null }
  | { action: "activate"; offerCode: typeof PROMOTION_PASS_OFFER_CODE; idempotencyKey: string };

export function normalizePromotionPassRequest(method: string, body?: unknown): PromotionPassRequest {
  if (method === "GET") {
    return {
      action: "status",
      offerCode: PROMOTION_PASS_OFFER_CODE,
      idempotencyKey: null,
    };
  }
  if (method !== "POST") throw new PromotionPassRequestError("method_not_allowed", 405);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new PromotionPassRequestError("invalid_body");
  }

  const input = body as Record<string, unknown>;
  if (input.action !== "activate") throw new PromotionPassRequestError("invalid_action");
  if (input.offer_code !== PROMOTION_PASS_OFFER_CODE) {
    throw new PromotionPassRequestError("invalid_offer");
  }
  if (typeof input.idempotency_key !== "string" || !UUID_RE.test(input.idempotency_key.trim())) {
    throw new PromotionPassRequestError("invalid_idempotency_key");
  }

  return {
    action: "activate",
    offerCode: PROMOTION_PASS_OFFER_CODE,
    idempotencyKey: input.idempotency_key.trim(),
  };
}
