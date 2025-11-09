import "./dashboard.styles.css";
import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { Warning, CheckCircle, Lock } from "@mui/icons-material";
import {
  getCompletedCoursesBysemester,
  checkPrerequisites,
  canAddCourseToSemester,
  getPrerequisiteStatus,
  validatePlanPrerequisites,
} from "../../utils/prerequisiteHelper";

const Dashboard = ({ plan, setPlan }) => {
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

  useEffect(() => {
    setSemesters(plan.semesters || {});
  }, [plan.semesters]);

  // Sync local semesters changes back to parent plan
  useEffect(() => {
    // Only update if semesters has content and is different from plan.semesters
    if (Object.keys(semesters).length > 0 && semesters !== plan.semesters) {
      setPlan((prevPlan) => ({
        ...prevPlan,
        semesters: semesters,
      }));
    }
  }, [semesters, plan.semesters, setPlan]);

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
  const filteredCourses = availableCourses.filter((course) =>
    course.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // const filteredCourses = courses.filter(course =>
  //     course.id.toLowerCase().includes(searchTerm.toLowerCase())
  // );

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

    setSemesters((prev) => ({
      ...prev,
      [over.id]: [...prev[over.id], droppedCourse],
    }));

    setCourses((prev) => prev.filter((c) => c.id !== active.id));
  };

  const handleDeleteCourse = (semesterKey, courseToDelete) => {
    // Remove course from semester
    setSemesters((prev) => ({
      ...prev,
      [semesterKey]: prev[semesterKey].filter(
        (c) => c.id !== courseToDelete.id
      ),
    }));

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
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mb: 2 }}
            />
            <div className="course-scroll">
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

          <Paper className="dashboard-panel panel-orange">
            <Typography variant="h6" className="panel-header">
              Plan Semesters (Drag courses here)
            </Typography>

            <div className="semesters">
              {semesters &&
                Object.keys(semesters).length !== 0 &&
                Object.entries(semesters).map(([semesterKey, courseList]) => {
                  // Calculate total credits for this semester
                  const semesterCredits = courseList.reduce((total, course) => {
                    const credits = parseInt(course.credits);
                    return total + credits;
                  }, 0);

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

          <Paper className="dashboard-panel panel-maroon">
            <Typography variant="h6" className="panel-header">
              Progress Overview
            </Typography>

            <Box className="progress-section">
              <Typography variant="subtitle1" className="progress-title">
                Overall Progress
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", mt: 2, mb: 1 }}>
                <Box sx={{ width: "100%", mr: 1 }}>
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
                <Box sx={{ minWidth: 50 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontWeight: 600 }}
                  >
                    {Math.round(progressPercentage)}%
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <strong>{totalCredits}</strong> / {TOTAL_REQUIRED_CREDITS}{" "}
                credits
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 2, display: "block" }}
              >
                {TOTAL_REQUIRED_CREDITS - totalCredits > 0
                  ? `${TOTAL_REQUIRED_CREDITS - totalCredits} credits remaining`
                  : "Degree requirements met! 🎉"}
              </Typography>
            </Box>

            {/* Prerequisite Violations Summary */}
            {violations.length > 0 && (
              <Box
                className="progress-section"
                sx={{
                  mt: 2,
                  backgroundColor: "rgba(244, 67, 54, 0.05)",
                  borderColor: "rgba(244, 67, 54, 0.3)",
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    color: "#f44336",
                    mb: 1,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Warning sx={{ fontSize: 20, mr: 0.5 }} />
                  Prerequisite Issues ({violations.length})
                </Typography>
                <Box sx={{ maxHeight: "200px", overflowY: "auto" }}>
                  {violations.map((violation, idx) => (
                    <Alert
                      key={idx}
                      severity="warning"
                      sx={{ mb: 1, py: 0.5 }}
                      icon={<Lock fontSize="small" />}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
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

            {violations.length === 0 && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  backgroundColor: "rgba(76, 175, 80, 0.05)",
                  borderRadius: 2,
                  border: "1px solid rgba(76, 175, 80, 0.2)",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    color: "#4caf50",
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle sx={{ fontSize: 18, mr: 0.5 }} />
                  No prerequisite violations
                </Typography>
              </Box>
            )}
          </Paper>
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

      <DragOverlay>
        {activeCourse ? (
          <Course course={activeCourse} draggable={true} overlay={true} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default Dashboard;
