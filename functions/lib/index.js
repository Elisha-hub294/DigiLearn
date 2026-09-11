"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remindOverdueTeacherApplications =
  exports.notifyAdminsOfTeacherApplication =
  exports.updateReport =
  exports.listReports =
  exports.notifyAdminsOfReport =
  exports.submitReport =
  exports.getYoutubeVideoDuration =
  exports.resubmitTeacherApplication =
  exports.changeAccountType =
  exports.reviewTeacherApplication =
  exports.sendTeacherNotifications =
  exports.sendUserNotifications =
  exports.notifyTeacherFollowersOfNewPost =
  exports.getFollowedTeachers =
  exports.manageTeacherCommunity =
  exports.sendLibraryNotification =
  exports.deleteResource =
  exports.deleteAccount =
  exports.generateAssistantReply =
  exports.initializeUserProfile =
    void 0;
const genai_1 = require("@google/genai");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const messaging_1 = require("firebase-admin/messaging");
const storage_1 = require("firebase-admin/storage");
const params_1 = require("firebase-functions/params");
const firestore_2 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
(0, app_1.initializeApp)();
const geminiApiKey = (0, params_1.defineSecret)("GEMINI_API_KEY");
const db = (0, firestore_1.getFirestore)();
const adminAuth = (0, auth_1.getAuth)();
const messaging = (0, messaging_1.getMessaging)();
const storage = (0, storage_1.getStorage)();
function requireVerifiedAuth(request) {
  if (!request.auth) {
    throw new https_1.HttpsError("unauthenticated", "Sign in required.");
  }
  if (request.auth.token?.email_verified !== true) {
    throw new https_1.HttpsError(
      "failed-precondition",
      "Verify your email before creating an account.",
    );
  }
  return request.auth;
}
const profileAccentPalette = [
  "#0F766E",
  "#1D4ED8",
  "#6D28D9",
  "#BE123C",
  "#B45309",
  "#047857",
  "#4338CA",
  "#C2410C",
];
const generateProfileAccent = () =>
  profileAccentPalette[Math.floor(Math.random() * profileAccentPalette.length)];
const defaultProfileFields = (request) => {
  const token = request.auth?.token ?? {};
  const email = typeof token.email === "string" ? token.email : "";
  const displayName = typeof token.name === "string" ? token.name.trim() : "";
  return {
    name: displayName || email.split("@")[0] || "OS platform learner",
    email,
    photoURL: typeof token.picture === "string" ? token.picture : "",
    accent: generateProfileAccent(),
    bio: "",
    level: "",
    school: "",
    gender: "",
    subjects: [],
    filterFeedByInterests: false,
    accountTypeCompleted: false,
    type: "",
    "marked-as-read": [],
    "hidden-pages": [],
    "saved-pages": [],
    "saved-books": [],
    "saved-lessons": [],
    "saved-papers": [],
    "saved-posts": [],
    "paper-revision-status": {},
    savedAt: {},
    joinedAt: firestore_1.FieldValue.serverTimestamp(),
  };
};
exports.initializeUserProfile = (0, https_1.onCall)(async (request) => {
  const verifiedAuth = requireVerifiedAuth(request);
  const userRef = db.doc(`users/${verifiedAuth.uid}`);
  const teacherRef = db.doc(`teachers/${verifiedAuth.uid}`);
  const [snapshot, teacherSnapshot] = await Promise.all([
    userRef.get(),
    teacherRef.get(),
  ]);
  const profile = defaultProfileFields(request);
  if (teacherSnapshot.exists) {
    if (snapshot.exists) {
      await userRef.delete();
    }
    const currentTeacher = teacherSnapshot.data() ?? {};
    const missingTeacherFields = Object.fromEntries(
      Object.entries(profile).filter(
        ([key]) => currentTeacher[key] === undefined,
      ),
    );
    if (Object.keys(missingTeacherFields).length > 0) {
      await teacherRef.set(missingTeacherFields, { merge: true });
    }
    return { created: false, collection: "teachers" };
  }
  if (!snapshot.exists) {
    await userRef.create(profile);
    return { created: true };
  }
  const current = snapshot.data() ?? {};
  const missing = Object.fromEntries(
    Object.entries(profile).filter(([key]) => current[key] === undefined),
  );
  if (Object.keys(missing).length > 0) {
    await userRef.set(missing, { merge: true });
  }
  return { created: false };
});
exports.generateAssistantReply = (0, https_1.onCall)(
  { secrets: [geminiApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new https_1.HttpsError("unauthenticated", "Sign in required.");
    }
    const prompt =
      typeof request.data?.prompt === "string"
        ? request.data.prompt.trim()
        : "";
    const conversation =
      typeof request.data?.conversation === "string"
        ? request.data.conversation.trim()
        : "";
    const systemPrompt =
      typeof request.data?.systemPrompt === "string"
        ? request.data.systemPrompt.trim()
        : "";
    const startupContent = request.data?.startupContent === true;
    if (!prompt || prompt.length > 4000 || conversation.length > 12000) {
      throw new https_1.HttpsError(
        "invalid-argument",
        "The assistant request is invalid.",
      );
    }
    const apiKey = geminiApiKey.value();
    if (!apiKey) {
      throw new https_1.HttpsError(
        "unavailable",
        "The assistant is not configured.",
      );
    }
    if (!startupContent) {
      const {
        ref: usageRef,
        legacyRef,
        email,
      } = getAssistantUsageRef(request.auth.uid, request.auth.token.email);
      const today = new Date().toISOString().slice(0, 10);
      await db.runTransaction(async (transaction) => {
        const usageSnapshot = await transaction.get(usageRef);
        const legacySnapshot =
          usageRef.path === legacyRef.path
            ? usageSnapshot
            : await transaction.get(legacyRef);
        const usage = usageSnapshot.exists
          ? usageSnapshot.data()
          : legacySnapshot.data();
        const requestCount =
          usage?.day === today ? Number(usage.count ?? 0) : 0;
        if (requestCount >= 15) {
          throw new https_1.HttpsError(
            "resource-exhausted",
            "Daily assistant usage limit reached.",
          );
        }
        transaction.set(usageRef, {
          day: today,
          count: requestCount + 1,
          updatedAt: firestore_1.Timestamp.now(),
          ...(email ? { email } : {}),
        });
        if (usageRef.path !== legacyRef.path && legacySnapshot.exists) {
          transaction.delete(legacyRef);
        }
      });
    }
    try {
      const ai = new genai_1.GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        // `gemini-3.5-flash-lite` is not a published Gemini model ID.
        // Use the lightweight production model supported by the Google Gen AI SDK.
        model: "gemini-2.5-flash-lite",
        contents: startupContent
          ? "Return JSON only with two string arrays: floatingMessages (exactly 3 short study-assistant greetings) and suggestions (exactly 6 useful study prompts). Do not use Markdown or add any other keys."
          : `${systemPrompt}\n\nConversation:\n${conversation}\n\nUser prompt:\n${prompt}`,
      });
      return { text: response.text ?? "" };
    } catch (error) {
      console.error("Failed to generate assistant reply:", error);
      throw new https_1.HttpsError(
        "unavailable",
        "Unable to generate a response.",
      );
    }
  },
);
const deletableCollections = new Set([
  "pages",
  "books",
  "pastPaper",
  "trendingLessons",
  "teacherPosts",
]);
const ownedCollections = [
  "books",
  "pages",
  "pastPaper",
  "trendingLessons",
  "teacherPosts",
  "teacherPostsCards",
  "teacherUpdates",
];
const userScopedCollections = [
  "activityEvents",
  "reports",
  "teacherApplicationAudit",
  "adminNotifications",
  "teacherApplications",
];
const userReferenceFields = [
  "userId",
  "owner",
  "createdBy",
  "applicantId",
  "reporterId",
  "uid",
];
const storagePrefixes = [
  "book-covers/",
  "page-covers/",
  "past-paper-covers/",
  "docs/",
  "post-covers/",
  "post-documents/",
  "past-papers/",
];
function getAssistantUsageRef(userId, email) {
  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";
  const usageKey = normalizedEmail
    ? encodeURIComponent(normalizedEmail)
    : userId;
  return {
    ref: db.doc(`assistantUsage/${usageKey}`),
    legacyRef: db.doc(`assistantUsage/${userId}`),
    email: normalizedEmail,
  };
}
exports.deleteAccount = (0, https_1.onCall)(async (request) => {
  if (!request.auth) {
    throw new https_1.HttpsError("unauthenticated", "Sign in required.");
  }
  const userId = request.auth.uid;
  const ownedResourceSnapshots = await Promise.all(
    ownedCollections.map((collectionName) =>
      db.collection(collectionName).where("owner", "==", userId).get(),
    ),
  );
  const paths = new Set();
  ownedResourceSnapshots.forEach((snapshot) => {
    snapshot.docs.forEach((document) => {
      collectStoragePaths(document.data(), paths);
    });
  });
  const topLevelCollections = await db.listCollections();
  const relatedCollectionNames = Array.from(
    new Set([
      ...userScopedCollections,
      ...topLevelCollections.map((collection) => collection.id),
    ]),
  );
  const relatedDocuments = await Promise.all(
    relatedCollectionNames.flatMap((collectionName) =>
      userReferenceFields.map(async (fieldName) => {
        const snapshot = await db
          .collection(collectionName)
          .where(fieldName, "==", userId)
          .get();
        snapshot.docs.forEach((document) =>
          collectStoragePaths(document.data(), paths),
        );
        return snapshot.docs;
      }),
    ),
  );
  const relatedDocumentRefs = new Map(
    relatedDocuments
      .flat()
      .map((document) => [document.ref.path, document.ref]),
  );
  const bucket = storage.bucket();
  const userStoragePrefixes = [
    `profile-pics/${userId}/`,
    ...storagePrefixes.map((prefix) => `${prefix}${userId}/`),
  ];
  const userFiles = await Promise.all(
    userStoragePrefixes.map((prefix) => bucket.getFiles({ prefix })),
  );
  userFiles.forEach(([files]) => {
    files.forEach((file) => paths.add(file.name));
  });
  await Promise.all(
    Array.from(paths, async (path) => {
      try {
        await bucket.file(path).delete();
      } catch (error) {
        if (error?.code !== 404) throw error;
      }
    }),
  );
  const adminNotificationRefs = [db.doc(`adminNotifications/${userId}`)];
  const assistantUsage = getAssistantUsageRef(
    userId,
    request.auth.token?.email,
  );
  await Promise.all([
    ...ownedResourceSnapshots.flatMap((snapshot) =>
      snapshot.docs.map((document) => db.recursiveDelete(document.ref)),
    ),
    ...Array.from(relatedDocumentRefs.values(), (reference) =>
      db.recursiveDelete(reference),
    ),
    ...adminNotificationRefs.map((reference) => reference.delete()),
    assistantUsage.ref.delete(),
    assistantUsage.legacyRef.delete(),
    db.recursiveDelete(db.doc(`users/${userId}`)),
    db.recursiveDelete(db.doc(`teachers/${userId}`)),
    db.recursiveDelete(db.doc(`teacherApplications/${userId}`)),
  ]);
  await adminAuth.deleteUser(userId);
  return { deleted: true };
});
function collectStoragePaths(value, paths) {
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
async function collectResourceTreePaths(reference, paths) {
  const snapshot = await reference.get();
  if (!snapshot.exists) return;
  collectStoragePaths(snapshot.data(), paths);
  const subcollections = await reference.listCollections();
  await Promise.all(
    subcollections.map(async (subcollection) => {
      const documents = await subcollection.get();
      await Promise.all(
        documents.docs.map((document) =>
          collectResourceTreePaths(document.ref, paths),
        ),
      );
    }),
  );
}
function removeResourceReferences(data, collectionName, resourceId) {
  const savedFieldByCollection = {
    pages: "saved-pages",
    books: "saved-books",
    pastPaper: "saved-papers",
    trendingLessons: "saved-lessons",
    teacherPosts: "saved-posts",
  };
  const savedField = savedFieldByCollection[collectionName];
  const updates = {};
  if (savedField && Array.isArray(data[savedField])) {
    const filtered = data[savedField].filter((value) => value !== resourceId);
    if (filtered.length !== data[savedField].length)
      updates[savedField] = filtered;
  }
  for (const field of ["marked-as-read", "hidden-pages"]) {
    if (!Array.isArray(data[field])) continue;
    const filtered = data[field].filter((value) =>
      typeof value === "string"
        ? value !== resourceId
        : !value || typeof value !== "object" || value.id !== resourceId,
    );
    if (filtered.length !== data[field].length) updates[field] = filtered;
  }
  if (data.savedAt && typeof data.savedAt === "object") {
    const savedAt = { ...data.savedAt };
    delete savedAt[`${savedField}:${resourceId}`];
    if (Object.keys(savedAt).length !== Object.keys(data.savedAt).length) {
      updates.savedAt = savedAt;
    }
  }
  if (data["paper-revision-status"]?.[resourceId] !== undefined) {
    const revisionStatus = { ...data["paper-revision-status"] };
    delete revisionStatus[resourceId];
    updates["paper-revision-status"] = revisionStatus;
  }
  if (Array.isArray(data.notifications)) {
    const notifications = data.notifications.filter(
      (notification) =>
        notification?.itemId !== resourceId ||
        notification?.collection !== collectionName,
    );
    if (notifications.length !== data.notifications.length) {
      updates.notifications = notifications;
    }
  }
  return updates;
}
async function cleanResourceReferences(collectionName, resourceId) {
  const activityTypeByCollection = {
    pages: "page",
    books: "book",
    pastPaper: "paper",
    trendingLessons: "lesson",
    teacherPosts: "post",
  };
  let batch = db.batch();
  let writes = 0;
  const flush = async () => {
    if (!writes) return;
    await batch.commit();
    batch = db.batch();
    writes = 0;
  };
  for (const profileCollection of ["users", "teachers"]) {
    let lastDocument;
    while (true) {
      let profileQuery = db
        .collection(profileCollection)
        .orderBy(firestore_1.FieldPath.documentId())
        .limit(250);
      if (lastDocument) profileQuery = profileQuery.startAfter(lastDocument);
      const profilePage = await profileQuery.get();
      for (const document of profilePage.docs) {
        const updates = removeResourceReferences(
          document.data(),
          collectionName,
          resourceId,
        );
        if (Object.keys(updates).length) {
          batch.update(document.ref, updates);
          writes += 1;
          if (writes === 450) await flush();
        }
      }
      if (profilePage.size < 250) break;
      lastDocument = profilePage.docs[profilePage.docs.length - 1];
    }
  }
  let activityQuery = db
    .collection("activityEvents")
    .where("resourceId", "==", resourceId)
    .orderBy(firestore_1.FieldPath.documentId())
    .limit(250);
  while (true) {
    const activityPage = await activityQuery.get();
    for (const document of activityPage.docs) {
      if (document.data().type === activityTypeByCollection[collectionName]) {
        batch.delete(document.ref);
        writes += 1;
        if (writes === 450) await flush();
      }
    }
    if (activityPage.size < 250) break;
    activityQuery = activityQuery.startAfter(
      activityPage.docs[activityPage.docs.length - 1],
    );
  }
  await flush();
}
exports.deleteResource = (0, https_1.onCall)(async (request) => {
  if (!request.auth) {
    throw new https_1.HttpsError("unauthenticated", "Sign in required.");
  }
  const { collectionName, resourceId } = request.data ?? {};
  if (
    typeof collectionName !== "string" ||
    !deletableCollections.has(collectionName) ||
    typeof resourceId !== "string" ||
    !resourceId.trim()
  ) {
    throw new https_1.HttpsError("invalid-argument", "Invalid resource.");
  }
  const resourceRef = db.collection(collectionName).doc(resourceId);
  const resourceSnapshot = await resourceRef.get();
  if (!resourceSnapshot.exists) {
    throw new https_1.HttpsError("not-found", "Resource not found.");
  }
  const resource = resourceSnapshot.data() ?? {};
  const userSnapshot = await db.collection("users").doc(request.auth.uid).get();
  const isAdmin = userSnapshot.data()?.type === "admin";
  if (!isAdmin && resource.owner !== request.auth.uid) {
    throw new https_1.HttpsError(
      "permission-denied",
      "You cannot delete this resource.",
    );
  }
  const paths = new Set();
  await collectResourceTreePaths(resourceRef, paths);
  const bucket = storage.bucket();
  await Promise.all(
    Array.from(paths, async (path) => {
      try {
        await bucket.file(path).delete();
      } catch (error) {
        if (error?.code !== 404) throw error;
      }
    }),
  );
  await cleanResourceReferences(collectionName, resourceId);
  await db.recursiveDelete(resourceRef);
  return { deleted: true };
});
exports.sendLibraryNotification = (0, https_1.onCall)(async (request) => {
  if (!request.auth) {
    throw new https_1.HttpsError("unauthenticated", "Sign in required.");
  }
  const publisherUid = request.auth.uid;
  const userSnapshot = await db.doc(`users/${request.auth.uid}`).get();
  const teacherSnapshot = await db.doc(`teachers/${request.auth.uid}`).get();
  const userData = userSnapshot.data() ?? {};
  const teacherData = teacherSnapshot.data() ?? {};
  const isPublisher =
    userData.type === "admin" ||
    (teacherData.type === "teacher" &&
      teacherData.teacherApprovalStatus === "approved");
  if (!isPublisher) {
    throw new https_1.HttpsError(
      "permission-denied",
      "Publishing permission required.",
    );
  }
  const input = request.data?.notification;
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new https_1.HttpsError("invalid-argument", "Invalid notification.");
  }
  const inputData = input;
  const publisherId =
    typeof inputData.publisherId === "string" ? inputData.publisherId : "";
  if (
    publisherId &&
    inputData.type === "announcement" &&
    publisherId !== request.auth.uid
  ) {
    throw new https_1.HttpsError(
      "permission-denied",
      "You can only notify followers of your own teacher account.",
    );
  }
  const notification = {
    ...inputData,
    publisherName:
      publisherId && inputData.type === "announcement"
        ? (teacherData.name ?? inputData.publisherName)
        : inputData.publisherName,
    publisherAvatar:
      publisherId && inputData.type === "announcement"
        ? (teacherData.avatar ?? inputData.publisherAvatar)
        : inputData.publisherAvatar,
    createdAt: firestore_1.Timestamp.now(),
    read: false,
  };
  const recipientDocs =
    publisherId && inputData.type === "announcement"
      ? (await db.collection(`teachers/${publisherId}/followers`).get()).docs
          .flatMap((follower) => [
            db.collection("users").doc(follower.id),
            db.collection("teachers").doc(follower.id),
          ])
          .filter((userRef) => userRef.id !== publisherUid)
      : [
          ...(await db.collection("users").get()).docs.map(
            (document) => document.ref,
          ),
          ...(await db.collection("teachers").get()).docs.map(
            (document) => document.ref,
          ),
        ].filter((userRef) => userRef.id !== publisherUid);
  const batchSize = 450;
  for (let start = 0; start < recipientDocs.length; start += batchSize) {
    const batch = db.batch();
    recipientDocs.slice(start, start + batchSize).forEach((userRef) => {
      batch.set(
        userRef,
        {
          notifications: firestore_1.FieldValue.arrayUnion(notification),
        },
        { merge: true },
      );
    });
    await batch.commit();
  }
  return { sent: recipientDocs.length };
});
exports.manageTeacherCommunity = (0, https_1.onCall)(async (request) => {
  if (!request.auth) {
    throw new https_1.HttpsError("unauthenticated", "Sign in required.");
  }
  const teacherId = request.data?.teacherId;
  const action = request.data?.action;
  if (typeof teacherId !== "string" || !teacherId.trim()) {
    throw new https_1.HttpsError("invalid-argument", "Teacher id is required.");
  }
  if (action !== "status" && action !== "join" && action !== "leave") {
    throw new https_1.HttpsError(
      "invalid-argument",
      "Invalid community action.",
    );
  }
  const teacherSnapshot = await db.doc(`teachers/${teacherId}`).get();
  if (!teacherSnapshot.exists || teacherSnapshot.data()?.type !== "teacher") {
    throw new https_1.HttpsError("not-found", "Teacher not found.");
  }
  const followerRef = db.doc(
    `teachers/${teacherId}/followers/${request.auth.uid}`,
  );
  if (action === "join") {
    const alreadyJoined = (await followerRef.get()).exists;
    await followerRef.set({ joinedAt: firestore_1.Timestamp.now() });
    const [userSnapshot, followerTeacherSnapshot] = await Promise.all([
      db.doc(`users/${request.auth.uid}`).get(),
      db.doc(`teachers/${request.auth.uid}`).get(),
    ]);
    if (!alreadyJoined && teacherId !== request.auth.uid) {
      const followerData =
        userSnapshot.data() ?? followerTeacherSnapshot.data() ?? {};
      const followerName =
        typeof followerData.name === "string" && followerData.name.trim()
          ? followerData.name.trim()
          : (request.auth.token?.name ?? "An OS platform user");
      const followerAvatar =
        typeof followerData.photoURL === "string"
          ? followerData.photoURL
          : typeof followerData.avatar === "string"
            ? followerData.avatar
            : "";
      const followerSchool =
        typeof followerData.school === "string" && followerData.school.trim()
          ? followerData.school.trim()
          : undefined;
      await db.doc(`teachers/${teacherId}`).set(
        {
          notifications: firestore_1.FieldValue.arrayUnion({
            id: `teacher-community-${request.auth.uid}-${Date.now()}`,
            type: "announcement",
            notificationKind: "teacher-community",
            publisherName: followerName,
            publisherAvatar: followerAvatar,
            publisherSchool: followerSchool,
            message: "Joined your community",
            createdAt: firestore_1.Timestamp.now(),
            read: false,
          }),
        },
        { merge: true },
      );
    }
    const followerProfileRef = userSnapshot.exists
      ? db.doc(`users/${request.auth.uid}`)
      : followerTeacherSnapshot.exists
        ? db.doc(`teachers/${request.auth.uid}`)
        : null;
    if (followerProfileRef) {
      await followerProfileRef.set(
        { followedTeacherIds: firestore_1.FieldValue.arrayUnion(teacherId) },
        { merge: true },
      );
    }
  } else if (action === "leave") {
    await followerRef.delete();
    const [userSnapshot, followerTeacherSnapshot] = await Promise.all([
      db.doc(`users/${request.auth.uid}`).get(),
      db.doc(`teachers/${request.auth.uid}`).get(),
    ]);
    const followerProfileRef = userSnapshot.exists
      ? db.doc(`users/${request.auth.uid}`)
      : followerTeacherSnapshot.exists
        ? db.doc(`teachers/${request.auth.uid}`)
        : null;
    if (followerProfileRef) {
      await followerProfileRef.set(
        { followedTeacherIds: firestore_1.FieldValue.arrayRemove(teacherId) },
        { merge: true },
      );
    }
  }
  const followerSnapshot = await followerRef.get();
  return { joined: followerSnapshot.exists };
});
/** Returns the followed-teacher IDs mirrored onto the authenticated profile. */
exports.getFollowedTeachers = (0, https_1.onCall)(async (request) => {
  if (!request.auth) {
    throw new https_1.HttpsError("unauthenticated", "Sign in required.");
  }
  const [userSnapshot, teacherSnapshot] = await Promise.all([
    db.doc(`users/${request.auth.uid}`).get(),
    db.doc(`teachers/${request.auth.uid}`).get(),
  ]);
  const teacherIds = [userSnapshot, teacherSnapshot].flatMap((snapshot) => {
    const followedTeacherIds = snapshot.data()?.followedTeacherIds;
    return Array.isArray(followedTeacherIds)
      ? followedTeacherIds.filter((teacherId) => typeof teacherId === "string")
      : [];
  });
  return { teacherIds: [...new Set(teacherIds)] };
});
/** New teacher posts always notify each follower of that teacher. */
exports.notifyTeacherFollowersOfNewPost = (0, firestore_2.onDocumentCreated)(
  "teacherPosts/{postId}",
  async (event) => {
    const post = event.data?.data();
    const teacherId = typeof post?.owner === "string" ? post.owner : "";
    if (!teacherId) return;
    const teacherSnapshot = await db.doc(`teachers/${teacherId}`).get();
    if (!teacherSnapshot.exists) return;
    const teacher = teacherSnapshot.data() ?? {};
    const followers = await db
      .collection(`teachers/${teacherId}/followers`)
      .get();
    if (followers.empty) return;
    const title = typeof post?.title === "string" ? post.title.trim() : "";
    const cover = typeof post?.cover === "string" ? post.cover.trim() : "";
    const notification = {
      id: `announcement-${event.params.postId}`,
      type: "announcement",
      publisherName:
        typeof teacher.name === "string" && teacher.name.trim()
          ? teacher.name.trim()
          : "Teacher",
      publisherAvatar:
        typeof teacher.photoURL === "string"
          ? teacher.photoURL
          : typeof teacher.avatar === "string"
            ? teacher.avatar
            : "",
      message: "Published a new announcement",
      ...(title ? { resourceTitle: title } : {}),
      ...(cover ? { previewImage: cover } : {}),
      createdAt: firestore_1.Timestamp.now(),
      read: false,
      itemId: event.params.postId,
      collection: "teacherPosts",
      navigation: "/teacher-profile",
    };
    const recipients = followers.docs
      .map((follower) => db.doc(`users/${follower.id}`))
      .filter((recipient) => recipient.id !== teacherId);
    for (let start = 0; start < recipients.length; start += 450) {
      const batch = db.batch();
      recipients.slice(start, start + 450).forEach((recipient) => {
        batch.set(
          recipient,
          { notifications: firestore_1.FieldValue.arrayUnion(notification) },
          { merge: true },
        );
      });
      await batch.commit();
    }
  },
);
function getNewNotifications(before, after) {
  const previousIds = new Set((before ?? []).map((item) => item.id));
  return (after ?? []).filter((item) => item.id && !previousIds.has(item.id));
}
async function sendUserNotification(event) {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!after) return;
  const newItems = getNewNotifications(
    before?.notifications,
    after.notifications,
  );
  const tokens = Object.values(after.pushTokens ?? {}).filter(
    (token) => typeof token === "string" && !!token,
  );
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
      title: "OS platform",
      body:
        newItems[0].resourceTitle ??
        newItems[0].message ??
        "You have a new notification.",
    },
    data: { screen: "/notifications" },
  });
}
exports.sendUserNotifications = (0, firestore_2.onDocumentWritten)(
  "users/{userId}",
  sendUserNotification,
);
exports.sendTeacherNotifications = (0, firestore_2.onDocumentWritten)(
  "teachers/{userId}",
  sendUserNotification,
);
function requireAdmin(request) {
  if (!request.auth)
    throw new https_1.HttpsError("unauthenticated", "Sign in required.");
  return db
    .doc(`users/${request.auth.uid}`)
    .get()
    .then((snapshot) => {
      if (snapshot.data()?.type !== "admin") {
        throw new https_1.HttpsError(
          "permission-denied",
          "Only admins can review applications.",
        );
      }
      return request.auth.uid;
    });
}
function applicantNotification(message, title) {
  return {
    id: `teacher-review-${Date.now()}`,
    type: "announcement",
    notificationKind: "teacher-review",
    publisherName: "OS platform",
    publisherAvatar: "@/assets/images/panda.png",
    message,
    resourceTitle: title,
    createdAt: firestore_1.Timestamp.now(),
    read: false,
  };
}
exports.reviewTeacherApplication = (0, https_1.onCall)(async (request) => {
  const adminId = await requireAdmin(request);
  const data = request.data ?? {};
  const applicationId =
    typeof data.applicationId === "string" ? data.applicationId.trim() : "";
  const decision =
    data.decision === "approve" || data.decision === "reject"
      ? data.decision
      : "";
  const reason = typeof data.reason === "string" ? data.reason.trim() : "";
  const allowReapply = data.allowReapply === true;
  if (!applicationId || !decision)
    throw new https_1.HttpsError(
      "invalid-argument",
      "Application and decision are required.",
    );
  if (decision === "reject" && reason.length < 5)
    throw new https_1.HttpsError(
      "invalid-argument",
      "A rejection reason is required.",
    );
  const applicationRef = db.doc(`teacherApplications/${applicationId}`);
  const applicantRef = db.doc(`teachers/${applicationId}`);
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
      throw new https_1.HttpsError(
        "failed-precondition",
        "This application has already been reviewed.",
      );
    const now = firestore_1.FieldValue.serverTimestamp();
    const status = decision === "approve" ? "approved" : "rejected";
    const notification = applicantNotification(
      decision === "approve"
        ? "Your teacher application has been approved. You can now publish books, lessons, pages, announcements, and past papers on OS platform."
        : `Your teacher application needs updates: ${reason}. Please resolve the issue and resend your request.`,
      decision === "approve"
        ? "Teacher account approved"
        : applicant?.name || application?.name || "Teacher application",
    );
    transaction.update(applicationRef, {
      status,
      rejectionReason:
        decision === "reject" ? reason : firestore_1.FieldValue.delete(),
      allowReapply:
        decision === "reject" ? allowReapply : firestore_1.FieldValue.delete(),
      reviewedAt: now,
      reviewedBy: adminId,
      updatedAt: now,
    });
    transaction.set(
      teacherRef,
      {
        ...applicant,
        type: "teacher",
        teacherApprovalStatus: status,
        teacherReviewReason:
          decision === "reject" ? reason : firestore_1.FieldValue.delete(),
        allowReapply:
          decision === "reject"
            ? allowReapply
            : firestore_1.FieldValue.delete(),
        notifications: firestore_1.FieldValue.arrayUnion(notification),
        ...(decision === "approve" ? { approvedAt: now } : {}),
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
      { read: true, dismissed: true, reviewedAt: firestore_1.Timestamp.now() },
      { merge: true },
    );
  return { status: decision === "approve" ? "approved" : "rejected" };
});
exports.changeAccountType = (0, https_1.onCall)(async (request) => {
  const verifiedAuth = requireVerifiedAuth(request);
  const accountType = request.data?.accountType;
  if (accountType !== "student" && accountType !== "teacher") {
    throw new https_1.HttpsError(
      "invalid-argument",
      "A valid account type is required.",
    );
  }
  const userId = verifiedAuth.uid;
  const userRef = db.doc(`users/${userId}`);
  const teacherRef = db.doc(`teachers/${userId}`);
  const applicationRef = db.doc(`teacherApplications/${userId}`);
  const userSnapshot = await userRef.get();
  const teacherSnapshot = await teacherRef.get();
  const userData = {
    ...defaultProfileFields(request),
    ...(teacherSnapshot.data() ?? userSnapshot.data() ?? {}),
  };
  if (userData.teacherApprovalStatus === "pending") {
    throw new https_1.HttpsError(
      "failed-precondition",
      "Account type cannot be changed while the teacher application is under review.",
    );
  }
  if (accountType === "student") {
    await userRef.set(
      {
        ...userData,
        type: "student",
        accountTypeCompleted: true,
        requestedAccountType: firestore_1.FieldValue.delete(),
        teacherApprovalStatus: firestore_1.FieldValue.delete(),
        teacherReviewReason: firestore_1.FieldValue.delete(),
      },
      { merge: true },
    );
    if (teacherSnapshot.exists) await teacherRef.delete();
    await applicationRef.delete();
    return { status: "student" };
  }
  await teacherRef.set(
    {
      ...userData,
      type: "teacher",
      accountTypeCompleted: true,
      requestedAccountType: "teacher",
      teacherApprovalStatus: "pending",
      teacherReviewReason: firestore_1.FieldValue.delete(),
    },
    { merge: true },
  );
  if (userSnapshot.exists) await userRef.delete();
  await applicationRef.set(
    {
      applicantId: userId,
      name: userData.name,
      email: userData.email,
      status: "pending",
      createdAt: firestore_1.FieldValue.serverTimestamp(),
      updatedAt: firestore_1.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  return { status: "pending" };
});
exports.resubmitTeacherApplication = (0, https_1.onCall)(async (request) => {
  if (!request.auth)
    throw new https_1.HttpsError("unauthenticated", "Sign in required.");
  const applicationId = request.auth.uid;
  const applicationRef = db.doc(`teacherApplications/${applicationId}`);
  const applicantRef = db.doc(`teachers/${applicationId}`);
  const auditRef = db.collection("teacherApplicationAudit").doc();
  const currentApplication = await applicationRef.get();
  if (currentApplication.data()?.status === "pending") {
    return { status: "pending" };
  }
  await db.runTransaction(async (transaction) => {
    const applicationSnapshot = await transaction.get(applicationRef);
    const applicationData = applicationSnapshot.data();
    if (!applicationSnapshot.exists || applicationData?.status !== "rejected") {
      throw new https_1.HttpsError(
        "failed-precondition",
        "Only rejected applications can be resubmitted.",
      );
    }
    if (applicationData?.allowReapply !== true) {
      throw new https_1.HttpsError(
        "failed-precondition",
        "This application cannot be resubmitted until an admin allows it again.",
      );
    }
    const now = firestore_1.FieldValue.serverTimestamp();
    transaction.update(applicationRef, {
      status: "pending",
      rejectionReason: firestore_1.FieldValue.delete(),
      allowReapply: firestore_1.FieldValue.delete(),
      updatedAt: now,
      resubmittedAt: now,
    });
    transaction.update(applicantRef, {
      type: "teacher",
      teacherApprovalStatus: "pending",
      teacherReviewReason: firestore_1.FieldValue.delete(),
      allowReapply: firestore_1.FieldValue.delete(),
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
  const videoId =
    typeof request.data?.videoId === "string"
      ? request.data.videoId.trim()
      : "";
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    throw new https_1.HttpsError(
      "invalid-argument",
      "A valid YouTube video is required.",
    );
  }
  try {
    const clients = [
      { clientName: "TVHTML5", clientVersion: "7.20250101.08.00" },
      { clientName: "WEB", clientVersion: "2.20250101.00.00" },
    ];
    for (const client of clients) {
      try {
        const playerResponse = await fetch(
          "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              videoId,
              context: { client },
            }),
          },
        );
        if (playerResponse.ok) {
          const playerData = await playerResponse.json();
          const playerSeconds = Number(
            playerData.videoDetails?.lengthSeconds ?? 0,
          );
          if (Number.isFinite(playerSeconds) && playerSeconds > 0) {
            return { duration: playerSeconds };
          }
        }
      } catch {}
    }
    const response = await fetch(
      `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
      },
    );
    if (response.ok) {
      const html = await response.text();
      const itempropMatch = html.match(
        /itemprop="duration"\s+content="PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?"/i,
      );
      if (itempropMatch) {
        const hours = Number(itempropMatch[1] || 0);
        const minutes = Number(itempropMatch[2] || 0);
        const seconds = Number(itempropMatch[3] || 0);
        const total = hours * 3600 + minutes * 60 + seconds;
        if (total > 0) {
          return { duration: total };
        }
      }
      const approxMatch = html.match(/"approxDurationMs"\s*:\s*"(\d+)"/);
      if (approxMatch?.[1]) {
        const ms = Number(approxMatch[1]);
        if (Number.isFinite(ms) && ms > 0) {
          return { duration: Math.round(ms / 1000) };
        }
      }
      const durationMatch =
        html.match(/"lengthSeconds"\s*:\s*"(\d+)"/) ||
        html.match(/\\?"lengthSeconds\\?"\s*:\s*\\?"(\d+)\\?"/) ||
        html.match(/&quot;lengthSeconds&quot;\s*:\s*&quot;(\d+)&quot;/);
      const totalSeconds = Number(durationMatch?.[1] ?? 0);
      if (Number.isFinite(totalSeconds) && totalSeconds > 0) {
        return { duration: totalSeconds };
      }
    }
    return { duration: null };
  } catch (error) {
    console.error("Failed to fetch YouTube duration:", error);
    return { duration: null };
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
    throw new https_1.HttpsError(
      "unauthenticated",
      "Sign in required to report an item.",
    );
  }
  const userId = request.auth.uid;
  const data = request.data;
  const reasons = Array.isArray(data.reasons)
    ? data.reasons.filter(
        (reason) => typeof reason === "string" && reportReasons.has(reason),
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
    throw new https_1.HttpsError(
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
      report.item?.id === itemId && (report.createdAt?.toMillis() ?? 0) > cutoff
    );
  });
  if (hasRecentReport) {
    throw new https_1.HttpsError(
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
    createdAt: firestore_1.Timestamp.now(),
    status: "new",
  });
  return { reportId: reportRef.id };
});
exports.notifyAdminsOfReport = (0, firestore_2.onDocumentCreated)(
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
        publisherName: "OS platform",
        publisherAvatar: "@/assets/images/panda.png",
        message: "A new resource report needs review.",
        resourceTitle: report.item?.name || "Reported resource",
        itemId: reportId,
        collection: "reports",
        navigation: "/admin-reports",
        adminKind: "report",
        storage: "admin",
        createdAt: firestore_1.FieldValue.serverTimestamp(),
        read: false,
      });
  },
);
exports.listReports = (0, https_1.onCall)(async (request) => {
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
exports.updateReport = (0, https_1.onCall)(async (request) => {
  const adminId = await requireAdmin(request);
  const data = request.data;
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
    throw new https_1.HttpsError(
      "invalid-argument",
      "A valid status and report are required.",
    );
  }
  const reportRef = db.doc(`reports/${reportId}`);
  if (!(await reportRef.get()).exists) {
    throw new https_1.HttpsError("not-found", "Report not found.");
  }
  await reportRef.update({
    status,
    adminNotes,
    reviewedBy: adminId,
    reviewedAt: firestore_1.Timestamp.now(),
  });
  if (status === "resolved" || status === "dismissed") {
    await db
      .collection("adminNotifications")
      .doc(`report-${reportId}`)
      .set(
        {
          read: true,
          dismissed: true,
          reviewedAt: firestore_1.Timestamp.now(),
        },
        { merge: true },
      );
  }
  return { status };
});
exports.notifyAdminsOfTeacherApplication = (0, firestore_2.onDocumentWritten)(
  "teacherApplications/{applicationId}",
  async (event) => {
    const application = event.data?.after.data();
    const previousApplication = event.data?.before.data();
    const applicationId = event.params.applicationId;
    const isResubmission = previousApplication?.status === "rejected";
    if (
      !application ||
      application.status !== "pending" ||
      previousApplication?.status === "pending"
    )
      return;
    const notificationId = isResubmission
      ? `teacher-resubmission-${applicationId}-${application.resubmittedAt?.seconds ?? Date.now()}`
      : applicationId;
    await Promise.all([
      db
        .collection("adminNotifications")
        .doc(notificationId)
        .set(
          {
            id: notificationId,
            type: "announcement",
            publisherName: "OS platform",
            publisherAvatar:
              typeof application.photoURL === "string"
                ? application.photoURL
                : "@/assets/images/panda.png",
            message: isResubmission
              ? "A teacher has resubmitted an application for your review."
              : "A new teacher account is waiting for your review.",
            resourceTitle: application.name || "Teacher application",
            itemId: applicationId,
            navigation: "/teacher-applications",
            adminKind: "teacher-application",
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            read: false,
            dismissed: false,
          },
          { merge: true },
        ),
      db.doc(`teachers/${applicationId}`).set(
        {
          notifications: firestore_1.FieldValue.arrayUnion(
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
exports.remindOverdueTeacherApplications = (0, scheduler_1.onSchedule)(
  "every day 09:00",
  async () => {
    const cutoff = firestore_1.Timestamp.fromMillis(
      Date.now() - 3 * 24 * 60 * 60 * 1000,
    );
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
          publisherName: "OS platform",
          publisherAvatar: "@/assets/images/panda.png",
          message:
            "A teacher application has been waiting for more than 3 days.",
          resourceTitle: data.name || "Teacher application",
          itemId: application.id,
          navigation: "/teacher-applications",
          createdAt: firestore_1.FieldValue.serverTimestamp(),
          read: false,
        },
        { merge: true },
      );
    });
    await batch.commit();
  },
);
//# sourceMappingURL=index.js.map
