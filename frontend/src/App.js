import logo from './logo.svg';
import './App.css';
import axios from 'axios';
import { useEffect, useState, useContext } from 'react';
import Navigation from './navigation/navigation.component';
import { UserContext } from "./contexts/user.content"
import Authentication from './authentication/authentication.component';
import { Routes, Route, data } from 'react-router-dom';
import Home from './Home';
import Plans from './components/plans/plans.component';
import Dashboard from './components/dashboard/dashboard.component';
// import Admin from './Admin';

function App() {

  const { currentUser } = useContext(UserContext);

  // load plan from localStorage (only on first render)
  const [plan, setPlan] = useState(() => {
    const saved = localStorage.getItem("userPlan");
    return saved ? JSON.parse(saved) : {};
  });

  // save plan to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("userPlan", JSON.stringify(plan));
  }, [plan]);


  return (
    <Routes>
      {/* Routes WITHOUT navbar (Landing and Auth) */}
      <Route path='/' element={<Home />} />
      <Route path='auth' element={<Authentication />} />

      {/* Routes WITH navbar */}
      <Route element={<Navigation plan={plan} />}>
        <Route path='plans' element={<Plans setPlan={setPlan} />} />
        <Route path='plans/:planId' element={<Dashboard plan={plan} setPlan={setPlan} />} />
      </Route>
    </Routes>
  );
}

export default App;
