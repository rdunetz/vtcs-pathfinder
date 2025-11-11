/**
 * Utility functions for handling course prerequisites
 */

/**
 * Get all courses that have been completed (placed in semesters before the target)
 * @param {Object} semesters - Object with semester keys and course arrays
 * @param {string} targetSemester - The semester we're checking for (e.g., "fall2")
 * @returns {string[]} Array of completed course codes
 */
export const getCompletedCoursesBysemester = (semesters, targetSemester) => {
  if (!semesters || Object.keys(semesters).length === 0) return [];

  // Parse semester key to get year and term
  // Use [a-zA-Z]+ to match only letters, not digits
  const semesterOrder = ["fall", "spring"];
  const targetMatch = targetSemester.match(/([a-zA-Z]+)(\d+)/);
  if (!targetMatch) return [];

  const [, targetTerm, targetYear] = targetMatch;
  const targetYearNum = parseInt(targetYear);
  const targetTermIndex = semesterOrder.indexOf(targetTerm.toLowerCase());

  // Calculate academic year for target semester
  // Spring semesters belong to the previous academic year
  const targetAcademicYear =
    targetTermIndex === 1 ? targetYearNum - 1 : targetYearNum;

  const completedCourses = [];

  // Go through all semesters and add courses from earlier ones
  Object.entries(semesters).forEach(([semesterKey, courses]) => {
    const match = semesterKey.match(/([a-zA-Z]+)(\d+)/);
    if (!match) return;

    const [, term, year] = match;
    const yearNum = parseInt(year);
    const termIndex = semesterOrder.indexOf(term.toLowerCase());

    // Calculate academic year for this semester
    const academicYear = termIndex === 1 ? yearNum - 1 : yearNum;

    // Check if this semester is before the target
    const isEarlier =
      academicYear < targetAcademicYear ||
      (academicYear === targetAcademicYear && termIndex < targetTermIndex);

    if (isEarlier) {
      courses.forEach((course) => {
        completedCourses.push(course.id || course.code);
      });
    }
  });

  return completedCourses;
};

/**
 * Check if a course's prerequisites are met
 * Supports both AND and OR logic:
 * - Simple array ["CS1114", "CS2064"] = ALL required (AND)
 * - Array of arrays [["CS1114", "CS2064", "ECE2514"]] = at least ONE from group (OR)
 * - Mixed [["CS1114"], ["CS2064", "CS2505"]] = CS1114 AND (CS2064 OR CS2505)
 *
 * @param {Object} course - Course object with prerequisites array
 * @param {string[]} completedCourses - Array of completed course codes
 * @returns {Object} { canEnroll: boolean, missingPrerequisites: string[] }
 */
export const checkPrerequisites = (course, completedCourses) => {
  if (!course.prerequisites || course.prerequisites.length === 0) {
    return { canEnroll: true, missingPrerequisites: [] };
  }

  const prereqs = course.prerequisites;

  // Ensure prereqs is an array
  if (!Array.isArray(prereqs)) {
    console.warn(
      `Invalid prerequisites format for course ${course.id || course.code}:`,
      prereqs
    );
    return { canEnroll: true, missingPrerequisites: [] };
  }

  // Check if it's the new format (array of arrays) or old format (simple array)
  const isGroupFormat = Array.isArray(prereqs[0]);

  if (!isGroupFormat) {
    // Old format: simple array - ALL required (AND logic)
    const missingPrerequisites = prereqs.filter(
      (prereq) => !completedCourses.includes(prereq)
    );

    return {
      canEnroll: missingPrerequisites.length === 0,
      missingPrerequisites,
    };
  }

  // New format: array of arrays
  // Each inner array is an OR group, outer array is AND
  const missingGroups = [];
  let canEnroll = true;

  for (const group of prereqs) {
    // Check if at least ONE course in this group is completed
    const hasCompletedOne = group.some((prereq) =>
      completedCourses.includes(prereq)
    );

    if (!hasCompletedOne) {
      // This entire group is missing
      canEnroll = false;
      missingGroups.push(group);
    }
  }

  // Flatten missing groups for display
  const missingPrerequisites = missingGroups.flat();

  return {
    canEnroll,
    missingPrerequisites,
    missingGroups, // Include groups for better error messages
  };
};

/**
 * Check if a course can be added to a specific semester
 * @param {Object} course - Course object
 * @param {string} targetSemester - Semester key (e.g., "fall2")
 * @param {Object} semesters - All semesters with their courses
 * @returns {Object} { allowed: boolean, reason: string, missingPrerequisites: string[] }
 */
export const canAddCourseToSemester = (course, targetSemester, semesters) => {
  const completedCourses = getCompletedCoursesBysemester(
    semesters,
    targetSemester
  );
  const { canEnroll, missingPrerequisites, missingGroups } = checkPrerequisites(
    course,
    completedCourses
  );

  if (canEnroll) {
    return {
      allowed: true,
      reason: "All prerequisites met",
      missingPrerequisites: [],
    };
  }

  // Build a better error message for OR groups
  let reason;
  if (missingGroups && missingGroups.length > 0) {
    const groupMessages = missingGroups.map((group) => {
      if (group.length === 1) {
        return group[0];
      }
      return `(${group.join(" OR ")})`;
    });
    reason = `Missing prerequisites: ${groupMessages.join(" AND ")}`;
  } else {
    reason = `Missing prerequisites: ${missingPrerequisites.join(", ")}`;
  }

  return {
    allowed: false,
    reason,
    missingPrerequisites,
  };
};

/**
 * Get prerequisite status for a course
 * @param {Object} course - Course object
 * @param {string[]} completedCourses - Array of completed course codes
 * @returns {string} 'available', 'locked', or 'no-prereqs'
 */
export const getPrerequisiteStatus = (course, completedCourses) => {
  if (!course.prerequisites || course.prerequisites.length === 0) {
    return "no-prereqs";
  }

  const { canEnroll } = checkPrerequisites(course, completedCourses);
  return canEnroll ? "available" : "locked";
};

/**
 * Validate all courses in a plan for prerequisite violations
 * @param {Object} semesters - All semesters with their courses
 * @returns {Array} Array of violation objects { semester, course, missingPrerequisites }
 */
export const validatePlanPrerequisites = (semesters) => {
  const violations = [];

  Object.entries(semesters).forEach(([semesterKey, courses]) => {
    const completedCourses = getCompletedCoursesBysemester(
      semesters,
      semesterKey
    );

    courses.forEach((course) => {
      const { canEnroll, missingPrerequisites, missingGroups } =
        checkPrerequisites(course, completedCourses);

      if (!canEnroll) {
        // Format the missing prerequisites message for OR groups
        let missingMessage;
        if (missingGroups && missingGroups.length > 0) {
          const groupMessages = missingGroups.map((group) => {
            if (group.length === 1) {
              return group[0];
            }
            return `(${group.join(" OR ")})`;
          });
          missingMessage = groupMessages.join(" AND ");
        } else {
          missingMessage = missingPrerequisites.join(", ");
        }

        violations.push({
          semester: semesterKey,
          course: course.id || course.code,
          courseName: course.name || course.title,
          missingPrerequisites: missingMessage,
        });
      }
    });
  });

  return violations;
};
