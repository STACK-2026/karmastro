export type CheckoutReturn = "success" | "canceled";
export type CheckoutReturnKind = "subscription" | "one_time";

export function parseCheckoutReturn(searchParams: URLSearchParams): CheckoutReturn | null {
  const values = searchParams.getAll("checkout");
  if (values.length !== 1) return null;
  return values[0] === "success" || values[0] === "canceled" ? values[0] : null;
}

export function parseCheckoutReturnKind(searchParams: URLSearchParams): CheckoutReturnKind | null {
  const values = searchParams.getAll("kind");
  if (values.length !== 1) return null;
  return values[0] === "subscription" || values[0] === "one_time" ? values[0] : null;
}

export function consumeCheckoutReturn(pathname: string, searchParams: URLSearchParams): string {
  const next = new URLSearchParams(searchParams);
  next.delete("checkout");
  next.delete("kind");
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function checkoutReturnAnalytics(
  status: CheckoutReturn,
  active: boolean,
  kind: CheckoutReturnKind | null,
) {
  if (status === "canceled") return { status };
  return {
    status,
    purchase_type: kind || "unknown",
    activation: kind === "subscription"
      ? (active ? "active" : "pending")
      : "not_applicable",
  };
}
