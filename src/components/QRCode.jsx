import { useEffect, useRef, useState } from "react";
import QRCodeLib from "qrcode-generator";

// === Colores y escala ===
const DARK = "#1F5D39";   // módulos y centro del finder
const LIGHT = "#71AA50";  // marco exterior del finder
const BG = "#FFFFFF";     // fondo
const CELL = 6;           // px por módulo
const MARGIN_MOD = 2;     // quiet zone en módulos
const LOGO_SIZE = 38;     // px logo
const LOGO_URL = "https://assets.jasu.us/logos/jasu-sheet.png";
const DOWNLOAD_SIZE = 1000;
const XLINK_NS = "http://www.w3.org/1999/xlink";

// === Radios (en múltiplos de módulo) ===
const FINDER_OUTER_RADIUS_MOD = 2; // 7x7
const FINDER_RING_RADIUS_MOD  = 1.5; // 5x5
const FINDER_INNER_RADIUS_MOD = 1; // 3x3
const MODULE_RADIUS = 0.4;              // módulos del QR (0 = cuadrados)

function roundedRectPath(x, y, w, h, { tl=0, tr=0, br=0, bl=0 } = {}) {
  // clamp por si el radio excede la mitad
  const c = (r) => Math.max(0, Math.min(r, Math.min(w, h) / 2));
  tl = c(tl); tr = c(tr); br = c(br); bl = c(bl);

  const p = [];
  p.push(`M ${x + tl} ${y}`);
  p.push(`H ${x + w - tr}`);
  if (tr) p.push(`A ${tr} ${tr} 0 0 1 ${x + w} ${y + tr}`); else p.push(`L ${x + w} ${y}`);
  p.push(`V ${y + h - br}`);
  if (br) p.push(`A ${br} ${br} 0 0 1 ${x + w - br} ${y + h}`); else p.push(`L ${x + w} ${y + h}`);
  p.push(`H ${x + bl}`);
  if (bl) p.push(`A ${bl} ${bl} 0 0 1 ${x} ${y + h - bl}`); else p.push(`L ${x} ${y + h}`);
  p.push(`V ${y + tl}`);
  if (tl) p.push(`A ${tl} ${tl} 0 0 1 ${x + tl} ${y}`); else p.push(`L ${x} ${y}`);
  p.push("Z");
  return p.join(" ");
}

const fetchAsDataUri = async (url) => {
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) throw new Error("No se pudo descargar el logo");
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export default function QRCode({ url, filename = "jasu-qr" }) {
  const ref = useRef(null);
  const lastTapRef = useRef(0);
  const [logoDataUri, setLogoDataUri] = useState(null);

  useEffect(() => {
    let active = true;
    fetchAsDataUri(LOGO_URL)
      .then((dataUri) => {
        if (active) setLogoDataUri(dataUri);
      })
      .catch(() => {
        if (active) setLogoDataUri(null);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!url || !ref.current) return;

    const svgNS = "http://www.w3.org/2000/svg";

    // 1) Matriz QR
    const qr = QRCodeLib(0, "M");
    qr.addData(url);
    qr.make();

    const N = qr.getModuleCount();
    const unit = CELL;
    const margin = MARGIN_MOD * unit;

    // 2) SVG base
    const size = (N + 2 * MARGIN_MOD) * unit;
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
    svg.setAttribute("width", String(size));
    svg.setAttribute("height", String(size));
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("shape-rendering", "geometricPrecision");

    // Fondo
    const bg = document.createElementNS(svgNS, "rect");
    bg.setAttribute("x", "0");
    bg.setAttribute("y", "0");
    bg.setAttribute("width", String(size));
    bg.setAttribute("height", String(size));
    bg.setAttribute("fill", BG);
    svg.appendChild(bg);

    // 3) Módulos (excluye finders 7×7)
    const finderBoxes = [
      { r0: 0, c0: 0,         key: "TL" },
      { r0: 0, c0: N - 7,     key: "TR" },
      { r0: N - 7, c0: 0,     key: "BL" },
    ];
    const inFinder = (r, c) =>
      finderBoxes.some(({ r0, c0 }) => r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7);

    const gModules = document.createElementNS(svgNS, "g");
    gModules.setAttribute("fill", DARK);

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (inFinder(r, c) || !qr.isDark(r, c)) continue;
        const x = margin + c * unit;
        const y = margin + r * unit;
        if (MODULE_RADIUS > 0) {
          const path = document.createElementNS(svgNS, "path");
          const d = roundedRectPath(x, y, unit, unit, {
            tl: MODULE_RADIUS * unit,
            tr: MODULE_RADIUS * unit,
            br: MODULE_RADIUS * unit,
            bl: MODULE_RADIUS * unit,
          });
          path.setAttribute("d", d);
          path.setAttribute("fill", DARK);
          gModules.appendChild(path);
        } else {
          const rect = document.createElementNS(svgNS, "rect");
          rect.setAttribute("x", String(x));
          rect.setAttribute("y", String(y));
          rect.setAttribute("width", String(unit));
          rect.setAttribute("height", String(unit));
          gModules.appendChild(rect);
        }
      }
    }
    svg.appendChild(gModules);

    // 4) Finders con 3 esquinas redondeadas y 1 interna cuadrada
    const drawFinder = (r0, c0, key) => {
      const x = margin + c0 * unit;
      const y = margin + r0 * unit;

      const outerSize = 7 * unit;
      const ringGap   = 1 * unit; // deja 5×5
      const innerSize = 3 * unit; // 3×3

      const rOuter = FINDER_OUTER_RADIUS_MOD * unit;
      const rRing  = FINDER_RING_RADIUS_MOD  * unit;
      const rInner = FINDER_INNER_RADIUS_MOD * unit;

      // ¿Qué esquina es la "interna" (hacia el centro del QR)?
      // TL -> BR interna; TR -> BL interna; BL -> TR interna
      const zeroCornerByKey = {
        TL: "br",
        TR: "bl",
        BL: "tr",
      };
      const zero = zeroCornerByKey[key];

      const allOuter = { tl: rOuter, tr: rOuter, br: rOuter, bl: rOuter };
      const allRing  = { tl: rRing,  tr: rRing,  br: rRing,  bl: rRing  };
      const allInner = { tl: rInner, tr: rInner, br: rInner, bl: rInner };

      allOuter[zero] = 0;
      allRing[zero]  = 0;
      allInner[zero] = 0;

      // Marco exterior (7x7) LIGHT
      const outerPath = document.createElementNS(svgNS, "path");
      outerPath.setAttribute("d", roundedRectPath(x, y, outerSize, outerSize, allOuter));
      outerPath.setAttribute("fill", LIGHT);

      // Anillo blanco (5x5)
      const ringX = x + ringGap, ringY = y + ringGap, ringSize = outerSize - 2 * ringGap;
      const ringPath = document.createElementNS(svgNS, "path");
      ringPath.setAttribute("d", roundedRectPath(ringX, ringY, ringSize, ringSize, allRing));
      ringPath.setAttribute("fill", BG);

      // Centro (3x3) DARK
      const innerX = x + 2 * unit, innerY = y + 2 * unit;
      const innerPath = document.createElementNS(svgNS, "path");
      innerPath.setAttribute("d", roundedRectPath(innerX, innerY, innerSize, innerSize, allInner));
      innerPath.setAttribute("fill", DARK);

      svg.appendChild(outerPath);
      svg.appendChild(ringPath);
      svg.appendChild(innerPath);
    };

    drawFinder(0, 0, "TL");          // top-left
    drawFinder(0, N - 7, "TR");      // top-right
    drawFinder(N - 7, 0, "BL");      // bottom-left

    // 5) Logo centrado (opcional)
    const cx = size / 2;
    const cy = size / 2;
    const pad = 2;

    const cartouche = document.createElementNS(svgNS, "rect");
    cartouche.setAttribute("x", String(cx - LOGO_SIZE / 2 - pad));
    cartouche.setAttribute("y", String(cy - LOGO_SIZE / 2 - pad));
    cartouche.setAttribute("width", String(LOGO_SIZE + 2 * pad));
    cartouche.setAttribute("height", String(LOGO_SIZE + 2 * pad));
    cartouche.setAttribute("fill", BG);
    svg.appendChild(cartouche);

    const logo = document.createElementNS(svgNS, "image");
    logo.setAttribute("href", logoDataUri || LOGO_URL);
    logo.setAttribute("x", String(cx - LOGO_SIZE / 2));
    logo.setAttribute("y", String(cy - LOGO_SIZE / 2));
    logo.setAttribute("width", String(LOGO_SIZE));
    logo.setAttribute("height", String(LOGO_SIZE));
    logo.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.appendChild(logo);

    // 6) Inyección
    ref.current.innerHTML = "";
    ref.current.appendChild(svg);
  }, [url, logoDataUri]);

  const drawRoundedRect = (ctx, x, y, w, h, radius) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  const handleDownload = async () => {
    const container = ref.current;
    if (!container) return;
    const svgNode = container.querySelector("svg");
    if (!svgNode) return;

    // Esperar a que el logo se cargue si no está disponible
    let logoToUse = logoDataUri;
    if (!logoToUse) {
      // Esperar un momento para que el logo se cargue en el SVG
      await new Promise(resolve => setTimeout(resolve, 500));
      logoToUse = logoDataUri;
    }

    // Clonar el SVG y escalarlo a 1000x1000
    const clone = svgNode.cloneNode(true);
    const originalViewBox = svgNode.getAttribute("viewBox") || `0 0 ${DOWNLOAD_SIZE} ${DOWNLOAD_SIZE}`;
    clone.setAttribute("width", String(DOWNLOAD_SIZE));
    clone.setAttribute("height", String(DOWNLOAD_SIZE));
    clone.setAttribute("viewBox", originalViewBox);

    // Si tenemos el logo como Data URI, usarlo en el clon
    const cloneImageNode = clone.querySelector("image");
    if (cloneImageNode && logoToUse) {
      cloneImageNode.setAttribute("href", logoToUse);
      cloneImageNode.setAttributeNS(XLINK_NS, "href", logoToUse);
    }

    // Convertir SVG a imagen
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = DOWNLOAD_SIZE;
      canvas.height = DOWNLOAD_SIZE;
      const ctx = canvas.getContext("2d");
      
      // Fondo blanco
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, DOWNLOAD_SIZE, DOWNLOAD_SIZE);
      
      // Dibujar el SVG completo
      ctx.drawImage(img, 0, 0, DOWNLOAD_SIZE, DOWNLOAD_SIZE);
      
      // Si el logo no se renderizó (por CORS), intentar dibujarlo manualmente
      if (logoToUse && cloneImageNode) {
        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";
        logoImg.onload = () => {
          const [vx, vy, vw, vh] = originalViewBox.split(" ").map(Number);
          const scale = DOWNLOAD_SIZE / vw;
          const logoSize = LOGO_SIZE * scale;
          const pad = 2 * scale;
          const logoX = (DOWNLOAD_SIZE - logoSize) / 2;
          const logoY = (DOWNLOAD_SIZE - logoSize) / 2;
          
          // Cartouche
          ctx.fillStyle = BG;
          ctx.fillRect(logoX - pad, logoY - pad, logoSize + 2 * pad, logoSize + 2 * pad);
          
          // Logo
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
          
          // Descargar
          downloadCanvas(canvas);
        };
        logoImg.onerror = () => {
          console.warn("No se pudo cargar el logo, descargando sin logo");
          downloadCanvas(canvas);
        };
        logoImg.src = logoToUse;
        URL.revokeObjectURL(svgUrl);
        return;
      }
      
      // Descargar
      downloadCanvas(canvas);
      URL.revokeObjectURL(svgUrl);
    };

    img.onerror = (err) => {
      console.error("Error al cargar el SVG para descarga", err);
      URL.revokeObjectURL(svgUrl);
    };

    img.src = svgUrl;

    function downloadCanvas(canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          const pngUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = pngUrl;
          a.download = `${filename}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(pngUrl);
        }
      }, "image/png", 1.0);
    }
  };

  const handleTouchEnd = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 400) {
      handleDownload();
    }
    lastTapRef.current = now;
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div
        ref={ref}
        onDoubleClick={handleDownload}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: "pointer" }}
        title="Doble clic para descargar QR 1000x1000"
      />
      <div
        style={{
          color: DARK,
          fontWeight: 600,
          fontFamily: "Montserrat, Inter, system-ui",
          marginTop: 16,
        }}
      >
        ¡Scan me!
      </div>
    </div>
  );
}
