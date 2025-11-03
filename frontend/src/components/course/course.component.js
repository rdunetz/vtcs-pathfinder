import './course.styles.css';
import React from 'react';
import { Typography, Container, Paper, IconButton } from '@mui/material';
import { InfoOutlined, DeleteOutline } from '@mui/icons-material';
import { useDraggable } from "@dnd-kit/core";

const Course = ({ course, draggable, overlay, onDelete, onInfo }) => {
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
                <div className="course-content">
                    <div className="course-info">
                        <Typography variant="h6" className="course-label">
                            {id}
                        </Typography>
                        <Typography variant="subtitle1" className="course-title">
                            {title}
                        </Typography>
                        <Typography variant="subtitle2" className="course-credits">
                            {credits} credits
                        </Typography>
                    </div>
                    {!draggable && !overlay && (
                        <div className="course-actions">
                            <IconButton
                                size="small"
                                className="course-icon-button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Info functionality to be implemented
                                }}
                                aria-label="Course information"
                            >
                                <InfoOutlined fontSize="small" />
                            </IconButton>
                            <IconButton
                                size="small"
                                className="course-icon-button course-delete-button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onDelete) onDelete(course);
                                }}
                                aria-label="Remove course"
                            >
                                <DeleteOutline fontSize="small" />
                            </IconButton>
                        </div>
                    )}
                </div>
            </Paper>
        </Container>
        </div>
    );
};

export default Course;
