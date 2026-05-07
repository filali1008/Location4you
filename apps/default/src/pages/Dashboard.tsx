import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, FileText, TrendingUp, AlertTriangle, CheckCircle, Wrench, DollarSign, Clock } from 'lucide-react';
import { getVehicules, getContrats, getChargesVehicules, getChargesGenerales, getFactures, daysUntil, formatMAD } from '@/lib/api';
import { StatsCard } from '@/components/shared/StatsCard';
import { StatusBadge } from '@/components/shared/StatusBadge';

function AlertBadge({ icon, label, count, color, onClick }: any) {
  const cls: Record<string, string> = {
    red: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  };
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-sm transition-colors ${cls[color] || cls.orange}`}>
      <div className="flex items-center gap-2">{icon}<span>{label}</span></div>
      <span className="font-bold">{count}</span>
    </button>
  );
}

function ChargesBreakdown({ chargesVeh, chargesGen }: any) {
  const labels: Record<string, string> = {
    carburant:'Carburant',lavage:'Lavage',vidange:'Vidange',visite:'Visite tech.',
    assurance:'Assurance',fradmin:'Frais admin',infractions:'Infractions',
    peages:'Péages',parking:'Parking',adblue:'AdBlue',reparation:'Réparation',
    autres:'Autres',loyer:'Loyer',salaires:'Salaires',marketing:'Marketing',
    frfixes:'Frais fixes',telecom:'Télécom',autre:'Autre',
  };
  const byType: Record<string, number> = {};
  chargesVeh.forEach((c: any) => { byType[c.type_charge] = (byType[c.type_charge]||0)+(c.montant||0); });
  chargesGen.forEach((c: any) => { byType[c.categorie] = (byType[c.categorie]||0)+(c.montant||0); });
  const total = Object.values(byType).reduce((s,v)=>s+v,0);
  const sorted = Object.entries(byType).sort((a,b)=>b[1]-a[1]);
  if (!sorted.length) return <p className="text-sm text-muted-foreground py-4 text-center">Aucune charge enregistrée</p>;
  return (
    <div className="space-y-2">
      {sorted.map(([type, amount]) => {
        const pct = total > 0 ? (amount/total)*100 : 0;
        return (
          <div key={type} className="flex items-center gap-3">
            <span className="text-sm w-28 truncate text-muted-foreground">{labels[type]||type}</span>
            <div className="flex-1 bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{width:`${pct}%`}} />
            </div>
            <span className="text-sm font-medium w-24 text-right">{formatMAD(amount)}</span>
          </div>
        );
      })}
      <div className="pt-2 border-t border-border flex justify-between text-sm font-semibold">
        <span>Total</span><span>{formatMAD(total)}</span>
      </div>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const [data,setData] = useState<any>({vehicules:[],contrats:[],chargesVeh:[],chargesGen:[],factures:[]});
  const [loading,setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const r = await Promise.allSettled([getVehicules(),getContrats(),getChargesVehicules(),getChargesGenerales(),getFactures()]);
    setData({
      vehicules: r[0].status==='fulfilled'?r[0].value:[],
      contrats: r[1].status==='fulfilled'?r[1].value:[],
      chargesVeh: r[2].status==='fulfilled'?r[2].value:[],
      chargesGen: r[3].status==='fulfilled'?r[3].value:[],
      factures: r[4].status==='fulfilled'?r[4].value:[],
    });
    setLoading(false);
  },[]);

  useEffect(()=>{loadData();},[loadData]);

  const today = new Date().toISOString().split('T')[0];
  const actifs = data.contrats.filter((c:any)=>c.statut_contrat==='actif');
  const lcd = actifs.filter((c:any)=>{ if(!c.date_debut||!c.date_fin) return false; return Math.round((new Date(c.date_fin).getTime()-new Date(c.date_debut).getTime())/86400000)<30; });
  const lld = actifs.filter((c:any)=>{ if(!c.date_debut||!c.date_fin) return false; return Math.round((new Date(c.date_fin).getTime()-new Date(c.date_debut).getTime())/86400000)>=30; });
  const valeur = data.vehicules.reduce((s:number,v:any)=>s+(v.valeur_achat||0),0);
  const aVTCrit = data.vehicules.filter((v:any)=>{ const d=daysUntil(v.date_prochaine_visite_technique); return d!==Infinity&&d<=15; });
  const aVTWarn = data.vehicules.filter((v:any)=>{ const d=daysUntil(v.date_prochaine_visite_technique); return d!==Infinity&&d>15&&d<=30; });
  const aAssurCrit = data.vehicules.filter((v:any)=>{ const d=daysUntil(v.date_fin_assurance); return d!==Infinity&&d<=15; });
  const aAssurWarn = data.vehicules.filter((v:any)=>{ const d=daysUntil(v.date_fin_assurance); return d!==Infinity&&d>15&&d<=30; });
  const aCGCrit = data.vehicules.filter((v:any)=>{ const d=daysUntil(v.date_fin_carte_grise); return d!==Infinity&&d<=15; });
  const aCGWarn = data.vehicules.filter((v:any)=>{ const d=daysUntil(v.date_fin_carte_grise); return d!==Infinity&&d>15&&d<=30; });
  const aVT = [...aVTCrit, ...aVTWarn];
  const aAssur = [...aAssurCrit, ...aAssurWarn];
  const aCG = [...aCGCrit, ...aCGWarn];
  const aFact = data.factures.filter((f:any)=>{ if(!['enattente','envoyee'].includes(f.statut)||!f.date_facture) return false; return Math.round((new Date(today).getTime()-new Date(f.date_facture).getTime())/86400000)>7; });
  const aContrats = actifs.filter((c:any)=>{ const d=daysUntil(c.date_fin); return d!==Infinity&&d<=3; });
  const totalAlertes = aVT.length+aAssur.length+aCG.length+aFact.length+aContrats.length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"/></div>;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Tableau de Bord</h2>
        <p className="text-muted-foreground text-sm mt-1">Vue d'ensemble — {today}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <StatsCard title="LCD Actifs" value={lcd.length} icon={<FileText className="w-5 h-5"/>} color="blue" onClick={()=>navigate('/locations?type=lcd')}/>
        <StatsCard title="LLD Actifs" value={lld.length} icon={<FileText className="w-5 h-5"/>} color="purple" onClick={()=>navigate('/locations?type=lld')}/>
        <StatsCard title="Total Flotte" value={data.vehicules.length} icon={<Car className="w-5 h-5"/>} color="blue"/>
        <StatsCard title="En Location" value={data.vehicules.filter((v:any)=>v.statut==='enlocation').length} icon={<Car className="w-5 h-5"/>} color="green"/>
        <StatsCard title="Disponibles" value={data.vehicules.filter((v:any)=>v.statut==='disponible').length} icon={<CheckCircle className="w-5 h-5"/>} color="green"/>
        <StatsCard title="Maintenance" value={data.vehicules.filter((v:any)=>['enmaintenance','horsservice'].includes(v.statut)).length} icon={<Wrench className="w-5 h-5"/>} color="orange"/>
        <StatsCard title="Vendus" value={data.vehicules.filter((v:any)=>v.statut==='vendu').length} icon={<Car className="w-5 h-5"/>} color="gray"/>
        <StatsCard title="Valeur Flotte" value={formatMAD(valeur)} icon={<DollarSign className="w-5 h-5"/>} color="green"/>
        <StatsCard title="Alertes" value={totalAlertes} icon={<AlertTriangle className="w-5 h-5"/>} color={totalAlertes>0?"red":"green"}/>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-2xl border border-border bg-card shadow-sm p-4">
          <h3 className="font-semibold mb-3">Répartition des Charges</h3>
          <ChargesBreakdown chargesVeh={data.chargesVeh} chargesGen={data.chargesGen}/>
        </div>
        <div className="rounded-2xl border border-border bg-card shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Alertes</h3>
            {totalAlertes>0&&<span className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">{totalAlertes}</span>}
          </div>
          <div className="space-y-2">
            {aVTCrit.length>0&&<AlertBadge icon={<Wrench className="w-3 h-3"/>} label="⚠️ VT critique (≤15j)" count={aVTCrit.length} color="red" onClick={()=>navigate('/flotte')}/>}
            {aVTWarn.length>0&&<AlertBadge icon={<Wrench className="w-3 h-3"/>} label="VT bientôt (16-30j)" count={aVTWarn.length} color="orange" onClick={()=>navigate('/flotte')}/>}
            {aAssurCrit.length>0&&<AlertBadge icon={<AlertTriangle className="w-3 h-3"/>} label="⚠️ Assurance critique (≤15j)" count={aAssurCrit.length} color="red" onClick={()=>navigate('/flotte')}/>}
            {aAssurWarn.length>0&&<AlertBadge icon={<AlertTriangle className="w-3 h-3"/>} label="Assurance bientôt (16-30j)" count={aAssurWarn.length} color="orange" onClick={()=>navigate('/flotte')}/>}
            {aCGCrit.length>0&&<AlertBadge icon={<FileText className="w-3 h-3"/>} label="⚠️ Carte grise critique (≤15j)" count={aCGCrit.length} color="red" onClick={()=>navigate('/flotte')}/>}
            {aCGWarn.length>0&&<AlertBadge icon={<FileText className="w-3 h-3"/>} label="Carte grise bientôt (16-30j)" count={aCGWarn.length} color="orange" onClick={()=>navigate('/flotte')}/>}
            {aFact.length>0&&<AlertBadge icon={<Clock className="w-3 h-3"/>} label="Factures en retard" count={aFact.length} color="red" onClick={()=>navigate('/factures')}/>}
            {aContrats.length>0&&<AlertBadge icon={<AlertTriangle className="w-3 h-3"/>} label="Contrats se terminant" count={aContrats.length} color="amber" onClick={()=>navigate('/locations')}/>}
            {totalAlertes===0&&<p className="text-sm text-muted-foreground text-center py-4">✅ Aucune alerte</p>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Contrats Actifs</h3>
          <button onClick={()=>navigate('/locations')} className="text-sm text-primary hover:underline">Voir tous →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                <th className="text-left py-2 px-2">Client</th>
                <th className="text-left py-2 px-2 hidden sm:table-cell">Véhicule</th>
                <th className="text-right py-2 px-2">Total</th>
                <th className="text-left py-2 px-2 hidden sm:table-cell">Paiement</th>
              </tr>
            </thead>
            <tbody>
              {actifs.slice(0,10).map((c:any)=>(
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="py-2 px-2 font-medium">{c.nom_client}<div className="text-xs text-muted-foreground">{c.date_debut} → {c.date_fin}</div></td>
                  <td className="py-2 px-2 text-muted-foreground hidden sm:table-cell">{c.vehicule_label}</td>
                  <td className="py-2 px-2 text-right font-medium">{formatMAD(c.total_du)}</td>
                  <td className="py-2 px-2 hidden sm:table-cell"><StatusBadge status={c.statut_paiement}/></td>
                </tr>
              ))}
              {actifs.length===0&&<tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Aucun contrat actif</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
