import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  serverTimestamp,
  startAfter,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";

export type ReportPayload = {
  reasons: string[];
  details: string;
  item: {
    type: string;
    id: string;
    name: string;
  };
};

export type ReportRecord = ReportPayload & {
  id: string;
  userId: string;
  username: string;
  userEmail: string;
  status: "new" | "in_review" | "resolved" | "dismissed";
  createdAt?: { seconds?: number };
  adminNotes?: string;
};

export async function submitReport(payload: ReportPayload) {
  return addDoc(collection(db, "reports"), {
    ...payload,
    userId: auth.currentUser?.uid,
    username: auth.currentUser?.displayName || "Unknown user",
    userEmail: auth.currentUser?.email || "Unavailable",
    createdAt: serverTimestamp(),
    status: "new",
  });
}

export async function listReports(cursor?: QueryDocumentSnapshot) {
  const constraints = [
    orderBy("createdAt", "desc"),
    limit(25),
    ...(cursor ? [startAfter(cursor)] : []),
  ];
  const snapshot = await getDocs(
    query(collection(db, "reports"), ...constraints),
  );
  return {
    reports: snapshot.docs.map(
      (report) => ({ id: report.id, ...report.data() }) as ReportRecord,
    ),
    cursor: snapshot.docs.at(-1),
    hasMore: snapshot.docs.length === 25,
  };
}

export async function updateReport(
  reportId: string,
  status: ReportRecord["status"],
  adminNotes: string,
) {
  await updateDoc(doc(db, "reports", reportId), {
    status,
    adminNotes,
    reviewedAt: serverTimestamp(),
  });
  if (status === "resolved" || status === "dismissed") {
    const notificationRef = doc(db, "adminNotifications", `report-${reportId}`);
    const notification = await getDoc(notificationRef);
    if (notification.exists()) {
      await updateDoc(notificationRef, {
        read: true,
        dismissed: true,
        reviewedAt: serverTimestamp(),
      });
    }
  }
}

export function getReportErrorMessage(error: unknown) {
  const firebaseError = error as { code?: string; message?: string };
  switch (firebaseError.code) {
    case "functions/resource-exhausted":
      return "You recently reported this item. Please wait before sending another report.";
    case "functions/unauthenticated":
      return "Please log in before sending a report.";
    case "functions/not-found":
      return "Report service is not deployed yet. Please try again later.";
    default:
      return (
        firebaseError.message ||
        "We couldn't send your report. Please try again."
      );
  }
}
