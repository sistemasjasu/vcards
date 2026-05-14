import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./formAgregar.css";
import { API_URL } from '../config';

// Imagen para evitar errores de carga
const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3E%3Ccircle cx='15' cy='15' r='15' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%23999'%3E?%3C/text%3E%3C/svg%3E";

const fieldLabels = {
  title: "Título / Puesto",
  address: "Dirección",
  profileImage: "URL Imagen de Perfil",
  phone: "Teléfono",
  email: "Correo Electrónico",
  website: "Sitio Web",
  whatsapp: "WhatsApp",
  linkedin: "Perfil LinkedIn",
  location: "Link Google Maps",
  calendar: "Link Calendar",
};

function PanelEditar() {
  const navigate = useNavigate();

  // Estados
  const [people, setPeople] = useState([]); 
  const [selectedId, setSelectedId] = useState(null); 
  const [formData, setFormData] = useState({ name: "", title: "" });
  const [activeFields, setActiveFields] = useState([]);
  const [selectedField, setSelectedField] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // 1. CARGAR LA LISTA AL INICIAR
  useEffect(() => {
    fetchPeople();
  }, []);

  const fetchPeople = () => {
    fetch(`${API_URL}/api/registros`)
      .then((res) => res.json())
      .then((data) => {
        const lista = data.people || data;
        setPeople(lista);
      })
      .catch((err) => console.error("Error cargando lista:", err));
  };

  // 2. SELECCIONAR PERSONA
  const handleSelectPerson = (person) => {
    setSelectedId(person.id);

    const datos = { ...person };
    const camposVisibles = ["name", "title"];

    // Separar teléfonos
    ["phone", "whatsapp"].forEach((key) => {
      if (datos[key]) {
        const texto = datos[key].trim();
        const primerEspacio = texto.indexOf(" ");

        if (primerEspacio !== -1) {
          datos[`${key}_lada`] = texto.substring(0, primerEspacio);
          datos[`${key}_num`] = texto.substring(primerEspacio + 1);
        } else {
          datos[`${key}_lada`] = "";
          datos[`${key}_num`] = texto;
        }
        delete datos[key];
        if (!camposVisibles.includes(key)) camposVisibles.push(key);
      }
    });

    Object.keys(datos).forEach((key) => {
      if (fieldLabels[key] && datos[key]) {
        if (!camposVisibles.includes(key)) camposVisibles.push(key);
      }
    });

    setFormData(datos);
    setActiveFields(camposVisibles);
  };


  // SUBIR IMAGEN
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedId) {
        alert("Selecciona a una persona primero.");
        return;
    }

    const data = new FormData();
    data.append("imagen", file);
    data.append("nombreArchivo", selectedId); 

    try {
      setIsUploading(true);
      const res = await fetch(`${API_URL}/api/subir-imagen`, {
        method: "POST",
        body: data,
      });
      const result = await res.json();
      
      if (result.url) {
        const urlFresca = `${result.url}?t=${Date.now()}`; 

        setFormData((prev) => ({ ...prev, profileImage: urlFresca }));
        if (!activeFields.includes("profileImage")) {
          setActiveFields([...activeFields, "profileImage"]);
        }

        setPeople(prevPeople => prevPeople.map(p => {
            if (p.id === selectedId) {
                return { ...p, profileImage: urlFresca };
            }
            return p;
        }));

      } else {
        alert("Error subiendo imagen: " + (result.error || "Desconocido"));
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    } finally {
      setIsUploading(false);
    }
  };

  // ELIMINAR REGISTRO 
  const handleDelete = async () => {
    if (!selectedId) return;

    // Confirmación de seguridad
    const confirmacion = window.confirm(`¿Estás SEGURO de que quieres eliminar a "${formData.name}"?\n\nEsta acción no se puede deshacer.`);
    
    if (!confirmacion) return;

    try {
        const res = await fetch(`${API_URL}/api/eliminar-registro/${selectedId}`, {
            method: 'DELETE'
        });
        const result = await res.json();

        if (result.status === 'success') {
            alert("Usuario eliminado correctamente.");
            // Quitamos al usuario de la lista localmente
            setPeople(people.filter(p => p.id !== selectedId));
            // Reseteamos el formulario
            setSelectedId(null);
            setFormData({ name: "", title: "" });
        } else {
            alert("Error al eliminar: " + result.message);
        }
    } catch (error) {
        alert("Error de conexión al intentar eliminar.");
    }
  };

  // --- MANEJADORES ---
  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const removeField = (fieldName) => {
    setActiveFields(activeFields.filter((f) => f !== fieldName));
    const newFormData = { ...formData };
    if (fieldName === "phone" || fieldName === "whatsapp") {
      delete newFormData[`${fieldName}_lada`];
      delete newFormData[`${fieldName}_num`];
    } else delete newFormData[fieldName];
    setFormData(newFormData);
  };

  const addField = () => {
    if (selectedField && !activeFields.includes(selectedField)) {
      setActiveFields([...activeFields, selectedField]);
      setFormData({ ...formData, [selectedField]: "" });
    }
    setSelectedField("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;

    const dataToSend = { ...formData, id: selectedId };

    ["phone", "whatsapp"].forEach((field) => {
      if (activeFields.includes(field)) {
        const lada = formData[`${field}_lada`] || "";
        const num = formData[`${field}_num`] || "";
        if (num) dataToSend[field] = `${lada} ${num}`.trim();
        delete dataToSend[`${field}_lada`];
        delete dataToSend[`${field}_num`];
      }
    });

    if (dataToSend.profileImage && dataToSend.profileImage.includes('?t=')) {
        dataToSend.profileImage = dataToSend.profileImage.split('?t=')[0];
    }

    try {
      const response = await fetch(
        `${API_URL}/api/actualizar-registro/${selectedId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSend),
        }
      );

      const result = await response.json();

      if (result.status === "success") {
        alert("¡Datos actualizados!");
        fetchPeople(); 
      } else {
        alert("Error: " + result.message);
      }
    } catch (error) {
      alert("Error de conexión");
    }
  };

  // RENDERIZADO DE INPUTS
  const renderInput = (key) => {
    if (key === "profileImage") {
      return (
        <div
          style={{
            border: "1px dashed #ccc",
            padding: 10,
            borderRadius: 10,
            background: "#f9f9f9",
          }}
        >
          {isUploading ? (
            <div style={{ color: "#2d5a27" }}>⏳ Actualizando en Drive...</div>
          ) : (
            <>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ width: "100%" }}
              />
              {formData.profileImage && (
                <div style={{ marginTop: 10, textAlign: "center" }}>
                  <img
                    src={formData.profileImage}
                    alt="Preview"
                    style={{ height: 80, borderRadius: 5 }}
                    referrerPolicy="no-referrer"
                    onError={(e)=>{e.target.onerror=null; e.target.src=DEFAULT_AVATAR}}
                  />
                  <div style={{ fontSize: 10, color: "#666" }}>Foto actual</div>
                </div>
              )}
            </>
          )}
        </div>
      );
    }
    if (key === "phone" || key === "whatsapp") {
      return (
        <div style={{ display: "flex", gap: "5px" }}>
          <input
            type="text"
            name={`${key}_lada`}
            placeholder="+52"
            value={formData[`${key}_lada`] || ""}
            onChange={handleInputChange}
            className="form-input"
            style={{ width: "70px", textAlign: "center" }}
          />
          <input
            type="text"
            name={`${key}_num`}
            placeholder="Número"
            value={formData[`${key}_num`] || ""}
            onChange={handleInputChange}
            className="form-input"
            style={{ flexGrow: 1 }}
          />
        </div>
      );
    }
    return (
      <input
        type="text"
        name={key}
        value={formData[key] || ""}
        onChange={handleInputChange}
        required={["name", "title"].includes(key)}
        className="form-input"
      />
    );
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f0f2f5",
        padding: "20px",
        gap: "20px",
        flexWrap: "wrap",
      }}
    >
      {/* PANEL IZQUIERDO: LISTA */}
      <div
        style={{
          flex: "1",
          minWidth: "300px",
          background: "white",
          padding: "20px",
          borderRadius: "20px",
          boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h2 style={{ color: "#2d5a27", marginTop: 0 }}>
          👥 Selecciona para editar
        </h2>
        <div className="separator"></div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {people.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPerson(p)}
              style={{
                textAlign: "left",
                padding: "10px",
                border:
                  selectedId === p.id ? "2px solid #2d5a27" : "1px solid #eee",
                background: selectedId === p.id ? '#e8f5e9' : 'white',
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: selectedId === p.id ? "bold" : "normal",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <img
                src={p.profileImage || DEFAULT_AVATAR}
                alt=""
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_AVATAR;
                }}
              />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* PANEL DERECHO: FORMULARIO */}
      <div style={{ flex: "2", minWidth: "350px" }}>
        {selectedId ? (
          <div className="business-card" style={{ margin: "0" }}>
            <div
              className="card-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <h2>
                  Editando:{" "}
                  <span style={{ fontSize: "0.8em", color: "#666" }}>
                    {formData.name}
                  </span>
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/${selectedId}`)}
                style={{
                  background: "#007bff",
                  color: "white",
                  border: "none",
                  padding: "8px 15px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Ver Tarjeta
              </button>
            </div>

            <div className="separator"></div>

            <form onSubmit={handleSubmit}>
              {activeFields.map((key) => (
                <div
                  key={key}
                  className="form-group"
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-end",
                  }}
                >
                  <div style={{ flexGrow: 1 }}>
                    <label className="form-label">
                      {fieldLabels[key] || key}
                    </label>
                    {renderInput(key)}
                  </div>
                  {!["name", "title"].includes(key) && (
                    <button
                      type="button"
                      onClick={() => removeField(key)}
                      style={{
                        background: "#ff4d4d",
                        color: "white",
                        border: "none",
                        padding: "0 15px",
                        height: "42px",
                        borderRadius: "10px",
                        cursor: "pointer",
                      }}
                    >
                      X
                    </button>
                  )}
                </div>
              ))}
              <div className="separator"></div>
              <div
                style={{ display: "flex", gap: "10px", marginBottom: "20px" }}
              >
                <select
                  value={selectedField}
                  onChange={(e) => setSelectedField(e.target.value)}
                  className="form-input"
                >
                  <option value="">-- Agregar dato extra --</option>
                  {Object.keys(fieldLabels).map((k) => (
                    <option
                      key={k}
                      value={k}
                      disabled={activeFields.includes(k)}
                    >
                      {fieldLabels[k]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addField}
                  style={{
                    padding: "12px 20px",
                    background: "#2d5a27",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                  }}
                >
                  +
                </button>
              </div>
              <button
                type="submit"
                className="save-contact-btn"
                disabled={isUploading}
              >
                <span className="material-symbols-rounded">update</span>{" "}
                {isUploading ? "Subiendo..." : "Guardar Cambios"}
              </button>
            </form>

            {/* BOTÓN ELIMINAR */}
            <div style={{ marginTop: "40px", borderTop: "1px solid #eee", paddingTop: "20px", textAlign: 'center' }}>
                <button 
                    type="button"
                    onClick={handleDelete}
                    style={{
                        background: "#dc3545", // Rojo
                        color: "white",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "0.9em",
                        width: "100%"
                    }}
                >
                    🗑️ Eliminar a esta persona
                </button>
            </div>

          </div>
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#999",
              fontSize: "1.2em",
              background: "white",
              borderRadius: "20px",
              padding: "50px",
            }}
          >
            ⬅️ Selecciona a alguien de la lista para comenzar a editar
          </div>
        )}
      </div>
    </div>
  );
}

export default PanelEditar;