import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useState, useEffect } from "react";
import BusinessCard from "./components/BusinessCard";
import AddPerson from "./components/formAgregar";
import NotFound from "./components/NotFound";
import peopleData from "./data/people.json";
import "./App.css";
import PanelEditar from "./components/formEditar";
import { API_URL } from "./config";

function AppRoutes() {
  const location = useLocation();
  // Bundle JSON: rutas válidas al primer paint; fallback si no hay API.
  const [people, setPeople] = useState(() => peopleData.people || []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/registros`, {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const lista = data.people ?? data;
        if (!cancelled && Array.isArray(lista)) {
          setPeople(lista);
        }
      } catch {
        /* sin servidor o CORS: se mantiene el JSON del bundle */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Navigate to="/dvazquez" replace />} />

        <Route path="/crear" element={<AddPerson />} />
        <Route path="/editar" element={<PanelEditar />} />

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
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
