import { Fragment, useContext, useState, useRef } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/user.content";
import { signOutUser } from "../utils/firebase/firebase.utils";
import "./navigation.styles.scss";
import { IconButton } from "@mui/material";
import AccountCircle from '@mui/icons-material/AccountCircle';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import Typography from "@mui/material/Typography";
import AppBar from '@mui/material/AppBar';
import Toolbar from "@mui/material/Toolbar";

const Navigation = (props) => {

  const appName = "VTCS Pathfinder"

  const { currentUser } = useContext(UserContext);

  const [anchorEl, setAnchorEl] = useState(null);

  const accountButtonRef = useRef(null);

  const navigate = useNavigate();

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

  const pages = [
    {
      link: "/plans",
      label: "Plans"
    },
    {
      link: "/dashboard",
      label: "Dashboard"
    },
  ]

  return (
    <Fragment>
      <div className="navigation">
        <AppBar position="fixed" sx={{ display: "flex", flexDirection: "row", display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#800000" }}>
          <Toolbar sx={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "row", gap: 20, alignItems: "center" }}>
              <Link to="/" style={{ textDecoration: 'none', color: "white" }}>
                <Typography variant="h6" component="div" sx={{ justifyContent: "center" }} >
                  {appName}
                </Typography>
              </Link>
              {currentUser ? (
                <div style={{ display: "flex", flexDirection: "row", gap: 20, alignItems: "center" }}>
                  {pages.map((page) => (
                    <Link to={page.link} style={{ textDecoration: 'none', color: "white" }}>
                      <Typography variant="h7" component="div" >
                        {page.label}
                      </Typography>
                    </Link>
                  ))}
                  {currentUser.isAdmin &&
                    <Link to="/admin" style={{ textDecoration: 'none', color: "white" }}>
                      <Typography variant="h7" component="div" >
                        Admin
                      </Typography>
                    </Link>
                  }
                </div>
              ) : (<></>)
              }
            </div>
          </Toolbar>
          <div className="nav-links-container">
            {currentUser ? (
              <div style={{ marginRight: "55px" }}>
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
                      top: '16px !important',
                      left: 'auto !important',
                      right: '60px !important',
                    },
                    position: "fixed",
                    top: "0",
                    right: "0",
                  }}
                  // anchorOrigin={{
                  //   vertical: "bottom",
                  //   horizontal: "center",
                  // }}
                  // transformOrigin={{
                  //   vertical: "top",
                  //   horizontal: "right",
                  // }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem onClick={handleClose}>Profile</MenuItem>
                  <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
                </Menu>
              </div>
            ) : (
              <Link to="/auth" style={{ textDecoration: 'none', color: "white" }}>
                <Typography variant="h7" component="div" sx={{ justifyContent: "center", marginRight: "60px" }} >
                  Sign In
                </Typography>
              </Link>
            )}
          </div>
        </AppBar>
      </div>
      <Outlet />
    </Fragment>
  );
};

export default Navigation;