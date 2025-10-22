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

// POST check prerequisites for a course
router.post("/:id/check-prerequisites", checkPrerequisites);

module.exports = router;
