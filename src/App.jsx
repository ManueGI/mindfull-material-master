// import React from 'react';
import { BrowserRouter as Router, Routes, Route, /* Link */ } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      {/* Un petit menu pour naviguer entre les pages */}
      {/* <nav>
        <Link to="/">Accueil</Link> | <Link to="/admin">Admin</Link>
      </nav> */}

      {/* Définition des routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
