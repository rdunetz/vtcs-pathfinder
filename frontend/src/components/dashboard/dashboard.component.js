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
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from "@mui/material";
import { ExpandMore, Close } from "@mui/icons-material";

const Dashboard = ({ plan, setPlan }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [courses, setCourses] = useState([]);
  const [activeCourse, setActiveCourse] = useState(null);
  const [originalCoursesOrder, setOriginalCoursesOrder] = useState([]); // Store original order
  const [semesters, setSemesters] = useState(plan.semesters || {});
  const [progressModalOpen, setProgressModalOpen] = useState(false);

  useEffect(() => {
    setSemesters(plan.semesters || {});
  }, [plan.semesters]);

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
  }, []);

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
    if (!over) return;

    const droppedCourse = courses.find((c) => c.id === active.id);

    setSemesters((prev) => {
      const updated = {
        ...prev,
        [over.id]: [...prev[over.id], droppedCourse],
      };

      // update plan here using the newly computed semesters
      setPlan((prevPlan) => ({
        ...prevPlan,
        semesters: updated,
      }));

      return updated; // return updated semesters to update state
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
    const categories = {
      CoreCS: {
        name: "Core CS",
        required: 21,
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
        required: 17,
        completed: 0,
        color: "#1a8f1e",
        description: "MATH 1225, 1226, 2204, 2534, 2114",
      },
      Foundation: {
        name: "Foundation",
        required: 13,
        completed: 0,
        color: "#757575",
        description: "CHEM, PHYS, ENGL, ENGE requirements",
      },
      Pathways: {
        name: "Pathways",
        required: 54,
        completed: 0,
        color: "#4FC3F7",
        description: "Pathways Concepts 1-7 + Free Electives",
      },
    };

    if (semesters && Object.keys(semesters).length > 0) {
      Object.values(semesters).forEach((semesterCourses) => {
        semesterCourses.forEach((course) => {
          const credits = parseInt(course.credits) || 0;
          const category = course.category || "Pathways";

          // Map old categories to new ones (temporary until DB is updated)
          if (category === "CS") {
            categories["CoreCS"].completed += credits;
          } else if (category === "MATH") {
            categories["Mathematics"].completed += credits;
          } else if (category === "ENGLISH") {
            categories["Foundation"].completed += credits;
          } else {
            categories["Pathways"].completed += credits;
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
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mb: 2 }}
            />
            <div className="course-scroll">
              {filteredCourses.map((course, index) => (
                <Course
                  key={index}
                  course={course}
                  draggable={true}
                  overlay={false}
                />
              ))}
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
      <DragOverlay>
        {activeCourse ? (
          <Course course={activeCourse} draggable={true} overlay={true} />
        ) : null}
      </DragOverlay>

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
    </DndContext>
  );
};

export default Dashboard;
