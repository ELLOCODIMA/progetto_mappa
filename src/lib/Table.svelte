<script>
  
  import { onMount } from 'svelte';
    

    let { dati=[], ondeleteRecord } = $props();
    let rowId=$state(null);
    function formattaData(isoString) {
        const d = new Date(isoString);
        return d.toLocaleString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    function getColorByRssi(rssi) {
        const val = parseFloat(rssi);
        if (val >= -70) return '#28a745'; // Verde per segnale forte
        if (val >= -90 && val <= -70) return '#f39c12'; // Giallo per segnale medio
        if (val < -90) return '#e74c3c'; // Rosso (Scarso)
        return '#dc3545'; // Rosso per segnale debole
    }
    function toggleMenu(id,event){
        if (event) {
            event.stopPropagation();
        }
        if(rowId===id){
            rowId=null;
        } else {
            rowId=id;
        }
    }
    onMount(() => {
        const chiudiMenu = () => {
            rowId = null;
        };
        
        window.addEventListener('click', chiudiMenu);
        return () => {
            window.removeEventListener('click', chiudiMenu);
        };
    })
</script>
<div class="table-container">
    <table>
        <thead>
            <tr>
                <th>Device ID</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Timestamp</th>
                <th>Rssi</th>
                <th>Snr</th>
            </tr>
        </thead>
        <tbody>
            {#if dati.length === 0}
                <tr>
                    <td colspan="6" style="text-align: center;">Nessun dato disponibile</td>
                </tr>
            {/if}
            {#each dati as row}
                <tr>
                    <td><span class="badge">{row.device_id}</span></td>
                    
                    <td>{row.Latitude.toFixed(4)}</td> 
                    <td>{row.Longitude.toFixed(4)}</td>
                    <td class="timestamp">{formattaData(row.received_at)}</td>
                    <td><small>RSSI:</small> 
                        <span class="badge-rssi" style="background-color: {getColorByRssi(row.Rssi)}; color: white;">{row.Rssi} dBm</span>
                        
                        </td>
                    <td><small>SNR:</small> <b>{row.Snr}</b></td>
                    <td style="text-align: center; position: relative;">
                        <button class="btn-action" onclick={(event) => toggleMenu(row.id, event)}>
                                &#8942; </button>
                        {#if rowId === row.id}
                            <div class="dropdown-menu">
                                <button class="btn-delete" onclick={() => { if(confirm("Vuoi davvero eliminare questa riga dal database?")) ondeleteRecord(row.id)}}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                        Elimina
                                </button>
                            </div>
                        {/if}
                    </td>        
                    </tr>
            {/each}
        </tbody>
    </table>
</div>  
<style>
    .table-container { margin-top: 20px; border-radius: 8px; overflow: visible; border: 1px solid #ddd; }
    table { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 14px; }
    th { background: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; }
    td { padding: 12px; border-bottom: 1px solid #eee; }
    .timestamp { font-family: 'Courier New', monospace; color: #444; font-weight: bold; }
    .badge { background: #e9ecef; padding: 2px 8px; border-radius: 4px; font-weight: bold; }
    tr:hover { background-color: #fcfcfc; }
    .btn-action {
        background: none;
        border: none;
        color: #dc3545;
        cursor: pointer;
        border-radius: 50%;
        padding: 0 8px;
        transition: background 0.2s ease;
        
    }
    .btn-action:hover {
        background: rgba(220, 53, 69, 0.1);
        color: #000;
    }
    .dropdown-menu {
        position: absolute;
        right: 15px;
        top: 80%;
        background: white;
        border: 1px solid white;
        border-radius: 8px;
        box-shadow: 0 10px 15px rgba(0,0,0,0.1);
        
        z-index: 100;
        min-width: 130px;
        padding: 4px ;

    }
    .btn-delete {
        
        width: 100%;
        padding: 8px 12px;

        background: none;
        border: none;
        text-align: left;
        font-size: 13px;
        color: #dc3545;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        border-radius: 6px;
        transition: background 0.2s ease;
    }
    .btn-delete:hover {
        background: black;
    }
    .badge-rssi{
        display: inline-block;
        padding: 4px 10px;
        border-radius: 12px;
        color: white;
        font-weight: bold;
        font-size: 13px;
        margin-left: 6px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        text-shadow: 0 1px 1px rgba(0,0,0,0.2);
    }

</style>