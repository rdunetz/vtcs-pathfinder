import './course.styles.css';
import React from 'react';
import { Typography, Container, Paper } from '@mui/material';
import { useDraggable } from "@dnd-kit/core";

const Course = ({ course, draggable, overlay }) => {
    const { id, title, credits, category } = course;

        const { attributes, listeners, setNodeRef, transform, isDragging } =
          useDraggable({ id: course.id, disabled: !draggable });
      
        const style = {
            // transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
            cursor: overlay ? "grabbing" : draggable ? "grab" : "default",
            opacity: isDragging ? 0.7 : 1,
        };

    const type = () => {

        switch (category) {
            case 'CS':
              return "cs-course-card";
            case 'MATH':
              return "math-course-card";
            case 'ENGLISH':
              return "english-course-card"
            default:
              return "course-card";
          }
    }

    return (
        <div ref={setNodeRef} style={style} {...(draggable ? listeners : {})} {...attributes}>
        <Container maxWidth="xl" className="course-container">
            <Paper className={type()} elevation={3}>
                <Typography variant="h6" className="course-label">
                    {id}
                </Typography>
                <Typography variant="subtitle1" className="course-title">
                    {title}
                </Typography>
                <Typography variant="subtitle2" className="course-credits">
                    {credits} credits
                </Typography>
            </Paper>
        </Container>
        </div>
    );
};

export default Course;
