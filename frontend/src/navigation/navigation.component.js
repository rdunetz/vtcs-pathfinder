import { Fragment, useContext, useState, useRef } from "react";
import { Outlet, Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { UserContext } from "../contexts/user.content";
import { signOutUser } from "../utils/firebase/firebase.utils";
import "./navigation.styles.scss";
import { IconButton, Button } from "@mui/material";
import AccountCircle from '@mui/icons-material/AccountCircle';
import ArrowBack from '@mui/icons-material/ArrowBack';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import Typography from "@mui/material/Typography";
import AppBar from '@mui/material/AppBar';
import Toolbar from "@mui/material/Toolbar";
import axios from "axios";

const Navigation = ({ plan }) => {

  const appName = "VTCS Pathfinder"

  const { currentUser } = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const accountButtonRef = useRef(null);

  // Detect if we're on a plan editor page (e.g., /plans/123)
  const isOnPlanEditor = location.pathname.startsWith('/plans/') && location.pathname !== '/plans';
  const isOnPlansPage = location.pathname === '/plans';

  // For now, we'll use a placeholder for plan name - this should come from props or context later
  // const planName = window.location.pathname.replace("/plans/", "").replace(/-/g, " ");
  const planName = plan.name;

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = () => {
    handleClose();
    signOutUser();
    navigate('/');
  }

  const handleBackToPlans = () => {
    navigate('/plans');
  }

  const handleExportPlan = async () => {
    
    try {
      const response = await axios.post(process.env.REACT_APP_BACKEND + "/plans/export-pdf",
        { plan },               // <-- your JSON data sent to backend
        { responseType: "blob" } // <-- required for PDF
      );

      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(pdfBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "checksheet.pdf";
      link.click();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download failed:", err);
    }
  }

  return (
    <Fragment>
      <div className="navigation">
        <AppBar position="fixed" sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", bgcolor: "#800000" }}>
          <Toolbar sx={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "space-between" }}>

            {/* Left side: Logo + Back button */}
            <div style={{ display: "flex", flexDirection: "row", gap: 20, alignItems: "center", flex: 1 }}>
              {/* Logo - always links to home */}
              <Link to="/" style={{ textDecoration: 'none', color: "white" }}>
                <Typography variant="h6" component="div">
                  {appName}
                </Typography>
              </Link>

              {/* Conditional navbar content based on route */}
              {currentUser && (
                <div style={{ display: "flex", flexDirection: "row", gap: 20, alignItems: "center" }}>
                  {/* On Plans page: Show "My Plans" label */}
                  {isOnPlansPage && (
                    <Typography variant="h6" component="div" sx={{ color: "white" }}>
                      My Plans
                    </Typography>
                  )}

                  {/* On Plan Editor page: Show back button */}
                  {isOnPlanEditor && (
                    <Button
                      startIcon={<ArrowBack />}
                      onClick={handleBackToPlans}
                      sx={{ color: "white", textTransform: "none" }}
                    >
                      My Plans
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Center: Plan name (only on plan editor) */}
            {currentUser && isOnPlanEditor && (
              <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
                <Typography variant="h6" component="div" sx={{ color: "white", fontWeight: 600 }}>
                  {planName}
                </Typography>
              </div>
            )}

            {/* Right side: Export button (only on editor) + User menu */}
            <div style={{ display: "flex", alignItems: "center", gap: 15, flex: 1, justifyContent: "flex-end" }}>
              {/* Export Plan button - only show on plan editor */}
              {currentUser && isOnPlanEditor && (
                <Button
                  variant="outlined"
                  onClick={handleExportPlan}
                  sx={{
                    color: "white",
                    borderColor: "white",
                    textTransform: "none",
                    "&:hover": {
                      borderColor: "white",
                      bgcolor: "rgba(255, 255, 255, 0.1)"
                    }
                  }}
                >
                  Export
                </Button>
              )}

              {/* User menu */}
              {currentUser && (
                <div>
                  <IconButton
                    ref={accountButtonRef}
                    size="large"
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleMenu}
                    color="inherit"
                  >
                    <AccountCircle fontSize="large" />
                  </IconButton>
                  <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    sx={{
                      '& .MuiPaper-root': {
                        top: '32px !important',
                        left: 'auto !important',
                        right: '60px !important',
                      },
                      position: "fixed",
                      top: "0",
                      right: "0",
                    }}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                  >
                    {/* <MenuItem onClick={handleClose}>Profile</MenuItem> */}
                    <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
                  </Menu>
                </div>
              )}
            </div>
          </Toolbar>
        </AppBar>
      </div>
      <Outlet />
    </Fragment>
  );
};

export default Navigation;