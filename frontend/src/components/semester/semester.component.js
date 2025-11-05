import { useDroppable } from "@dnd-kit/core";
import { Typography, Paper, Box } from '@mui/material';

const SemesterBox = ({ id, title, children, credits = 0, creditLimit = 19 }) => {
    
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {title}
            </Typography>
            <Typography 
                variant="body2" 
                color={credits > creditLimit ? "error" : "text.secondary"}
                sx={{ 
                    fontWeight: credits > creditLimit ? 600 : 400,
                    fontSize: '0.875rem'
                }}
            >
                {credits} / {creditLimit} credits
            </Typography>
        </Box>
        <div>{children}</div>
    </Paper>
    );
}

export default SemesterBox;