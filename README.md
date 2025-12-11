# JASU vCards - Sistema de Tarjetas de Presentación Digitales

Sistema web para generar y compartir tarjetas de presentación digitales con descarga de archivos vCard compatibles con Android 15 y versiones anteriores.

## ✨ Características

- **Tarjetas de presentación digitales** personalizables por contacto
- **Descarga de vCard 2.1** compatible con Android 15+
- **QR Code personalizado** con logo de la empresa
- **Descarga de QR en alta resolución** (1000x1000px) con doble clic/doble tap
- **Botones de contacto** para teléfono, email, WhatsApp, LinkedIn, WeChat, calendario, etc.
- **Diseño responsive** optimizado para móviles y desktop
- **Compartir enlaces** mediante Web Share API

## 📋 Tabla de Contenidos

- [Requisitos del Sistema](#requisitos-del-sistema)
- [Instalación Inicial](#instalación-inicial)
- [Desarrollo](#desarrollo)
- [Producción](#producción)
- [Configuración de Nginx](#configuración-de-nginx)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Modificaciones y Actualizaciones](#modificaciones-y-actualizaciones)
- [Solución de Problemas](#solución-de-problemas)

## 🔧 Requisitos del Sistema

- Node.js 16+ 
- npm 8+
- Nginx (para producción)
- Certificados SSL (Let's Encrypt)

## 🚀 Instalación Inicial

### 1. Clonar y configurar el proyecto

```bash
# Navegar al directorio del proyecto
cd /root/vcards

# Instalar dependencias
npm install
```

### 2. Configurar datos de contactos

Editar el archivo `src/data/people.json` con la información de los contactos:

```json
{
  "people": [
    {
      "id": "usuario_id",
      "name": "Nombre Completo",
      "title": "Cargo/Posición",
      "address": "Dirección completa",
      "profileImage": "URL_de_imagen",
      "phone": "+52 123 456 7890",
      "email": "email@ejemplo.com",
      "website": "https://www.ejemplo.com",
      "whatsapp": "+52 123 456 7890",
      "linkedin": "https://linkedin.com/in/usuario",
      "location": "URL_de_Google_Maps",
      "calendar": "URL_de_calendario"
    }
  ]
}
```

## 💻 Desarrollo

### Iniciar servidor de desarrollo

```bash
# Iniciar servidor de desarrollo en puerto 4200
npm run dev

# El servidor estará disponible en:
# - Local: http://localhost:4200/
# - Red: http://142.93.251.147:4200/
```

### Comandos de desarrollo

```bash
# Linter
npm run lint

# Construir para desarrollo
npm run build

# Previsualizar build de producción
npm run preview
```

### Acceso durante desarrollo

- **Servidor local**: `http://localhost:4200/`
- **Servidor de red**: `http://142.93.251.147:4200/`
- **URLs de ejemplo**: 
  - `http://142.93.251.147:4200/dvazquez`
  - `http://142.93.251.147:4200/lvasquez`
- **Tip**: Haz doble clic (o doble tap) en el QR para descargarlo como PNG 1000×1000 px.

## 🏭 Producción

### 1. Construir para producción

```bash
# Construir archivos optimizados
npm run build

# Los archivos se generan en la carpeta dist/
```

### 2. Desplegar en servidor web (recomendado)

```bash
# Sincronizar con rsync y eliminar archivos obsoletos
rsync -av --delete /root/vcards/dist/ /var/www/vcards/

# Asegurar ownership correcto (una sola vez o si cambia)
chown -R www-data:www-data /var/www/vcards/

# Recargar nginx
systemctl reload nginx

# Verificar que se copiaron correctamente
ls -la /var/www/vcards/
ls -la /var/www/vcards/assets/
```

## 🌐 Configuración de Nginx

### 1. Archivo de configuración

El archivo de configuración se encuentra en: `/etc/nginx/sites-available/vcards.jasu.us`

```nginx
server {
    listen 80;
    server_name vcards.jasu.us;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name vcards.jasu.us;
    
    root /var/www/vcards;
    index index.html;
    
    # Configuración SSL
    ssl_certificate     /etc/letsencrypt/live/vcards.jasu.us/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vcards.jasu.us/privkey.pem;
    
    # Configuración de archivos estáticos
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache para assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 2. Comandos de nginx

```bash
# Recargar configuración
systemctl reload nginx

# Reiniciar nginx
systemctl restart nginx

# Verificar configuración
nginx -t

# Ver estado
systemctl status nginx
```

### 3. Configuración de CORS para assets.jasu.us

Para que el logo del QR se descargue correctamente, es necesario configurar CORS en el servidor de assets. El archivo de configuración se encuentra en: `/etc/nginx/sites-available/assets.jasu.us`

```nginx
server {
    server_name assets.jasu.us;

    root /var/www/assets.jasu.us;
    index index.html;

    # Headers CORS para permitir acceso desde vcards.jasu.us
    location / {
        # Manejar preflight OPTIONS
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' 'https://vcards.jasu.us';
            add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Content-Type';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        # Headers CORS para requests normales
        add_header 'Access-Control-Allow-Origin' 'https://vcards.jasu.us' always;
        add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type' always;

        try_files $uri $uri/ =404;
    }

    # Configuración específica para logos (opcional, más restrictiva)
    location /logos/ {
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' 'https://vcards.jasu.us';
            add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Content-Type';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        add_header 'Access-Control-Allow-Origin' 'https://vcards.jasu.us' always;
        add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type' always;

        try_files $uri =404;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/assets.jasu.us/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/assets.jasu.us/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = assets.jasu.us) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name assets.jasu.us;
    return 404; # managed by Certbot
}
```

**Aplicar cambios:**
```bash
# Editar el archivo de configuración
sudo nano /etc/nginx/sites-available/assets.jasu.us

# Verificar que la configuración sea válida
sudo nginx -t

# Recargar nginx
sudo systemctl reload nginx
```

## 📁 Estructura del Proyecto

```
/root/vcards/
├── src/
│   ├── components/          # Componentes React
│   │   ├── BusinessCard.jsx # Componente principal
│   │   ├── ContactButtons.jsx
│   │   ├── Header.jsx
│   │   ├── ProfileSection.jsx
│   │   └── QRCode.jsx
│   ├── data/
│   │   └── people.json      # Datos de contactos
│   ├── utils/
│   │   └── vcard.js         # Generador de vCard
│   ├── App.jsx
│   └── main.jsx
├── dist/                    # Archivos de producción
├── public/
├── package.json
└── vite.config.js
```

## 🔄 Modificaciones y Actualizaciones

#### 1. Desarrollo
```bash
# Los cambios se reflejan automáticamente en:
# http://142.93.251.147:4200/
```

#### 2. Producción
```bash
# 1. Construir nueva versión
npm run build

# 2. Sincronizar al servidor web (elimina lo obsoleto)
rsync -av --delete /root/vcards/dist/ /var/www/vcards/

# 3. Recargar nginx
systemctl reload nginx

# 4. Verificar cambios
curl -I https://vcards.jasu.us/
ls -la /var/www/vcards/assets/
```

### 3. Script rápido `re-build.sh`

El script automatiza todo el flujo (dry-run por defecto):

```bash
# Vista previa (no aplica cambios)
./re-build.sh

# Aplicar cambios (rsync --delete + reload nginx)
./re-build.sh --apply

# Opción útiles:
#   --skip-install      fuerza omitir npm ci
#   --skip-build        reutiliza el build existente
#   --log deploy.log    guarda la salida
#   --force             obliga npm ci aunque no cambie package-lock
#
# El script detecta si package-lock.json cambió desde el último deploy
# y solo ejecuta npm ci cuando es necesario.
```

### Modificar datos de contactos:

```bash
# Editar archivo de datos
nano /root/vcards/src/data/people.json

# Para desarrollo: los cambios se reflejan automáticamente
# Para producción: seguir pasos de actualización arriba
```

### Modificar generación de vCard:

```bash
# Editar generador de vCard
nano /root/vcards/src/utils/vcard.js

# Para desarrollo: los cambios se reflejan automáticamente
# Para producción: seguir pasos de actualización arriba
```

## 🐛 Solución de Problemas

### Problema: vCard se genera en versión 4.0 en lugar de 2.1

**Síntomas**: El archivo descargado tiene `VERSION:4.0`

**Solución**:
```bash
# 1. Limpiar caché completamente
rm -rf /root/vcards/dist
rm -rf /root/vcards/node_modules/.vite

# 2. Reconstruir
npm run build

# 3. Actualizar producción (sincronizar y recargar)
rsync -av --delete /root/vcards/dist/ /var/www/vcards/
systemctl reload nginx

# 4. Limpiar caché del navegador (Ctrl + Shift + R)
```

### Problema: Cambios no se reflejan en producción

**Solución**:
```bash
# Verificar que los archivos se copiaron
ls -la /var/www/vcards/assets/

# Verificar que index.html apunta al archivo correcto
cat /var/www/vcards/index.html | grep "index-.*\.js"

# Recargar nginx
systemctl reload nginx
```

### Problema: Error 404 en assets

**Solución**:
```bash
# Verificar permisos
chown -R www-data:www-data /var/www/vcards/
chmod -R 755 /var/www/vcards/

# Verificar configuración de nginx
nginx -t
systemctl reload nginx
```

### Problema: Logo no aparece en QR descargado

**Síntomas**: El QR se descarga sin el logo en el centro

**Causa**: Problema de CORS al cargar el logo desde `assets.jasu.us`

**Solución**:
1. Verificar que la configuración de CORS esté aplicada en `assets.jasu.us` (ver sección [Configuración de CORS](#3-configuración-de-cors-para-assetsjasuus))
2. Verificar headers CORS:
```bash
curl -I -H "Origin: https://vcards.jasu.us" https://assets.jasu.us/logos/jasu-sheet.png
```
3. Deberías ver el header `Access-Control-Allow-Origin: https://vcards.jasu.us`
4. Recargar nginx después de aplicar cambios:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Funcionalidad: Descarga de QR en alta resolución

**Cómo usar**:
- **Desktop**: Doble clic en el QR Code
- **Móvil**: Doble tap en el QR Code

**Características**:
- Descarga automática en formato PNG
- Resolución: 1000x1000 píxeles
- Nombre del archivo: `{id}-qr.png` (ej: `lvasquez-qr.png`)
- Incluye el logo de la empresa en el centro (si CORS está configurado correctamente)

### Problema: Servidor de desarrollo no inicia

**Solución**:
```bash
# Matar procesos existentes
pkill -f "vite"

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Iniciar servidor
npm run dev
```

## 📝 Comandos de Mantenimiento

### Backup de configuración

```bash
# Backup de configuración de nginx
cp /etc/nginx/sites-available/vcards.jasu.us /etc/nginx/sites-available/vcards.jasu.us.backup

# Backup de datos
cp /root/vcards/src/data/people.json /root/vcards/src/data/people.json.backup
```

### Logs y monitoreo

```bash
# Logs de nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Logs del servidor de desarrollo
# (se muestran en la terminal donde se ejecuta npm run dev)
```

### Actualización de dependencias

```bash
# Verificar dependencias desactualizadas
npm outdated

# Actualizar dependencias
npm update

# Reconstruir y desplegar
npm run build
rsync -av --delete /root/vcards/dist/ /var/www/vcards/
systemctl reload nginx
```

## 🔗 URLs del Sistema

- **Desarrollo**: `http://142.93.251.147:4200/`
- **Producción**: `https://vcards.jasu.us/`
- **Ejemplos**:
  - `https://vcards.jasu.us/dvazquez`
  - `https://vcards.jasu.us/lvasquez`
  - `https://vcards.jasu.us/gfernandez`

