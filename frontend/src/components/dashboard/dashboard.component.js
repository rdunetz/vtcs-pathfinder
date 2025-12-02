import "./dashboard.styles.css";
import React, { useState, useEffect, useContext } from "react";
import Course from "../course/course.component";
import SemesterBox from "../semester/semester.component";
import axios from "axios";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import {
  Typography,
  Container,
  Paper,
  TextField,
  LinearProgress,
  Box,
  Alert,
  Snackbar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  Warning,
  CheckCircle,
  Lock,
  ExpandMore,
  Close,
} from "@mui/icons-material";
import {
  getCompletedCoursesBysemester,
  checkPrerequisites,
  canAddCourseToSemester,
  getPrerequisiteStatus,
  validatePlanPrerequisites,
} from "../../utils/prerequisiteHelper";
import { UserContext } from "../../contexts/user.content";

const Dashboard = ({ plan, setPlan }) => {
  const { currentUser } = useContext(UserContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [courses, setCourses] = useState([]);
  const [activeCourse, setActiveCourse] = useState(null);
  const [originalCoursesOrder, setOriginalCoursesOrder] = useState([]); // Store original order
  const [semesters, setSemesters] = useState(plan.semesters || {});
  const [prerequisiteWarning, setPrerequisiteWarning] = useState({
    open: false,
    message: "",
    severity: "warning",
  });
  const [violations, setViolations] = useState([]);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  useEffect(() => {
    // Parse prerequisites from strings (Firebase format) to arrays (for validation)
    const parsedSemesters = {};
    const rawSemesters = plan.semesters || {};

    Object.entries(rawSemesters).forEach(([semesterKey, courses]) => {
      parsedSemesters[semesterKey] = courses.map((course) => {
        // If prerequisites is a string, parse it back to array
        if (typeof course.prerequisites === "string") {
          try {
            return {
              ...course,
              prerequisites:
                course.prerequisites === "[]"
                  ? []
                  : JSON.parse(course.prerequisites),
            };
          } catch (e) {
            console.error("Error parsing prerequisites for", course.id, e);
            return { ...course, prerequisites: [] };
          }
        }
        return course;
      });
    });

    setSemesters(parsedSemesters);
  }, [plan.semesters]);

  // Auto-save immediately when semesters change
  useEffect(() => {
    // Don't auto-save if plan doesn't have an ID yet
    if (!plan.id || !currentUser) return;

    const savePlan = async () => {
      try {
        // Convert prerequisites arrays to JSON strings to match Firebase format
        const semestersForFirebase = {};
        Object.entries(semesters).forEach(([semesterKey, courses]) => {
          semestersForFirebase[semesterKey] = courses.map((course) => ({
            ...course,
            // Convert prerequisites array to string like Firebase stores it
            prerequisites: course.prerequisites
              ? JSON.stringify(course.prerequisites)
              : "[]",
          }));
        });

        await axios.put(`${process.env.REACT_APP_BACKEND}/plans/${plan.id}`, {
          userId: currentUser.uid,
          semesters: semestersForFirebase,
        });
      } catch (error) {
        console.error("Error auto-saving plan:", error);
      }
    };

    savePlan();
  }, [semesters, plan.id, currentUser]);

  // Recalculate violations whenever the local semesters state changes
  useEffect(() => {
    const planViolations = validatePlanPrerequisites(semesters);
    setViolations(planViolations);
  }, [semesters]);

  useEffect(() => {
    if (courses.length > 0) {
      return;
    }

    axios
      .get(process.env.REACT_APP_BACKEND + "/courses")
      .then((res) => {
        setCourses(res.data.data);
        setOriginalCoursesOrder(res.data.data); // Store original order
      })
      .catch((err) => {
        console.error("Failed to fetch courses", err);
      });
  }, [courses.length]);

  // Build a Set of course IDs already placed in semesters
  const usedCourseIds = new Set(
    Object.values(semesters || {})
      .flat()
      .map((course) => course.id)
  );

  // Only show courses that are NOT in semesters
  const availableCourses = courses.filter(
    (course) => !usedCourseIds.has(course.id)
  );

  // Apply search filter to *availableCourses*, not `courses`
  // Normalize both search term and course IDs to handle spaces/dashes (e.g., "ARCH 1044" matches "ARCH1044")
  const normalizedSearchTerm = searchTerm.toLowerCase().replace(/[\s-:]/g, "");
  const filteredCourses = availableCourses.filter((course) =>
    course.id.toLowerCase().replace(/[\s-:]/g, "").includes(normalizedSearchTerm)
  );

  // const filteredCourses = courses.filter(course =>
  //     course.id.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  // Helper function to validate course code format
  const validateCourseCode = (code) => {
    if (!code || typeof code !== "string") return false;
    // Accept formats like: CS2114, CS-2114, CS 2114, MATH2114, etc.
    const courseCodeRegex = /^[A-Z]{2,4}\s*[-:]?\s*\d{4}$/i;
    return courseCodeRegex.test(code.trim());
  };

  // Helper function to determine category from subject
  const determineCategory = (subject) => {
    if (!subject) return "General";
    const subjectUpper = subject.toUpperCase();
    const categoryMap = {
      CS: "CS",
      MATH: "MATH",
      ENGL: "ENGLISH",
      ENGLISH: "ENGLISH",
      ECE: "ECE",
      COMM: "COMM",
      PHYS: "PHYS",
      CHEM: "CHEM",
      BIOL: "BIOL",
    };
    return categoryMap[subjectUpper] || "General";
  };

  // Transform search result from API to course format
  const transformSearchResultToCourse = (searchResult) => {
    if (!searchResult || !searchResult.code) {
      throw new Error("Invalid search result: missing course code");
    }

    // Normalize course code (remove dashes/spaces)
    const normalizedCode = searchResult.code.replace(/[\s-:]/g, "");

    return {
      id: normalizedCode,
      code: normalizedCode,
      name: searchResult.name || "Unknown Course",
      credits: searchResult.creditHours || null,
      category: determineCategory(searchResult.subject),
      prerequisites: searchResult.prerequisites || [],
      semesters: ["Fall", "Spring"], // Default, could be enhanced later
      description: searchResult.catalogDescription || "",
    };
  };

  // Handle adding course from search
  const handleAddCourseFromSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchError("Please enter a course code");
      return;
    }

    // Validate course code format
    if (!validateCourseCode(searchTerm)) {
      setSearchError(
        "Invalid course code format. Please use format like CS2114 or CS-2114"
      );
      return;
    }

    // Check if course already exists
    const normalizedSearchTerm = searchTerm.replace(/[\s-:]/g, "").toUpperCase();
    const courseExists = courses.some(
      (c) => (c.id || c.code || "").toUpperCase() === normalizedSearchTerm
    );

    if (courseExists) {
      setSearchError("This course is already in the list");
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND}/courses/search/by-id`,
        {
          params: { courseId: searchTerm.trim() },
        }
      );

      if (response.data.success && response.data.data) {
        const searchData = response.data.data;

        // Check if course was found (has code and name)
        if (!searchData.code || !searchData.name) {
          setSearchError(
            `Course "${searchTerm}" not found. Please check the course code.`
          );
          setIsSearching(false);
          return;
        }

        // Transform and add course
        const newCourse = transformSearchResultToCourse(searchData);
        setCourses((prev) => [...prev, newCourse]);
        setOriginalCoursesOrder((prev) => [...prev, newCourse]);

        // Show success message
        setPrerequisiteWarning({
          open: true,
          message: `✓ Course ${newCourse.id} added successfully`,
          severity: "success",
        });

        // Keep search term so user doesn't need to search again
        // The newly added course will now appear in filtered results
        // setSearchTerm("");
      } else {
        setSearchError(
          `Course "${searchTerm}" not found. Please check the course code.`
        );
      }
    } catch (error) {
      console.error("Error searching for course:", error);
      if (error.response?.status === 502) {
        setSearchError(
          "Unable to search for course. The timetable service may be unavailable."
        );
      } else if (error.response?.data?.error) {
        setSearchError(error.response.data.error);
      } else {
        setSearchError(
          `Failed to search for course: ${error.message || "Unknown error"}`
        );
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleDragEnd = (event) => {
    const { over, active } = event;
    setActiveCourse(null);

    if (!over) return;

    const droppedCourse = courses.find((c) => c.id === active.id);
    if (!droppedCourse) return;

    // Check prerequisites before allowing the drop
    const validation = canAddCourseToSemester(
      droppedCourse,
      over.id,
      semesters
    );

    if (!validation.allowed) {
      // Show warning but still allow the drop (with warning)
      setPrerequisiteWarning({
        open: true,
        message: `Warning: ${droppedCourse.id} - ${validation.reason}`,
        severity: "warning",
      });
    } else if (
      droppedCourse.prerequisites &&
      droppedCourse.prerequisites.length > 0
    ) {
      // Show success message for courses with prerequisites
      setPrerequisiteWarning({
        open: true,
        message: `✓ ${droppedCourse.id} added - All prerequisites met`,
        severity: "success",
      });
    }

    setSemesters((prev) => {
      const updated = {
        ...prev,
        [over.id]: [...prev[over.id], droppedCourse], // Keep full course with prerequisites for validation
      };

      // Update plan here using the newly computed semesters
      setPlan((prevPlan) => ({
        ...prevPlan,
        semesters: updated,
      }));

      return updated;
    });

    setCourses((prev) => prev.filter((c) => c.id !== active.id));
  };

  const handleDeleteCourse = (semesterKey, courseToDelete) => {
    // Remove course from semester
    setSemesters((prev) => {
      const updated = {
        ...prev,
        [semesterKey]: prev[semesterKey].filter(
          (c) => c.id !== courseToDelete.id
        ),
      };

      setPlan((prevPlan) => ({
        ...prevPlan,
        semesters: updated,
      }));

      return updated;
    });

    setCourses((prev) => {
      const newCourses = [...prev];

      // Check if course already exists in list (by id or code)
      const exists = newCourses.some(
        (c) => (c.id || c.code) === (courseToDelete.id || courseToDelete.code)
      );

      if (!exists) {
        // Find the original index of the course being deleted
        const originalIndex = originalCoursesOrder.findIndex(
          (c) => (c.id || c.code) === (courseToDelete.id || courseToDelete.code)
        );

        // Insert the course at the found position
        newCourses.splice(originalIndex, 0, courseToDelete);
      }

      return newCourses;
    });
  };

  // Calculate total credits from all semesters
  const calculateTotalCredits = () => {
    if (!semesters || Object.keys(semesters).length === 0) {
      return;
    }

    let total = 0;
    Object.values(semesters).forEach((semesterCourses) => {
      semesterCourses.forEach((course) => {
        // Parse credits as number to avoid string concatenation
        const credits = parseInt(course.credits) || 0;
        total += credits;
      });
    });
    return total;
  };

  const totalCredits = calculateTotalCredits();
  const TOTAL_REQUIRED_CREDITS = 123;
  const progressPercentage = Math.min(
    (totalCredits / TOTAL_REQUIRED_CREDITS) * 100,
    100
  );

  // Calculate detailed progress by category
  const calculateDetailedProgress = () => {
    // Define core CS courses
    const CORE_CS_COURSES = [
      "CS1114",
      "CS2114",
      "CS1944",
      "CS2104",
      "CS2505",
      "CS2506",
      "CS3114",
      "CS3214",
      "CS3604",
      "CS3304",
      "CS4944",
    ];

    // Define category mapping
    const CATEGORY_MAPPING = {
      MATH: "Mathematics",
      ENGLISH: "Foundation",
      CHEM: "Foundation",
      PHYS: "Foundation",
      ENGE: "Foundation",
      Foundation: "Foundation",
      // CS courses handled separately based on CORE_CS_COURSES list
      // All other categories default to Pathways
    };

    const categories = {
      CoreCS: {
        name: "Core CS",
        required: 29,
        completed: 0,
        color: "#861F41",
        description: "Required CS courses",
      },
      CSElectives: {
        name: "CS Electives",
        required: 18,
        completed: 0,
        color: "#E5751F",
        description: "CS Theory + Upper-level CS + Capstone",
      },
      Mathematics: {
        name: "Mathematics",
        required: 20,
        completed: 0,
        color: "#1a8f1e",
        description: "MATH 1225, 1226, 2204, 2534, 2114, 3134",
      },
      Foundation: {
        name: "Foundation",
        required: 22,
        completed: 0,
        color: "#757575",
        description: "CHEM, PHYS, ENGL, ENGE requirements",
      },
      Pathways: {
        name: "Pathways",
        required: 34,
        completed: 0,
        color: "#4FC3F7",
        description: "Pathways Concepts 1-7 + Free Electives + Other",
      },
    };

    if (semesters && Object.keys(semesters).length > 0) {
      Object.values(semesters).forEach((semesterCourses) => {
        semesterCourses.forEach((course) => {
          const credits = parseInt(course.credits) || 0;
          const category = course.category || "Pathways";
          const courseCode = course.id || course.code || "";

          // Differentiate between CS Core vs Electives
          if (category === "CS") {
            if (CORE_CS_COURSES.includes(courseCode)) {
              categories["CoreCS"].completed += credits;
            } else {
              categories["CSElectives"].completed += credits;
            }
          } else {
            // Map course category to progress category
            const targetCategory = CATEGORY_MAPPING[category] || "Pathways";
            categories[targetCategory].completed += credits;
          }
        });
      });
    }

    return categories;
  };

  const detailedProgress = calculateDetailedProgress();

  return (
    <DndContext
      onDragStart={(event) => {
        const course = courses.find((c) => c.id === event.active.id);
        setActiveCourse(course);
      }}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveCourse(null)}
    >
      <Container maxWidth="xl" className="dashboard-container">
        <Container className="dashboard-grid">
          {/* Left Panel: Available Courses (Full Height) */}
          <Paper className="dashboard-panel panel-maroon">
            <Typography variant="h6" className="panel-header">
              Available Courses
            </Typography>
            <TextField
              className="search-bar"
              fullWidth
              label="Search Courses"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSearchError(null); // Clear error when user types
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter" && filteredCourses.length === 0 && validateCourseCode(searchTerm)) {
                  handleAddCourseFromSearch();
                }
              }}
              error={!!searchError}
              helperText={searchError}
              sx={{ mb: 2 }}
            />
            {/* Show "Add Course" button when no results and valid course code format */}
            {filteredCourses.length === 0 &&
              searchTerm.trim() &&
              validateCourseCode(searchTerm) && (
                <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddCourseFromSearch}
                    disabled={isSearching}
                    startIcon={
                      isSearching ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : null
                    }
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      px: 3,
                    }}
                  >
                    {isSearching
                      ? "Searching..."
                      : `Add Course ${searchTerm.trim().toUpperCase()}`}
                  </Button>
                </Box>
              )}
            <div className="course-scroll">
              {filteredCourses.length === 0 && !searchTerm.trim() && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: "center", mt: 2 }}
                >
                  No courses available. Search for a course to add it.
                </Typography>
              )}
              {filteredCourses.map((course, index) => {
                // Get all completed courses from all semesters to show prerequisite status
                const allCompletedCourses = Object.values(semesters)
                  .flat()
                  .map((c) => c.id || c.code);
                const prereqStatus = getPrerequisiteStatus(
                  course,
                  allCompletedCourses
                );
                const { missingPrerequisites } = checkPrerequisites(
                  course,
                  allCompletedCourses
                );

                return (
                  <Course
                    key={index}
                    course={course}
                    draggable={true}
                    overlay={false}
                    prerequisiteStatus={prereqStatus}
                    missingPrerequisites={missingPrerequisites}
                  />
                );
              })}
            </div>
          </Paper>

          {/* Right Side: Progress Bar + Semesters */}
          <div className="right-side-container">
            {/* Progress Bar at Top - Clickable */}
            <Paper
              className="progress-bar-right clickable-progress"
              onClick={() => setProgressModalOpen(true)}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: "#861F41",
                    minWidth: "fit-content",
                  }}
                >
                  Progress Overview
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    flex: 1,
                    gap: 2,
                  }}
                >
                  <Box sx={{ flex: 1, maxWidth: "400px" }}>
                    <LinearProgress
                      variant="determinate"
                      value={progressPercentage}
                      sx={{
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: "rgba(134, 31, 65, 0.15)",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: "#861F41",
                          borderRadius: 6,
                        },
                      }}
                    />
                  </Box>

                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 600, minWidth: "fit-content" }}
                  >
                    {Math.round(progressPercentage)}%
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ minWidth: "fit-content" }}
                  >
                    <strong>{totalCredits}</strong> / {TOTAL_REQUIRED_CREDITS}{" "}
                    credits
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ minWidth: "fit-content" }}
                  >
                    {TOTAL_REQUIRED_CREDITS - totalCredits > 0
                      ? `(${TOTAL_REQUIRED_CREDITS - totalCredits} remaining)`
                      : "🎉 Complete!"}
                  </Typography>

                  <ExpandMore sx={{ color: "#861F41", ml: 1 }} />
                </Box>
              </Box>

              {/* Prerequisite Violations in Progress Bar */}
              {violations.length > 0 && (
                <Box
                  sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}
                >
                  <Chip
                    icon={<Warning />}
                    label={`${violations.length} Prerequisite Issue${
                      violations.length > 1 ? "s" : ""
                    }`}
                    color="warning"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Click to view details
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Semesters Below */}
            <Paper className="dashboard-panel panel-orange semesters-panel">
              <Typography variant="h6" className="panel-header">
                Plan Semesters (Drag courses here)
              </Typography>

              <div className="semesters">
                {semesters &&
                  Object.keys(semesters).length !== 0 &&
                  Object.entries(semesters).map(([semesterKey, courseList]) => {
                    // Calculate total credits for this semester
                    const semesterCredits = courseList.reduce(
                      (total, course) => {
                        const credits = parseInt(course.credits);
                        return total + credits;
                      },
                      0
                    );

                    const semesterTitle = semesterKey.replace(
                      /(\D+)(\d+)/,
                      (_, s, y) =>
                        `${s.charAt(0).toUpperCase() + s.slice(1)} ${y}`
                    );

                    return (
                      <SemesterBox
                        key={semesterKey}
                        id={semesterKey}
                        title={semesterTitle}
                        credits={semesterCredits}
                        creditLimit={19}
                      >
                        {courseList.map((course, idx) => (
                          <Course
                            key={idx}
                            course={course}
                            draggable={false}
                            overlay={false}
                            onDelete={() =>
                              handleDeleteCourse(semesterKey, course)
                            }
                          />
                        ))}
                      </SemesterBox>
                    );
                  })}
              </div>
            </Paper>
          </div>
        </Container>
      </Container>

      {/* Snackbar for prerequisite warnings */}
      <Snackbar
        open={prerequisiteWarning.open}
        autoHideDuration={4000}
        onClose={() =>
          setPrerequisiteWarning({ ...prerequisiteWarning, open: false })
        }
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() =>
            setPrerequisiteWarning({ ...prerequisiteWarning, open: false })
          }
          severity={prerequisiteWarning.severity}
          sx={{ width: "100%" }}
        >
          {prerequisiteWarning.message}
        </Alert>
      </Snackbar>

      {/* Detailed Progress Modal */}
      <Dialog
        open={progressModalOpen}
        onClose={() => setProgressModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#861F41" }}>
              Detailed Progress Breakdown
            </Typography>
            <IconButton
              onClick={() => setProgressModalOpen(false)}
              size="small"
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Overall Progress */}
            <Box
              sx={{
                mb: 4,
                p: 3,
                backgroundColor: "rgba(134, 31, 65, 0.05)",
                borderRadius: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, mb: 2, color: "#861F41" }}
              >
                Overall Progress
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Box sx={{ flex: 1, mr: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={progressPercentage}
                    sx={{
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: "rgba(134, 31, 65, 0.15)",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: "#861F41",
                        borderRadius: 8,
                      },
                    }}
                  />
                </Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, minWidth: "60px" }}
                >
                  {Math.round(progressPercentage)}%
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>{totalCredits}</strong> of {TOTAL_REQUIRED_CREDITS}{" "}
                credits completed
                {TOTAL_REQUIRED_CREDITS - totalCredits > 0 && (
                  <span style={{ color: "#666", marginLeft: "8px" }}>
                    ({TOTAL_REQUIRED_CREDITS - totalCredits} remaining)
                  </span>
                )}
              </Typography>
            </Box>

            {/* Prerequisite Violations in Modal */}
            {violations.length > 0 && (
              <Box
                sx={{
                  mb: 4,
                  p: 3,
                  backgroundColor: "rgba(244, 67, 54, 0.05)",
                  borderRadius: 2,
                  border: "1px solid rgba(244, 67, 54, 0.2)",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    color: "#f44336",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Warning sx={{ fontSize: 22, mr: 1 }} />
                  Prerequisite Issues ({violations.length})
                </Typography>
                <Box sx={{ maxHeight: "200px", overflowY: "auto" }}>
                  {violations.map((violation, idx) => (
                    <Alert
                      key={idx}
                      severity="warning"
                      sx={{ mb: 1.5 }}
                      icon={<Lock fontSize="small" />}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {violation.course}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Missing: {violation.missingPrerequisites}
                      </Typography>
                    </Alert>
                  ))}
                </Box>
              </Box>
            )}

            {/* Category Breakdown */}
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, mb: 3, color: "#861F41" }}
            >
              Progress by Category
            </Typography>

            {Object.entries(detailedProgress).map(([key, category]) => {
              const percentage = Math.min(
                (category.completed / category.required) * 100,
                100
              );
              return (
                <Box
                  key={key}
                  sx={{
                    mb: 3,
                    p: 2,
                    backgroundColor: "rgba(0, 0, 0, 0.02)",
                    borderRadius: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {category.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {category.completed} / {category.required} credits
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 1.5 }}
                  >
                    {category.description}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: "rgba(0, 0, 0, 0.1)",
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: category.color,
                            borderRadius: 5,
                          },
                        }}
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        minWidth: "50px",
                        textAlign: "right",
                      }}
                    >
                      {Math.round(percentage)}%
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </DialogContent>
      </Dialog>

      <DragOverlay>
        {activeCourse ? (
          <Course course={activeCourse} draggable={true} overlay={true} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default Dashboard;
