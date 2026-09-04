import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
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
  const [readReportIds, setReadReportIds] = useState<Set<string>>(
    () => new Set(),
  );
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

  useEffect(() => {
    if (!user || profile?.type !== "admin") return;

    return onSnapshot(
      query(collection(db, "reports"), where("status", "==", "new")),
      (snapshot) => {
        const fallbackNotifications = snapshot.docs
          .map((report) => {
            const data = report.data();
            return normalizeNotification({
              id: `report-${report.id}`,
              type: "announcement",
              publisherName: "DigiLearn",
              publisherAvatar: "@/assets/images/panda.png",
              message: "A new resource report needs review.",
              resourceTitle:
                (data.item as { name?: string } | undefined)?.name ??
                "Reported resource",
              itemId: report.id,
              collection: "reports",
              navigation: "/admin-reports",
              adminKind: "report",
              storage: "admin",
              createdAt: data.createdAt,
              read: readReportIds.has(`report-${report.id}`),
            });
          })
          .filter(Boolean) as NotificationRecord[];

        setNotifications((current) => {
          const merged = new Map(
            current
              .filter((item) => item.storage !== "admin")
              .map((item) => [item.id, item]),
          );
          current
            .filter((item) => item.storage === "admin")
            .forEach((item) => merged.set(item.id, item));
          fallbackNotifications.forEach((item) => {
            if (!merged.has(item.id)) merged.set(item.id, item);
          });
          return [...merged.values()];
        });
      },
      (reason) =>
        setError(reason?.message ?? "Unable to load new report alerts."),
    );
  }, [profile?.type, readReportIds, user]);

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
      if (
        adminNotification?.adminKind === "report" &&
        adminNotification.id.startsWith("report-")
      ) {
        try {
          await updateDoc(doc(db, "adminNotifications", notificationId), {
            read: true,
          });
        } catch {}
        setReadReportIds((current) =>
          new Set(current).add(adminNotification.id),
        );
        return true;
      }
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
      adminItems
        .filter((item) => item.adminKind !== "report")
        .map((item) =>
          updateDoc(doc(db, "adminNotifications", item.id), { read: true }),
        ),
    );
    setReadReportIds(
      (current) =>
        new Set([
          ...current,
          ...adminItems
            .filter((item) => item.adminKind === "report")
            .map((item) => item.id),
        ]),
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
