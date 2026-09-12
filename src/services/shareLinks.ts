export type SharedResourceType = "book" | "page" | "paper" | "lesson";

export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.digilearn.app";

const RESOURCE_ROUTES: Record<SharedResourceType, string> = {
  book: "/book-preview",
  page: "/page-preview",
  paper: "/paper-preview",
  lesson: "/lesson-player",
};

function getLinking() {
  try {
    return require("expo-linking") as typeof import("expo-linking");
  } catch {
    return {
      createURL: (path: string) => `digilearn://${path}`,
    } as Pick<typeof import("expo-linking"), "createURL">;
  }
}

type ShareApi = {
  Share?: {
    share: (options: {
      title: string;
      message: string;
      url: string;
    }) => Promise<unknown>;
  };
};

function getShareApi(): ShareApi {
  try {
    return require("react-native") as unknown as ShareApi;
  } catch {
    return {
      Share: {
        share: async () => undefined,
      },
    };
  }
}

export function getSharedResourceUrl(
  type: SharedResourceType,
  id: string,
): string {
  const linking = getLinking();
  if (typeof linking.createURL === "function") {
    return linking.createURL("share", {
      queryParams: { type, id },
    });
  }
  return `digilearn://share?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`;
}

export async function shareResource(
  type: SharedResourceType,
  id: string | undefined,
  title: string,
): Promise<void> {
  if (!id) return;

  const url = getSharedResourceUrl(type, id);
  const reactNative = getShareApi();
  if (!reactNative.Share?.share) return;

  await reactNative.Share.share({
    title,
    message: `Open "${title}" in OS platform: ${url}`,
    url,
  });
}

function decodeSharedValue(value: string): string {
  let decoded = value;
  for (let pass = 0; pass < 2; pass += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded;
}

export function getSharedResourceRoute(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const pathname = parsed.pathname.replace(/^\/+|\/+$/g, "");
  const segments = pathname ? pathname.split("/").filter(Boolean) : [];

  let typeSegment: string | null = parsed.searchParams.get("type");
  let idSegment: string | null = parsed.searchParams.get("id");

  if (segments[0]?.toLowerCase() === "share") {
    if (segments.length >= 3) {
      typeSegment = segments[1] ?? typeSegment;
      idSegment = segments[2] ?? idSegment;
    } else if (segments.length === 2) {
      typeSegment = segments[1] ?? typeSegment;
    }
  } else if (parsed.hostname.toLowerCase() === "share") {
    if (segments.length >= 2) {
      typeSegment = segments[0] ?? typeSegment;
      idSegment = segments[1] ?? idSegment;
    }
    if (!typeSegment && !idSegment && parsed.searchParams.size > 0) {
      typeSegment = parsed.searchParams.get("type");
      idSegment = parsed.searchParams.get("id");
    }
  }

  if (!typeSegment || !idSegment) return null;

  const type = typeSegment.toLowerCase() as SharedResourceType;
  const route = RESOURCE_ROUTES[type];
  if (!route) return null;

  const id = decodeSharedValue(idSegment);
  const params = new URLSearchParams({ id });
  if (type === "page") params.set("source", "home");
  return `${route}?${params.toString()}`;
}
