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

  return (
    <Routes>
      {/* Routes WITHOUT navbar (Landing and Auth) */}
      <Route path='/' element={<Home/>}/>
      <Route path='auth' element={<Authentication/>}/>

      {/* Routes WITH navbar */}
      <Route element={<Navigation/>}>
        <Route path='plans' element={<Plans/>}/>
        <Route path='plans/:planId' element={<Dashboard/>}/>
      </Route>
    </Routes>
  );
}

export default App;
