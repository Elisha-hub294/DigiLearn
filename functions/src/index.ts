import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getStorage } from "firebase-admin/storage";
import {
  onDocumentCreated,
  onDocumentWritten,
} from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";

initializeApp();
const db = getFirestore();
const messaging = getMessaging();
const storage = getStorage();

const deletableCollections = new Set([
  "pages",
  "books",
  "pastPaper",
  "trendingLessons",
  "teacherPosts",
]);

const storagePrefixes = [
  "book-covers/",
  "page-covers/",
  "docs/",
  "post-covers/",
  "post-documents/",
  "past-papers/",
];

function collectStoragePaths(value: unknown, paths: Set<string>) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("gs://")) {
      const path = trimmed.replace(/^gs:\/\/[^/]+\//, "");
      if (path) paths.add(path);
    } else if (trimmed.includes("/o/")) {
      const encodedPath = trimmed.split("/o/")[1]?.split("?")[0];
      if (encodedPath) paths.add(decodeURIComponent(encodedPath));
    } else if (storagePrefixes.some((prefix) => trimmed.startsWith(prefix))) {
      paths.add(trimmed);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStoragePaths(item, paths));
    return;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectStoragePaths(item, paths));
  }
}

export const deleteResource = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }

  const { collectionName, resourceId } = request.data ?? {};
  if (
    typeof collectionName !== "string" ||
    !deletableCollections.has(collectionName) ||
    typeof resourceId !== "string" ||
    !resourceId.trim()
  ) {
    throw new HttpsError("invalid-argument", "Invalid resource.");
  }

  const resourceRef = db.collection(collectionName).doc(resourceId);
  const resourceSnapshot = await resourceRef.get();
  if (!resourceSnapshot.exists) {
    throw new HttpsError("not-found", "Resource not found.");
  }

  const resource = resourceSnapshot.data() ?? {};
  const userSnapshot = await db.collection("users").doc(request.auth.uid).get();
  const isAdmin = userSnapshot.data()?.type === "admin";
  if (!isAdmin && resource.owner !== request.auth.uid) {
    throw new HttpsError(
      "permission-denied",
      "You cannot delete this resource.",
    );
  }

  const paths = new Set<string>();
  collectStoragePaths(resource, paths);
  const bucket = storage.bucket();
  await Promise.all(
    Array.from(paths, async (path) => {
      try {
        await bucket.file(path).delete();
      } catch (error: any) {
        if (error?.code !== 404) throw error;
      }
    }),
  );
  await resourceRef.delete();
  return { deleted: true };
});

type UserNotification = {
  id?: string;
  message?: string;
  resourceTitle?: string;
  publisherName?: string;
  read?: boolean;
};

function getNewNotifications(
  before: UserNotification[] | undefined,
  after: UserNotification[] | undefined,
) {
  const previousIds = new Set((before ?? []).map((item) => item.id));
  return (after ?? []).filter((item) => item.id && !previousIds.has(item.id));
}

export const sendUserNotifications = onDocumentWritten(
  "users/{userId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!after) return;

    const newItems = getNewNotifications(
      before?.notifications as UserNotification[] | undefined,
      after.notifications as UserNotification[] | undefined,
    );
    const tokens = Object.values(
      (after.pushTokens ?? {}) as Record<string, unknown>,
    ).filter((token): token is string => typeof token === "string" && !!token);
    if (
      after.pushNotificationsEnabled === false ||
      !tokens.length ||
      !newItems.length
    ) {
      return;
    }

    await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: "DigiLearn",
        body:
          newItems[0].resourceTitle ??
          newItems[0].message ??
          "You have a new notification.",
      },
      data: { screen: "/notifications" },
    });
  },
);

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
  const data = (request.data ?? {}) as {
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
        ? "Your teacher application has been approved. You can now publish books, lessons, pages, announcements, and past papers on DigiLearn."
        : `Your teacher application needs updates: ${reason}`,
      decision === "approve"
        ? "Teacher account approved"
        : applicant?.name || application?.name || "Teacher application",
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

  await db
    .collection("adminNotifications")
    .doc(applicationId)
    .set(
      { read: true, dismissed: true, reviewedAt: Timestamp.now() },
      { merge: true },
    );

  return { status: decision === "approve" ? "approved" : "rejected" };
});

export const changeAccountType = onCall(async (request) => {
  if (!request.auth)
    throw new HttpsError("unauthenticated", "Sign in required.");

  const accountType = request.data?.accountType;
  if (accountType !== "student" && accountType !== "teacher") {
    throw new HttpsError(
      "invalid-argument",
      "A valid account type is required.",
    );
  }

  const userId = request.auth.uid;
  const userRef = db.doc(`users/${userId}`);
  const applicationRef = db.doc(`teacherApplications/${userId}`);
  const userSnapshot = await userRef.get();
  const authUser = request.auth.token;
  const userData = userSnapshot.data() ?? {
    name: authUser.name || authUser.email?.split("@")[0] || "DigiLearn learner",
    email: authUser.email || "",
    photoURL: authUser.picture || "",
    bio: "",
    level: "",
    school: "",
    gender: "",
    subjects: [],
    filterFeedByInterests: false,
    "marked-as-read": [],
    "hidden-pages": [],
    "saved-pages": [],
    "saved-books": [],
    "saved-lessons": [],
    "saved-posts": [],
    "paper-revision-status": {},
    savedAt: {},
    joinedAt: FieldValue.serverTimestamp(),
  };

  if (accountType === "student") {
    await userRef.set(
      {
        ...userData,
        type: "student",
        accountTypeCompleted: true,
        requestedAccountType: FieldValue.delete(),
        teacherApprovalStatus: FieldValue.delete(),
        teacherReviewReason: FieldValue.delete(),
      },
      { merge: true },
    );
    await applicationRef.delete();
    return { status: "student" };
  }

  await userRef.set(
    {
      ...userData,
      type: "student",
      accountTypeCompleted: true,
      requestedAccountType: "teacher",
      teacherApprovalStatus: "pending",
      teacherReviewReason: FieldValue.delete(),
    },
    { merge: true },
  );
  await applicationRef.set(
    {
      applicantId: userId,
      name: userData.name,
      email: userData.email,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  return { status: "pending" };
});

export const resubmitTeacherApplication = onCall(async (request) => {
  if (!request.auth)
    throw new HttpsError("unauthenticated", "Sign in required.");
  const applicationId = request.auth.uid;
  const applicationRef = db.doc(`teacherApplications/${applicationId}`);
  const applicantRef = db.doc(`users/${applicationId}`);
  const auditRef = db.collection("teacherApplicationAudit").doc();
  const currentApplication = await applicationRef.get();
  if (currentApplication.data()?.status === "pending") {
    return { status: "pending" };
  }
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

const reportReasons = new Set([
  "Incorrect information",
  "Broken or unavailable",
  "Inappropriate content",
  "Duplicate resource",
  "Other",
]);

export const submitReport = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Sign in required to report an item.",
    );
  }
  const userId = request.auth.uid;

  const data = request.data as {
    reasons?: unknown;
    details?: unknown;
    item?: { type?: unknown; id?: unknown; name?: unknown };
  };
  const reasons = Array.isArray(data.reasons)
    ? data.reasons.filter(
        (reason): reason is string =>
          typeof reason === "string" && reportReasons.has(reason),
      )
    : [];
  const details = typeof data.details === "string" ? data.details.trim() : "";
  const item = data.item ?? {};
  const itemType = typeof item.type === "string" ? item.type.trim() : "";
  const itemId = typeof item.id === "string" ? item.id.trim() : "";
  const itemName = typeof item.name === "string" ? item.name.trim() : "";

  if (
    (!reasons.length && !details) ||
    details.length > 1000 ||
    !itemType ||
    !itemId ||
    !itemName
  ) {
    throw new HttpsError(
      "invalid-argument",
      "A reason and valid item details are required.",
    );
  }

  const [userSnapshot, teacherSnapshot] = await Promise.all([
    db.doc(`users/${userId}`).get(),
    db.doc(`teachers/${userId}`).get(),
  ]);
  const profile = userSnapshot.exists
    ? userSnapshot.data()
    : teacherSnapshot.data();
  const recentReports = await db
    .collection("reports")
    .where("userId", "==", userId)
    .limit(20)
    .get();
  const cutoff = Date.now() - 10 * 60 * 1000;
  const hasRecentReport = recentReports.docs.some((document) => {
    const report = document.data();
    return (
      (report.item as { id?: string } | undefined)?.id === itemId &&
      ((report.createdAt as Timestamp | undefined)?.toMillis() ?? 0) > cutoff
    );
  });
  if (hasRecentReport) {
    throw new HttpsError(
      "resource-exhausted",
      "You recently reported this item. Please wait before sending another report.",
    );
  }
  const reportRef = db.collection("reports").doc();
  await reportRef.set({
    userId,
    username: profile?.name || request.auth.token.name || "Unknown user",
    userEmail: request.auth.token.email || "Unavailable",
    reasons,
    details,
    item: { type: itemType, id: itemId, name: itemName },
    createdAt: Timestamp.now(),
    status: "new",
  });

  return { reportId: reportRef.id };
});

export const notifyAdminsOfReport = onDocumentCreated(
  "reports/{reportId}",
  async (event) => {
    const report = event.data?.data();
    const reportId = event.params.reportId;
    if (!report) return;
    await db
      .collection("adminNotifications")
      .doc(`report-${reportId}`)
      .set({
        id: `report-${reportId}`,
        type: "announcement",
        publisherName: "DigiLearn",
        publisherAvatar: "@/assets/images/panda.png",
        message: "A new resource report needs review.",
        resourceTitle: report.item?.name || "Reported resource",
        itemId: reportId,
        collection: "reports",
        navigation: "/admin-reports",
        adminKind: "report",
        storage: "admin",
        createdAt: FieldValue.serverTimestamp(),
        read: false,
      });
  },
);

export const listReports = onCall(async (request) => {
  await requireAdmin(request);
  const snapshot = await db
    .collection("reports")
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();
  return {
    reports: snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    })),
  };
});

export const updateReport = onCall(async (request) => {
  const adminId = await requireAdmin(request);
  const data = request.data as {
    reportId?: unknown;
    status?: unknown;
    adminNotes?: unknown;
  };
  const reportId =
    typeof data.reportId === "string" ? data.reportId.trim() : "";
  const status = ["new", "in_review", "resolved", "dismissed"].includes(
    String(data.status),
  )
    ? String(data.status)
    : "";
  const adminNotes =
    typeof data.adminNotes === "string" ? data.adminNotes.trim() : "";
  if (!reportId || !status || adminNotes.length > 2000) {
    throw new HttpsError(
      "invalid-argument",
      "A valid status and report are required.",
    );
  }
  const reportRef = db.doc(`reports/${reportId}`);
  if (!(await reportRef.get()).exists) {
    throw new HttpsError("not-found", "Report not found.");
  }
  await reportRef.update({
    status,
    adminNotes,
    reviewedBy: adminId,
    reviewedAt: Timestamp.now(),
  });
  if (status === "resolved" || status === "dismissed") {
    await db
      .collection("adminNotifications")
      .doc(`report-${reportId}`)
      .set(
        { read: true, dismissed: true, reviewedAt: Timestamp.now() },
        { merge: true },
      );
  }
  return { status };
});

export const notifyAdminsOfTeacherApplication = onDocumentWritten(
  "teacherApplications/{applicationId}",
  async (event) => {
    const application = event.data?.after.data();
    const previousApplication = event.data?.before.data();
    const applicationId = event.params.applicationId;
    if (
      !application ||
      application.status !== "pending" ||
      previousApplication?.status === "pending"
    )
      return;

    await Promise.all([
      db
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
            adminKind: "teacher-application",
            createdAt: FieldValue.serverTimestamp(),
            read: false,
          },
          { merge: true },
        ),
      db.doc(`users/${applicationId}`).set(
        {
          notifications: FieldValue.arrayUnion(
            applicantNotification(
              "Your teacher application is under review. We will notify you when a decision is made.",
              application.name || "Teacher application",
            ),
          ),
        },
        { merge: true },
      ),
    ]);
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
