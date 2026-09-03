import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";

initializeApp();
const db = getFirestore();

function requireAdmin(request: { auth?: { uid: string } | null }) {
  if (!request.auth)
    throw new HttpsError("unauthenticated", "Sign in required.");
  return db
    .doc(`users/${request.auth.uid}`)
    .get()
    .then((snapshot) => {
      if (snapshot.data()?.type !== "admin") {
        throw new HttpsError(
          "permission-denied",
          "Only admins can review applications.",
        );
      }
      return request.auth!.uid;
    });
}

function applicantNotification(message: string, title: string) {
  return {
    id: `teacher-review-${Date.now()}`,
    type: "announcement",
    publisherName: "DigiLearn",
    publisherAvatar: "@/assets/images/panda.png",
    message,
    resourceTitle: title,
    createdAt: Timestamp.now(),
    read: false,
  };
}

export const reviewTeacherApplication = onCall(async (request) => {
  const adminId = await requireAdmin(request);
  const data = request.data as {
    applicationId?: unknown;
    decision?: unknown;
    reason?: unknown;
  };
  const applicationId =
    typeof data.applicationId === "string" ? data.applicationId.trim() : "";
  const decision =
    data.decision === "approve" || data.decision === "reject"
      ? data.decision
      : "";
  const reason = typeof data.reason === "string" ? data.reason.trim() : "";
  if (!applicationId || !decision)
    throw new HttpsError(
      "invalid-argument",
      "Application and decision are required.",
    );
  if (decision === "reject" && reason.length < 5)
    throw new HttpsError("invalid-argument", "A rejection reason is required.");

  const applicationRef = db.doc(`teacherApplications/${applicationId}`);
  const applicantRef = db.doc(`users/${applicationId}`);
  const teacherRef = db.doc(`teachers/${applicationId}`);
  const auditRef = db.collection("teacherApplicationAudit").doc();

  await db.runTransaction(async (transaction) => {
    const [applicationSnapshot, applicantSnapshot] = await Promise.all([
      transaction.get(applicationRef),
      transaction.get(applicantRef),
    ]);
    const application = applicationSnapshot.data();
    const applicant = applicantSnapshot.data();
    if (!applicationSnapshot.exists || !applicantSnapshot.exists)
      throw new HttpsError("not-found", "Application not found.");
    if (application?.status !== "pending")
      throw new HttpsError(
        "failed-precondition",
        "This application has already been reviewed.",
      );

    const now = FieldValue.serverTimestamp();
    const status = decision === "approve" ? "approved" : "rejected";
    const notification = applicantNotification(
      decision === "approve"
        ? "Your teacher account has been approved."
        : `Your teacher application needs updates: ${reason}`,
      applicant?.name || application?.name || "Teacher application",
    );

    transaction.update(applicationRef, {
      status,
      rejectionReason: decision === "reject" ? reason : FieldValue.delete(),
      reviewedAt: now,
      reviewedBy: adminId,
      updatedAt: now,
    });
    transaction.update(applicantRef, {
      type: decision === "approve" ? "teacher" : "student",
      teacherApprovalStatus: status,
      teacherReviewReason: decision === "reject" ? reason : FieldValue.delete(),
      notifications: FieldValue.arrayUnion(notification),
    });
    if (decision === "approve")
      transaction.set(
        teacherRef,
        {
          ...applicant,
          type: "teacher",
          teacherApprovalStatus: "approved",
          approvedAt: now,
        },
        { merge: true },
      );
    transaction.set(auditRef, {
      applicationId,
      applicantId: applicationId,
      action: status,
      reason: decision === "reject" ? reason : "",
      adminId,
      createdAt: now,
    });
  });

  return { status: decision === "approve" ? "approved" : "rejected" };
});

export const resubmitTeacherApplication = onCall(async (request) => {
  if (!request.auth)
    throw new HttpsError("unauthenticated", "Sign in required.");
  const applicationId = request.auth.uid;
  const applicationRef = db.doc(`teacherApplications/${applicationId}`);
  const applicantRef = db.doc(`users/${applicationId}`);
  const auditRef = db.collection("teacherApplicationAudit").doc();
  await db.runTransaction(async (transaction) => {
    const applicationSnapshot = await transaction.get(applicationRef);
    if (
      !applicationSnapshot.exists ||
      applicationSnapshot.data()?.status !== "rejected"
    ) {
      throw new HttpsError(
        "failed-precondition",
        "Only rejected applications can be resubmitted.",
      );
    }
    const now = FieldValue.serverTimestamp();
    transaction.update(applicationRef, {
      status: "pending",
      rejectionReason: FieldValue.delete(),
      updatedAt: now,
      resubmittedAt: now,
    });
    transaction.update(applicantRef, {
      type: "student",
      teacherApprovalStatus: "pending",
      teacherReviewReason: FieldValue.delete(),
    });
    transaction.set(auditRef, {
      applicationId,
      applicantId: applicationId,
      action: "resubmitted",
      reason: "",
      adminId: null,
      createdAt: now,
    });
  });
  return { status: "pending" };
});

export const getYoutubeVideoDuration = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }

  const videoId =
    typeof request.data?.videoId === "string"
      ? request.data.videoId.trim()
      : "";
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    throw new HttpsError(
      "invalid-argument",
      "A valid YouTube video is required.",
    );
  }

  try {
    const playerResponse = await fetch(
      "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          context: {
            client: {
              clientName: "WEB",
              clientVersion: "2.20250101.00.00",
            },
          },
        }),
      },
    );
    if (playerResponse.ok) {
      const playerData = (await playerResponse.json()) as {
        videoDetails?: { lengthSeconds?: string };
      };
      const playerSeconds = Number(playerData.videoDetails?.lengthSeconds ?? 0);
      if (Number.isFinite(playerSeconds) && playerSeconds > 0) {
        return { duration: playerSeconds };
      }
    }

    const response = await fetch(
      `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
      { headers: { "User-Agent": "Mozilla/5.0" } },
    );
    if (!response.ok) {
      throw new Error(`YouTube returned ${response.status}`);
    }

    const html = await response.text();
    const durationMatch =
      html.match(/"lengthSeconds"\s*:\s*"(\d+)"/) ||
      html.match(/\\?"lengthSeconds\\?"\s*:\s*\\?"(\d+)\\?"/) ||
      html.match(/&quot;lengthSeconds&quot;\s*:\s*&quot;(\d+)&quot;/);
    const totalSeconds = Number(durationMatch?.[1] ?? 0);

    return {
      duration:
        Number.isFinite(totalSeconds) && totalSeconds > 0 ? totalSeconds : null,
    };
  } catch (error) {
    console.error("Failed to fetch YouTube duration:", error);
    throw new HttpsError("unavailable", "Unable to fetch video duration.");
  }
});

export const notifyAdminsOfTeacherApplication = onDocumentCreated(
  "teacherApplications/{applicationId}",
  async (event) => {
    const application = event.data?.data();
    const applicationId = event.params.applicationId;
    if (!application) return;
    await db
      .collection("adminNotifications")
      .doc(applicationId)
      .set(
        {
          id: applicationId,
          type: "announcement",
          publisherName: "DigiLearn",
          publisherAvatar: "@/assets/images/panda.png",
          message: "A new teacher account is waiting for your review.",
          resourceTitle: application.name || "Teacher application",
          itemId: applicationId,
          navigation: "/teacher-applications",
          createdAt: FieldValue.serverTimestamp(),
          read: false,
        },
        { merge: true },
      );
  },
);

export const remindOverdueTeacherApplications = onSchedule(
  "every day 09:00",
  async () => {
    const cutoff = Timestamp.fromMillis(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const applications = await db
      .collection("teacherApplications")
      .where("status", "==", "pending")
      .where("createdAt", "<=", cutoff)
      .get();
    const batch = db.batch();
    applications.docs.forEach((application) => {
      const data = application.data();
      batch.set(
        db.collection("adminNotifications").doc(`sla-${application.id}`),
        {
          id: `sla-${application.id}`,
          type: "announcement",
          publisherName: "DigiLearn",
          publisherAvatar: "@/assets/images/panda.png",
          message:
            "A teacher application has been waiting for more than 3 days.",
          resourceTitle: data.name || "Teacher application",
          itemId: application.id,
          navigation: "/teacher-applications",
          createdAt: FieldValue.serverTimestamp(),
          read: false,
        },
        { merge: true },
      );
    });
    await batch.commit();
  },
);
