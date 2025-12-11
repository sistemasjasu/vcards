# Learning - Aprende a crear y publicar vCards (explicado fácil)

Hola. Imagina que este proyecto es un álbum de figuritas. Cada figurita es una tarjeta de una persona (vCard). Vamos a aprender a:
- Encender el juego (iniciar el proyecto)
- Editar figuritas (cambiar datos)
- Ver cómo quedan (modo desarrollo)
- Guardarlas bonitas (build de producción)
- Pegarlas en el mural de la escuela (publicar en el servidor)

Si algo no entiendes, no te preocupes: lee despacio y copia los pasos.

---

## 1) ¿Qué es este proyecto?

Es una página web que muestra tarjetas con datos de personas: nombre, foto, teléfono, etc. Está hecha con React y Vite (herramientas para construir sitios modernos).

Las tarjetas se leen desde un archivo: `src/data/people.json`.

---

## 2) Lo que necesitas (requisitos)

- Una computadora con Linux (aquí usamos un servidor).
- Node.js 16 o más y npm (ya instalados en este proyecto).
- Nginx para publicar la página (ya configurado aquí).

Puedes revisar versiones con:

```bash
node -v
npm -v
```

---

## 3) Estructura importante

```
/root/vcards/
├── src/                 # Código fuente
│  ├── components/       # Piezas de la interfaz (React)
│  ├── data/people.json  # Datos de las personas
│  └── App.jsx           # Página principal
├── public/              # Archivos públicos
├── dist/                # Versión lista para publicar (se crea con build)
├── package.json         # Comandos y dependencias
└── vite.config.js       # Configuración de Vite
```

---

## 4) Cómo arrancar en MODO PRÁCTICA (desarrollo)

Esto es como jugar sin guardar todavía. Verás los cambios al instante.

```bash
cd /root/vcards
npm install     # instala herramientas (solo la primera vez o si cambias dependencias)
npm run dev     # inicia el sitio en modo desarrollo
```

Ahora abre en el navegador:
- Local: `http://localhost:4200/`
- Red: `http://142.93.251.147:4200/`

Para parar el servidor, presiona Ctrl + C en la terminal.

---

## 5) Cambiar los datos de una persona (editar figuritas)

1. Abre el archivo `src/data/people.json`.
2. Verás algo así:

```json
{
  "people": [
    {
      "id": "mtinajero",
      "name": "Manuel Tinajero",
      "title": "Commercial Manager",
      "address": "...",
      "profileImage": "https://.../Manuel.png",
      "phone": "+52 ...",
      "email": "...@jasu.us",
      "website": "https://www.jasu.us",
      "whatsapp": "+52 ...",
      "linkedin": "https://...",
      "location": "https://maps.google..."
    }
  ]
}
```

3. Cambia los valores entre comillas. No borres comas ni llaves. Si te equivocas en la coma o en una comilla, dará error.
4. Guarda el archivo. En modo desarrollo, el sitio se actualiza solo.

Consejo: El campo `id` es la parte que va en la URL. Si `id` es "mtinajero", la página es `https://vcards.jasu.us/mtinajero`.

---

## 6) Agregar una nueva persona

1. Dentro del arreglo `people`, agrega otro bloque con los mismos campos. Ejemplo:

```json
{
  "id": "jdoe",
  "name": "Juan Doe",
  "title": "Sales",
  "address": "Dirección...",
  "profileImage": "https://assets.jasu.us/profile_images/Juan.png",
  "phone": "+52 555 555 5555",
  "email": "jdoe@jasu.us",
  "website": "https://www.jasu.us",
  "whatsapp": "+52 555 555 5555",
  "linkedin": "https://linkedin.com/in/juan",
  "location": "https://maps.google.com/..."
}
```

2. Asegúrate de que cada bloque (cada persona) esté separado por comas y que todo quede dentro de `"people": [ ... ]`.
3. Guarda y visita `http://localhost:4200/jdoe` (o la IP en red).

---

## 7) Construir para PRODUCCIÓN (guardarlo bonito)

Cuando ya te gustó cómo se ve, crea la versión lista para publicar:

```bash
cd /root/vcards
npm run build
```

Esto crea la carpeta `dist/` con archivos optimizados.

---

## 8) Publicar en el servidor (pegarlo en el mural)

Sincroniza lo de `dist/` hacia la carpeta que Nginx sirve al mundo (`/var/www/vcards/`):

```bash
rsync -av --delete /root/vcards/dist/ /var/www/vcards/
systemctl reload nginx
```

Listo. Abre `https://vcards.jasu.us/` y las URLs de cada persona.

Importante: No borres manualmente archivos de `/var/www/vcards/assets/`. El `rsync --delete` se encarga de limpiar lo viejo y dejar lo nuevo.

---

## 9) Errores comunes y cómo arreglarlos

- "No se ve nada / pantalla en blanco":
  - Revisa la consola del navegador (F12 → Console) por errores.
  - Asegúrate de no haber roto el JSON (faltan comas o comillas).
  - Vuelve a construir y publicar.

- "Cambios no se ven en producción":
  - Ejecuta de nuevo:
    ```bash
    npm run build
    rsync -av --delete /root/vcards/dist/ /var/www/vcards/
    systemctl reload nginx
    ```
  - Fuerza recarga en el navegador (Ctrl + F5).

- "Imagen no carga":
  - Verifica que la URL de `profileImage` exista y sea pública.

---

## 10) Palabras nuevas (mini diccionario)

- React: herramienta para construir interfaces.
- Vite: herramienta que ayuda a arrancar rápido y construir versiones optimizadas.
- Build: crear la versión final, optimizada, para subir al servidor.
- Nginx: el programa que muestra tus archivos al mundo (el servidor web).
- JSON: formato de texto para guardar datos con llaves, comillas y comas.

---

## 11) Comandos que usarás mucho

```bash
# Arrancar en desarrollo
npm run dev

# Revisar errores de código
npm run lint

# Construir para producción
npm run build

# Publicar (copiar al servidor web) y recargar nginx
rsync -av --delete /root/vcards/dist/ /var/www/vcards/
systemctl reload nginx
```

---

## 12) ¿Qué hacer si me atoro?

1) Revisa que el JSON esté bien (comas y comillas).  
2) Mira la consola del navegador (F12).  
3) Vuelve a correr: `npm run build` y luego publica con `rsync`.  
4) Pregunta: escribe qué cambiaste y qué error viste.

¡Listo! Ya sabes jugar, editar figuritas y pegarlas en el mural. 😉

---

## 13) Aprende a programar este proyecto (desde cero)

Vamos a ver cómo está hecho por dentro. No necesitas saber nada, solo lee y prueba.

### 13.1 ¿Qué es React y JSX?

- React te deja construir pantallas con piezas llamadas "componentes".
- JSX es escribir HTML dentro de JavaScript. Ejemplo de un componente simple:

```jsx
function Hola() {
  return <h1>Hola mundo</h1>;
}
```

Para usarlo en pantalla:

```jsx
export default function App() {
  return (
    <div>
      <Hola />
    </div>
  );
}
```

### 13.2 Props: pasar datos a un componente

Las "props" son como una nota que le mandas a un componente.

```jsx
function Saludo({ nombre }) {
  return <p>Hola, {nombre}</p>;
}

export default function App() {
  return <Saludo nombre="Manuel" />;
}
```

### 13.3 Estado (state): guardar un valor que cambia

```jsx
import { useState } from 'react';

export default function Contador() {
  const [cuenta, setCuenta] = useState(0);
  return (
    <div>
      <p>Cuenta: {cuenta}</p>
      <button onClick={() => setCuenta(cuenta + 1)}>Sumar</button>
    </div>
  );
}
```

### 13.4 Eventos: qué pasa cuando haces clic

```jsx
function Boton() {
  const handleClick = () => alert('¡Hiciste clic!');
  return <button onClick={handleClick}>Haz clic</button>;
}
```

### 13.5 Rutas con `react-router-dom`

Este proyecto usa rutas como `/dvazquez` o `/mtinajero`. En `src/App.jsx` se crea una ruta por cada persona del JSON:

```jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BusinessCard from './components/BusinessCard';
import peopleData from './data/people.json';

export default function App() {
  const people = peopleData.people;
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dvazquez" replace />} />
        {people.map(person => (
          <Route key={person.id} path={`/${person.id}`} element={<BusinessCard person={person} />} />
        ))}
      </Routes>
    </Router>
  );
}
```

Idea clave: si agregas una persona con `id: "jdoe"`, automáticamente habrá una ruta `/jdoe` que muestra su tarjeta.

### 13.6 Crear un botón nuevo en la tarjeta

Abre `src/components/BusinessCard.jsx`. Ahí ya hay un botón para "Save contact". Puedes agregar otro, por ejemplo un botón que diga "Saludar":

```jsx
function BusinessCard({ person }) {
  const handleSaludo = () => alert(`Hola, ${person.name}`);
  return (
    <div>
      {/* ...otros elementos... */}
      <button onClick={handleSaludo}>Saludar</button>
    </div>
  );
}
```

Puntos importantes de un botón:
- Se crea con `<button>Texto</button>`.
- El evento de clic se maneja con `onClick={() => ...}` o pasando una función como `onClick={handleSaludo}`.

### 13.7 Generar y descargar vCard (contacto)

En `src/utils/vcard.js` hay funciones para crear el texto de una vCard versión 2.1 (compatible con Android 15 y anteriores). En `BusinessCard.jsx` se usa así:

```jsx
import { generateVCard } from '../utils/vcard';

function handleSaveContact(person) {
  const vcard = generateVCard(person);
  const blob = new Blob([vcard], { type: 'text/vcard' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${person.name.replace(/\s+/g, '_')}.vcf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
```

Qué hace `generateVCard(person)`:
- Construye líneas de texto con los campos (nombre, teléfono, email, dirección, etc.).
- Devuelve un string listo para guardar como `.vcf`.

### 13.8 Crear un QR con `qrcode-generator`

El componente `src/components/QRCode.jsx` usa la librería `qrcode-generator` para crear una imagen SVG de un QR a partir de una URL.

Pasos dentro del componente:
1) Crea el objeto QR y le agrega la URL:

```jsx
const qr = QRCodeLib(0, 'M');
qr.addData(url);
qr.make();
```

2) Crea un `<svg>` y dibuja módulos (cuadritos) y los "finders" (los 3 ojos de los QRs), con colores y esquinas redondeadas.
3) Inserta opcionalmente un logo al centro.
4) Mete el SVG dentro del `ref` para que se vea en pantalla.

Cómo usarlo en la tarjeta:

```jsx
<QRCode url={currentUrl} />
```

Donde `currentUrl` es la URL de la tarjeta que se está viendo.

### 13.9 Librerías usadas y para qué sirven

- `react` y `react-dom`: construir interfaces con componentes.
- `react-router-dom`: crear rutas/URLs y mostrar componentes distintos según la URL.
- `qrcode-generator`: generar el código QR como SVG.
- `vite`: herramienta para el servidor de desarrollo y para construir (build) rápido y optimizado.
- `eslint` y plugins: revisar errores comunes de código.

### 13.10 Crear tu propio componente desde cero

1) Crea un archivo, por ejemplo `src/components/MiBoton.jsx`:

```jsx
export default function MiBoton({ texto, onClick }) {
  return <button onClick={onClick}>{texto}</button>;
}
```

2) Úsalo en `BusinessCard.jsx`:

```jsx
import MiBoton from './MiBoton';

function BusinessCard({ person }) {
  return (
    <div>
      <MiBoton texto="Decir hola" onClick={() => alert('Hola!')} />
    </div>
  );
}
```

### 13.11 Buenas prácticas fáciles

- Mantén los datos en `people.json` bien formados (comas, comillas, llaves).
- Componentes pequeños y claros.
- Nombres de funciones y variables que expliquen su intención (`handleSaveContact`, `currentUrl`).
- Evita lógica muy larga dentro del `return`; crea funciones arriba y llámalas.

### 13.12 ¿Cómo empiezo si no sé nada?

1) Abre `src/data/people.json` y cambia tu nombre.  
2) Inicia `npm run dev` y mira el cambio.  
3) Agrega un botón en `BusinessCard.jsx`.  
4) Cambia el texto del QR debajo.  
5) Cuando te guste, haz `npm run build` y publica con `rsync`.

---

## 14) Ejercicios prácticos (paso a paso)

Hazlos en orden. Si algo falla, vuelve un paso atrás.

### 14.1 Agrega una persona nueva

1) Edita `src/data/people.json` y agrega un objeto dentro de `people`:

```json
{
  "id": "jdoe",
  "name": "Juan Doe",
  "title": "Sales",
  "address": "CDMX",
  "profileImage": "https://assets.jasu.us/profile_images/Juan.png",
  "phone": "+52 555 555 5555",
  "email": "jdoe@jasu.us",
  "website": "https://www.jasu.us",
  "whatsapp": "+52 555 555 5555",
  "linkedin": "https://linkedin.com/in/juan",
  "location": "https://maps.google.com/..."
}
```

2) Guarda y visita `http://localhost:4200/jdoe`.

### 14.2 Crea un botón que abra WhatsApp

En `src/components/ContactButtons.jsx` (o dentro de `BusinessCard.jsx` si prefieres), agrega:

```jsx
function abrirWhatsApp(numero) {
  const noEspacios = String(numero).replace(/\s+/g, '');
  window.open(`https://wa.me/${noEspacios.replace(/\D/g,'')}`, '_blank');
}

// Dentro del JSX
<button onClick={() => abrirWhatsApp(person.whatsapp)}>WhatsApp</button>
```

Prueba el botón en tu tarjeta.

### 14.3 Cambia colores del QR

Abre `src/components/QRCode.jsx` y modifica las constantes de color:

```jsx
const DARK = "#000000";  // módulos
const LIGHT = "#00AAFF"; // marco
const BG = "#FFFFFF";    // fondo
```

Guarda y mira el nuevo estilo del QR.

### 14.4 Agrega un botón de compartir

En `src/components/BusinessCard.jsx`, reutiliza `navigator.share` si está disponible:

```jsx
async function handleShare(url, person) {
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${person.name} - ${person.title}`,
        text: `Conoce a ${person.name}`,
        url,
      });
    } catch {}
  } else {
    await navigator.clipboard.writeText(url);
    alert('Enlace copiado');
  }
}

// En el JSX
<button onClick={() => handleShare(currentUrl, person)}>Compartir</button>
```

### 14.5 Valida el teléfono antes de generar vCard

En `src/utils/vcard.js`, ajusta `formatPhone` para forzar `+`:

```js
function formatPhone(phone = "") {
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("+") ? digits : `+${digits}`;
}
```

Reconstruye y prueba descargar el contacto.

### 14.6 Cambia la ruta por defecto

En `src/App.jsx`, la ruta `/` redirige a una persona por defecto. Cámbiala:

```jsx
<Route path="/" element={<Navigate to="/mtinajero" replace />} />
```

### 14.7 Ajusta estilos del botón principal

En `src/components/BusinessCard.css`, busca la clase del botón (por ejemplo `.save-contact-btn`) y cambia padding, color o borde. Ejemplo:

```css
.save-contact-btn {
  background: #1F5D39;
  color: #fff;
  padding: 12px 16px;
  border-radius: 12px;
}
```

Guarda y verifica el nuevo estilo.



