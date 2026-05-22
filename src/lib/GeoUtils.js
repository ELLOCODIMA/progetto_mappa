export function CalcolaDistanza(latPing,lonPing,rData){
        if(!latPing||!lonPing||!rData.Latitude||!rData.Longitude)return '-';
        const latR= parseFloat(rData.Latitude);
        const lonR= parseFloat(rData.Longitude);
        const R = 6371e3; 
        const p1 = latPing * Math.PI/180;
        const p2 = latR * Math.PI/180;
        const dp = (latR-latPing) * Math.PI/180;
        const dl = (lonR-lonPing) * Math.PI/180;
        const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return Math.round(R * c) + ' m';
    }