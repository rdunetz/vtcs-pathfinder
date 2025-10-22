const express = require("express");
const router = express.Router();
const {
  getUserPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  addCourseToPlan,
  removeCourseFromPlan,
  moveCourseBetweenSemesters,
  validatePlan,
} = require("../controllers/planController");

// GET all plans for a user
router.get("/user/:userId", getUserPlans);

// GET validate a plan against requirements (BEFORE /:id route!)
router.get("/:id/validate", validatePlan);

// GET a specific plan by ID
router.get("/:id", getPlanById);

// POST create a new plan
router.post("/", createPlan);

// PUT update a plan
router.put("/:id", updatePlan);

// DELETE a plan
router.delete("/:id", deletePlan);

// POST add a course to a plan
router.post("/:id/add-course", addCourseToPlan);

// POST remove a course from a plan
router.post("/:id/remove-course", removeCourseFromPlan);

// POST move a course between semesters
router.post("/:id/move-course", moveCourseBetweenSemesters);

module.exports = router;
