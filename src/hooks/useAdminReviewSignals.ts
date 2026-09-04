import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { useProfile } from "../contexts/ProfileContext";

export function useAdminReviewSignals() {
  const { profile } = useProfile();
  const [newReportCount, setNewReportCount] = useState(0);
  const [pendingApplicationCount, setPendingApplicationCount] = useState(0);

  useEffect(() => {
    if (profile?.type !== "admin") return;
    const unsubscribeReports = onSnapshot(
      query(collection(db, "reports"), where("status", "==", "new")),
      (snapshot) => setNewReportCount(snapshot.size),
    );
    const unsubscribeApplications = onSnapshot(
      query(
        collection(db, "teacherApplications"),
        where("status", "==", "pending"),
      ),
      (snapshot) => setPendingApplicationCount(snapshot.size),
    );
    return () => {
      unsubscribeReports();
      unsubscribeApplications();
    };
  }, [profile?.type]);

  return { newReportCount, pendingApplicationCount };
}
