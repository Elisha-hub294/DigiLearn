export type Book = {
  id: string;
  title: string;
  description: string;
  cover: string;
  year?: string;
  edition?: string;
  author: string[];
  subject: string[];
  pages?: string;
  rating?: number;
  saves?: number;
};

export const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80";

/**
 * Normalizes strings to lower case and trims whitespace for case-insensitive comparisons
 */
export const normalizeKey = (key: string): string => key.trim().toLowerCase();

/**
 * Resolves an author's avatar URL dynamically against fetched teacher profiles from Firestore.
 */
export const resolveAuthorAvatar = (
  authorName: string,
  teacherAvatars: Record<string, string>,
  defaultUserAvatar: string,
): string => {
  const normalizedAuthor = normalizeKey(authorName);
  return teacherAvatars[normalizedAuthor] || defaultUserAvatar;
};
