export function getErrorMessage(error: unknown, fallback = "Une erreur est survenue"): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
