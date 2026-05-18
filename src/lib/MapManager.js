

export class MapManager 
{
    constructor(containerId, initialcenter=[44.6993, 10.6479], initialZoom=13) 
    {
        this.containerId=containerId;
        this.initialcenter=initialcenter;
        this.initialZoom=initialZoom;
        this.map=null;
        this.L=null;
        this.markers=[];
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
        return '#gray';
        
       
    }
    updateMarkers(gpsData)
    {
        if (!this.map || !this.L) return; // Assicurati che la mappa sia inizializzata
        this.markers.forEach(m => this.map.removeLayer(m)); // Rimuovi i marker esistenti
        this.markers=[]; // Resetta l'array dei marker
        gpsData.forEach(point => {
            const lat = parseFloat(point.Latitude);
            const lng = parseFloat(point.Longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
                const color = this.colorByRssi(point.Rssi);

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
            const marker = this.L.marker([point.Latitude, point.Longitude], { icon: svgIcon })
                .addTo(this.map)
                .bindPopup(`<b>DEVICE ID:</b> ${point.device_id}<br><b>Received at:</b> ${new Date(point.received_at).toLocaleString('it-IT')}
                <br><b>RSSI:</b> ${point.Rssi}<br><b>SNR:</b> ${point.Snr}
                <br><b>Latitude:</b> ${point.Latitude}
                <br><b>Longitude:</b> ${point.Longitude}`);
            this.markers.push(marker);

        }});
    }
        destroy()
        {
            if (this.map) {
                this.map.remove();
            }
        }
    
}