import './Home.css';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import RouteImage from './assets/route.jpg'

function Home() {

    const PROJECT_NAME = "VTCS Pathfinder"

    return (
        <Container maxWidth={false} className="Home">
            <Box className="Home-main">
                <Typography variant="h2" gutterBottom className="Home-title animate-fade-slide">
                    {PROJECT_NAME}
                    <br />
                </Typography>

                <Divider className='animate-fade-slide' />


                <div style={{ height: '200px', overflow: 'hidden', justifyContent: 'center', display: 'flex'}}>
                    <img src={RouteImage} alt="Route" className="Home-image animate-fade-slide" />
                </div>

                {/* <Divider className='animate-fade-slide' /> */}

                <br/>

                <Typography variant="h5" gutterBottom className="Home-subtitle animate-fade-slide">
                    Our senior capstone project, VTCS Pathfinder, is a web application designed to help Virginia Tech Computer Science students plan their academic journey efficiently. It allows users to visualize and organize their semesters based on the official VT CS degree checklist, ensuring that prerequisites and graduation requirements are met. The tool provides an intuitive interface for course selection, semester planning, and progress tracking throughout a student’s academic career.
                </Typography>

                <br/>

                <Button
                    variant="contained"
                    size="large"
                    className="Home-button animate-fade-slide"
                    href="/auth"
                >
                    Get Started
                </Button>

                {/* <img src="vtMap.png" alt="VT Map" className="Home-image" /> */}

            </Box>
        </Container>
    );
}

export default Home;
