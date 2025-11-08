const { db } = require("../db");

/**
 * Get all plans for a user
 */
const getUserPlans = async (req, res) => {
  try {
    const { userId } = req.params;

    const snapshot = await db
      .collection("users")
      .doc(userId)
      .collection("plans")
      .get();

    const plans = [];
    snapshot.forEach((doc) => {
      plans.push({ id: doc.id, ...doc.data() });
    });

    res.json({
      success: true,
      count: plans.length,
      data: plans,
    });
  } catch (error) {
    console.error("Error getting user plans:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch plans",
      message: error.message,
    });
  }
};

/**
 * Get a specific plan by ID
 * Note: Now requires userId to be passed in the request body or query params
 */
const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query; // Get userId from query params

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    const doc = await db
      .collection("users")
      .doc(userId)
      .collection("plans")
      .doc(id)
      .get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: "Plan not found",
      });
    }

    res.json({
      success: true,
      data: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error("Error getting plan:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch plan",
      message: error.message,
    });
  }
};

/**
 * Create a new plan
 */
const createPlan = async (req, res) => {
  try {
    const { userId, name, semesters, template } = req.body;

    if (!userId || !name) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId and name are required",
      });
    }

    if (!semesters) {
      return res.status(400).json({
        success: false,
        error: "semesters object is required",
      });
    }

    const plan = {
      name,
      semesters: semesters,
      template: template || "none",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store in subcollection: users/{userId}/plans/{planId}
    const docRef = await db
      .collection("users")
      .doc(userId)
      .collection("plans")
      .add(plan);

    res.status(201).json({
      success: true,
      message: "Plan created successfully",
      data: { id: docRef.id, ...plan },
    });
  } catch (error) {
    console.error("Error creating plan:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create plan",
      message: error.message,
    });
  }
};

/**
 * Update a plan
 */
const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, ...updates } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    const planRef = db
      .collection("users")
      .doc(userId)
      .collection("plans")
      .doc(id);

    const doc = await planRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: "Plan not found",
      });
    }

    // Don't allow createdAt changes
    delete updates.createdAt;

    updates.updatedAt = new Date().toISOString();

    await planRef.update(updates);

    const updatedDoc = await planRef.get();

    res.json({
      success: true,
      message: "Plan updated successfully",
      data: { id: updatedDoc.id, ...updatedDoc.data() },
    });
  } catch (error) {
    console.error("Error updating plan:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update plan",
      message: error.message,
    });
  }
};

/**
 * Delete a plan
 */
const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    const planRef = db
      .collection("users")
      .doc(userId)
      .collection("plans")
      .doc(id);

    const doc = await planRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: "Plan not found",
      });
    }

    await planRef.delete();

    res.json({
      success: true,
      message: "Plan deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting plan:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete plan",
      message: error.message,
    });
  }
};

/**
 * Add a course to a specific semester in a plan
 */
const addCourseToPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, courseCode, year, term } = req.body;

    if (!userId || !courseCode || year === undefined || !term) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: userId, courseCode, year, and term are required",
      });
    }

    const planRef = db
      .collection("users")
      .doc(userId)
      .collection("plans")
      .doc(id);

    const planDoc = await planRef.get();

    if (!planDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Plan not found",
      });
    }

    // Verify course exists
    const courseDoc = await db.collection("courses").doc(courseCode).get();

    if (!courseDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }

    const plan = planDoc.data();
    const semesters = plan.semesters || [];

    // Find the semester
    const semesterIndex = semesters.findIndex(
      (sem) => sem.year === year && sem.term === term
    );

    if (semesterIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Semester not found in plan",
      });
    }

    // Check if course already exists in this semester
    if (semesters[semesterIndex].courses.includes(courseCode)) {
      return res.status(409).json({
        success: false,
        error: "Course already exists in this semester",
      });
    }

    // Add course to semester
    semesters[semesterIndex].courses.push(courseCode);

    await planRef.update({
      semesters,
      updatedAt: new Date().toISOString(),
    });

    const updatedDoc = await planRef.get();

    res.json({
      success: true,
      message: "Course added to plan successfully",
      data: { id: updatedDoc.id, ...updatedDoc.data() },
    });
  } catch (error) {
    console.error("Error adding course to plan:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add course to plan",
      message: error.message,
    });
  }
};

/**
 * Remove a course from a specific semester in a plan
 */
const removeCourseFromPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, courseCode, year, term } = req.body;

    if (!userId || !courseCode || year === undefined || !term) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: userId, courseCode, year, and term are required",
      });
    }

    const planRef = db
      .collection("users")
      .doc(userId)
      .collection("plans")
      .doc(id);

    const planDoc = await planRef.get();

    if (!planDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Plan not found",
      });
    }

    const plan = planDoc.data();
    const semesters = plan.semesters || [];

    // Find the semester
    const semesterIndex = semesters.findIndex(
      (sem) => sem.year === year && sem.term === term
    );

    if (semesterIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Semester not found in plan",
      });
    }

    // Remove course from semester
    semesters[semesterIndex].courses = semesters[semesterIndex].courses.filter(
      (code) => code !== courseCode
    );

    await planRef.update({
      semesters,
      updatedAt: new Date().toISOString(),
    });

    const updatedDoc = await planRef.get();

    res.json({
      success: true,
      message: "Course removed from plan successfully",
      data: { id: updatedDoc.id, ...updatedDoc.data() },
    });
  } catch (error) {
    console.error("Error removing course from plan:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove course from plan",
      message: error.message,
    });
  }
};

/**
 * Move a course from one semester to another
 */
const moveCourseBetweenSemesters = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, courseCode, fromYear, fromTerm, toYear, toTerm } = req.body;

    if (
      !userId ||
      !courseCode ||
      fromYear === undefined ||
      !fromTerm ||
      toYear === undefined ||
      !toTerm
    ) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    const planRef = db
      .collection("users")
      .doc(userId)
      .collection("plans")
      .doc(id);

    const planDoc = await planRef.get();

    if (!planDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Plan not found",
      });
    }

    const plan = planDoc.data();
    const semesters = plan.semesters || [];

    // Find source and target semesters
    const fromIndex = semesters.findIndex(
      (sem) => sem.year === fromYear && sem.term === fromTerm
    );
    const toIndex = semesters.findIndex(
      (sem) => sem.year === toYear && sem.term === toTerm
    );

    if (fromIndex === -1 || toIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Source or target semester not found",
      });
    }

    // Remove from source
    semesters[fromIndex].courses = semesters[fromIndex].courses.filter(
      (code) => code !== courseCode
    );

    // Add to target (if not already there)
    if (!semesters[toIndex].courses.includes(courseCode)) {
      semesters[toIndex].courses.push(courseCode);
    }

    await planRef.update({
      semesters,
      updatedAt: new Date().toISOString(),
    });

    const updatedDoc = await planRef.get();

    res.json({
      success: true,
      message: "Course moved successfully",
      data: { id: updatedDoc.id, ...updatedDoc.data() },
    });
  } catch (error) {
    console.error("Error moving course:", error);
    res.status(500).json({
      success: false,
      error: "Failed to move course",
      message: error.message,
    });
  }
};

/**
 * Validate a plan against degree requirements
 */
const validatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    const planRef = db
      .collection("users")
      .doc(userId)
      .collection("plans")
      .doc(id);

    const planDoc = await planRef.get();

    if (!planDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Plan not found",
      });
    }

    const plan = planDoc.data();
    const semesters = plan.semesters || [];

    // Get all courses in the plan
    const allCourseCodes = [];
    semesters.forEach((semester) => {
      allCourseCodes.push(...semester.courses);
    });

    // Fetch all course details
    const coursePromises = allCourseCodes.map((code) =>
      db.collection("courses").doc(code).get()
    );
    const courseDocs = await Promise.all(coursePromises);

    const courses = courseDocs
      .filter((doc) => doc.exists)
      .map((doc) => ({ id: doc.id, ...doc.data() }));

    // Calculate total credits
    const totalCredits = courses.reduce(
      (sum, course) => sum + (course.credits || 0),
      0
    );

    // Group by category
    const creditsByCategory = {};
    courses.forEach((course) => {
      const category = course.category || "Uncategorized";
      creditsByCategory[category] =
        (creditsByCategory[category] || 0) + (course.credits || 0);
    });

    // Check prerequisite violations
    const violations = [];

    for (let i = 0; i < semesters.length; i++) {
      const semester = semesters[i];

      // Get all courses completed before this semester
      const completedCourses = [];
      for (let j = 0; j < i; j++) {
        completedCourses.push(...semesters[j].courses);
      }

      // Check each course in this semester
      for (const courseCode of semester.courses) {
        const courseDoc = await db.collection("courses").doc(courseCode).get();
        if (courseDoc.exists) {
          const course = courseDoc.data();
          const prerequisites = course.prerequisites || [];

          const missingPrereqs = prerequisites.filter(
            (prereq) => !completedCourses.includes(prereq)
          );

          if (missingPrereqs.length > 0) {
            violations.push({
              semester: `Year ${semester.year} ${semester.term}`,
              course: courseCode,
              courseName: course.name,
              missingPrerequisites: missingPrereqs,
            });
          }
        }
      }
    }

    // VT CS Degree Requirements (simplified - adjust as needed)
    const requirements = {
      totalCredits: {
        required: 120,
        current: totalCredits,
        met: totalCredits >= 120,
      },
      coreCS: {
        required: 45,
        current: creditsByCategory["Core CS"] || 0,
        met: (creditsByCategory["Core CS"] || 0) >= 45,
      },
      electives: {
        required: 12,
        current: creditsByCategory["CS Elective"] || 0,
        met: (creditsByCategory["CS Elective"] || 0) >= 12,
      },
    };

    const allRequirementsMet =
      requirements.totalCredits.met &&
      requirements.coreCS.met &&
      requirements.electives.met &&
      violations.length === 0;

    res.json({
      success: true,
      data: {
        valid: allRequirementsMet,
        totalCredits,
        creditsByCategory,
        requirements,
        violations,
        summary: {
          totalCourses: allCourseCodes.length,
          prerequisiteViolations: violations.length,
          allRequirementsMet,
        },
      },
    });
  } catch (error) {
    console.error("Error validating plan:", error);
    res.status(500).json({
      success: false,
      error: "Failed to validate plan",
      message: error.message,
    });
  }
};

module.exports = {
  getUserPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  addCourseToPlan,
  removeCourseFromPlan,
  moveCourseBetweenSemesters,
  validatePlan,
};
