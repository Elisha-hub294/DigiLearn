"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.remindOverdueTeacherApplications = exports.notifyAdminsOfTeacherApplication = exports.emailNewReport = exports.submitReport = exports.getYoutubeVideoDuration = exports.resubmitTeacherApplication = exports.reviewTeacherApplication = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const firestore_2 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const nodemailer_1 = __importDefault(require("nodemailer"));
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const reportEmailUser = (0, params_1.defineSecret)("REPORT_EMAIL_USER");
const reportEmailPassword = (0, params_1.defineSecret)("REPORT_EMAIL_PASSWORD");
function requireAdmin(request) {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Sign in required.");
    return db
        .doc(`users/${request.auth.uid}`)
        .get()
        .then((snapshot) => {
        if (snapshot.data()?.type !== "admin") {
            throw new https_1.HttpsError("permission-denied", "Only admins can review applications.");
        }
        return request.auth.uid;
    });
}
function applicantNotification(message, title) {
    return {
        id: `teacher-review-${Date.now()}`,
        type: "announcement",
        publisherName: "DigiLearn",
        publisherAvatar: "@/assets/images/panda.png",
        message,
        resourceTitle: title,
        createdAt: firestore_1.Timestamp.now(),
        read: false,
    };
}
exports.reviewTeacherApplication = (0, https_1.onCall)(async (request) => {
    const adminId = await requireAdmin(request);
    const data = request.data;
    const applicationId = typeof data.applicationId === "string" ? data.applicationId.trim() : "";
    const decision = data.decision === "approve" || data.decision === "reject"
        ? data.decision
        : "";
    const reason = typeof data.reason === "string" ? data.reason.trim() : "";
    if (!applicationId || !decision)
        throw new https_1.HttpsError("invalid-argument", "Application and decision are required.");
    if (decision === "reject" && reason.length < 5)
        throw new https_1.HttpsError("invalid-argument", "A rejection reason is required.");
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
            throw new https_1.HttpsError("not-found", "Application not found.");
        if (application?.status !== "pending")
            throw new https_1.HttpsError("failed-precondition", "This application has already been reviewed.");
        const now = firestore_1.FieldValue.serverTimestamp();
        const status = decision === "approve" ? "approved" : "rejected";
        const notification = applicantNotification(decision === "approve"
            ? "Your teacher account has been approved."
            : `Your teacher application needs updates: ${reason}`, applicant?.name || application?.name || "Teacher application");
        transaction.update(applicationRef, {
            status,
            rejectionReason: decision === "reject" ? reason : firestore_1.FieldValue.delete(),
            reviewedAt: now,
            reviewedBy: adminId,
            updatedAt: now,
        });
        transaction.update(applicantRef, {
            type: decision === "approve" ? "teacher" : "student",
            teacherApprovalStatus: status,
            teacherReviewReason: decision === "reject" ? reason : firestore_1.FieldValue.delete(),
            notifications: firestore_1.FieldValue.arrayUnion(notification),
        });
        if (decision === "approve")
            transaction.set(teacherRef, {
                ...applicant,
                type: "teacher",
                teacherApprovalStatus: "approved",
                approvedAt: now,
            }, { merge: true });
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
exports.resubmitTeacherApplication = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Sign in required.");
    const applicationId = request.auth.uid;
    const applicationRef = db.doc(`teacherApplications/${applicationId}`);
    const applicantRef = db.doc(`users/${applicationId}`);
    const auditRef = db.collection("teacherApplicationAudit").doc();
    await db.runTransaction(async (transaction) => {
        const applicationSnapshot = await transaction.get(applicationRef);
        if (!applicationSnapshot.exists ||
            applicationSnapshot.data()?.status !== "rejected") {
            throw new https_1.HttpsError("failed-precondition", "Only rejected applications can be resubmitted.");
        }
        const now = firestore_1.FieldValue.serverTimestamp();
        transaction.update(applicationRef, {
            status: "pending",
            rejectionReason: firestore_1.FieldValue.delete(),
            updatedAt: now,
            resubmittedAt: now,
        });
        transaction.update(applicantRef, {
            type: "student",
            teacherApprovalStatus: "pending",
            teacherReviewReason: firestore_1.FieldValue.delete(),
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
exports.getYoutubeVideoDuration = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Sign in required.");
    }
    const videoId = typeof request.data?.videoId === "string"
        ? request.data.videoId.trim()
        : "";
    if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
        throw new https_1.HttpsError("invalid-argument", "A valid YouTube video is required.");
    }
    try {
        const playerResponse = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
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
        });
        if (playerResponse.ok) {
            const playerData = (await playerResponse.json());
            const playerSeconds = Number(playerData.videoDetails?.lengthSeconds ?? 0);
            if (Number.isFinite(playerSeconds) && playerSeconds > 0) {
                return { duration: playerSeconds };
            }
        }
        const response = await fetch(`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (!response.ok) {
            throw new Error(`YouTube returned ${response.status}`);
        }
        const html = await response.text();
        const durationMatch = html.match(/"lengthSeconds"\s*:\s*"(\d+)"/) ||
            html.match(/\\?"lengthSeconds\\?"\s*:\s*\\?"(\d+)\\?"/) ||
            html.match(/&quot;lengthSeconds&quot;\s*:\s*&quot;(\d+)&quot;/);
        const totalSeconds = Number(durationMatch?.[1] ?? 0);
        return {
            duration: Number.isFinite(totalSeconds) && totalSeconds > 0 ? totalSeconds : null,
        };
    }
    catch (error) {
        console.error("Failed to fetch YouTube duration:", error);
        throw new https_1.HttpsError("unavailable", "Unable to fetch video duration.");
    }
});
const reportReasons = new Set([
    "Incorrect information",
    "Broken or unavailable",
    "Inappropriate content",
    "Duplicate resource",
    "Other",
]);
exports.submitReport = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Sign in required to report an item.");
    }
    const data = request.data;
    const reasons = Array.isArray(data.reasons)
        ? data.reasons.filter((reason) => typeof reason === "string" && reportReasons.has(reason))
        : [];
    const details = typeof data.details === "string" ? data.details.trim() : "";
    const item = data.item ?? {};
    const itemType = typeof item.type === "string" ? item.type.trim() : "";
    const itemId = typeof item.id === "string" ? item.id.trim() : "";
    const itemName = typeof item.name === "string" ? item.name.trim() : "";
    if ((!reasons.length && !details) || details.length > 1000 || !itemType || !itemId || !itemName) {
        throw new https_1.HttpsError("invalid-argument", "A reason and valid item details are required.");
    }
    const [userSnapshot, teacherSnapshot] = await Promise.all([
        db.doc(`users/${request.auth.uid}`).get(),
        db.doc(`teachers/${request.auth.uid}`).get(),
    ]);
    const profile = userSnapshot.data() ?? teacherSnapshot.data();
    const reportRef = db.collection("reports").doc();
    await reportRef.set({
        userId: request.auth.uid,
        username: profile?.name || request.auth.token.name || "Unknown user",
        userEmail: request.auth.token.email || "Unavailable",
        reasons,
        details,
        item: { type: itemType, id: itemId, name: itemName },
        createdAt: firestore_1.Timestamp.now(),
        status: "queued",
    });
    return { reportId: reportRef.id };
});
exports.emailNewReport = (0, firestore_2.onDocumentCreated)({
    document: "reports/{reportId}",
    secrets: [reportEmailUser, reportEmailPassword],
}, async (event) => {
    const report = event.data?.data();
    if (!report)
        return;
    const transport = nodemailer_1.default.createTransport({
        service: "gmail",
        auth: {
            user: reportEmailUser.value(),
            pass: reportEmailPassword.value(),
        },
    });
    const item = report.item;
    const reasons = report.reasons?.join(", ") || "None selected";
    const subject = `[DigiLearn] ${item.type} report: ${item.name}`;
    const text = [
        `A user reported a problem with a DigiLearn ${item.type}.`,
        "",
        `User: ${report.username}`,
        `User ID: ${report.userId}`,
        `User email: ${report.userEmail}`,
        "",
        `Item name: ${item.name}`,
        `Item ID: ${item.id}`,
        `Item type: ${item.type}`,
        `Selected problems: ${reasons}`,
        `Details: ${report.details || "None provided"}`,
    ].join("\n");
    await transport.sendMail({
        from: reportEmailUser.value(),
        to: "elishabagalw@gmail.com",
        subject,
        text,
    });
    await event.data?.ref.update({ status: "sent", sentAt: firestore_1.Timestamp.now() });
});
exports.notifyAdminsOfTeacherApplication = (0, firestore_2.onDocumentCreated)("teacherApplications/{applicationId}", async (event) => {
    const application = event.data?.data();
    const applicationId = event.params.applicationId;
    if (!application)
        return;
    await db
        .collection("adminNotifications")
        .doc(applicationId)
        .set({
        id: applicationId,
        type: "announcement",
        publisherName: "DigiLearn",
        publisherAvatar: "@/assets/images/panda.png",
        message: "A new teacher account is waiting for your review.",
        resourceTitle: application.name || "Teacher application",
        itemId: applicationId,
        navigation: "/teacher-applications",
        createdAt: firestore_1.FieldValue.serverTimestamp(),
        read: false,
    }, { merge: true });
});
exports.remindOverdueTeacherApplications = (0, scheduler_1.onSchedule)("every day 09:00", async () => {
    const cutoff = firestore_1.Timestamp.fromMillis(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const applications = await db
        .collection("teacherApplications")
        .where("status", "==", "pending")
        .where("createdAt", "<=", cutoff)
        .get();
    const batch = db.batch();
    applications.docs.forEach((application) => {
        const data = application.data();
        batch.set(db.collection("adminNotifications").doc(`sla-${application.id}`), {
            id: `sla-${application.id}`,
            type: "announcement",
            publisherName: "DigiLearn",
            publisherAvatar: "@/assets/images/panda.png",
            message: "A teacher application has been waiting for more than 3 days.",
            resourceTitle: data.name || "Teacher application",
            itemId: application.id,
            navigation: "/teacher-applications",
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            read: false,
        }, { merge: true });
    });
    await batch.commit();
});
//# sourceMappingURL=index.js.map