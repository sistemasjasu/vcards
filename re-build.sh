#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="/root/vcards"
BUILD_DIR="$PROJECT_DIR/dist"
TARGET_DIR="/var/www/vcards"
LOCKFILE="$PROJECT_DIR/package-lock.json"
DEPLOY_META_DIR="$TARGET_DIR/.deploy-meta"
LOCK_HASH_FILE="$DEPLOY_META_DIR/package-lock.sha256"

COLOR_RED="\033[0;31m"
COLOR_GREEN="\033[0;32m"
COLOR_YELLOW="\033[0;33m"
COLOR_RESET="\033[0m"

usage() {
  cat <<EOF
Uso: $(basename "$0") [opciones]

Reconstruye el proyecto y despliega de forma segura al directorio $TARGET_DIR.

Opciones:
  --apply           Ejecuta el rsync real (por defecto solo dry-run)
  --no-backup       No crear backup del destino antes de aplicar cambios
  --skip-install    Omite npm ci (usa dependencias existentes)
  --skip-build      Omite npm run build (usa build existente)
  --log <archivo>   Guarda la salida en un archivo (además de la terminal)
  --force           Continúa en pasos no críticos aunque haya warnings
  -h, --help        Muestra esta ayuda

Ejemplos:
  Dry-run solamente:
    $(basename "$0")

  Aplicar cambios con backup automático:
    $(basename "$0") --apply

  Aplicar sin backup (bajo tu propio riesgo):
    $(basename "$0") --apply --no-backup
EOF
}

APPLY=false
DO_BACKUP=true
SKIP_INSTALL=false
SKIP_BUILD=false
FORCE=false
LOG_FILE=""

DID_INSTALL=false
DID_BUILD=false
DID_SYNC=false
DID_RELOAD=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply) APPLY=true; shift ;;
    --no-backup) DO_BACKUP=false; shift ;;
    --skip-install) SKIP_INSTALL=true; shift ;;
    --skip-build) SKIP_BUILD=true; shift ;;
    --force) FORCE=true; shift ;;
    --log)
      LOG_FILE="${2:-}"
      if [[ -z "$LOG_FILE" ]]; then
        echo -e "${COLOR_RED}--log requiere un archivo${COLOR_RESET}"
        exit 1
      fi
      shift 2
      ;;
    -h|--help) usage; exit 0 ;;
    *) echo -e "${COLOR_RED}Opción desconocida:${COLOR_RESET} $1"; usage; exit 1 ;;
  esac
done

if [[ -n "$LOG_FILE" ]]; then
  mkdir -p "$(dirname "$LOG_FILE")"
  touch "$LOG_FILE"
  echo -e "${COLOR_YELLOW}==> Registrando salida en $LOG_FILE${COLOR_RESET}"
  exec > >(tee -a "$LOG_FILE")
  exec 2>&1
fi

echo -e "${COLOR_YELLOW}==> Validando prerrequisitos...${COLOR_RESET}"
command -v rsync >/dev/null 2>&1 || { echo -e "${COLOR_RED}Falta rsync${COLOR_RESET}"; exit 1; }
command -v nginx >/dev/null 2>&1 || { echo -e "${COLOR_RED}Falta nginx en PATH${COLOR_RESET}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${COLOR_RED}Falta npm en PATH${COLOR_RESET}"; exit 1; }
command -v sha256sum >/dev/null 2>&1 || { echo -e "${COLOR_RED}Falta sha256sum${COLOR_RESET}"; exit 1; }

[[ -d "$PROJECT_DIR" ]] || { echo -e "${COLOR_RED}No existe $PROJECT_DIR${COLOR_RESET}"; exit 1; }
[[ -d "$TARGET_DIR" ]] || { echo -e "${COLOR_RED}No existe $TARGET_DIR${COLOR_RESET}"; exit 1; }

cd "$PROJECT_DIR"

# Determinar si debemos ejecutar npm ci
SHOULD_INSTALL=true
LOCK_HASH_CURRENT=""
if [[ -f "$LOCKFILE" ]]; then
  LOCK_HASH_CURRENT=$(sha256sum "$LOCKFILE" | awk '{print $1}')
else
  echo -e "${COLOR_YELLOW}Advertencia:${COLOR_RESET} No se encontró package-lock.json; se ejecutará npm ci."
fi

if $SKIP_INSTALL; then
  SHOULD_INSTALL=false
  echo -e "${COLOR_YELLOW}==> Saltando instalación de dependencias (flag --skip-install)${COLOR_RESET}"
elif [[ -n "$LOCK_HASH_CURRENT" && -f "$LOCK_HASH_FILE" ]]; then
  LAST_HASH=$(cat "$LOCK_HASH_FILE")
  if [[ "$LAST_HASH" == "$LOCK_HASH_CURRENT" && $FORCE == false ]]; then
    SHOULD_INSTALL=false
    echo -e "${COLOR_YELLOW}==> package-lock.json sin cambios; omitiendo npm ci (usa --force para forzar)${COLOR_RESET}"
  elif [[ "$LAST_HASH" == "$LOCK_HASH_CURRENT" && $FORCE == true ]]; then
    echo -e "${COLOR_YELLOW}==> --force detectado; ejecutando npm ci aunque no haya cambios${COLOR_RESET}"
  fi
fi

if $SHOULD_INSTALL; then
  echo -e "${COLOR_YELLOW}==> Instalando dependencias (npm ci)...${COLOR_RESET}"
  npm ci && DID_INSTALL=true
fi

if ! $SKIP_BUILD; then
  echo -e "${COLOR_YELLOW}==> Construyendo proyecto (npm run build)...${COLOR_RESET}"
  npm run build && DID_BUILD=true
else
  echo -e "${COLOR_YELLOW}==> Saltando build${COLOR_RESET}"
fi

[[ -d "$BUILD_DIR" ]] || { echo -e "${COLOR_RED}No se encontró $BUILD_DIR. Asegúrate de que el build haya terminado correctamente.${COLOR_RESET}"; exit 1; }

echo -e "${COLOR_YELLOW}==> Validando configuración de Nginx...${COLOR_RESET}"
if ! nginx -t; then
  echo -e "${COLOR_RED}Configuración de Nginx inválida. Corrige antes de continuar.${COLOR_RESET}"
  $FORCE || exit 1
fi

echo -e "${COLOR_YELLOW}==> Vista previa (dry-run) de cambios con rsync --delete...${COLOR_RESET}"
rsync -avun --delete "$BUILD_DIR/" "$TARGET_DIR/"

if ! $APPLY; then
  echo -e "${COLOR_YELLOW}==> Resumen${COLOR_RESET}"
  echo "  npm ci: $([[ $DID_INSTALL == true ]] && echo ejecutado || echo omitido)"
  echo "  build:  $([[ $DID_BUILD == true ]] && echo ejecutado || echo omitido)"
  echo "  rsync:  pendiente (dry-run)"
  echo "  nginx:  pendiente (dry-run)"
  echo -e "${COLOR_GREEN}Dry-run completado.${COLOR_RESET} Añade --apply para aplicar los cambios."
  exit 0
fi

if $DO_BACKUP; then
  echo -e "${COLOR_YELLOW}==> Creando backup de $TARGET_DIR ...${COLOR_RESET}"
  BACKUP_FILE="/var/www/vcards-backup-$(date +%F-%H%M%S).tgz"
  tar -C "/var/www" -czf "$BACKUP_FILE" "$(basename "$TARGET_DIR")"
  echo -e "${COLOR_GREEN}Backup creado:${COLOR_RESET} $BACKUP_FILE"
else
  echo -e "${COLOR_YELLOW}==> Backup deshabilitado por --no-backup${COLOR_RESET}"
fi

echo -e "${COLOR_YELLOW}==> Aplicando cambios con rsync --delete...${COLOR_RESET}"
rsync -av --delete "$BUILD_DIR/" "$TARGET_DIR/"
DID_SYNC=true

echo -e "${COLOR_YELLOW}==> Ajustando ownership (si es necesario)...${COLOR_RESET}"
if id -u www-data >/dev/null 2>&1; then
  chown -R www-data:www-data "$TARGET_DIR"
else
  echo -e "${COLOR_YELLOW}Usuario www-data no existe, saltando chown${COLOR_RESET}"
fi

echo -e "${COLOR_YELLOW}==> Recargando Nginx...${COLOR_RESET}"
nginx -t && systemctl reload nginx
DID_RELOAD=true

if [[ -n "$LOCK_HASH_CURRENT" ]]; then
  mkdir -p "$DEPLOY_META_DIR"
  echo "$LOCK_HASH_CURRENT" > "$LOCK_HASH_FILE"
fi

echo -e "${COLOR_YELLOW}==> Resumen${COLOR_RESET}"
echo "  npm ci: $([[ $DID_INSTALL == true ]] && echo ejecutado || echo omitido)"
echo "  build:  $([[ $DID_BUILD == true ]] && echo ejecutado || echo omitido)"
echo "  rsync:  $([[ $DID_SYNC == true ]] && echo ejecutado || echo omitido)"
echo "  nginx:  $([[ $DID_RELOAD == true ]] && echo recargado || echo omitido)"

echo -e "${COLOR_GREEN}Despliegue completado con éxito.${COLOR_RESET}"