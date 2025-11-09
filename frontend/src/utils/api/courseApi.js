import axios from "axios";

const API_BASE_URL = "http://localhost:5001/api";

/**
 * Check if a student can enroll in a course based on prerequisites
 * @param {string} courseCode - The course code to check
 * @param {string[]} completedCourses - Array of completed course codes
 * @returns {Promise} Object with canEnroll, missingPrerequisites, etc.
 */
export const checkCoursePrerequisites = async (
  courseCode,
  completedCourses = []
) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/courses/${courseCode}/check-prerequisites`,
      {
        params: {
          completedCourses: completedCourses.join(","),
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error checking prerequisites:", error);
    throw error;
  }
};

/**
 * Get all courses
 * @returns {Promise} Array of all courses
 */
export const getAllCourses = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/courses`);
    return response.data;
  } catch (error) {
    console.error("Error fetching courses:", error);
    throw error;
  }
};

/**
 * Get courses by category
 * @returns {Promise} Object with courses grouped by category
 */
export const getCoursesByCategory = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/courses/by-category`);
    return response.data;
  } catch (error) {
    console.error("Error fetching courses by category:", error);
    throw error;
  }
};

/**
 * Get a single course by code
 * @param {string} courseCode - The course code
 * @returns {Promise} Course object
 */
export const getCourse = async (courseCode) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/courses/${courseCode}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching course:", error);
    throw error;
  }
};

/**
 * Batch check prerequisites for multiple courses
 * @param {string[]} courseCodes - Array of course codes to check
 * @param {string[]} completedCourses - Array of completed course codes
 * @returns {Promise} Object mapping course codes to prerequisite check results
 */
export const batchCheckPrerequisites = async (
  courseCodes,
  completedCourses = []
) => {
  try {
    const checks = await Promise.all(
      courseCodes.map((code) =>
        checkCoursePrerequisites(code, completedCourses)
      )
    );

    const results = {};
    courseCodes.forEach((code, index) => {
      results[code] = checks[index].data;
    });

    return results;
  } catch (error) {
    console.error("Error batch checking prerequisites:", error);
    throw error;
  }
};
