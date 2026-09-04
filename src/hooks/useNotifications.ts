import { onAuthStateChanged, User } from "firebase/auth";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import { auth, db } from "../../firebaseConfig";
import { useProfile } from "../contexts/ProfileContext";
import {
  deleteNotification,
  markAllUserNotificationsAsRead,
  markNotificationAsRead,
  normalizeNotification,
  NotificationRecord,
} from "../services/notifications";

export function useNotifications() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useProfile();

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

  useEffect(() => {
    if (!user || profile?.type !== "admin") return;

    const unsubscribe = onSnapshot(
      collection(db, "adminNotifications"),
      (snapshot) => {
        const adminItems = snapshot.docs
          .filter((item) => item.data().dismissed !== true)
          .map((item) =>
            normalizeNotification({ ...item.data(), storage: "admin" }),
          )
          .filter(Boolean) as NotificationRecord[];
        setNotifications((current) => [
          ...current.filter((item) => item.storage !== "admin"),
          ...adminItems,
        ]);
      },
      (reason) =>
        setError(reason?.message ?? "Unable to load admin notifications."),
    );

    return () => unsubscribe();
  }, [profile?.type, user]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const markRead = useCallback(
    async (notificationId: string) => {
      if (!user) return false;
      const adminNotification = notifications.find(
        (notification) =>
          notification.id === notificationId &&
          notification.storage === "admin",
      );
      if (adminNotification) {
        await updateDoc(doc(db, "adminNotifications", notificationId), {
          read: true,
        });
        return true;
      }
      const updated = await markNotificationAsRead(user.uid, notificationId);
      return updated;
    },
    [user],
  );

  const markAllRead = useCallback(async () => {
    if (!user) return false;
    await markAllUserNotificationsAsRead(user.uid);
    const adminItems = notifications.filter(
      (item) => item.storage === "admin" && !item.read,
    );
    await Promise.all(
      adminItems.map((item) =>
        updateDoc(doc(db, "adminNotifications", item.id), { read: true }),
      ),
    );
    return true;
  }, [notifications, user]);

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
    markAllRead,
    deleteNotif,
  };
}
