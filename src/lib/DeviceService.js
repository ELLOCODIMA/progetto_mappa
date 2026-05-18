import { supabase } from "./supabase";

export class DeviceService {
    constructor(tableName) {
        
        this.tableName = tableName;
        this.subscription = null;
    }
    
    async fetchData(limit = 40) 
    {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .order('received_at', { ascending: false })
            .limit(limit);
        

        if (error) {
            console.error('Error fetching device data:', error);
            return [];
        }

        return data||[];
    }
    subscribeToChanges(onUpdate) 
    {
        this.subscription = supabase
            .channel('public:'+this.tableName)
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
}