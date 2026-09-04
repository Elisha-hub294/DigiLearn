import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebaseConfig";
import { invalidateLocalCaches, LOCAL_CACHE_KEYS } from "../utils/localCache";
import { invalidateFirestoreReadCache } from "./firestoreReadCache";

export type DeletableResourceCollection =
  | "pages"
  | "books"
  | "pastPaper"
  | "trendingLessons"
  | "teacherPosts";

export async function deleteResource(
  collectionName: DeletableResourceCollection,
  resourceId: string,
) {
  const removeResource = httpsCallable(functions, "deleteResource");
  await removeResource({ collectionName, resourceId });

  await invalidateLocalCaches(
    LOCAL_CACHE_KEYS.library,
    LOCAL_CACHE_KEYS.search,
    LOCAL_CACHE_KEYS.books,
  );
  invalidateFirestoreReadCache(
    `collection:${collectionName}`,
    "collection:books",
    "collection:pages",
    "collection:pastPaper",
    "collection:trendingLessons",
    "collection:teacherPosts",
  );
}
