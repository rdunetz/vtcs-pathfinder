import './dashboard.styles.css'
import React, { useState, useEffect } from 'react';
import Course from '../course/course.component';
import SemesterBox from '../semester/semester.component';
import axios from 'axios';
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { Typography, Container, Paper, TextField } from '@mui/material';

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
                                        <Course key={idx} course={course} draggable={false} overlay={false} />
                                    ))}
                                </SemesterBox>
                            ))}
                        </div>
                    </Paper>

                    <Paper className="dashboard-panel panel-maroon">
                        <Typography variant="h6" className="panel-header">
                            Progress Overview
                        </Typography>
                        <Typography variant="body1">
                            Track your overall completion progress.
                        </Typography>
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