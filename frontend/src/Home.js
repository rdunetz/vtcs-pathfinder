import './Home.css';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
// import SocialsIconRow from './Socials'
import Divider from '@mui/material/Divider';


function Home() {

  const email = ""

  return (
    <Container maxWidth={false} className="Home">
      <Box className="Home-main">
        <Typography variant="h2" gutterBottom className="Home-title animate-fade-slide">
            VTCS Pathfinder
          {/* Hello I'm <span className="accent">Ryan</span>, */}
          <br/>
        </Typography>

        <Divider className='animate-fade-slide' />

        {/* <div className='animate-fade-slide'>
          <SocialsIconRow email={email} subject='Job Offer' body='Hello Ryan, we want to offer you a job!' />
        </div> */}

        <Typography variant="h5" gutterBottom className="Home-subtitle animate-fade-slide">
          I'm a senior attending Virginia Tech studying Computer Science. My interests
          are robotics, AI, and coding. This is my portfolio and just a place I can 
          just develop my skills.
        </Typography>

        {/* <Button
          variant="contained"
          size="large"
          className="Home-button"
          href="/Review"
        >
          Add a Review
        </Button> */}

        {/* <img src="vtMap.png" alt="VT Map" className="Home-image" /> */}
      </Box>
    </Container>
  );
}

export default Home;
