import { createContext } from "react";
import {
  NO_EFFECTIVE_ACCESS,
  type EffectiveAccess,
} from "@/lib/promotion-pass";

export type PromotionPassContextValue = EffectiveAccess & {
  serverOffsetMs: number;
  loading: boolean;
  error: string | null;
  refreshAccess: () => Promise<EffectiveAccess>;
  activatePass: () => Promise<EffectiveAccess>;
};

export const PromotionPassContext = createContext<PromotionPassContextValue>({
  ...NO_EFFECTIVE_ACCESS,
  serverOffsetMs: 0,
  loading: false,
  error: null,
  refreshAccess: async () => NO_EFFECTIVE_ACCESS,
  activatePass: async () => NO_EFFECTIVE_ACCESS,
});
