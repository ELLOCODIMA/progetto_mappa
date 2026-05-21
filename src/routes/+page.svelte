<script>
    
    import { onMount } from 'svelte';
    //import 'leaflet/dist/leaflet.css';
    
    import { MapManager } from '$lib/MapManager';
    import { DeviceService } from '$lib/DeviceService';
    import { exportToPDF } from '$lib/PdfExporter';
    import Table from '$lib/Table.svelte';
    import DashboardLayout from '$lib/DashboardLayout.svelte';
    let mapManager;
    let deviceService;
    let limiteDati=$state(100)
    let datigps=$state([]);
    let tableList=$state([]);
    let selectedTable=$state('');
    let routerLat=$state();
    let routerLon=$state();
    let routerRecordId =$state(null);
    async function onRouterChange(){
        if (!routerLat || !routerLon) return;
        if(mapManager){
            mapManager.updateRouterMarker(routerLat,routerLon,routerRecordId);

        }
        const payload ={
            Latitude: routerLat,
            Longitude : routerLon
        };
        if (routerRecordId){
            payload.id=routerRecordId;
        }
        const savedRouter= await deviceService.upsertRouterPosition(payload);
         if (result) {
        routerLat = '';  // ← svuota i campi
        routerLon = '';  // ← svuota i campi
        // oppure i nomi delle tue variabili Svelte legate agli input
        }
    }
    async function handleDeleteRouter() {
        if (!confirm("Vuoi davvero eliminare la posizione del router dal database?")) {
            return;
        }

        if (routerRecordId) {
            // Chiediamo al servizio di cancellarlo
            const successo = await deviceService.deleteRouterPosition(routerRecordId);
            if (!successo) return;
        }

        routerLat = null;
        routerLon = null;
        routerRecordId = null;
        if (mapManager) {
            mapManager.clearRouterMarker();
        }
    }
    async function caricaTab(nomeTab) {
        if (!nomeTab) return;
        if (deviceService){
            deviceService.unsubscribe();
        }
        const limiteEffettivo= limiteDati ;
        deviceService = new DeviceService(nomeTab,limiteEffettivo);
        
        datigps = await deviceService.fetchData(limiteEffettivo);
        if (mapManager) {
            mapManager.updateMarkers(datigps);
        }
        deviceService.subscribeToChanges((newData) => {
            datigps = newData;
            if (mapManager) {
                mapManager.updateMarkers(datigps);
            }
        });
    }
    
    onMount(async () => 
    {

  
        
        await import('leaflet/dist/leaflet.css');
        mapManager = new MapManager('map-container',handleDeleteRecord);
        deviceService = new DeviceService('Lora_E5');
        await mapManager.init();

        const routerData = await deviceService.getRouterPosition();
        if (routerData) {
            routerLat = routerData.Latitude;
            routerLon = routerData.Longitude;
            routerRecordId = routerData.id;
            mapManager.updateRouterMarker(routerLat, routerLon, routerRecordId);
        }



        const list = await deviceService.getTableList();
        if (list && list.length > 0) {
            tableList = list;
            if( tableList.includes('Lora_E5')){
                selectedTable = 'Lora_E5';
            } else {
                selectedTable = tableList[0];
            }
            await caricaTab(selectedTable);
        } else {
            console.error('Nessuna tabella disponibile');
        }
        
        return () => {
            mapManager.destroy();
            if (deviceService) {
                deviceService.unsubscribe();
            }
        };
    })
    async function handleDeleteRecord(id)
    {

        if(!confirm("Vuoi davvero eliminare questa riga dal database?")){
            return;
        }
        const successo = await deviceService.deleteRecord(id);
        if(successo){
            datigps = datigps.filter(record => record.id !== id);
            mapManager.updateMarkers(datigps);
        } else {
            console.error('Errore durante l\'eliminazione del record');
        }
    }
    
    function onCambioTendina(event)
    {
        selectedTable = event.target.value;
        datigps = [];
        if (mapManager) {
            mapManager.updateMarkers([]);
        }
            
        caricaTab(selectedTable);
    }
    async function onExportPDF()
    {
        const mapContainer = document.getElementById('map-container');
        await exportToPDF(mapContainer,datigps,selectedTable);
    }

</script>

<DashboardLayout 
    bind:limiteDati={limiteDati}
    bind:routerLat={routerLat}
    bind:routerLon={routerLon}
    datigps={datigps}
    tableList={tableList}
    selectedTable={selectedTable}
    onCambioTendina={onCambioTendina}
    onRouterChange={onRouterChange}
    onExportPDF={onExportPDF}
    handleDeleteRecord={handleDeleteRecord}
/>
<style>
    @import "./+page.css";
</style>