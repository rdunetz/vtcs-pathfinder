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

  // Read generated JSON
  const filePath = path.join(__dirname, "courses.json"); // ensure generate_courses_json.py wrote here
  const raw = fs.readFileSync(filePath, "utf-8");
  const courses = JSON.parse(raw);

  for (const course of courses) {
    // Validate minimal fields
    if (!course.code || !course.name) {
      // skip malformed entries
      continue;
    }

    // Normalize credits: expect [x] or [x, y] or null
    const credits = course.credits;
    const isCreditsList =
      credits == null ||
      (Array.isArray(credits) &&
        (credits.length === 1 || credits.length === 2) &&
        credits.every((n) => typeof n === "number" && Number.isFinite(n)));
    if (!isCreditsList) {
      // Skip or coerce as needed; here we skip malformed credits
      continue;
    }

    // Ensure defaults similar to your controller schema
    const record = {
      code: course.code,
      name: course.name,
      credits: credits, // keep as [x] or [x, y] or null (if you prefer to enforce list, ensure generator always outputs a list)
      prerequisites: Array.isArray(course.prerequisites) ? course.prerequisites : [],
      corequisites: Array.isArray(course.corequisites) ? course.corequisites : [],
      category: course.category || "General",
      semesters: Array.isArray(course.semesters) && course.semesters.length ? course.semesters : ["Fall", "Spring"],
      description: course.description || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("courses").doc(record.code).set(record, { merge: true });
    console.log(`✅ Added ${record.code}: ${record.name}`);
  }

  console.log("✅ Done!");
  process.exit(0);
}

seed();
