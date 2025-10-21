const { db } = require("../db");

/**
 * Get user profile by ID
 */
const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await db.collection("users").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      data: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user profile",
      message: error.message,
    });
  }
};

/**
 * Create a new user profile
 */
const createUserProfile = async (req, res) => {
  try {
    const { uid, email, displayName } = req.body;

    if (!uid || !email) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: uid and email are required",
      });
    }

    // Check if user already exists
    const existingDoc = await db.collection("users").doc(uid).get();

    if (existingDoc.exists) {
      return res.status(409).json({
        success: false,
        error: "User profile already exists",
      });
    }

    const userProfile = {
      uid,
      email,
      displayName: displayName || "",
      major: "Computer Science",
      expectedGraduation: "",
      completedCourses: [],
      currentCourses: [],
      interests: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("users").doc(uid).set(userProfile);

    res.status(201).json({
      success: true,
      message: "User profile created successfully",
      data: { id: uid, ...userProfile },
    });
  } catch (error) {
    console.error("Error creating user profile:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create user profile",
      message: error.message,
    });
  }
};

/**
 * Update user profile
 */
const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const doc = await db.collection("users").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Don't allow certain field changes
    delete updates.uid;
    delete updates.createdAt;

    updates.updatedAt = new Date().toISOString();

    await db.collection("users").doc(id).update(updates);

    const updatedDoc = await db.collection("users").doc(id).get();

    res.json({
      success: true,
      message: "User profile updated successfully",
      data: { id: updatedDoc.id, ...updatedDoc.data() },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update user profile",
      message: error.message,
    });
  }
};

/**
 * Delete user profile
 */
const deleteUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await db.collection("users").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Also delete user's plans
    const plansSnapshot = await db
      .collection("plans")
      .where("userId", "==", id)
      .get();

    const batch = db.batch();
    plansSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    batch.delete(db.collection("users").doc(id));
    await batch.commit();

    res.json({
      success: true,
      message: "User profile and associated plans deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user profile:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete user profile",
      message: error.message,
    });
  }
};

/**
 * Add a completed course to user profile
 */
const addCompletedCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { courseCode, grade, semester } = req.body;

    if (!courseCode) {
      return res.status(400).json({
        success: false,
        error: "courseCode is required",
      });
    }

    const doc = await db.collection("users").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: "User not found",
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

    const userData = doc.data();
    const completedCourses = userData.completedCourses || [];

    // Check if already completed
    const alreadyCompleted = completedCourses.some(
      (course) => course.courseCode === courseCode
    );

    if (alreadyCompleted) {
      return res.status(409).json({
        success: false,
        error: "Course already marked as completed",
      });
    }

    const completedCourse = {
      courseCode,
      grade: grade || null,
      semester: semester || null,
      completedAt: new Date().toISOString(),
    };

    completedCourses.push(completedCourse);

    await db.collection("users").doc(id).update({
      completedCourses,
      updatedAt: new Date().toISOString(),
    });

    const updatedDoc = await db.collection("users").doc(id).get();

    res.json({
      success: true,
      message: "Completed course added successfully",
      data: { id: updatedDoc.id, ...updatedDoc.data() },
    });
  } catch (error) {
    console.error("Error adding completed course:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add completed course",
      message: error.message,
    });
  }
};

/**
 * Remove a completed course from user profile
 */
const removeCompletedCourse = async (req, res) => {
  try {
    const { id, courseCode } = req.params;

    const doc = await db.collection("users").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const userData = doc.data();
    const completedCourses = userData.completedCourses || [];

    const updatedCourses = completedCourses.filter(
      (course) => course.courseCode !== courseCode
    );

    await db.collection("users").doc(id).update({
      completedCourses: updatedCourses,
      updatedAt: new Date().toISOString(),
    });

    const updatedDoc = await db.collection("users").doc(id).get();

    res.json({
      success: true,
      message: "Completed course removed successfully",
      data: { id: updatedDoc.id, ...updatedDoc.data() },
    });
  } catch (error) {
    console.error("Error removing completed course:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove completed course",
      message: error.message,
    });
  }
};

/**
 * Get user's progress summary
 */
const getUserProgress = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await db.collection("users").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const userData = doc.data();
    const completedCourses = userData.completedCourses || [];

    // Get course details
    const coursePromises = completedCourses.map((completed) =>
      db.collection("courses").doc(completed.courseCode).get()
    );
    const courseDocs = await Promise.all(coursePromises);

    const courses = courseDocs
      .filter((doc) => doc.exists)
      .map((doc) => ({ id: doc.id, ...doc.data() }));

    // Calculate credits
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

    // Calculate progress percentage (assuming 120 total credits needed)
    const progressPercentage = Math.min((totalCredits / 120) * 100, 100);

    res.json({
      success: true,
      data: {
        totalCredits,
        requiredCredits: 120,
        progressPercentage: progressPercentage.toFixed(2),
        completedCourseCount: completedCourses.length,
        creditsByCategory,
        completedCourses: completedCourses.map((completed) => {
          const course = courses.find((c) => c.code === completed.courseCode);
          return {
            ...completed,
            courseName: course?.name || "Unknown",
            credits: course?.credits || 0,
          };
        }),
      },
    });
  } catch (error) {
    console.error("Error getting user progress:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user progress",
      message: error.message,
    });
  }
};

module.exports = {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  deleteUserProfile,
  addCompletedCourse,
  removeCompletedCourse,
  getUserProgress,
};
