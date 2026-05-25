
import { browser } from '$app/environment';

import { CalcolaDistanza } from './GeoUtils';

export async function exportToPDF(mapContainer,tableData,selectedTable,routerData) {
    if (!browser) return;
    try{
        const html2Module = (await import('html2pdf.js'));
        const html2canvas = (await import('html2canvas')).default;
        const html2pdf = html2Module.default;

        const contenutopdf = document.createElement('div');
        contenutopdf.style.padding = '10px';
        contenutopdf.backgroundColor = 'white';
        contenutopdf.style.fontFamily = 'Arial, sans-serif';
        contenutopdf.style.width='770px';
        contenutopdf.style.boxSizing='border-box';

        const titolo = document.createElement('h1');
        titolo.textContent='Wireless Signal Tracker - Report';
        titolo.style.textAlign = 'center';
        titolo.style.marginBottom = '10px';
        titolo.style.background='none';
        titolo.style.color = '#333';
        contenutopdf.appendChild(titolo);

        const data = document.createElement('p');
        data.textContent = `Data report: ${new Date().toLocaleString()}`;
        data.style.textAlign = 'center';
        data.style.marginBottom = '25px';
        data.style.color = '#555';
        contenutopdf.appendChild(data);

        const InfoTable = document.createElement('p');
        InfoTable.textContent = `Tabella: ${selectedTable}`;
        InfoTable.style.marginBottom = '20px';
        InfoTable.style.fontWeight = 'bold'; 
        InfoTable.style.fontSize = '16px';       
       
        contenutopdf.appendChild(InfoTable);

        const mapScreenshot = document.createElement('h2');
        mapScreenshot.textContent = 'Mappa:';
        mapScreenshot.style.marginTop= '20px';
        mapScreenshot.style.marginBottom = '15px';
        mapScreenshot.style.color = '#333';
        mapScreenshot.style.fontSize = '18px';
        mapScreenshot.style.borderBottom = '2px solid #ccc';
        mapScreenshot.style.paddingBottom = '5px';
        contenutopdf.appendChild(mapScreenshot);

        const canvas = await html2canvas(mapContainer, { 
            scale: 2,
            useCORS: true,
            allowTaint: false,
            logging: false,
            
        });
        const imgData = canvas.toDataURL('image/png');
        const img = document.createElement('img');
        img.src = imgData;
        img.style.width = '97%';
        img.style.height = 'auto';
        img.style.border = '1px solid #ccc';
        img.style.borderRadius = '12px';
        img.style.marginBottom = '30px';
        contenutopdf.appendChild(img);

        const tableTitle = document.createElement('h2');
        tableTitle.textContent = 'Dati GPS:';
        tableTitle.style.marginTop= '30px';
        tableTitle.style.marginBottom = '15px';
        tableTitle.style.color = '#333';
        tableTitle.style.fontSize = '18px';
        tableTitle.style.borderBottom = '2px solid #ccc';
        tableTitle.style.paddingBottom = '5px';
        
        contenutopdf.appendChild(tableTitle);

        const table = document.createElement('table');
        table.style.width = '97%';
        
        table.style.maxWidth = '97%';
        table.style.tableLayout = 'fixed';       // ← forza le colonne a stare nei limiti
        table.style.boxSizing = 'border-box';
        table.style.borderCollapse = 'collapse';
        table.style.marginBottom = '20px';
        

        if(tableData.length > 0){
            const headerRow = table.insertRow();
            const colonneVisibili = ['device_id', 'Latitude', 'Longitude', 'Rssi', 'Snr', 'received_at','Distanza'];
            colonneVisibili.forEach(key => {
                const cell = headerRow.insertCell();
                cell.textContent = key;
                cell.style.border = '1px solid #ddd';
                cell.style.padding = '6px 4px';
                cell.style.backgroundColor = '#f2f2f2';
                cell.style.fontWeight = 'bold';
                cell.style.textAlign = 'center';
                cell.style.fontSize = '12px';

                cell.style.fontWeight = 'bold';
            });
            tableData.forEach((rowData , index) => {
                const row = table.insertRow();
                colonneVisibili.forEach(key => {
                    const cell = row.insertCell();
                    let value = rowData[key];
                    if(key === 'received_at' && value) {
                        value = new Date(value).toLocaleString('it-IT');
                    }else if((key === 'Latitude' || key === 'Longitude') && typeof value=='number'){ 
                        value = value.toFixed(5);
                    }else if(key === 'Rssi' && value){
                        value = `${value} dBm`;
                    }else if (key==='Distanza'){
                        value=CalcolaDistanza(rowData.Latitude,rowData.Longitude,routerData)
                    }

                    cell.textContent = value||'-';
                    cell.style.border = '1px solid #ddd';
                    cell.style.padding = '4px 2px';
                    cell.style.fontSize = '12px';
                    cell.style.textAlign = 'center';
                    cell.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f9f9f9';
                });
            });




        }else{
            const noDataRow = table.insertRow();
            const cell = noDataRow.insertCell();
            cell.textContent = 'Nessun dato disponibile';
            cell.style.border = '1px solid #ddd';
            cell.style.padding = '10px';
            cell.style.textAlign = 'center';
        }
        contenutopdf.appendChild(table);

        const opt = {
            margin: [0.3, 0.2, 0.3, 0.2],
            filename: `report_${selectedTable}_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true,logging: false },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
            pagebreak : {mode: ['css', 'legacy'],avoid:['tr', 'img']},
        };
        html2pdf().set(opt).from(contenutopdf).save();

    }catch(error){
        console.error('Errore durante l\'esportazione in PDF:', error);
        alert('Si è verificato un errore durante l\'esportazione in PDF. Riprova più tardi.');
    }
    
}