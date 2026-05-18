<script>
    
    import { onMount } from 'svelte';
    //import 'leaflet/dist/leaflet.css';
    
    import { MapManager } from '$lib/MapManager';
    import { DeviceService } from '$lib/DeviceService';
    import { exportToPDF } from '$lib/PdfExporter';
    import Table from '$lib/Table.svelte';
  
    let mapManager;
    let deviceService;
    let datigps=$state([]);
    let tableList=$state([]);
    let selectedTable=$state('');
    async function caricaTab(nomeTab) {
        if (!nomeTab) return;
        if (deviceService){
            deviceService.unsubscribe();
        }
        deviceService = new DeviceService(nomeTab);
        datigps = await deviceService.fetchData();
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

  // async perché dobbiamo "aspettare" la risposta di Supabase
       /* const { data, error } = await supabase
            .from('Lora_E5')
            .select('*')

        console.log('data:', data)
        console.log('error:', error)
        dati = data*/
        await import('leaflet/dist/leaflet.css');
        mapManager = new MapManager('map-container');
        deviceService = new DeviceService('Lora_E5');
        await mapManager.init();
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

<main class="dashboard-container">
    <h1>Wireless Signal Tracker</h1>
    <div class="controls">
        <div class="select-wrapper">
            <svg class="select-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
            <select id="table-select" onchange={onCambioTendina} bind:value={selectedTable}>
                {#if tableList.length==0}
                    <option value="" disabled>Caricamento tabelle...</option>
                {:else}
                    
                    {#each tableList as tabella}
                        <option value={tabella}>{tabella}</option>
                    {/each}
                {/if}
            </select>
        </div>
        <button class="btn-download" onclick={onExportPDF}>
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Scarica PDF
        </button>
    </div>
    <div id="map-container" ></div>
    <div class="table-wrapper">
        <Table dati={datigps} ondeleteRecord={handleDeleteRecord}/>
    </div>
</main>
<style>
    /* 1. CONTAINER GENERALE (Layout di sfondo) */
    .dashboard-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        background-color: #f8fafc; /* Grigio chiarissimo stile Apple/Tailwind */
        min-height: 100vh;
    }

    /* 2. TITOLO MODERNO (Gradiente dinamico e font-weight estremo) */
    h1 {
        text-align: center;
        font-size: 2.8rem;
        font-weight: 800; /* Più marcato */
        margin-top: 10px;
        margin-bottom: 35px;
        letter-spacing: -1.5px; /* Più stretto in stile tech */
        
        /* Gradiente da Verde LoRa a Blu Tech */
        background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        
        /* Un leggero drop-shadow sul testo */
        filter: drop-shadow(0px 2px 8px rgba(16, 185, 129, 0.1));
    }

    /* CONTROLS SECTION */
    .controls {
        display: flex;
        justify-content: center;
        gap: 15px;
        align-items: center;
        margin-bottom: 30px;
        flex-wrap: wrap;
    }

    /* SELECT WRAPPER CON ICONA */
    .select-wrapper {
        position: relative;
        display: inline-block;
        width: 100%;
        max-width: 300px;
    }

    .select-icon {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        width: 20px;
        height: 20px;
        color: #64748b;
        pointer-events: none;
        z-index: 10;
    }

    #table-select {
        width: 100%;
        padding: 14px 45px 14px 16px;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 500;
        color: #2c3e50;
        background-color: #ffffff;
        cursor: pointer;
        transition: all 0.3s ease;
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    #table-select:hover {
        border-color: #3b82f6;
        box-shadow: 0 4px 12px -2px rgba(59, 130, 246, 0.1);
    }

    #table-select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 
                    0 4px 12px -2px rgba(59, 130, 246, 0.15);
        background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
    }

    #table-select option {
        padding: 12px;
        color: #2c3e50;
        background-color: #ffffff;
    }

    #table-select option:checked {
        background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
        color: white;
    }

    /* DOWNLOAD BUTTON */
    .btn-download {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 14px 24px;
        border: none;
        border-radius: 12px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px -2px rgba(16, 185, 129, 0.3);
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        white-space: nowrap;
    }

    .btn-download:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px -2px rgba(16, 185, 129, 0.4);
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
    }

    .btn-download:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px -2px rgba(16, 185, 129, 0.3);
    }

    .btn-icon {
        width: 20px;
        height: 20px;
        stroke: currentColor;
    }

    /* 3. IL CONTAINER DELLA MAPPA (Effetto vetro sfumato) */
    #map-container {
        width: 100%;
        height: 500px; /* Altezza generosa per vedere bene i punti */
        border-radius: 16px; /* Angoli decisamente più morbidi */
        background-color: #ffffff;
        border: 1px solid #e2e8f0;
        
        /* Ombra moderna e profonda (soft shadow) */
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 
                    0 8px 10px -6px rgba(0, 0, 0, 0.05);
        
        margin-bottom: 40px;
        overflow: hidden; /* Evita che la mappa esca dagli angoli arrotondati */
        transition: transform 0.3s ease;
    }
    
    /*#map-container:hover {
        transform: translateY(-2px); // Effetto sollevamento impercettibile 
    }*/

    /* 4. WRAPPER PER LA TABELLA */
    /* Avvolgere la tabella permette di darle bordi arrotondati e scroll laterale su mobile */
    .table-wrapper {
        background: #ffffff;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 
                    0 2px 4px -1px rgba(0, 0, 0, 0.02);
        padding: 15px;
        padding-bottom: 60px; /* Rimuove padding inferiore per allineare meglio con la tabella */
        overflow-x: auto;
        overflow-y: visible; /* Evita crash su smartphone */
    }
</style>