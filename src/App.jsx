import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import BusinessCard from './components/BusinessCard';
import NotFound from './components/NotFound';
import peopleData from './data/people.json';
import './App.css';

function App() {
  const [people, setPeople] = useState([]);

  useEffect(() => {
    setPeople(peopleData.people);
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/dvazquez" replace />} />
          {people.map((person) => (
            <Route 
              key={person.id} 
              path={`/${person.id}`} 
              element={<BusinessCard person={person} />} 
            />
          ))}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
