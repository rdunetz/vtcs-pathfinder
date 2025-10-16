const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const courses = [
  {
    code: "CS1114",
    name: "Introduction to Software Design",
    credits: 3,
    prerequisites: [],
    category: "Core CS",
    semesters: ["Fall", "Spring"],
  },
  {
    code: "CS2114",
    name: "Software Design and Data Structures",
    credits: 3,
    prerequisites: ["CS1114"],
    category: "Core CS",
    semesters: ["Fall", "Spring"],
  },
  {
    code: "CS2505",
    name: "Computer Organization I",
    credits: 3,
    prerequisites: ["CS1114"],
    category: "Core CS",
    semesters: ["Fall", "Spring"],
  },
  {
    code: "CS3114",
    name: "Data Structures and Algorithms",
    credits: 3,
    prerequisites: ["CS2114"],
    category: "Core CS",
    semesters: ["Fall", "Spring"],
  },
];

async function seed() {
  console.log("🌱 Seeding database...");

  for (const course of courses) {
    await db.collection("courses").doc(course.code).set(course);
    console.log(`✅ Added ${course.code}: ${course.name}`);
  }

  console.log("✅ Done!");
  process.exit(0);
}

seed();
