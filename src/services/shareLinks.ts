import { Share } from "react-native";

export type SharedResourceType = "book" | "page" | "paper" | "lesson";

const SHARE_HOST = "https://digilearn-af86d.firebaseapp.com";
export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.digilearn.app";

const RESOURCE_ROUTES: Record<SharedResourceType, string> = {
  book: "/book-preview",
  page: "/page-preview",
  paper: "/paper-preview",
  lesson: "/lesson-player",
};

export function getSharedResourceUrl(
  type: SharedResourceType,
  id: string,
): string {
  return `${SHARE_HOST}/share/${type}/${encodeURIComponent(id)}`;
}

export async function shareResource(
  type: SharedResourceType,
  id: string | undefined,
  title: string,
): Promise<void> {
  if (!id) return;

  const url = getSharedResourceUrl(type, id);
  await Share.share({
    title,
    message: `Open "${title}" in OS platform: ${url}`,
    url,
  });
}

export function getSharedResourceRoute(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const path = parsed.pathname.replace(/^\/+|\/+$/g, "").split("/");
  if (path.length !== 3 || path[0].toLowerCase() !== "share") return null;

  const type = path[1].toLowerCase() as SharedResourceType;
  const route = RESOURCE_ROUTES[type];
  if (!route || !path[2]) return null;

  const id = decodeURIComponent(path[2]);
  const params = new URLSearchParams({ id });
  if (type === "page") params.set("source", "home");
  return `${route}?${params.toString()}`;
}
