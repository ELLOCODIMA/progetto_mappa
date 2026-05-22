import { supabase } from "./supabase";

export class DeviceService {
    constructor(tableName,limit) {
        
        this.tableName = tableName;
        this.subscription = null;
        this.limiteEffettivo=limit;
        
    }
    
    async fetchData(limit) 
    {
        if (limit !== undefined) {
            this.limiteEffettivo = limit;
        }
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .order('received_at', { ascending: false })
            .limit(this.limiteEffettivo);
        

        if (error) {
            console.error('Error fetching device data:', error);
            return [];
        }

        return data||[];
    }
    subscribeToChanges(onUpdate) 
    {
        const nomeCanale = 'canale_' + this.tableName + '_' + Date.now();
        this.subscription = supabase
            .channel(nomeCanale)
            .on('postgres_changes', { event: '*', schema: 'public', table: this.tableName }, async (payload) => {
                console.log('Change received:', payload);
                const newData = await this.fetchData();
                onUpdate(newData);// Avvisa il componente Svelte
            })
            this.subscription.subscribe(status => {
                console.log('subscription status:', status);
            });
    }
    unsubscribe() {
        if (this.subscription) {
            supabase.removeChannel(this.subscription);
            this.subscription = null;
            
        }
    }
    async deleteRecord(id){
        const { error } = await supabase
            .from(this.tableName)
            .delete()
            .eq('id', id);
        if (error) {
            console.error('Error deleting record:', error);
        }
        return true;
    }
    async getTableList(){
        const { data, error } = await supabase.rpc('get_public_tables');
            
        if (error) {
            console.error('--- ERRORE RPC SUPABASE ---');
            console.error('Codice:', error.code);
            console.error('Messaggio:', error.message);
            console.error('Dettagli:', error.details);
            console.error('Suggerimento:', error.hint);
            return [];
        }
        if (!data || data.length === 0) {
            console.warn('Nessuna tabella trovata nel database.');
            return [];
        }
        const nomitabelle = data.map(item => {if(typeof item==='object'&& item!==null)
            {
                return item.tablename;
            }});
        return nomitabelle;
    }
    async getRouterPosition()
    {
        const{data, error}= await supabase
        .schema('Router_position')
        .from('pos_Router')
        .select('*')
        .order('id',{ascending:false})
        .limit(1);
        if (error) 
        {
            console.error("Errore nel recupero del router:", error.message);
            return null;
        }
        return data && data.length > 0 ? data[0] : null;    
    }
    async upsertRouterPosition(payload)
    {
        const{data, error}= await supabase
        .schema('Router_position')
        .from('pos_Router')
        .upsert(payload, { onConflict: 'id' })
        .select();

        if (error) 
        {
            console.error("Errore nel salvataggio del router:", error.message);
            return null;
        }
        return data && data.length > 0 ? data[0] : null;
    }   
    async deleteRouterPosition(routerid){
        if(!routerid) return true;
        const { error } = await supabase
        .schema('Router_position')
        .from('pos_Router')
        .delete()
        .eq('id', routerid);
        if (error) 
            {
            console.error("Errore nella cancellazione del router:", error.message);
            return false;
        }
        return true;
    }
}