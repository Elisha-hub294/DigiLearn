export type AiUsageStatusLike = {
  allowed: boolean;
  remainingQuota: number;
  dailyLimit: number;
  errorMessage?: string;
};

export function shouldSkipStartupSuggestionGeneration(
  status: AiUsageStatusLike,
): boolean {
  if (!status || status.allowed) {
    return false;
  }

  if (status.remainingQuota <= 0) {
    return true;
  }

  const detail = (status.errorMessage ?? "").toLowerCase();
  return (
    detail.includes("daily limit") ||
    detail.includes("daily ai") ||
    detail.includes("reached your daily limit")
  );
}
