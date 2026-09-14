import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";

export type LiveSessionInfo = {
  id: string;
  title?: string;
  teacher?: string;
  subject?: string;
  meetCode?: string;
  meetUrl?: string;
};

/**
 * Subscribes in real-time to the `teacherPosts` collection and returns
 * the most recently started active live session, if any.
 *
 * Only sessions where `isLive === true` and `status !== 'ended'` are returned.
 * The hook returns `null` when there is no active session.
 */
export function useLiveSession(): LiveSessionInfo | null {
  const [liveSession, setLiveSession] = useState<LiveSessionInfo | null>(null);

  useEffect(() => {
    let cancelled = false;

    try {
      const q = query(
        collection(db, "teacherPosts"),
        where("isLive", "==", true),
        where("status", "==", "live"),
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (cancelled) return;

          const activeDocs = snapshot.docs.filter((d) => {
            const data = d.data();
            // Double-guard: skip docs that were ended
            return data.status !== "ended" && data.isLive !== false;
          });

          if (activeDocs.length === 0) {
            setLiveSession(null);
            return;
          }

          // Pick the most recent (highest createdAt timestamp)
          const sorted = [...activeDocs].sort((a, b) => {
            const aTs = a.data().createdAt;
            const bTs = b.data().createdAt;
            const aTime =
              typeof aTs?.toMillis === "function" ? aTs.toMillis() : 0;
            const bTime =
              typeof bTs?.toMillis === "function" ? bTs.toMillis() : 0;
            return bTime - aTime;
          });

          const doc = sorted[0];
          const data = doc.data();

          setLiveSession({
            id: doc.id,
            title: typeof data.title === "string" ? data.title : undefined,
            teacher:
              typeof data.teacher === "string" ? data.teacher : undefined,
            subject: typeof data.subject === "string" ? data.subject : undefined,
            meetCode:
              typeof data.meetCode === "string" ? data.meetCode : undefined,
            meetUrl:
              typeof data.meetUrl === "string" ? data.meetUrl : undefined,
          });
        },
        (err) => {
          // Silently ignore permission or network errors — no live session shown
          console.warn("[useLiveSession] snapshot error:", err?.message);
          if (!cancelled) setLiveSession(null);
        },
      );

      return () => {
        cancelled = true;
        unsubscribe();
      };
    } catch (err) {
      console.warn("[useLiveSession] setup error:", err);
      return () => {
        cancelled = true;
      };
    }
  }, []);

  return liveSession;
}
