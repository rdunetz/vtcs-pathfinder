const express = require("express");
const router = express.Router();
const {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getCoursesByCategory,
  checkPrerequisites,
} = require("../controllers/courseController");

// GET all courses with optional filtering
// Query params: category, semester, search
router.get("/", getAllCourses);

// GET courses grouped by category (BEFORE /:id route!)
router.get("/by-category", getCoursesByCategory);

// GET a single course by ID
router.get("/:id", getCourseById);

// POST create a new course
router.post("/", createCourse);

// PUT update a course
router.put("/:id", updateCourse);

// DELETE a course
router.delete("/:id", deleteCourse);

// GET/POST check prerequisites for a course (supports both methods)
router.get("/:id/check-prerequisites", checkPrerequisites);
router.post("/:id/check-prerequisites", checkPrerequisites);

// Timetable-backed lookups (before /:id)
router.get('/search/by-id', searchCourseID);   // expects year, semester, courseId as query params
router.get('/search/by-crn', searchCourseCRN); // expects year, semester, crn as query params


module.exports = router;
