// vcard-universal-compatible.js - Compatible con Android 15 y versiones anteriores
function esc(v = "") {
  return String(v)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/:/g, "\\:");
}

// Formato de teléfono universal
function formatPhone(phone = "") {
  const cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.length === 0) return "";
  
  // Si no tiene código de país y tiene 10 dígitos, asumir código de país
  if (cleaned.length === 10) {
    return "+1" + cleaned; // Asumir +1 como código por defecto
  }
  
  // Si no tiene + al inicio, agregarlo
  if (cleaned.length > 0 && !cleaned.startsWith("+")) {
    return "+" + cleaned;
  }
  
  return cleaned;
}

// Generar timestamp en formato ISO
function getTimestamp() {
  return new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function generateVCard(person) {
  const full = String(person?.name || "").trim();
  const parts = full.split(/\s+/);
  const first = parts[0] || "";
  const last = parts.slice(1).join(" ") || "";
  
  // Usar vCard 2.1 con todos los campos necesarios para Android 15
  const lines = [
    "BEGIN:VCARD",
    "VERSION:2.1",
    // Campo N obligatorio: Apellido;Nombre;SegundoNombre;Prefijo;Sufijo
    `N:${esc(last)};${esc(first)};;;`,
    // Campo FN obligatorio - nombre completo
    `FN:${esc(full || first)}`,
    // Organización
    person?.title ? `ORG:${esc(person.title)}` : null,
    // Título/Cargo
    person?.title ? `TITLE:${esc(person.title)}` : null,
    // Teléfono con formato simple para vCard 2.1
    person?.phone ? `TEL;TYPE=CELL:${formatPhone(person.phone)}` : null,
    // Email simple
    person?.email ? `EMAIL;TYPE=WORK:${esc(person.email)}` : null,
    // Dirección
    person?.address ? `ADR;TYPE=WORK:;;${esc(person.address)};;;;` : null,
    // Sitio web
    person?.website ? `URL;TYPE=WORK:${esc(person.website)}` : null,
    // Nota
    `NOTE:Digital Business Card - ${esc(full)}`,
    // Timestamp de revisión
    `REV:${getTimestamp()}`,
    "END:VCARD"
  ].filter(Boolean);

  // CRLF obligatorio para Android
  return lines.join("\r\n");
}

// Versión alternativa vCard 2.1 para máxima compatibilidad
export function generateVCard21(person) {
  const full = String(person?.name || "").trim();
  const parts = full.split(/\s+/);
  const first = parts[0] || "";
  const last = parts.slice(1).join(" ") || "";
  
  const lines = [
    "BEGIN:VCARD",
    "VERSION:2.1",
    // Formato N estricto para vCard 2.1
    `N:${esc(last)};${esc(first)};;;`,
    `FN:${esc(full || first)}`,
    // Teléfono con formato simple para vCard 2.1
    person?.phone ? `TEL;CELL:${formatPhone(person.phone)}` : null,
    // Email simple
    person?.email ? `EMAIL;INTERNET:${esc(person.email)}` : null,
    // Timestamp de revisión
    `REV:${getTimestamp()}`,
    "END:VCARD"
  ].filter(Boolean);

  return lines.join("\r\n");
}

// Descarga en navegador con headers correctos
export function downloadVCard(filename, vcfText) {
  const blob = new Blob([vcfText], { type: "text/x-vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".vcf") ? filename : `${filename}.vcf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
