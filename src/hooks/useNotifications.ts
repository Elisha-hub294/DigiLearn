import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import { auth, db } from "../../firebaseConfig";
import {
  deleteNotification,
  markNotificationAsRead,
  normalizeNotification,
  NotificationRecord,
} from "../services/notifications";

export function useNotifications() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setError(null);
      if (!nextUser) {
        setNotifications([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    setLoading(true);
    const ref = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const next = Array.isArray(snapshot.data()?.notifications)
          ? ((snapshot.data()?.notifications as unknown[])
              .map((item) => normalizeNotification(item))
              .filter(Boolean) as NotificationRecord[])
          : [];

        setNotifications(next);
        setError(null);
        setLoading(false);
      },
      (reason) => {
        setError(reason?.message ?? "Unable to load notifications.");
        setNotifications([]);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const markRead = useCallback(
    async (notificationId: string) => {
      if (!user) return false;
      const updated = await markNotificationAsRead(user.uid, notificationId);
      return updated;
    },
    [user],
  );

  const deleteNotif = useCallback(
    async (notificationId: string) => {
      if (!user) return false;
      const updated = await deleteNotification(user.uid, notificationId);
      return updated;
    },
    [user],
  );

  return {
    user,
    notifications,
    loading,
    error,
    unreadCount,
    hasUnread: unreadCount > 0,
    markRead,
    deleteNotif,
  };
}
