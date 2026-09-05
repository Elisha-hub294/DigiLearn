const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require("@firebase/rules-unit-testing");
const { collection, doc, getDocs, setDoc } = require("firebase/firestore");
const { ref, uploadBytes } = require("firebase/storage");

const projectId = "digilearn-rules-tests";
let testEnv;

function auth(uid, type = "student", approved = false) {
  return {
    uid,
    token: {
      email: `${uid}@example.test`,
      email_verified: true,
    },
    type,
    approved,
  };
}

function firestoreContext(user) {
  return testEnv.authenticatedContext(user.uid, user.token);
}

async function seedUser(uid, type, teacherApprovalStatus) {
  const context = testEnv.withSecurityRulesDisabled();
  await setDoc(doc(context.firestore(), "users", uid), {
    type,
    teacherApprovalStatus,
  });
}

test.before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: fs.readFileSync(
        path.join(__dirname, "../../firestore.rules"),
        "utf8",
      ),
    },
    storage: {
      rules: fs.readFileSync(
        path.join(__dirname, "../../storage.rules"),
        "utf8",
      ),
    },
  });
});

test.after(async () => {
  await testEnv.cleanup();
});

test.beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.clearStorage();
});

test("verified students cannot publish books", async () => {
  const context = firestoreContext(auth("student-1"));
  await assertFails(
    setDoc(doc(context.firestore(), "books", "student-book"), {
      title: "Student book",
      author: "Student",
      owner: "student-1",
      description: "Test",
      cover: "",
      updatedAt: new Date(),
    }),
  );
});

test("approved teachers can publish books they own", async () => {
  await seedUser("teacher-1", "teacher", "approved");
  const context = firestoreContext(auth("teacher-1"));
  await assertSucceeds(
    setDoc(doc(context.firestore(), "books", "teacher-book"), {
      title: "Teacher book",
      author: "Teacher",
      owner: "teacher-1",
      description: "Test",
      cover: "",
      updatedAt: new Date(),
    }),
  );
});

test("users cannot upload to another user's Storage path", async () => {
  const student = testEnv.authenticatedContext("student-1", {
    email_verified: true,
  });
  const bytes = Buffer.from("test file");
  await assertFails(
    uploadBytes(ref(student.storage(), "docs/teacher-1/file.txt"), bytes, {
      contentType: "text/plain",
    }),
  );
});

test("users can upload to their own Storage path", async () => {
  const student = testEnv.authenticatedContext("student-1", {
    email_verified: true,
  });
  await assertSucceeds(
    uploadBytes(
      ref(student.storage(), "docs/student-1/file.txt"),
      Buffer.from("test file"),
      {
        contentType: "text/plain",
      },
    ),
  );
});

test("non-admin users cannot read admin notifications", async () => {
  const disabled = testEnv.withSecurityRulesDisabled();
  await setDoc(doc(disabled.firestore(), "adminNotifications", "notice-1"), {
    read: false,
  });
  const context = firestoreContext(auth("student-1"));
  await assertFails(
    getDocs(collection(context.firestore(), "adminNotifications")),
  );
});

test("admin users can read admin notifications", async () => {
  await seedUser("admin-1", "admin", undefined);
  const disabled = testEnv.withSecurityRulesDisabled();
  await setDoc(doc(disabled.firestore(), "adminNotifications", "notice-1"), {
    read: false,
  });
  const context = firestoreContext(auth("admin-1"));
  await assertSucceeds(
    getDocs(collection(context.firestore(), "adminNotifications")),
  );
});
