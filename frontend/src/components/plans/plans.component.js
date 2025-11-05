import React, { useState, useEffect, useContext } from 'react';
import { Typography, Container, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ComboBox from '../combo-box/combo-box.component';
import { UserContext } from '../../contexts/user.content';

const Plans = () => {
    const navigate = useNavigate();

    const { currentUser } = useContext(UserContext);
    const [plans, setPlans] = useState([]);

    useEffect(() => {

        if (!currentUser || plans.length > 0) {
            return;
        }

        axios.get(process.env.REACT_APP_BACKEND + "/plans/user/" + currentUser.uid)
            .then(res => {
                setPlans(res.data.data);
                console.log(res.data.data);
            })
            .catch(err => {
                console.error("Failed to fetch plans", err);
            });

    }, [currentUser]);

    return (
        <Container maxWidth="lg" sx={{ mt: 12, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    My Degree Plans
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                    Welcome to your course planning page. Here you can create and manage your academic plans.
                </Typography>

                <ComboBox options={plans}/>

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