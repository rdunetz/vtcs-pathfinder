import React, { useState, useEffect, useContext } from 'react';
import { Typography, Container, Paper, Button, IconButton, Autocomplete, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../../contexts/user.content';
import './plans.styles.css';

const Plans = ({ setPlan }) => {
    const navigate = useNavigate();
    const { currentUser } = useContext(UserContext);
    const [plans, setPlans] = useState([]);

    useEffect(() => {
        if (!currentUser || plans.length > 0) return;

        axios.get(process.env.REACT_APP_BACKEND + "/plans/user/" + currentUser.uid)
            .then(res => {
                setPlans(res.data.data);
                console.log(res.data.data);
            })
            .catch(err => {
                console.error("Failed to fetch plans", err);
            });
    }, [currentUser]);

    // TODO: CHANGE THIS
    const createNewPlan = () => {

        const startYear = 2025;

        const semesters = {};

        let year = startYear;

        let i = 0;

        while (i <= 7) {

            const season = i % 2 === 0 ? "Fall" : "Spring";

            year = i % 2 === 0 ? year : year + 1;

            semesters[season + year] = [];

            i += 1;
        }

        console.log(semesters)

        const newPlan = {
            name: 'New Test Plan',
            semesters: semesters,
        }

        setPlan(newPlan);

        navigate('/plans/New-Plan'); // change route as needed
    };

    return (
        <Container maxWidth="lg" className="plans-container">
            <Paper className="plans-card">
                <div className="header-row">
                    <Typography variant="h4" gutterBottom>
                        My Degree Plans
                    </Typography>

                    {/* Add Plan Button */}
                    <IconButton className="add-plan-btn" onClick={createNewPlan}>
                        <AddIcon fontSize='large' />
                    </IconButton>
                </div>

                <Typography variant="body1" className="plans-description">
                    Welcome to your course planning page. Here you can create and manage your academic plans.
                </Typography>

                <Autocomplete
                    disablePortal
                    getOptionLabel={(option) => option.name}
                    options={plans}
                    sx={{ maxWidth: 300, marginBottom: 4 }}
                    onChange={(event, value) => {
                        if (!value) return;
                        setPlan(value);
                        navigate(`/plans/${value.name.replace(/\s+/g, '-')}`);
                    }}
                    renderInput={(params) => <TextField {...params} label="Plans" />}
                />

                {/* Temporary button to test navigation */}
                <Button
                    variant="contained"
                    onClick={() => navigate('/plans/test-plan-123')}
                    className="test-plan-btn"
                >
                    Open Test Plan (Demo)
                </Button>
            </Paper>
        </Container>
    );
};

export default Plans;
