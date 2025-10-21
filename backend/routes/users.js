const express = require("express");
const router = express.Router();
const {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  deleteUserProfile,
  addCompletedCourse,
  removeCompletedCourse,
  getUserProgress,
} = require("../controllers/usersController");

// GET user profile by ID
router.get("/:id", getUserProfile);

// POST create a new user profile
router.post("/", createUserProfile);

// PUT update user profile
router.put("/:id", updateUserProfile);

// DELETE user profile
router.delete("/:id", deleteUserProfile);

// POST add a completed course
router.post("/:id/completed-courses", addCompletedCourse);

// DELETE remove a completed course
router.delete("/:id/completed-courses/:courseCode", removeCompletedCourse);

// GET user progress summary
router.get("/:id/progress", getUserProgress);

module.exports = router;
