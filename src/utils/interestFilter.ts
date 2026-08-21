import { UserProfile } from "../services/userProfile";

export function shouldFilterByInterests(
  profile: UserProfile | null | undefined,
): boolean {
  return Boolean(profile?.filterFeedByInterests);
}

export function matchesUserInterests(
  itemSubjects: string | string[] | undefined | null,
  userInterests: string[] | undefined | null,
): boolean {
  if (!userInterests || userInterests.length === 0) {
    return false;
  }
  if (!itemSubjects) {
    return false;
  }

  const rawSubjects = Array.isArray(itemSubjects)
    ? itemSubjects
    : [itemSubjects];
  const normalizedInterests = userInterests
    .map((s) => (typeof s === "string" ? s.trim().toLowerCase() : ""))
    .filter(Boolean);

  if (normalizedInterests.length === 0) {
    return false;
  }

  return rawSubjects.some((subj) => {
    if (typeof subj !== "string") return false;
    const normItem = subj.trim().toLowerCase();
    if (!normItem) return false;
    return normalizedInterests.some(
      (interest) =>
        normItem === interest ||
        normItem.includes(interest) ||
        interest.includes(normItem),
    );
  });
}
