import React, { useState, useEffect, useContext } from "react";
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
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { UserContext } from "../../contexts/user.content";
import "./plans.styles.css";

const Plans = ({ setPlan }) => {
  const navigate = useNavigate();
  const { currentUser } = useContext(UserContext);
  const [plans, setPlans] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [planName, setPlanName] = useState("");
  const [startingSemester, setStartingSemester] = useState("Fall");
  const [startingYear, setStartingYear] = useState(new Date().getFullYear());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);

  useEffect(() => {
    if (!currentUser || plans.length > 0) return;

    axios
      .get(process.env.REACT_APP_BACKEND + "/plans/user/" + currentUser.uid)
      .then((res) => {
        // Sort plans by createdAt date (newest first)
        const sortedPlans = res.data.data.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB - dateA; // Descending order (newest first)
        });
        setPlans(sortedPlans);
        console.log(sortedPlans);
      })
      .catch((err) => {
        console.error("Failed to fetch plans", err);
      });
  }, [currentUser]);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    // Reset form fields
    setPlanName("");
    setStartingSemester("Fall");
    setStartingYear(new Date().getFullYear());
  };

  const createNewPlan = async () => {
    try {
      // Build semesters object matching Dashboard's expected structure
      const semestersObject = {};
      let currentSemester = startingSemester;
      let actualYear = startingYear;

      for (let i = 0; i < 8; i++) {
        const term =
          i % 2 === 0
            ? currentSemester
            : currentSemester === "Fall"
            ? "Spring"
            : "Fall";

        // Increment year when transitioning from Fall to Spring
        if (term === "Spring" && i % 2 === 1 && startingSemester === "Fall") {
          actualYear += 1;
        }
        // Increment year when we reach Spring again if starting with Spring
        if (
          term === "Spring" &&
          i > 0 &&
          i % 2 === 0 &&
          startingSemester === "Spring"
        ) {
          actualYear += 1;
        }

        // Create key like "Fall2025", "Spring2026"
        const semesterKey = `${term}${actualYear}`;
        semestersObject[semesterKey] = [];
      }

      const planData = {
        userId: currentUser.uid,
        name: planName || "Untitled Plan",
        semesters: semestersObject,
      };

      // POST to backend to create plan in Firebase (now using subcollections)
      const response = await axios.post(
        process.env.REACT_APP_BACKEND + "/plans",
        planData
      );

      if (response.data.success) {
        const createdPlan = response.data.data;

        // Add to local plans state (at the beginning since it's newest)
        setPlans((prevPlans) => [createdPlan, ...prevPlans]);

        // Set as current plan
        setPlan(createdPlan);

        handleCloseModal();

        // Navigate to the new plan
        navigate(`/plans/${createdPlan.id}`);
      }
    } catch (error) {
      console.error("Error creating plan:", error);
      alert("Failed to create plan. Please try again.");
    }
  };

  const handleOpenDeleteModal = (plan, event) => {
    event.stopPropagation(); // Prevent opening the plan when clicking delete
    setPlanToDelete(plan);
    setDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setPlanToDelete(null);
  };

  const handleDeletePlan = async () => {
    if (!planToDelete) return;

    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_BACKEND}/plans/${planToDelete.id}`,
        {
          data: { userId: currentUser.uid },
        }
      );

      if (response.data.success) {
        // Remove from local state
        setPlans((prevPlans) =>
          prevPlans.filter((p) => p.id !== planToDelete.id)
        );
        handleCloseDeleteModal();
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
      alert("Failed to delete plan. Please try again.");
    }
  };

  return (
    <Container maxWidth="lg" className="plans-container">
      <Paper className="plans-card">
        <Typography variant="h4" gutterBottom className="plans-title">
          My Degree Plans
        </Typography>

        {/* Gray Box with Add Button on Left and Plans Grid on Right */}
        <div className="plans-grid-container">
          {/* Add Plan Button - Left Side */}
          <div className="add-plan-section">
            <IconButton
              className="add-plan-btn-large"
              onClick={handleOpenModal}
            >
              <AddIcon className="add-icon-large" />
            </IconButton>
            <Typography variant="caption" className="add-plan-text">
              Create New Plan
            </Typography>
          </div>

          {/* Plans Grid - Right Side */}
          <div className="plans-grid">
            {plans.length === 0 ? (
              <Typography variant="body1" className="no-plans-text">
                No plans yet. Click the + to create your first plan!
              </Typography>
            ) : (
              plans.map((plan) => (
                <Paper
                  key={plan.id || plan._id}
                  className="plan-card"
                  onClick={() => {
                    setPlan(plan);
                    navigate(`/plans/${plan.id}`);
                  }}
                >
                  <div className="plan-card-header">
                    <Typography variant="h6" className="plan-name">
                      {plan.name}
                    </Typography>
                    <IconButton
                      className="delete-plan-btn"
                      onClick={(e) => handleOpenDeleteModal(plan, e)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </div>
                  <Typography variant="caption" color="textSecondary">
                    {plan.createdAt
                      ? `Created ${new Date(plan.createdAt).toLocaleDateString()}`
                      : "Created recently"}
                  </Typography>
                </Paper>
              ))
            )}
          </div>
        </div>

        {/* Create New Plan Modal */}
        <Dialog
          open={modalOpen}
          onClose={handleCloseModal}
          maxWidth="sm"
          fullWidth
          slotProps={{
            paper: {
              className: "create-plan-modal",
            },
          }}
        >
          <DialogTitle className="modal-title">Create New Plan</DialogTitle>
          <DialogContent className="modal-content">
            {/* Plan Name */}
            <TextField
              autoFocus
              margin="dense"
              label="Plan Name"
              type="text"
              fullWidth
              variant="outlined"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="e.g., Main Plan, Transfer Plan"
              className="modal-input"
            />

            {/* Starting Semester */}
            <FormControl
              fullWidth
              margin="dense"
              variant="outlined"
              className="modal-input"
            >
              <InputLabel>Starting Semester</InputLabel>
              <Select
                value={startingSemester}
                onChange={(e) => setStartingSemester(e.target.value)}
                label="Starting Semester"
              >
                <MenuItem value="Fall">Fall</MenuItem>
                <MenuItem value="Spring">Spring</MenuItem>
              </Select>
            </FormControl>

            {/* Starting Year */}
            <FormControl
              fullWidth
              margin="dense"
              variant="outlined"
              className="modal-input"
            >
              <InputLabel>Starting Year</InputLabel>
              <Select
                value={startingYear}
                onChange={(e) => setStartingYear(e.target.value)}
                label="Starting Year"
              >
                {Array.from(
                  { length: 10 },
                  (_, i) => new Date().getFullYear() - 2 + i
                ).map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions className="modal-actions">
            <Button onClick={handleCloseModal} className="modal-cancel-btn">
              Cancel
            </Button>
            <Button
              onClick={createNewPlan}
              variant="contained"
              className="modal-create-btn"
              disabled={!planName.trim()}
            >
              Create Plan
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog
          open={deleteModalOpen}
          onClose={handleCloseDeleteModal}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle className="delete-modal-title">Delete Plan?</DialogTitle>
          <DialogContent>
            <Typography variant="body1">
              Are you sure you want to delete{" "}
              <strong>{planToDelete?.name}</strong>?
            </Typography>
            <Typography variant="body2" color="error" sx={{ marginTop: 2 }}>
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions className="modal-actions">
            <Button
              onClick={handleCloseDeleteModal}
              className="modal-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeletePlan}
              variant="contained"
              className="modal-delete-btn"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default Plans;
