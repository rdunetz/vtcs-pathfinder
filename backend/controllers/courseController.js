const { db } = require("../db");
const { spawn } = require("child_process");

// Allow configuring interpreter and pythonpath via env
const PY_INTERPRETER = process.env.PY_INTERPRETER || "python"; // 'python3' on mac/linux, 'python' on Windows
const PYTHONPATH = process.env.PYTHONPATH || ""; // e.g., ".;./pythonTimetables" on Windows, ".:./pythonTimetables" on Linux/Mac

/**
 * Get all courses with optional filtering
 */
const getAllCourses = async (req, res) => {
  try {
    const { category, semester, search } = req.query;

    let coursesRef = db.collection("courses");
    let snapshot;

    // Apply filters if provided
    if (category) {
      snapshot = await coursesRef.where("category", "==", category).get();
    } else {
      snapshot = await coursesRef.get();
    }

    let courses = [];
    snapshot.forEach((doc) => {
      courses.push({ id: doc.id, ...doc.data() });
    });

    // Filter by semester availability if provided
    if (semester) {
      courses = courses.filter((course) =>
        course.semesters?.includes(semester)
      );
    }

    // Filter by search term (code or name)
    if (search) {
      const searchLower = search.toLowerCase();
      courses = courses.filter(
        (course) =>
          course.code?.toLowerCase().includes(searchLower) ||
          course.name?.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    console.error("Error getting courses:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch courses",
      message: error.message,
    });
  }
};

/**
 * Get a single course by ID/code
 */
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection("courses").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }

    res.json({
      success: true,
      data: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error("Error getting course:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch course",
      message: error.message,
    });
  }
};

/**
 * Create a new course
 */
const createCourse = async (req, res) => {
  try {
    const courseData = req.body;

    // Validate required fields
    if (!courseData.code || !courseData.name || !courseData.credits) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: code, name, and credits are required",
      });
    }

    // Check if course already exists
    const existingDoc = await db
      .collection("courses")
      .doc(courseData.code)
      .get();

    if (existingDoc.exists) {
      return res.status(409).json({
        success: false,
        error: "Course with this code already exists",
      });
    }

    // Set defaults
    const course = {
      code: courseData.code,
      name: courseData.name,
      credits: courseData.credits,
      prerequisites: courseData.prerequisites || [],
      corequisites: courseData.corequisites || [],
      category: courseData.category || "General",
      semesters: courseData.semesters || ["Fall", "Spring"],
      description: courseData.description || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("courses").doc(course.code).set(course);

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: { id: course.code, ...course },
    });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create course",
      message: error.message,
    });
  }
};

/**
 * Update an existing course
 */
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const doc = await db.collection("courses").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }

    // Don't allow code changes
    delete updates.code;
    delete updates.createdAt;

    // Add updated timestamp
    updates.updatedAt = new Date().toISOString();

    await db.collection("courses").doc(id).update(updates);

    const updatedDoc = await db.collection("courses").doc(id).get();

    res.json({
      success: true,
      message: "Course updated successfully",
      data: { id: updatedDoc.id, ...updatedDoc.data() },
    });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update course",
      message: error.message,
    });
  }
};

/**
 * Delete a course
 */
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await db.collection("courses").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }

    await db.collection("courses").doc(id).delete();

    res.json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete course",
      message: error.message,
    });
  }
};

/**
 * Get courses by category
 */
const getCoursesByCategory = async (req, res) => {
  try {
    const snapshot = await db.collection("courses").get();

    const coursesByCategory = {};

    snapshot.forEach((doc) => {
      const course = { id: doc.id, ...doc.data() };
      const category = course.category || "Uncategorized";

      if (!coursesByCategory[category]) {
        coursesByCategory[category] = [];
      }
      coursesByCategory[category].push(course);
    });

    res.json({
      success: true,
      data: coursesByCategory,
    });
  } catch (error) {
    console.error("Error getting courses by category:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch courses by category",
      message: error.message,
    });
  }
};

/**
 * Check prerequisites for a course
 * Accepts completedCourses as query parameter (comma-separated) or JSON body
 */
const checkPrerequisites = async (req, res) => {
  try {
    const { id } = req.params;

    // Support both query params (GET) and body (POST) for flexibility
    let completedCourses = [];
    if (req.query.completedCourses) {
      // GET request: parse comma-separated string
      completedCourses = req.query.completedCourses
        .split(",")
        .map((c) => c.trim());
    } else if (req.body && req.body.completedCourses) {
      // POST request: use array from body
      completedCourses = req.body.completedCourses;
    }

    const doc = await db.collection("courses").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }

    const course = { id: doc.id, ...doc.data() };
    const prerequisites = course.prerequisites || [];
    const corequisites = course.corequisites || [];

    const missingPrerequisites = prerequisites.filter(
      (prereq) => !completedCourses.includes(prereq)
    );

    const canEnroll = missingPrerequisites.length === 0;

    res.json({
      success: true,
      data: {
        canEnroll,
        courseCode: course.code,
        courseName: course.name,
        prerequisites,
        corequisites,
        missingPrerequisites,
        completedCourses,
      },
    });
  } catch (error) {
    console.error("Error checking prerequisites:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check prerequisites",
      message: error.message,
    });
  }
};

// ---------- Timetable bridge (Python subprocess) ----------
function callTimetablePython(funcName, argsObj) {
  return new Promise((resolve, reject) => {
    const code = `
import json, sys, os, math
from enum import Enum

# Try package import first; fallback to sys.path injection
try:
    from pythonTimetables.timeTablesVTT import searchID, searchCRNData
except ModuleNotFoundError:
    base = os.getcwd()
    pkg = os.path.join(base, "pythonTimetables")
    if pkg not in sys.path:
        sys.path.insert(0, pkg)
    from timeTablesVTT import searchID, searchCRNData

def to_jsonable(obj):
    # Normalize float NaN/Inf from pandas to None to keep strict JSON
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    # Enums -> stable string or value
    if isinstance(obj, Enum):
        return getattr(obj, "value", str(obj))
    # Custom objects -> dict of attrs
    if hasattr(obj, "__dict__"):
        return { k: to_jsonable(v) for k, v in obj.__dict__.items() }
    # Iterables
    if isinstance(obj, (list, tuple, set)):
        return [to_jsonable(x) for x in obj]
    # Dicts
    if isinstance(obj, dict):
        return { k: to_jsonable(v) for k, v in obj.items() }
    # Primitives/other -> string or unchanged
    return obj

args = json.loads(sys.stdin.read())
try:
    if "${funcName}" == "searchID":
        res = searchID(args["year"], args["semester"], args["courseId"], True)
    elif "${funcName}" == "searchCRNData":
        res = searchCRNData(args["year"], args["semester"], args["crn"])
    else:
        res = {"error": "Unknown function"}
    print(json.dumps(to_jsonable(res), ensure_ascii=False))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

    const env = { ...process.env };
    if (PYTHONPATH) {
      const sep = process.platform === "win32" ? ";" : ":";
      env.PYTHONPATH = env.PYTHONPATH ? `${PYTHONPATH}${sep}${env.PYTHONPATH}` : PYTHONPATH;
    }

    const py = spawn(PY_INTERPRETER, ["-c", code], { env });

    let out = "";
    let err = "";
    const timer = setTimeout(() => { try { py.kill("SIGKILL"); } catch (_) {} }, 20000);

    py.stdout.on("data", d => out += d.toString());
    py.stderr.on("data", d => err += d.toString());
    py.on("close", code => {
      clearTimeout(timer);
      if (code !== 0 && !out) return reject(new Error(err || `Python exited ${code}`));
      try { resolve(JSON.parse(out)); } catch (e) {
        reject(new Error(`Failed to parse Python output: ${e.message}. Raw: ${out || err}`));
      }
    });

    py.stdin.write(JSON.stringify(argsObj));
    py.stdin.end();
  });
}

// GET /api/courses/search/by-id?year=2026&semester=Fall&courseId=CS-2114
const searchCourseID = async (req, res) => {
  try {
    let { year, semester, courseId } = req.query;
    if (!year || !semester || !courseId) {
      return res.status(400).json({ success: false, error: "year, semester, and courseId are required" });
    }
    // Normalize courseId like "CS2114" or "CS-2114"
    courseId = String(courseId).trim();
    const data = await callTimetablePython("searchID", { year, semester, courseId });
    if (data?.error) return res.status(502).json({ success: false, error: data.error });
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Error searchCourseID:", error);
    return res.status(500).json({ success: false, error: "Failed to search by courseId", message: error.message });
  }
};

// GET /api/courses/search/by-crn?year=2026&semester=Fall&crn=91234
// GET /api/courses/search/by-crn?year=2026&semester=Fall&crn=91234
const searchCourseCRN = async (req, res) => {
  try {
    let { year, semester, crn } = req.query;
    if (!year || !semester || !crn) {
      return res.status(400).json({ success: false, error: "year, semester, and crn are required" });
    }
    crn = String(crn).trim();
    const data = await callTimetablePython("searchCRNData", { year, semester, crn });
    if (data?.error) return res.status(502).json({ success: false, error: data.error });
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Error searchCourseCRN:", error);
    return res.status(500).json({ success: false, error: "Failed to search by CRN", message: error.message });
  }
};


module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getCoursesByCategory,
  checkPrerequisites,
  searchCourseID,
  searchCourseCRN,
};