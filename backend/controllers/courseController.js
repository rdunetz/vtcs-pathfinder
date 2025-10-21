const { db } = require("../db");

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
 */
const checkPrerequisites = async (req, res) => {
  try {
    const { id } = req.params;
    const { completedCourses = [] } = req.body;

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

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getCoursesByCategory,
  checkPrerequisites,
};
