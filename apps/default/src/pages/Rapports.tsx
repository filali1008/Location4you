import React, { useEffect, useState } from 'react';
import { getContrats, getChargesVehicules, getChargesGenerales, getFactures, formatMAD } from '@/lib/api';
import { StatsCard } from '@/components/shared/StatsCard';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

export function Rapports() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth()+1);
  const [year, setYear] = useState(today.getFullYear());
  const [data, setData] = useState<any>({contrats:[],chargesVeh:[],chargesGen:[],factures:[]});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const r = await Promise.allSettled([getContrats(),getChargesVehicules(),getChargesGenerales(),getFactures()]);
    setData({contrats:r[0].status==='fulfilled'?r[0].value:[],chargesVeh:r[1].status==='fulfilled'?r[1].value:[],chargesGen:r[2].status==='fulfilled'?r[2].value:[],factures:r[3].status==='fulfilled'?r[3].value:[]});
    setLoading(false);
  };
  useEffect(()=>{load();},[]);

  const pad = (n: number) => n.toString().padStart(2,'0');
  const prefix = `${year}-${pad(month)}`;

  const recettes = data.factures.filter((f:any)=>f.statut==='payee'&&f.date_facture?.startsWith(prefix)).reduce((s:number,f:any)=>s+(f.montant||0),0);
  const totCV = data.chargesVeh.filter((c:any)=>c.date?.startsWith(prefix)).reduce((s:number,c:any)=>s+(c.montant||0),0);
  const totCG = data.chargesGen.filter((c:any)=>c.date?.startsWith(prefix)).reduce((s:number,c:any)=>s+(c.montant||0),0);
  const totalCharges = totCV+totCG;
  const resultat = recettes-totalCharges;
  const factEnc = data.factures.filter((f:any)=>f.statut==='payee'&&f.date_facture?.startsWith(prefix)).length;

  const contratsMois = data.contrats.filter((c:any)=>c.date_debut?.startsWith(prefix)||c.date_fin?.startsWith(prefix));

  if(loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"/></div>;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Rapports Financiers</h2>
        <div className="flex gap-3 mt-3">
          <select value={month} onChange={e=>setMonth(Number(e.target.value))} className="px-3 py-2 rounded-xl border border-border bg-background text-sm">
            {Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{new Date(2000,i).toLocaleString('fr-FR',{month:'long'})}</option>)}
          </select>
          <select value={year} onChange={e=>setYear(Number(e.target.value))} className="px-3 py-2 rounded-xl border border-border bg-background text-sm">
            {[2023,2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatsCard title="Recettes" value={formatMAD(recettes)} icon={<TrendingUp className="w-5 h-5"/>} color="green" trend="up"/>
        <StatsCard title="Charges Flotte" value={formatMAD(totCV)} icon={<BarChart3 className="w-5 h-5"/>} color="orange"/>
        <StatsCard title="Charges Générales" value={formatMAD(totCG)} icon={<BarChart3 className="w-5 h-5"/>} color="red"/>
        <StatsCard title="Total Charges" value={formatMAD(totalCharges)} icon={<BarChart3 className="w-5 h-5"/>} color="orange"/>
        <StatsCard title="Résultat Net" value={formatMAD(resultat)} icon={resultat>=0?<TrendingUp className="w-5 h-5"/>:<TrendingDown className="w-5 h-5"/>} color={resultat>=0?'green':'red'}/>
        <StatsCard title="Factures Encaissées" value={factEnc} icon={<TrendingUp className="w-5 h-5"/>} color="blue"/>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm p-4">
        <h3 className="font-semibold mb-3">Contrats du Mois ({contratsMois.length})</h3>
        {contratsMois.length===0?<p className="text-sm text-muted-foreground">Aucun contrat ce mois</p>:(
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>{['Client','Véhicule','Période','Total'].map(h=><th key={h} className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase">{h}</th>)}</tr>
              </thead>
              <tbody>
                {contratsMois.map((c:any)=>(
                  <tr key={c.id} className="border-b border-border/50">
                    <td className="py-2 px-3">{c.nom_client}</td>
                    <td className="py-2 px-3">{c.vehicule_label}</td>
                    <td className="py-2 px-3 text-xs">{c.date_debut} → {c.date_fin}</td>
                    <td className="py-2 px-3 font-medium">{formatMAD(c.total_du)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={`rounded-2xl border p-4 ${resultat>=0?'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20':'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'}`}>
        <h3 className={`font-bold text-lg ${resultat>=0?'text-green-800 dark:text-green-400':'text-red-800 dark:text-red-400'}`}>
          Résultat Net : {formatMAD(resultat)} {resultat>=0?'✅':'❌'}
        </h3>
        <p className={`text-sm mt-1 ${resultat>=0?'text-green-700 dark:text-green-500':'text-red-700 dark:text-red-500'}`}>
          Recettes {formatMAD(recettes)} — Charges {formatMAD(totalCharges)}
        </p>
      </div>
    </div>
  );
}
