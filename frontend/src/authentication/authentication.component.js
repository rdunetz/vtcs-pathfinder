import SignUpForm from "../components/sign-up-form/sign-up-form.component";
import SignInForm from "../components/sign-in-form/sign-in-form.component";
import "./authentication.styles.scss"
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

const Authentication = () => {

    return (
        <>
            {/* Static Navbar */}
            <AppBar position="fixed" sx={{ bgcolor: "#800000" }}>
                <Toolbar>
                    <Typography variant="h6" component="div">
                        VTCS Pathfinder
                    </Typography>
                </Toolbar>
            </AppBar>

            <div className="authentication-container" style={{ marginTop: '80px' }}>
                <SignInForm/>
                <SignUpForm/>
            </div>
        </>
    )

}

export default Authentication;