import React from 'react';
import logo from './logo.svg';
import './App.css';

import {BrowserRouter as Router, Route, Link} from "react-router-dom";

// Route components
import Dashboard from "./Dashboard";

function App() {
  return (
    <Router>
      <div>
        <Route path="/" component={Dashboard} />
      </div>
    </Router>
  );
}

export default App;
