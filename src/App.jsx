import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom"; 
import { useState, useEffect } from "react";
import BusinessCard from "./components/BusinessCard";
import AddPerson from "./components/formAgregar"; 
import NotFound from "./components/NotFound";
import peopleData from "./data/people.json";
import "./App.css";
import PanelEditar from "./components/formEditar";




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

          {/* RUTA DEL PANEL DE CONTROL CREAR */}
          <Route path="/crear" element={<AddPerson />} />
          {/* RUTA DEL PANEL DE CONTROL EDITAR */}
          <Route path="/editar" element={<PanelEditar />} />



          
          {/* Rutas dinámicas */}
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
