import React from 'react';
import { Typography, Container, Grid, Paper } from '@mui/material';

const Dashboard = () => {
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h4" gutterBottom>
                            Dashboard
                        </Typography>
                        <Typography variant="body1">
                            Welcome to your student dashboard. Here you can see your academic progress and course information.
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Current Courses
                        </Typography>
                        {/* Add current courses list here */}
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Progress Overview
                        </Typography>
                        {/* Add progress charts/stats here */}
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Dashboard;