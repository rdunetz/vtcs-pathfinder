import { useDroppable } from "@dnd-kit/core";
import { Typography, Paper } from '@mui/material';

const SemesterBox = ({ id, title, children }) => {
    
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
    <Paper
        ref={setNodeRef}
        sx={{
        minHeight: "140px",
        padding: 2,
        marginBottom: 2,
        borderRadius: "20px",
        backgroundColor: '#f9f9f9',
        width: 'auto',
        border: isOver ? "2px dashed #ff9800" : "2px dashed transparent",
        }}
    >
        <Typography variant="subtitle1">{title}</Typography>
        <div>{children}</div>
    </Paper>
    );
}

export default SemesterBox;