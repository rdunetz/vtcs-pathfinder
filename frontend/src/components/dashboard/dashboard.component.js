import './dashboard.styles.css'
import React, { useState, useEffect } from 'react';
import Course from '../course/course.component';
import SemesterBox from '../semester/semester.component';
import axios from 'axios';
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { Typography, Container, Paper, TextField, LinearProgress, Box } from '@mui/material';

const Dashboard = (params) => {

    const { plan } = params;
    const [searchTerm, setSearchTerm] = useState("");
    const [courses, setCourses] = useState([]);
    const [activeCourse, setActiveCourse] = useState(null);
    const [semesters, setSemesters] = useState({
        fall2025: [],
        spring2026: [],
        fall2026: [],
        spring2027: [],
        fall2027: [],
        spring2028: [],
        fall2028: [],
        spring2029: []
    });

    useEffect(() => {

        if (courses.length > 0) {
            return;
        }

        axios.get(process.env.REACT_APP_BACKEND + "/courses")
            .then(res => {
                setCourses(res.data.data);
            })
            .catch(err => {
                console.error("Failed to fetch courses", err);
            });

    }, []);

    const filteredCourses = courses.filter(course =>
        course.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDragEnd = (event) => {
        const { over, active } = event;
        if (!over) return;

        const droppedCourse = courses.find(c => c.id === active.id);

        setSemesters(prev => ({
            ...prev,
            [over.id]: [...prev[over.id], droppedCourse]
        }));

        setCourses((prev) => prev.filter((c) => c.id !== active.id));

    };

    const handleDeleteCourse = (semesterKey, courseToDelete) => {
        // Remove course from semester
        setSemesters(prev => ({
            ...prev,
            [semesterKey]: prev[semesterKey].filter(c => c.id !== courseToDelete.id)
        }));

        // Add course back to available courses list
        setCourses(prev => [...prev, courseToDelete]);
    };

    // Calculate total credits from all semesters
    const calculateTotalCredits = () => {
        let total = 0;
        Object.values(semesters).forEach(semesterCourses => {
            semesterCourses.forEach(course => {
                // Parse credits as number to avoid string concatenation
                const credits = parseInt(course.credits) || 0;
                total += credits;
            });
        });
        return total;
    };

    const totalCredits = calculateTotalCredits();
    const TOTAL_REQUIRED_CREDITS = 123;
    const progressPercentage = Math.min((totalCredits / TOTAL_REQUIRED_CREDITS) * 100, 100);

    return (
        <DndContext
            onDragStart={(event) => {
                const course = courses.find(c => c.id === event.active.id)
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
                            className='search-bar'
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
                                <Course key={index} course={course} draggable={true} overlay={false} />
                            ))}
                        </div>
                    </Paper>

                    <Paper className="dashboard-panel panel-orange">
                        <Typography variant="h6" className="panel-header">
                            Plan Semesters (Drag courses here)
                        </Typography>

                        <div className="semesters">
                            {Object.entries(semesters).map(([semesterKey, courseList]) => (
                                <SemesterBox
                                    key={semesterKey}
                                    id={semesterKey}
                                    title={semesterKey.replace(/(\D+)(\d+)/, (_, s, y) =>
                                        `${s.charAt(0).toUpperCase() + s.slice(1)} ${y}`
                                    )}
                                >
                                    {courseList.map((course, idx) => (
                                        <Course
                                            key={idx}
                                            course={course}
                                            draggable={false}
                                            overlay={false}
                                            onDelete={() => handleDeleteCourse(semesterKey, course)}
                                        />
                                    ))}
                                </SemesterBox>
                            ))}
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

                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1 }}>
                                <Box sx={{ width: '100%', mr: 1 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={progressPercentage}
                                        sx={{
                                            height: 12,
                                            borderRadius: 6,
                                            backgroundColor: 'rgba(134, 31, 65, 0.15)',
                                            '& .MuiLinearProgress-bar': {
                                                backgroundColor: '#861F41',
                                                borderRadius: 6,
                                            }
                                        }}
                                    />
                                </Box>
                                <Box sx={{ minWidth: 50 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        {Math.round(progressPercentage)}%
                                    </Typography>
                                </Box>
                            </Box>

                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                <strong>{totalCredits}</strong> / {TOTAL_REQUIRED_CREDITS} credits
                            </Typography>

                            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                                {TOTAL_REQUIRED_CREDITS - totalCredits > 0
                                    ? `${TOTAL_REQUIRED_CREDITS - totalCredits} credits remaining`
                                    : 'Degree requirements met! 🎉'}
                            </Typography>
                        </Box>
                    </Paper>

                </Container>
            </Container>
            <DragOverlay>
                {activeCourse ? <Course course={activeCourse} draggable={true} overlay={true} /> : null}
            </DragOverlay>
        </DndContext>
    );
};

export default Dashboard;