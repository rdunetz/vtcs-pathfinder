import React from 'react';
import { Typography, Container, Paper } from '@mui/material';

const Plans = () => {
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Course Plans
                </Typography>
                <Typography variant="body1">
                    Welcome to your course planning page. Here you can create and manage your academic plans.
                </Typography>
                {/* Add your plans content here */}
            </Paper>
        </Container>
    );
};

export default Plans;