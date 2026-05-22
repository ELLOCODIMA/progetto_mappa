<script>
    import Table from '$lib/Table.svelte'; 
    let {
        datigps = [], 
        tableList = [], 
        selectedTable = '', 
        routerLat = $bindable(), // $bindable serve per l'input bidirezionale delle coordinate
        routerLon = $bindable(), 
        routerRecordId,
        limiteDati = $bindable(),
        onCambioTendina, 
        onRouterChange, 
        onExportPDF, 
        handleDeleteRecord,
        handleDeleteRouter,
        caricaTab
    }=$props();
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
        <div class="router-controls" style="display: flex; gap: 15px; align-items: center; justify-content: center; margin-bottom: 20px; background: white; padding: 12px 25px; border-radius: 12px; border: 1px solid #e2e8f0; width: fit-content; margin-left: auto; margin-right: auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <strong style="color: #1e40af; display: flex; align-items: center; gap: 6px;">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                    <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                    <line x1="12" y1="20" x2="12.01" y2="20"></line>
                </svg>
                Posizione Router:
            </strong>
            <div style="display: flex; align-items: center; gap: 5px;">
                <label for="r-lat" style="font-size: 14px; color: #64748;">Latitude:</label>
                <input id="r-lat" type="number" step="0.0001" placeholder="es. 10.647978" bind:value={routerLat} oninput={onRouterChange} style="width: 130px; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; outline: none;"/>

            </div>
            <div style="display: flex; align-items: center; gap: 5px;">
                <label for="r-lon" style="font-size: 14px; color: #64748;">Longitude:</label>
                <input id="r-lon" type="number" stp="0.0001" placeholder="es. 10.647978" bind:value={routerLon} oninput={onRouterChange} style="width: 130px; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; outline: none;"/>

            </div>
        </div>
        <div class="limit-wrapper" style="display: flex; align-items: center; gap: 8px;">
            <label for="limit-input" style="font-weight: 600; color: #2c3e50;">
                Mostra:

            </label>
            <input 
                id="limit-input"
                type="number"
                min="1"
                placeholder="100"
                bind:value={limiteDati}
                oninput={() => caricaTab(selectedTable)}
                style="width: 80px; padding: 12px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 16px; outline: none;"
            />

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
        <Table 
        dati={datigps}
        ondeleteRecord={handleDeleteRecord}
        routerData={{Latitude:routerLat,Longitude: routerLon,id:routerRecordId}} 
         />
    </div>
</main>