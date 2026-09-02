import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../../firebaseConfig";

const functions = getFunctions(app);

type ReviewDecision = "approve" | "reject";

export async function reviewTeacherApplication(
  applicationId: string,
  decision: ReviewDecision,
  reason?: string,
) {
  const callable = httpsCallable(functions, "reviewTeacherApplication");
  return callable({ applicationId, decision, reason: reason?.trim() ?? "" });
}

export async function resubmitTeacherApplication() {
  const callable = httpsCallable(functions, "resubmitTeacherApplication");
  return callable({});
}
