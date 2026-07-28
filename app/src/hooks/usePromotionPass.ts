import { useContext } from "react";
import { PromotionPassContext } from "@/contexts/promotion-pass-context";

export function usePromotionPass() {
  return useContext(PromotionPassContext);
}
