import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './formAgregar.css'; 
import { API_URL } from '../config';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3E%3Ccircle cx='15' cy='15' r='15' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%23999'%3E?%3C/text%3E%3C/svg%3E";

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

function AddPerson() {
  const navigate = useNavigate();
  
  // Datos del formulario
  const [formData, setFormData] = useState({ name: '', title: '', email: ''});
  const [activeFields, setActiveFields] = useState(['name', 'title', 'email', 'phone', 'whatsapp', 'website', 'address', 'linkedin', 'location', 'profileImage']);
  const [selectedField, setSelectedField] = useState('');
  
  // Estado para la imagen que se va a subir 
  const [fileToUpload, setFileToUpload] = useState(null);
  const [localPreview, setLocalPreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- GENERADOR DE ID ---
  const generateId = (email) => {
    if (!email || !email.includes('@')) return '';
    return email.split('@')[0].toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');
  };

  // --- MANEJO DE SELECCIÓN DE IMAGEN ---
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
        setFileToUpload(file);

        setLocalPreview(URL.createObjectURL(file));
        
       
        if (!activeFields.includes('profileImage')) {
            setActiveFields([...activeFields, 'profileImage']);
        }
    }
  };

  // --- PROCESO DE GUARDADO SEGURO ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    // Generar ID
    const generatedId = generateId(formData.email);
    if (!generatedId) {
        alert("Debes ingresar un correo válido para generar el ID.");
        setIsSaving(false);
        return;
    }

    try {
        // VERIFICAR SI EL ID YA EXISTE 
        const checkRes = await fetch(`${API_URL}/api/registros`);
        const data = await checkRes.json();
        const lista = data.people || data;
        
        const existe = lista.some(p => String(p.id) === String(generatedId));

        if (existe) {
            alert(`Ya existe una persona con ese correo`);
            setIsSaving(false);
            return; 
        }

        // SI NO EXISTE, ENTONCES SUBIMOS LA FOTO
        let finalImageUrl = formData.profileImage || ''; 
        if (fileToUpload) {
            const formDataImg = new FormData();
            formDataImg.append('imagen', fileToUpload);
            formDataImg.append('nombreArchivo', generatedId); 
            const uploadRes = await fetch(`${API_URL}/api/subir-imagen`, {
                method: 'POST',
                body: formDataImg
            });
            const uploadResult = await uploadRes.json();
            
            if (uploadResult.url) {
                finalImageUrl = uploadResult.url;
            } else {
                throw new Error("Error al subir la imagen a Drive");
            }
        }

        // GUARDAR LOS DATOS FINALES EN EL JSON
        const dataToSend = { 
            ...formData, 
            id: generatedId, 
            profileImage: finalImageUrl 
        };

        // Procesar teléfonos 
        ['phone', 'whatsapp'].forEach(field => {
            if (activeFields.includes(field)) {
                const lada = formData[`${field}_lada`] || '';
                const num = formData[`${field}_num`] || '';
                if (num) dataToSend[field] = `${lada} ${num}`.trim();
                delete dataToSend[`${field}_lada`];
                delete dataToSend[`${field}_num`];
            }
        });

        const saveRes = await fetch(`${API_URL}/api/guardar-registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        });

        const saveResult = await saveRes.json();

        if (saveResult.status === 'success') {
            alert(` ¡Registro creado con éxito!`);
            navigate(`/${generatedId}`);
            window.location.reload();
        } else {
            alert('Error al guardar datos: ' + saveResult.message);
        }

    } catch (error) {
        console.error(error);
        alert('Ocurrió un error: ' + error.message);
    } finally {
        setIsSaving(false);
    }
  };

  // --- MANEJADORES DE INPUTS ---
  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const removeField = (fieldName) => {
    setActiveFields(activeFields.filter(f => f !== fieldName));
    const newFormData = { ...formData };
    if (fieldName === 'phone' || fieldName === 'whatsapp') {
        delete newFormData[`${fieldName}_lada`];
        delete newFormData[`${fieldName}_num`];
    } else delete newFormData[fieldName];
    setFormData(newFormData);
    if (fieldName === 'profileImage') {
        setFileToUpload(null);
        setLocalPreview(null);
    }
  };

  const addField = () => {
    if (selectedField && !activeFields.includes(selectedField)) {
      setActiveFields([...activeFields, selectedField]);
      setFormData({...formData, [selectedField]: ''});
    }
    setSelectedField('');
  };

  const renderInput = (key) => {
    if (key === 'profileImage') {
        return (
            <div style={{border: '1px dashed #ccc', padding: 10, borderRadius: 10, background: '#f9f9f9'}}>
                <input type="file" accept="image/*" onChange={handleFileSelect} style={{width:'100%'}} />
                
                {/* Mostramos PREVIEW LOCAL o URL MANUAL */}
                {(localPreview || formData.profileImage) && (
                    <div style={{marginTop: 10, textAlign:'center'}}>
                        <img 
                            src={localPreview || formData.profileImage} 
                            alt="Preview" 
                            style={{height: 80, borderRadius: 5}} 
                            onError={(e)=>{e.target.src=DEFAULT_AVATAR}}
                        />
                        <div style={{fontSize: 10, color: '#666'}}>
                            {localPreview ? "Vista previa" : "URL Manual"}
                        </div>
                    </div>
                )}
            </div>
        );
    }
    if (key === 'phone' || key === 'whatsapp') {
        return (
            <div style={{ display: 'flex', gap: '5px' }}>
                <input type="text" name={`${key}_lada`} placeholder="+52" value={formData[`${key}_lada`] || ''} onChange={handleInputChange} className="form-input" style={{ width: '70px', textAlign: 'center' }} />
                <input type="text" name={`${key}_num`} placeholder="Número" value={formData[`${key}_num`] || ''} onChange={handleInputChange} className="form-input" style={{ flexGrow: 1 }} />
            </div>
        );
    }
    return <input type="text" name={key} value={formData[key] || ''} onChange={handleInputChange} required={['name','title','email'].includes(key)} className="form-input" />;
  };

  return (
    <div className="business-card">
      <div className="card-header">
         <h2> Nuevo Registro</h2>
         <div className="separator"></div>
      </div>
      
      <form onSubmit={handleSubmit}>
        {activeFields.map(key => (
          <div key={key} className="form-group" style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flexGrow: 1 }}>
              <label className="form-label">{fieldLabels[key] || key}</label>
              {renderInput(key)}
            </div>
            {!['name','title','email'].includes(key) && (
              <button type="button" onClick={() => removeField(key)} style={{ background: '#ff4d4d', color: 'white', border: 'none', padding: '0 15px', height: '42px', borderRadius: '10px', cursor: 'pointer' }}>X</button>
            )}
          </div>
        ))}

        <div className="separator"></div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <select value={selectedField} onChange={(e) => setSelectedField(e.target.value)} className="form-input">
            <option value="">-- Agregar dato extra --</option>
            {Object.keys(fieldLabels).map(k => (
              <option key={k} value={k} disabled={activeFields.includes(k)}>{fieldLabels[k]}</option>
            ))}
          </select>
          <button type="button" onClick={addField} style={{ padding: '12px 20px', background: '#2d5a27', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>+</button>
        </div>

        <button type="submit" className="save-contact-btn" disabled={isSaving}>
          <span className="material-symbols-rounded">save</span> 
          {isSaving ? ' Guardando y Subiendo...' : ' Guardar Registro'}
        </button>
      </form>
    </div>
  );
}

export default AddPerson;