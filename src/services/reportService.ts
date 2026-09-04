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
  status: "queued" | "retrying" | "sent" | "failed";
  createdAt?: { seconds?: number };
  lastError?: string;
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

export async function retryReport(reportId: string) {
  const callable = httpsCallable<{ reportId: string }, { status: string }>(
    functions,
    "retryReport",
  );
  return callable({ reportId });
}
