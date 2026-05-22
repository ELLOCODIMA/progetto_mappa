


export class MapManager 
{
    constructor(containerId, onDeleteRecord,onDeleteRouter, initialcenter=[44.6993, 10.6479], initialZoom=13) 
    {
        this.containerId=containerId;
        this.onDeleteRecord=onDeleteRecord;
        this.onDeleteRouter=onDeleteRouter;
        this.initialcenter=initialcenter;
        this.initialZoom=initialZoom;
        this.map=null;
        this.L=null;
        this.markers=[];
        this.routerMarker=null;
    }
    async init()
    {
        // Caricamento dinamico di Leaflet per evitare errori in Server-Side Rendering (SSR)
        const leaflet = await import('leaflet');
        this.L = leaflet.default;
        this.map = this.L.map(this.containerId).setView(this.initialcenter, this.initialZoom); // Centra la mappa su Milano
        this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);
    }
    // colori del ping 
    colorByRssi(rssi) {
        const val = parseFloat(rssi);
        if (val >= -70) 
            return '#2ecc71';
        else if (val >= -90 && val <= -70)
            return '#f39c12';
        else if (val <= -90) 
            return '#e74c3c'
        return 'gray';
        
       
    }
    updateMarkers(gpsData,routerData)
    {
        if (!this.map || !this.L) return; // Assicurati che la mappa sia inizializzata
        this.markers.forEach(m => this.map.removeLayer(m)); // Rimuovi i marker esistenti
        this.markers=[]; // Resetta l'array dei marker
        gpsData.forEach(point => {
            const lat = parseFloat(point.Latitude);
            const lng = parseFloat(point.Longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
                const color = this.colorByRssi(point.Rssi);
                
                let distanzaHtml="";
                if(routerData && routerData.Latitude && routerData.Longitude){
                    const rLat=parseFloat(routerData.Latitude);
                    const rLon=parseFloat(routerData.Longitude);
                    if(!isNaN(rLat) && !isNaN(rLon)){
                        const dist =this.map.distance([lat,lng],[rLat,rLon])
                        distanzaHtml=`<br><b style ="color:#3b82f6;">Distanza Router:</b> ${Math.round(dist)} m`;
                    }
                }
                // --- 2. TEMPLATE SVG DINAMICO ---
                const svgIcon = this.L.divIcon({
                    className: 'custom-pin',
                    // Il fill="${color}" cambia il colore del pin in base all'RSSI
                    html: `
                        <svg viewBox="0 0 24 24" width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" 
                                  fill="${color}" 
                                  stroke="white" 
                                  stroke-width="1.5"/>
                        </svg>
                    `,
                    iconSize: [30, 30],
                    iconAnchor: [15, 30], // La punta del pin tocca le coordinate
                    popupAnchor: [0, -30]
                });
            const dataLeggibile = new Date(point.received_at).toLocaleString('it-IT', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            //card che compare sopra i ping 
            const marker = this.L.marker([point.Latitude, point.Longitude], { icon: svgIcon })
                .addTo(this.map)
                .bindPopup(`<b>DEVICE ID:</b> ${point.device_id}<br><b>Received at:</b> ${new Date(point.received_at).toLocaleString('it-IT')}
                <br><b>RSSI:</b> ${point.Rssi}<br><b>SNR:</b> ${point.Snr}
                <br><b>Latitude:</b> ${point.Latitude}
                <br><b>Longitude:</b> ${point.Longitude}
                ${distanzaHtml}
                <button class="btn_delete"   style="background-color: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; width: 100%; font-weight: bold; font-family: sans-serif;">Elimina</button>`
                
                );
            marker.on('popupopen',() =>{
                const btn = document.querySelector('.btn_delete');
                if(btn){
                    btn.onclick = ()=>{
                        if(this.onDeleteRecord){
                            this.onDeleteRecord(point.id)
                            /*this.map.removeLayer(marker);
                            this.markers = this.markers.filter(m => m !== marker);*/
                        }
                    }
                }

            })
                
            this.markers.push(marker);

        }});
    }
    updateRouterMarker(RouterData){
        
        if (!this.map || !this.L) return; // Assicurati che la mappa sia inizializzata
        if(this.routerMarker){
            this.map.removeLayer(this.routerMarker);
            this.routerMarker=null;
        }
        if (!RouterData) return;
        const Lat = parseFloat(RouterData.Latitude);
        const Lon = parseFloat(RouterData.Longitude);
        const routerID = RouterData.id || null;
        if(!isNaN(Lat) && !isNaN(Lon)){
            const wifiIcon= this.L.divIcon({
                className: 'custom-rputer-pin',
                html:`<svg viewBox="0 0 24 24" width="35" height="35" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="11" fill="#1e40af" stroke="white" stroke-width="2"/>
                        <path d="M6 9.5 C9 6, 15 6, 18 9.5 M8.5 12.5 C10.5 10.5, 13.5 10.5, 15.5 12.5 M11 15.5 C11.5 15, 12.5 15, 13 15.5" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>
                        <circle cx="12" cy="18" r="1.5" fill="white"/>
                    </svg>,`,
                iconSize:[35,35],
                icon:[17.5,17.5],
                popupAnchor:[0,-17]

            })
            this.routerMarker=this.L.marker([Lat,Lon],{icon: wifiIcon})
            .addTo(this.map)
            .bindPopup(`
                    <div style="text-align: center; font-family: sans-serif;">
                        <b style="color: #1e40af;">Gateway / Router</b><br>
                        Lat: ${Lat}<br>
                        Lon: ${Lon}<br><br>
                        <button class="btn-delete-router" style="background-color: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; width: 100%; font-weight: bold;">
                            Elimina Router
                        </button>
                    </div>
                `);
            this.routerMarker.on('popupopen',()=>{
                const btn =document.querySelector('.btn-delete-router');
                if(btn){
                    btn.onclick = ()=>{
                        if(this.onDeleteRouter){
                            this.onDeleteRouter(routerID);
                            
                        }
                    }
                }
            })
                    

        }
    }
        destroy()
        {
            if (this.map) {
                this.map.remove();
            }
        }
    
}