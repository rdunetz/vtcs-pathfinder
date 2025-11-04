import './course.styles.css';
import React, { useState } from 'react';
import { 
    Typography, 
    Container, 
    Paper, 
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Chip,
    Divider,
    Box
} from '@mui/material';
import { InfoOutlined, DeleteOutline } from '@mui/icons-material';
import { useDraggable } from "@dnd-kit/core";

const Course = ({ course, draggable, overlay, onDelete }) => {
    const { id, title, credits, category } = course;
    const [modalOpen, setModalOpen] = useState(false);

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
        <>
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
                                            setModalOpen(true);
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

            {/* Course Info Modal */}
            <Dialog 
                open={modalOpen} 
                onClose={() => setModalOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                    }
                }}
            >
                <DialogTitle>
                    <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                        {course?.id || course?.code || 'Course'}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
                        {course?.title || course?.name || 'Course Title'}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                            <Chip 
                                label={`${Array.isArray(course.credits) ? course.credits[0] : (course.credits || 'N/A')} Credits`} 
                                color="primary" 
                                size="small"
                            />
                            <Chip 
                                label={course.category || 'General'} 
                                color="secondary" 
                                size="small"
                            />
                            {course.semesters && course.semesters.length > 0 && (
                                <Chip 
                                    label={`Available: ${course.semesters.join(', ')}`} 
                                    variant="outlined" 
                                    size="small"
                                />
                            )}
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Description
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph sx={{ lineHeight: 1.7 }}>
                            {course.description || 'No description available.'}
                        </Typography>

                        {(course.prerequisites && course.prerequisites.length > 0) && (
                            <>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                    Prerequisites
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {course.prerequisites.map((prereq, idx) => (
                                        <Chip key={idx} label={prereq} size="small" variant="outlined" />
                                    ))}
                                </Box>
                            </>
                        )}

                        {(course.corequisites && course.corequisites.length > 0) && (
                            <>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                    Corequisites
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {course.corequisites.map((coreq, idx) => (
                                        <Chip key={idx} label={coreq} size="small" variant="outlined" />
                                    ))}
                                </Box>
                            </>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setModalOpen(false)} color="primary" variant="contained">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default Course;
