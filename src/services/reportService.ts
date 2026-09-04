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

export async function submitReport(payload: ReportPayload) {
  const callable = httpsCallable<ReportPayload, { reportId: string }>(
    functions,
    "submitReport",
  );
  return callable(payload);
}
