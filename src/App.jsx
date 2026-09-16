import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Classroom from './pages/Classroom';
import Learn from './pages/Learn';
import Games from './pages/Games';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/classroom" element={<Classroom />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/games" element={<Games />} />
            <Route path="*" element={
              <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">404: Page Not Found</h2>
                  <p className="text-gray-600">The page you are looking for does not exist.</p>
                </div>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;