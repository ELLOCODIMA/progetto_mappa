import { browser } from '$app/environment';
import { CalcolaDistanza } from './GeoUtils';

export async function exportToPDF(mapContainer, tableData, selectedTable, routerData) {
    if (!browser) return;

    try {
        // Import dinamici per evitare problemi lato server (SvelteKit)
        const html2Module = await import('html2pdf.js');
        const html2canvas = (await import('html2canvas')).default;
        const html2pdf = html2Module.default;

        // 1. Cattura la mappa
        const canvas = await html2canvas(mapContainer, {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            logging: false,
        });
        const mapImgData = canvas.toDataURL('image/png');

        // 2. Genera le righe della tabella dinamicamente
        const colonneVisibili = ['device_id', 'Latitude', 'Longitude', 'Rssi', 'Snr', 'received_at', 'Distanza'];
        
        const tableRowsHtml = tableData.length > 0 
            ? tableData.map((rowData, index) => {
                const rowClass = index % 2 === 0 ? 'bg-white' : 'bg-light';
                
                let dateStr = rowData['received_at'] ? new Date(rowData['received_at']).toLocaleString('it-IT') : '-';
                let latStr = typeof rowData['Latitude'] === 'number' ? rowData['Latitude'].toFixed(5) : '-';
                let lonStr = typeof rowData['Longitude'] === 'number' ? rowData['Longitude'].toFixed(5) : '-';
                let rssiStr = rowData['Rssi'] ? `${rowData['Rssi']} dBm` : '-';
                let distStr = CalcolaDistanza(rowData.Latitude, rowData.Longitude, routerData) || '-';

                return `
                    <tr class="${rowClass}">
                        <td>${rowData['device_id'] || '-'}</td>
                        <td>${latStr}</td>
                        <td>${lonStr}</td>
                        <td class="font-medium">${rssiStr}</td>
                        <td>${rowData['Snr'] || '-'}</td>
                        <td class="text-sm">${dateStr}</td>
                        <td class="font-medium text-blue">${distStr}</td>
                    </tr>
                `;
            }).join('')
            : `<tr><td colspan="7" class="text-center p-4">Nessun dato disponibile</td></tr>`;

        // 3. Costruisci il template HTML/CSS moderno
        const htmlContent = `
            <div id="pdf-container" style="font-family: 'Inter', 'Segoe UI', sans-serif; padding: 20px; color: #1f2937; max-width: 800px; margin: 0 auto;">
                
                <style>
                    /* Stili moderni incorporati */
                    h1 { color: #111827; font-size: 24px; font-weight: 700; margin-bottom: 4px; text-align: center; }
                    .subtitle { color: #6b7280; font-size: 14px; text-align: center; margin-bottom: 30px; }
                    .badge { display: inline-block; background-color: #eff6ff; color: #1d4ed8; padding: 6px 12px; border-radius: 9999px; font-size: 14px; font-weight: 600; margin-bottom: 20px; }
                    .section-title { font-size: 18px; font-weight: 600; color: #374151; margin-top: 30px; margin-bottom: 12px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
                    .map-image { width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e5e7eb; }
                    
                    /* Stili Tabella */
                    table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; border-radius: 8px; overflow: hidden; }
                    th { background-color: #f8fafc; color: #475569; font-weight: 600; padding: 12px 8px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; text-align: center;}
                    td { padding: 10px 8px; border-bottom: 1px solid #f1f5f9; color: #334155; text-align: center;}
                    .bg-white { background-color: #ffffff; }
                    .bg-light { background-color: #f8fafc; }
                    .text-center { text-align: center; }
                    .text-sm { font-size: 11px; }
                    .font-medium { font-weight: 500; }
                    .text-blue { color: #2563eb; }
                </style>

                <h1>Wireless Signal Tracker</h1>
                <div class="subtitle">Report generato il: ${new Date().toLocaleString('it-IT')}</div>
                
                <div>
                    <span class="badge">Tabella sorgente: ${selectedTable}</span>
                </div>

                <div class="section-title">Mappa Tracciamento</div>
                <img src="${mapImgData}" class="map-image" alt="Mappa del segnale" />

                <div class="section-title" style="page-break-before: auto;">Dati GPS e Segnale</div>
                <table>
                    <thead>
                        <tr>
                            ${colonneVisibili.map(col => `<th>${col.replace('_', ' ')}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                    </tbody>
                </table>
            </div>
        `;

        // 4. Inserisci il template in un div temporaneo
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = htmlContent;

        // 5. Opzioni per html2pdf
        const opt = {
            margin:       0.4,
            filename:     `report_${selectedTable}_${new Date().toISOString().split('T')[0]}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' },
            pagebreak:    { mode: ['css', 'legacy'], avoid: ['tr', 'img', '.section-title'] }
        };

        // 6. Genera ed esporta
        await html2pdf().set(opt).from(tempContainer).save();

    } catch (error) {
        console.error("Errore durante l'esportazione in PDF:", error);
        alert("Si è verificato un errore durante l'esportazione in PDF. Riprova più tardi.");
    }
}