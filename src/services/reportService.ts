import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebaseConfig";

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
  const callable = httpsCallable<ReportPayload, { reportId: string }>(
    functions,
    "submitReport",
  );
  return callable(payload);
}

export async function listReports() {
  const callable = httpsCallable<undefined, { reports: ReportRecord[] }>(
    functions,
    "listReports",
  );
  return (await callable()).data.reports;
}

export async function updateReport(
  reportId: string,
  status: ReportRecord["status"],
  adminNotes: string,
) {
  const callable = httpsCallable<
    { reportId: string; status: ReportRecord["status"]; adminNotes: string },
    { status: string }
  >(functions, "updateReport");
  return callable({ reportId, status, adminNotes });
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
