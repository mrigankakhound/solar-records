const PDFDocument = require('pdfkit');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 36;
const CONTENT_WIDTH = A4_WIDTH - MARGIN * 2;

const HEADER_HEIGHT = 80;
const FOOTER_HEIGHT = 45;
const HEADER_FOOTER_GAP = 8;

// Usable content area top/bottom
const CONTENT_TOP = MARGIN + HEADER_HEIGHT + HEADER_FOOTER_GAP;
const CONTENT_BOTTOM = A4_HEIGHT - MARGIN - FOOTER_HEIGHT - HEADER_FOOTER_GAP;
const CONTENT_AREA_HEIGHT = CONTENT_BOTTOM - CONTENT_TOP;

// Colors
const COLORS = {
  primary: '#1a3a5c',
  accent: '#2980b9',
  lightGrey: '#f5f5f5',
  midGrey: '#e0e0e0',
  darkGrey: '#555555',
  black: '#1a1a1a',
  white: '#ffffff',
  tableHeader: '#1a3a5c',
  tableRowAlt: '#eaf3fb',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const fetchImageBuffer = (url) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const timeout = setTimeout(() => reject(new Error(`Timeout fetching: ${url}`)), 30000);

    const request = protocol.get(url, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        clearTimeout(timeout);
        return fetchImageBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        clearTimeout(timeout);
        return reject(new Error(`HTTP ${res.statusCode} fetching: ${url}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        clearTimeout(timeout);
        resolve(Buffer.concat(chunks));
      });
      res.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    request.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
};

// Force JPEG + limit to 1200px wide for PDF (saves ~70% memory vs full-res)
const toPdfImageUrl = (url) => {
  if (!url) return url;
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/f_jpg,q_75,w_1200,c_limit/');
  }
  return url;
};


const loadLocalAsset = (filename) => {
  const assetPath = path.join(__dirname, '../../assets', filename);
  if (fs.existsSync(assetPath)) {
    return fs.readFileSync(assetPath);
  }
  return null;
};

// ─── DRAW HEADER ─────────────────────────────────────────────────────────────
const drawHeader = (doc, pmLogoBuffer, drtLogoBuffer) => {
  const y = MARGIN;
  const logoH = 65;
  const pmLogoW = 70;
  const drtLogoW = 115;
  const centerX = MARGIN + CONTENT_WIDTH / 2;

  // Background bar
  doc.rect(MARGIN, y, CONTENT_WIDTH, HEADER_HEIGHT)
    .fill(COLORS.white);

  // PM Surya Ghar logo — LEFT
  if (pmLogoBuffer) {
    try {
      doc.image(pmLogoBuffer, MARGIN, y + (HEADER_HEIGHT - logoH) / 2, {
        fit: [pmLogoW, logoH],
        align: 'left',
        valign: 'center',
      });
    } catch (e) {
      console.warn('Could not render PM logo:', e.message);
    }
  }

  // DRT Enterprise logo — RIGHT
  const rightLogoX = MARGIN + CONTENT_WIDTH - drtLogoW - 15;
  if (drtLogoBuffer) {
    try {
      doc.image(drtLogoBuffer, rightLogoX, y + (HEADER_HEIGHT - logoH) / 2, {
        fit: [drtLogoW, logoH],
        align: 'right',
        valign: 'center',
      });
    } catch (e) {
      console.warn('Could not render DRT logo:', e.message);
    }
  }

  // Center text — DRT ENTERPRISE
  doc.font('Helvetica-Bold')
    .fontSize(16)
    .fillColor(COLORS.primary)
    .text('DRT ENTERPRISE', MARGIN + pmLogoW + 10, y + 18, {
      width: CONTENT_WIDTH - pmLogoW - drtLogoW - 20,
      align: 'center',
    });

  // Center text — Solar Energy Solutions
  doc.font('Helvetica')
    .fontSize(10)
    .fillColor(COLORS.accent)
    .text('Solar Energy Solutions', MARGIN + pmLogoW + 10, y + 38, {
      width: CONTENT_WIDTH - pmLogoW - drtLogoW - 20,
      align: 'center',
    });

  // Thin divider below header
  const dividerY = y + HEADER_HEIGHT + 4;
  doc.moveTo(MARGIN, dividerY)
    .lineTo(MARGIN + CONTENT_WIDTH, dividerY)
    .lineWidth(1.5)
    .strokeColor(COLORS.accent)
    .stroke();
};

// ─── DRAW FOOTER ─────────────────────────────────────────────────────────────
const drawFooter = (doc, pageNum, totalPages) => {
  const dividerY = A4_HEIGHT - MARGIN - FOOTER_HEIGHT - 4;

  // Thin divider above footer
  doc.moveTo(MARGIN, dividerY)
    .lineTo(MARGIN + CONTENT_WIDTH, dividerY)
    .lineWidth(0.8)
    .strokeColor(COLORS.midGrey)
    .stroke();

  const footerY = A4_HEIGHT - MARGIN - FOOTER_HEIGHT + 6;
  const rightColW = 160;
  const rightColX = MARGIN + CONTENT_WIDTH - rightColW;

  // Left column — GSTIN (bold) + Contact (bold)
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(COLORS.darkGrey);
  doc.text('GSTIN: 18ABXFM0804A1ZE', MARGIN, footerY);
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(COLORS.darkGrey);
  doc.text('Contact: +91 7002322258 / +91 8254028956', MARGIN, footerY + 12);

  // Right column — Email + Web pushed to right edge
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(COLORS.darkGrey);
  doc.text('Email: contact@drtweb.in', rightColX, footerY, { width: rightColW, align: 'right' });
  doc.text('Web: www.drtweb.in', rightColX, footerY + 12, { width: rightColW, align: 'right' });

  // Page number centered
  doc.font('Helvetica').fontSize(7).fillColor(COLORS.darkGrey);
  doc.text(`Page ${pageNum} of ${totalPages}`, MARGIN, footerY + 24, {
    width: CONTENT_WIDTH,
    align: 'center',
  });
};

// ─── DRAW INFO TABLE (Page 1) ────────────────────────────────────────────────
const drawInfoTable = (doc, record) => {
  const startY = CONTENT_TOP;
  const sectionLabelH = 20;

  // Section heading
  doc.rect(MARGIN, startY, CONTENT_WIDTH, sectionLabelH)
    .fill(COLORS.tableHeader);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.white);
  doc.text('CONSUMER INFORMATION', MARGIN + 8, startY + 5, {
    width: CONTENT_WIDTH,
    align: 'left',
  });

  const rows = [
    ['Consumer Name', record.consumerName],
    ['Consumer No', record.consumerNo],
    ['Contact Number', record.contactNumber],
    ['Application Reference No', record.applicationRefNo],
    ['Address', record.address],
    ['Plant Capacity', record.plantCapacity],
    ['Installation Date', formatDate(record.installationDate)],
    ['Sub-Division', record.subDivision],
    ['Date of System Commissioning', record.commissioningDate ? formatDate(record.commissioningDate) : '—'],
    ['Vendor Name', record.vendorName],
  ];

  const rowH = 22;
  const labelW = 175;
  const valueW = CONTENT_WIDTH - labelW;
  let rowY = startY + sectionLabelH;

  rows.forEach(([label, value], i) => {
    const bg = i % 2 === 0 ? COLORS.white : COLORS.tableRowAlt;
    doc.rect(MARGIN, rowY, CONTENT_WIDTH, rowH).fill(bg);

    // Label cell
    doc.rect(MARGIN, rowY, labelW, rowH).fill(i % 2 === 0 ? '#e8eff6' : '#d5e8f5').stroke();

    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLORS.primary);
    doc.text(label, MARGIN + 6, rowY + 6, { width: labelW - 10 });

    // Value cell
    doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.black);
    doc.text(String(value || '—'), MARGIN + labelW + 6, rowY + 6, { width: valueW - 12 });

    // Row border
    doc.rect(MARGIN, rowY, CONTENT_WIDTH, rowH).strokeColor(COLORS.midGrey).lineWidth(0.5).stroke();

    rowY += rowH;
  });

  return rowY; // return the Y position after the table
};

// ─── DRAW PHOTO SECTION ───────────────────────────────────────────────────────
const drawPhotoSection = (doc, title, imgBuffer, startY, maxHeight) => {
  const titleH = 22;
  const imgPadding = 6;

  // Section heading
  doc.rect(MARGIN, startY, CONTENT_WIDTH, titleH).fill(COLORS.tableHeader);
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLORS.white);
  doc.text(title, MARGIN + 8, startY + 6, { width: CONTENT_WIDTH });

  const imgAreaY = startY + titleH + imgPadding;
  const imgAreaH = maxHeight - titleH - imgPadding * 2;

  if (imgBuffer && imgAreaH > 20) {
    try {
      doc.image(imgBuffer, MARGIN, imgAreaY, {
        fit: [CONTENT_WIDTH, imgAreaH],
        align: 'center',
        valign: 'center',
      });
    } catch (e) {
      console.warn(`Could not render photo for "${title}":`, e.message);
      doc.font('Helvetica').fontSize(9).fillColor(COLORS.darkGrey);
      doc.text('(Image unavailable)', MARGIN + 10, imgAreaY + 10);
    }
  }
};

// ─── MAIN GENERATE FUNCTION ───────────────────────────────────────────────────
const generatePDF = async (record) => {
  // Load logos
  const pmLogoBuffer = loadLocalAsset('pm.png');
  const drtLogoBuffer = loadLocalAsset('DRTlogo.png');

  if (!pmLogoBuffer) console.warn('⚠️  pm.png not found in backend/assets/. Header PM logo will be missing.');
  if (!drtLogoBuffer) console.warn('⚠️  DRTlogo.png not found in backend/assets/. Header DRT logo will be missing.');

  // Fetch all photos from Cloudinary sequentially (avoids connection saturation)
  // Also forces JPEG format so PDFKit can always render them
  const fetchPhoto = async (photo, label) => {
    if (!photo || !photo.url) {
      console.log(`ℹ️  ${label}: no URL, skipping`);
      return null;
    }
    const jpegUrl = toPdfImageUrl(photo.url);
    console.log(`📷 Fetching ${label}: ${jpegUrl}`);
    try {
      const buf = await fetchImageBuffer(jpegUrl);
      console.log(`✅ ${label}: fetched ${buf.length} bytes`);
      return buf;
    } catch (e) {
      console.warn(`⚠️  ${label} fetch failed: ${e.message}`);
      return null;
    }
  };

  const inverterBuf    = await fetchPhoto(record.inverterPhoto,   'Inverter');
  const panelBuf       = await fetchPhoto(record.panelPhoto,      'Panel');
  const earthBuf       = await fetchPhoto(record.earthPhoto,      'Earth');
  const laBuf          = await fetchPhoto(record.laPhoto,         'LA');
  const additionalBuf  = await fetchPhoto(record.additionalPhoto, 'Additional');

  const doc = new PDFDocument({
    size: 'A4',
    margin: 0,
    info: {
      Title: `DRT Solar Record - ${record.consumerName}`,
      Author: 'DRT ENTERPRISE',
      Subject: 'Solar Installation Record',
    },
  });

  const chunks = [];
  doc.on('data', chunk => chunks.push(chunk));
  const pdfPromise = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  // ── PAGE 1: Consumer Info + Inverter Photo ──────────────────────────────────
  drawHeader(doc, pmLogoBuffer, drtLogoBuffer);
  drawFooter(doc, 1, 3);

  const afterTableY = drawInfoTable(doc, record);

  const inverterGap = 10;
  const inverterStartY = afterTableY + inverterGap;
  const inverterMaxH = CONTENT_BOTTOM - inverterStartY;

  if (inverterMaxH > 30) {
    drawPhotoSection(doc, 'INVERTER PHOTO', inverterBuf, inverterStartY, inverterMaxH);
  }

  // ── PAGE 2: Panel Photo + Earth Photo ──────────────────────────────────────
  doc.addPage();
  drawHeader(doc, pmLogoBuffer, drtLogoBuffer);
  drawFooter(doc, 2, 3);

  const page2TotalH = CONTENT_AREA_HEIGHT;
  const gap2 = 12;
  const halfH = (page2TotalH - gap2) / 2;

  drawPhotoSection(doc, 'PANEL PHOTO', panelBuf, CONTENT_TOP, halfH);
  drawPhotoSection(doc, 'EARTH PHOTO', earthBuf, CONTENT_TOP + halfH + gap2, halfH);

  // ── PAGE 3: LA Photo + Optional Additional Photo ───────────────────────────
  doc.addPage();
  drawHeader(doc, pmLogoBuffer, drtLogoBuffer);
  drawFooter(doc, 3, 3);

  if (additionalBuf) {
    const gap3 = 12;
    const halfH3 = (CONTENT_AREA_HEIGHT - gap3) / 2;
    drawPhotoSection(doc, 'LA PHOTO', laBuf, CONTENT_TOP, halfH3);
    drawPhotoSection(doc, 'ADDITIONAL PHOTO', additionalBuf, CONTENT_TOP + halfH3 + gap3, halfH3);
  } else {
    drawPhotoSection(doc, 'LA PHOTO', laBuf, CONTENT_TOP, CONTENT_AREA_HEIGHT);
  }

  doc.end();
  return await pdfPromise;
};

module.exports = { generatePDF };
