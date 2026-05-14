import express from "express";
import cors from "cors";
import fs from "fs";
import multer from "multer";
import { google } from "googleapis";
import { Readable } from "stream";

const app = express();
// process.env.PORT es la variable que usan los servidores reales
const PORT = process.env.PORT || 3000;
const DB_FILE = "./src/data/people.json";

// --- CONFIGURACIÓN GOOGLE DRIVE ---
const KEY_FILE_PATH = "./google-credentials.json";
const SCOPES = ["https://www.googleapis.com/auth/drive"];

// ID DE TU CARPETA EN SHARED DRIVE
const CARPETA_DRIVE_ID = "1BMDiI3GvyQwxIMnDAXL0oTRioXoPTXAg";

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE_PATH,
  scopes: SCOPES,
});

const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());


// ==========================================
// RUTA 1: SUBIR IMAGEN (CORREGIDO - SOPORTE TODOS LOS FORMATOS)
// ==========================================
app.post('/api/subir-imagen', upload.single('imagen'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send('No se subió archivo.');

        const nombreBase = req.body.nombreArchivo || 'sin-id';
        const driveService = google.drive({ version: 'v3', auth });
        
        // Datos del nuevo archivo (Bytes y Tipo)
        const media = {
            mimeType: req.file.mimetype,
            body: Readable.from(req.file.buffer),
        };

        // 1. BUSCAR SI YA EXISTE
        const busqueda = await driveService.files.list({
            q: `name = '${nombreBase}' and '${CARPETA_DRIVE_ID}' in parents and trashed = false`,
            fields: 'files(id, name)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        let archivoId;

        if (busqueda.data.files.length > 0) {
            // A) ACTUALIZAR (UPDATE)
            
            archivoId = busqueda.data.files[0].id;

            await driveService.files.update({
                fileId: archivoId,
                // ¡AQUÍ ESTÁ EL ARREGLO! Actualizamos también el tipo de archivo (etiqueta)
                resource: {
                    mimeType: req.file.mimetype
                },
                media: media,
                supportsAllDrives: true,
            });

        } else {
            // B) CREAR (CREATE)
            console.log(`Creando archivo nuevo: ${nombreBase} (${req.file.mimetype})`);
            const fileMetadata = {
                name: nombreBase,
                parents: [CARPETA_DRIVE_ID],
                // Guardamos el tipo correcto desde el inicio
                mimeType: req.file.mimetype 
            };

            const archivoNuevo = await driveService.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id',
                supportsAllDrives: true,
            });
            archivoId = archivoNuevo.data.id;
            
            await driveService.permissions.create({
                fileId: archivoId,
                requestBody: { role: 'reader', type: 'anyone' },
                supportsAllDrives: true,
            });
        }

        // Link LH3 (Rápido y Seguro)
        const directLink = `https://lh3.googleusercontent.com/d/${archivoId}`;

       
        res.json({ url: directLink });

    } catch (error) {
        console.error('Error Drive:', error);
        res.status(500).json({ error: error.message });
    }
});


// ==========================================
// RUTA 2: LEER (GET)
// ==========================================
app.get("/api/registros", (req, res) => {
  res.set("Cache-Control", "no-store");
  if (fs.existsSync(DB_FILE)) {
    try {
      res.json(JSON.parse(fs.readFileSync(DB_FILE, "utf-8")));
    } catch (e) {
      res.json({ people: [] });
    }
  } else res.json({ people: [] });
});

// ==========================================
// RUTA 3: GUARDAR (POST)
// ==========================================
app.post("/api/guardar-registro", (req, res) => {
  const nuevo = req.body;
  let db = { people: [] };
  if (fs.existsSync(DB_FILE))
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    } catch (e) {}
  if (!db.people) db.people = [];
  db.people.push(nuevo);
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  res.json({ status: "success" });
});

// ==========================================
// RUTA 4: ACTUALIZAR (PUT)
// ==========================================
app.put("/api/actualizar-registro/:id", (req, res) => {
  const id = req.params.id;
  const datos = req.body;
  let db = { people: [] };
  if (fs.existsSync(DB_FILE))
    db = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  const idx = db.people.findIndex((p) => p.id === id);
  if (idx !== -1) {
    db.people[idx] = { ...datos, id: id };
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    res.json({ status: "success" });
  } else res.status(404).json({ status: "error" });
});





// ... (Tus otras rutas arriba)

// ==========================================
// RUTA 5: ELIMINAR (DELETE) - ¡NUEVA!
// ==========================================
app.delete('/api/eliminar-registro/:id', (req, res) => {
    const id = req.params.id;
    let db = { people: [] };
    
    if (fs.existsSync(DB_FILE)) {
        try {
            db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        } catch (e) {
            return res.status(500).json({ error: 'Error leyendo base de datos' });
        }
    }

    const initialLength = db.people.length;
    // Filtramos para dejar solo a los que NO sean el ID que queremos borrar
    db.people = db.people.filter(p => p.id !== id);

    if (db.people.length < initialLength) {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
        res.json({ status: 'success' });
    } else {
        res.status(404).json({ status: 'error', message: 'No se encontró el registro' });
    }
});

// ... tus rutas de API arriba ...

// 1. Decirle a Express que use la carpeta 'dist' (donde está el React construido)
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'dist')));



// Usamos /.*/ sin comillas. Esto significa "Coincide con todo" en lenguaje máquina.
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// app.listen(...)
// app.listen(...)
app.listen(PORT, () => console.log(`Servidor listo ${PORT}`));