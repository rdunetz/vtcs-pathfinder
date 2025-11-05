import React from 'react';
import { Typography, Container, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Plans = () => {
    const navigate = useNavigate();

    return (
        <Container maxWidth="lg" sx={{ mt: 12, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    My Degree Plans
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                    Welcome to your course planning page. Here you can create and manage your academic plans.
                </Typography>

                {/* Temporary test button to navigate to plan editor */}
                <Button
                    variant="contained"
                    onClick={() => navigate('/plans/test-plan-123')}
                    sx={{ bgcolor: "#800000", "&:hover": { bgcolor: "#600020" } }}
                >
                    Open Test Plan (Demo)
                </Button>

                {/* TODO: Add plan cards here with real plan data */}
            </Paper>
        </Container>
    );
};

export default Plans;