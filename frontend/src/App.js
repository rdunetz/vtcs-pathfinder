import logo from './logo.svg';
import './App.css';
import axios from 'axios';
import { useEffect, useState, useContext } from 'react';
import Navigation from './navigation/navigation.component';
import { UserContext } from "./contexts/user.content"
import Authentication from './authentication/authentication.component';
import { Routes, Route, data } from 'react-router-dom';
import Home from './Home';
// import Admin from './Admin';

function App() {

  const { currentUser } = useContext(UserContext);

  return (
    <Routes>
    <Route path='/' element={<Navigation/>}>
      <Route index element={<Home/>}/>
      <Route path='auth' element={<Authentication/>}/>
    </Route>
  </Routes>
  );
}

export default App;
