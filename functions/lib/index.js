"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remindOverdueTeacherApplications = exports.notifyAdminsOfTeacherApplication = exports.resubmitTeacherApplication = exports.reviewTeacherApplication = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const firestore_2 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
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