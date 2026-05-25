import { browser } from '$app/environment';
import { CalcolaDistanza } from './GeoUtils';

// ─── Palette ────────────────────────────────────────────────────────────────
const C = {
  bg:        '#ffffff',
  surface:   '#f8fafc',
  border:    '#e2e8f0',
  text:      '#0f172a',
  muted:     '#64748b',
  accent:    '#3b82f6',
  green:     '#10b981',
  rowOdd:    '#f1f5f9',
  good:      '#16a34a',
  mid:       '#ff8800',
  bad:       '#dc2626',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function rssiColor(rssi) {
  const v = parseFloat(rssi);
  if (v >= -70)  return C.good;
  if (v >= -90)  return C.mid;
  return C.bad;
}

function rssiLabel(rssi) {
  const v = parseFloat(rssi);
  if (v >= -70)  return 'Ottimo';
  if (v >= -90)  return 'Discreto';
  return 'Debole';
}

function fmt(key, value, row, routerData) {
  if (key === 'received_at' && value)
    return new Date(value).toLocaleString('it-IT');
  if ((key === 'Latitude' || key === 'Longitude') && typeof value === 'number')
    return value.toFixed(5);
  if (key === 'Rssi' && value != null)
    return `${value} dBm`;
  if (key === 'Distanza')
    return CalcolaDistanza(row.Latitude, row.Longitude, routerData) ?? '-';
  return value ?? '-';
}

// ─── Snapshot della mappa con il layer Turf sovrapposto ───────────────────
async function snapshotMap(mapContainer, mapManager, html2canvas) {
  // Assicura che il layer coverage sia visibile prima dello screenshot
  const hadLayer = mapManager?.covarageLayer && mapManager.map?.hasLayer(mapManager.covarageLayer);
  await new Promise(resolve => setTimeout(resolve, 500));
  const canvas = await html2canvas(mapContainer, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    logging: false,
    backgroundColor: '#f8fafc',
  });
  return canvas.toDataURL('image/png');
}

// ─── Statistiche riassuntive ──────────────────────────────────────────────
function calcStats(data) {
  if (!data.length) return null;
  const rssiVals = data.map(r => parseFloat(r.Rssi)).filter(v => !isNaN(v));
  const snrVals  = data.map(r => parseFloat(r.Snr)).filter(v => !isNaN(v));
  return {
    count:   data.length,
    rssiAvg: rssiVals.length ? (rssiVals.reduce((a,b) => a+b, 0) / rssiVals.length).toFixed(1) : '-',
    rssiMin: rssiVals.length ? Math.min(...rssiVals) : '-',
    rssiMax: rssiVals.length ? Math.max(...rssiVals) : '-',
    snrAvg:  snrVals.length  ? (snrVals.reduce((a,b) => a+b, 0)  / snrVals.length).toFixed(1)  : '-',
  };
}

// ─── HTML del documento PDF ───────────────────────────────────────────────
function buildHTML(mapImg, data, selectedTable, routerData, stats) {
  const COLS = ['device_id','Latitude','Longitude','Rssi','Snr','received_at','Distanza'];

  const statCards = stats ? `
    <div style="display:flex;gap:12px;margin-bottom:28px;flex-wrap:wrap;">
      ${[
        ['Misurazioni',   stats.count,            C.accent],
        ['RSSI medio',    stats.rssiAvg + ' dBm', rssiColor(stats.rssiAvg)],
        ['RSSI migliore', stats.rssiMax + ' dBm', C.good],
        ['RSSI peggiore', stats.rssiMin + ' dBm', C.bad],
        ['SNR medio',     stats.snrAvg + ' dB',   C.accent],
      ].map(([label, val, col]) => `
        <div style="flex:1;min-width:120px;background:${C.surface};border:1px solid ${C.border};
                    border-radius:10px;padding:12px 14px;border-top:3px solid ${col};">
          <div style="font-size:10px;color:${C.muted};text-transform:uppercase;
                      letter-spacing:.06em;margin-bottom:4px;">${label}</div>
          <div style="font-size:18px;font-weight:700;color:${col};">${val}</div>
        </div>`).join('')}
    </div>` : '';

  const rows = data.length
    ? data.map((row, i) => {
        const rssiCol = row.Rssi != null ? rssiColor(row.Rssi) : C.muted;
        return `<tr style="background:${i%2===0 ? C.bg : C.rowOdd};">
          ${COLS.map(k => {
            const v = fmt(k, row[k], row, routerData);
            const extra = k === 'Rssi'
              ? `color:${rssiCol};font-weight:600;`
              : '';
            return `<td style="border:1px solid ${C.border};padding:6px 8px;font-size:10.5px;
                               text-align:center;color:${C.text};${extra}">${v}</td>`;
          }).join('')}
        </tr>`;
      }).join('')
    : `<tr><td colspan="${COLS.length}" style="padding:16px;text-align:center;
           color:${C.muted};font-size:12px;">Nessun dato disponibile</td></tr>`;

  return `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;width:780px;padding:28px 32px;
            box-sizing:border-box;background:${C.bg};color:${C.text};">

  <!-- Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;
              padding-bottom:16px;margin-bottom:24px;
              border-bottom:2px solid ${C.accent};">
    <div>
      <h1 style="margin:0;font-size:20px;font-weight:800;color:${C.text};letter-spacing:-0.5px;">
        Wireless Signal Tracker
      </h1>
      <p style="margin:4px 0 0;font-size:11px;color:${C.muted};">
        Report generato il ${new Date().toLocaleString('it-IT')}
      </p>
    </div>
    <div style="background:${C.surface};border:1px solid ${C.border};border-radius:8px;
                padding:8px 14px;font-size:12px;text-align:right;">
      <span style="color:${C.muted};">Tabella</span><br>
      <strong style="color:${C.text};font-size:14px;">${selectedTable}</strong>
    </div>
  </div>

  <!-- Stat cards -->
  ${statCards}

  <!-- Mappa -->
  <h2 style="font-size:13px;font-weight:700;color:${C.muted};text-transform:uppercase;
             letter-spacing:.08em;margin:0 0 10px;">Mappa di copertura</h2>
  <img src="${mapImg}"
       style="width:100%;height:auto;border:1px solid ${C.border};border-radius:12px;
              margin-bottom:28px;display:block;" />

  <!-- Legenda -->
  <div style="display:flex;gap:18px;margin-bottom:24px;flex-wrap:wrap;">
    <span style="font-size:11px;color:${C.muted};font-weight:600;align-self:center;">Segnale:</span>
    ${[['Ottimo (≥ −70 dBm)', C.good],['Discreto (−90…−70)', C.mid],['Debole (< −90 dBm)', C.bad]]
      .map(([l,c]) => `
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:${C.text};">
          <div style="width:10px;height:10px;border-radius:50%;background:${c};flex-shrink:0;"></div>
          ${l}
        </div>`).join('')}
    <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:${C.text};">
      <div style="width:18px;height:3px;background:${C.accent};border-radius:2px;flex-shrink:0;"></div>
      Perimetro copertura (Turf)
    </div>
  </div>

  <!-- Tabella dati -->
  <h2 style="font-size:13px;font-weight:700;color:${C.muted};text-transform:uppercase;
             letter-spacing:.08em;margin:0 0 10px;">Dati GPS</h2>
  <table style="width:100%;table-layout:fixed;border-collapse:collapse;box-sizing:border-box;">
    <thead>
      <tr style="background:${C.accent};">
        ${COLS.map(k => `
          <th style="border:1px solid ${C.accent};padding:8px 6px;font-size:10px;
                     text-align:center;color:#fff;font-weight:700;letter-spacing:.05em;">
            ${k.toUpperCase()}
          </th>`).join('')}
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <!-- Footer -->
  <p style="text-align:center;font-size:9px;color:${C.border};margin-top:24px;
            border-top:1px solid ${C.border};padding-top:10px;">
    Wireless Signal Tracker — documento generato automaticamente
  </p>
</div>`;
}

// ─── Export principale ────────────────────────────────────────────────────
export async function exportToPDF(mapContainer, tableData, selectedTable, routerData, mapManager) {
  if (!browser) return;

  try {
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);

    // 1. Screenshot mappa (con layer Turf già visibile)
    const mapImg = await snapshotMap(mapContainer, mapManager, html2canvas);

    // 2. Statistiche
    const stats = calcStats(tableData);

    // 3. HTML stilizzato
    const html = buildHTML(mapImg, tableData, selectedTable, routerData, stats);

    // 4. Monta fuori schermo
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;';
    wrap.innerHTML = html;
    document.body.appendChild(wrap);

    // 5. Canvas pagina intera
    const pageCanvas = await html2canvas(wrap, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
    });
    document.body.removeChild(wrap);

    // 6. Costruisci PDF con paginazione automatica
    const pdf    = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageW  = pdf.internal.pageSize.getWidth();
    const pageH  = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const printW = pageW - margin * 2;
    const totalH = (pageCanvas.height * printW) / pageCanvas.width;

    let yOffset = 0;
    while (yOffset < totalH) {
      if (yOffset > 0) pdf.addPage();

      const srcY    = (yOffset / totalH) * pageCanvas.height;
      const sliceH  = Math.min(
        ((pageH - margin * 2) / totalH) * pageCanvas.height,
        pageCanvas.height - srcY
      );

      const slice = document.createElement('canvas');
      slice.width  = pageCanvas.width;
      slice.height = sliceH;
      slice.getContext('2d').drawImage(
        pageCanvas, 0, srcY, pageCanvas.width, sliceH,
                    0,    0, pageCanvas.width, sliceH
      );

      const slicePrintH = (sliceH / pageCanvas.height) * totalH;
      pdf.addImage(slice.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin, printW, slicePrintH);
      yOffset += pageH - margin * 2;
    }

    pdf.save(`report_${selectedTable}_${new Date().toISOString().split('T')[0]}.pdf`);

  } catch (err) {
    console.error('Errore export PDF:', err);
    alert('Errore durante la generazione del PDF. Controlla la console per i dettagli.');
  }
}