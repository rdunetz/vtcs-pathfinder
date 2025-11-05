const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function seed() {
  console.log("🌱 Seeding database from courses.json...");

  const filePath = path.join(__dirname, "courses.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const courses = JSON.parse(raw);

  for (const course of courses) {
    if (!course.code || !course.name) continue;

    // Validate credits
    const credits = course.credits;
    const isCreditsList =
      credits == null ||
      (Array.isArray(credits) &&
        (credits.length === 1 || credits.length === 2) &&
        credits.every((n) => typeof n === "number" && Number.isFinite(n)));
    if (!isCreditsList) continue;

    // Normalize pathways
    const pathways = Array.isArray(course.pathways)
      ? course.pathways.filter((p) => typeof p === "string" && p.trim().length > 0)
      : typeof course.pathways === "string"
      ? course.pathways.split(",").map((p) => p.trim()).filter((p) => p.length > 0)
      : [];

    // Normalize arrays
    const prerequisites = Array.isArray(course.prerequisites)
      ? course.prerequisites.filter((c) => typeof c === "string")
      : [];
    const corequisites = Array.isArray(course.corequisites)
      ? course.corequisites.filter((c) => typeof c === "string")
      : [];

    // Normalize semesters
    const semesters =
      Array.isArray(course.semesters) && course.semesters.length
        ? course.semesters.filter((s) => typeof s === "string" && s.trim().length > 0)
        : ["Fall", "Spring"];

    const docRef = db.collection("courses").doc(course.code);
    const snap = await docRef.get();

    const nowIso = new Date().toISOString();
    const baseData = {
      code: course.code,
      name: course.name,
      credits: credits ?? null,
      prerequisites,
      corequisites,
      category: course.category || "General",
      semesters,
      description: typeof course.description === "string" ? course.description : "",
      pathways,
      updatedAt: nowIso,
    };

    if (!snap.exists) {
      // New document: set createdAt
      await docRef.set({ ...baseData, createdAt: nowIso }, { merge: true });
      console.log(`🆕 Created ${course.code}: ${course.name}`);
    } else {
      // Existing document: DO NOT modify createdAt
      await docRef.set(baseData, { merge: true });
      console.log(`🔁 Updated ${course.code}: ${course.name}`);
    }
  }

  console.log("✅ Done!");
  process.exit(0);
}

seed();
