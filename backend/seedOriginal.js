const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const courses = [
  // First Year Core
  {
    code: "CS1114",
    name: "Introduction to Software Design",
    credits: 3,
    prerequisites: [],
    corequisites: [],
    category: "Core CS",
    semesters: ["Fall", "Spring"],
    description:
      "Introduction to software design and implementation using Java.",
  },
  {
    code: "MATH1225",
    name: "Calculus of a Single Variable",
    credits: 3,
    prerequisites: [],
    corequisites: [],
    category: "Math",
    semesters: ["Fall", "Spring"],
    description: "Limits, continuity, derivatives, and integrals.",
  },
  {
    code: "MATH1226",
    name: "Calculus of a Single Variable II",
    credits: 3,
    prerequisites: ["MATH1225"],
    corequisites: [],
    category: "Math",
    semesters: ["Fall", "Spring"],
    description:
      "Techniques of integration, applications, sequences and series.",
  },

  // Second Year Core
  {
    code: "CS2114",
    name: "Software Design and Data Structures",
    credits: 3,
    prerequisites: ["CS1114"],
    corequisites: [],
    category: "Core CS",
    semesters: ["Fall", "Spring"],
    description: "Object-oriented software design and data structures.",
  },
  {
    code: "CS2505",
    name: "Computer Organization I",
    credits: 3,
    prerequisites: ["CS1114"],
    corequisites: [],
    category: "Core CS",
    semesters: ["Fall", "Spring"],
    description:
      "Introduction to computer organization and assembly language programming.",
  },
  {
    code: "CS2506",
    name: "Computer Organization II",
    credits: 3,
    prerequisites: ["CS2505"],
    corequisites: [],
    category: "Core CS",
    semesters: ["Fall", "Spring"],
    description: "Computer architecture, memory systems, and I/O.",
  },
  {
    code: "MATH2214",
    name: "Introduction to Differential Equations",
    credits: 3,
    prerequisites: ["MATH1226"],
    corequisites: [],
    category: "Math",
    semesters: ["Fall", "Spring"],
    description: "First and second order differential equations.",
  },
  {
    code: "MATH2534",
    name: "Introduction to Linear Algebra",
    credits: 3,
    prerequisites: ["MATH1226"],
    corequisites: [],
    category: "Math",
    semesters: ["Fall", "Spring"],
    description: "Matrices, vector spaces, linear transformations.",
  },

  // Third Year Core
  {
    code: "CS3114",
    name: "Data Structures and Algorithms",
    credits: 3,
    prerequisites: ["CS2114"],
    corequisites: [],
    category: "Core CS",
    semesters: ["Fall", "Spring"],
    description: "Advanced data structures and algorithm analysis.",
  },
  {
    code: "CS3214",
    name: "Computer Systems",
    credits: 4,
    prerequisites: ["CS2505", "CS2114"],
    corequisites: [],
    category: "Core CS",
    semesters: ["Fall", "Spring"],
    description: "Systems programming, concurrency, and OS concepts.",
  },
  {
    code: "CS3304",
    name: "Comparative Languages",
    credits: 3,
    prerequisites: ["CS2114"],
    corequisites: [],
    category: "Core CS",
    semesters: ["Fall", "Spring"],
    description: "Study of programming language paradigms and design.",
  },
  {
    code: "CS3744",
    name: "Introduction to GUI Programming",
    credits: 3,
    prerequisites: ["CS2114"],
    corequisites: [],
    category: "Core CS",
    semesters: ["Fall", "Spring"],
    description: "Design and implementation of graphical user interfaces.",
  },
  {
    code: "STAT3704",
    name: "Introduction to Statistics",
    credits: 3,
    prerequisites: ["MATH1226"],
    corequisites: [],
    category: "Math",
    semesters: ["Fall", "Spring"],
    description: "Descriptive statistics, probability, and inference.",
  },

  // Fourth Year and Electives
  {
    code: "CS4104",
    name: "Data and Algorithm Analysis",
    credits: 3,
    prerequisites: ["CS3114"],
    corequisites: [],
    category: "Core CS",
    semesters: ["Fall", "Spring"],
    description: "Advanced algorithm design and analysis techniques.",
  },
  {
    code: "CS4234",
    name: "Theory of Computation",
    credits: 3,
    prerequisites: ["CS3114"],
    corequisites: [],
    category: "Core CS",
    semesters: ["Fall", "Spring"],
    description: "Formal languages, automata, computability, and complexity.",
  },
  {
    code: "CS4644",
    name: "Creative Computing Studio Capstone",
    credits: 3,
    prerequisites: ["CS3744"],
    corequisites: [],
    category: "Core CS",
    semesters: ["Fall", "Spring"],
    description: "Team-based capstone project course.",
  },

  // CS Electives
  {
    code: "CS4414",
    name: "Issues in Scientific Computing",
    credits: 3,
    prerequisites: ["CS3114"],
    corequisites: [],
    category: "CS Elective",
    semesters: ["Fall", "Spring"],
    description: "Numerical methods and scientific programming.",
  },
  {
    code: "CS4604",
    name: "Introduction to Database Systems",
    credits: 3,
    prerequisites: ["CS3114"],
    corequisites: [],
    category: "CS Elective",
    semesters: ["Fall", "Spring"],
    description: "Database design, SQL, and database management systems.",
  },
  {
    code: "CS4624",
    name: "Multimedia, Hypertext, and Information Access",
    credits: 3,
    prerequisites: ["CS3114"],
    corequisites: [],
    category: "CS Elective",
    semesters: ["Fall", "Spring"],
    description:
      "Information retrieval, multimedia systems, and web technologies.",
  },
  {
    code: "CS4784",
    name: "Human Computer Interaction",
    credits: 3,
    prerequisites: ["CS2114"],
    corequisites: [],
    category: "CS Elective",
    semesters: ["Fall", "Spring"],
    description: "Principles of user interface design and usability.",
  },
  {
    code: "CS4804",
    name: "Introduction to Artificial Intelligence",
    credits: 3,
    prerequisites: ["CS3114"],
    corequisites: [],
    category: "CS Elective",
    semesters: ["Fall", "Spring"],
    description: "AI concepts, search algorithms, and machine learning basics.",
  },
  {
    code: "CS4824",
    name: "Machine Learning",
    credits: 3,
    prerequisites: ["CS3114", "STAT3704"],
    corequisites: [],
    category: "CS Elective",
    semesters: ["Fall", "Spring"],
    description: "Supervised and unsupervised learning algorithms.",
  },
  {
    code: "CS4254",
    name: "Computer Network Architecture and Programming",
    credits: 3,
    prerequisites: ["CS3214"],
    corequisites: [],
    category: "CS Elective",
    semesters: ["Fall", "Spring"],
    description:
      "Network protocols, socket programming, and distributed systems.",
  },
  {
    code: "CS4264",
    name: "Principles of Computer Security",
    credits: 3,
    prerequisites: ["CS3214"],
    corequisites: [],
    category: "CS Elective",
    semesters: ["Fall", "Spring"],
    description: "Security principles, cryptography, and secure systems.",
  },
  {
    code: "CS4544",
    name: "Mobile and Ubiquitous Computing",
    credits: 3,
    prerequisites: ["CS3214"],
    corequisites: [],
    category: "CS Elective",
    semesters: ["Fall", "Spring"],
    description: "Mobile application development and ubiquitous computing.",
  },
  {
    code: "CS4704",
    name: "Software Engineering",
    credits: 3,
    prerequisites: ["CS3114"],
    corequisites: [],
    category: "CS Elective",
    semesters: ["Fall", "Spring"],
    description: "Software development methodologies and project management.",
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
