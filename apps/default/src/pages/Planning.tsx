import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Lock } from 'lucide-react';
import { getContrats, getBlocages, createBlocage, deleteBlocage, getVehicules } from '@/lib/api';
import { toast } from 'sonner';

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS_FR = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
const COLORS = ['bg-blue-200 text-blue-800','bg-emerald-200 text-emerald-800','bg-violet-200 text-violet-800','bg-amber-200 text-amber-800','bg-rose-200 text-rose-800','bg-cyan-200 text-cyan-800','bg-indigo-200 text-indigo-800','bg-orange-200 text-orange-800'];

export function Planning() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [contrats, setContrats] = useState<any[]>([]);
  const [blocages, setBlocages] = useState<any[]>([]);
  const [vehs, setVehs] = useState<any[]>([]);
  const [selected, setSelected] = useState<Date|null>(null);
  const [openBlock, setOpenBlock] = useState(false);
  const [formB, setFormB] = useState<any>({vehicule_id:'',vehicule_label:'',date_debut:'',date_fin:'',motif:'maintenance',notes:''});
  const [loading, setLoading] = useState(true);

  const load = async () => { setLoading(true); const [a,b,c] = await Promise.all([getContrats(),getBlocages(),getVehicules()]); setContrats(a);setBlocages(b);setVehs(c);setLoading(false); };
  useEffect(()=>{load();},[]);

  const firstDay = new Date(year,month,1).getDay();
  const startOffset = firstDay===0?6:firstDay-1;
  const daysInMonth = new Date(year,month+1,0).getDate();

  const getEventsForDay = (day: number) => {
    const d = new Date(year,month,day).toISOString().split('T')[0];
    const cs = contrats.filter(c=>c.statut_contrat==='actif'&&c.date_debut&&c.date_fin&&c.date_debut<=d&&c.date_fin>=d);
    const bs = blocages.filter(b=>b.date_debut&&b.date_fin&&b.date_debut<=d&&b.date_fin>=d);
    return {cs,bs};
  };

  const vehColorMap: Record<string,string> = {};
  contrats.forEach((c,i)=>{if(c.vehicule_id&&!vehColorMap[c.vehicule_id])vehColorMap[c.vehicule_id]=COLORS[Object.keys(vehColorMap).length%COLORS.length];});

  const selectedDate = selected?.toISOString().split('T')[0];
  const selCs = selected?contrats.filter(c=>c.statut_contrat==='actif'&&c.date_debut&&c.date_fin&&c.date_debut<=selectedDate!&&c.date_fin>=selectedDate!):[];
  const selBs = selected?blocages.filter(b=>b.date_debut&&b.date_fin&&b.date_debut<=selectedDate!&&b.date_fin>=selectedDate!):[];

  const saveBlock = async () => {
    if(!formB.vehicule_id||!formB.date_debut||!formB.date_fin){toast.error('Champs requis');return;}
    try{await createBlocage(formB);toast.success('Blocage créé');setOpenBlock(false);await load();}
    catch{toast.error('Erreur');}
  };

  const delBlock = async (id: string) => {
    try{await deleteBlocage(id);toast.success('Blocage supprimé');setBlocages(p=>p.filter(x=>x.id!==id));}catch{toast.error('Erreur');}
  };

  const prevMonth=()=>{if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);};
  const nextMonth=()=>{if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);};

  if(loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"/></div>;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Planning des Réservations</h2>
        <button onClick={()=>setOpenBlock(true)} className="flex items-center gap-2 bg-muted text-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-muted/80"><Lock className="w-4 h-4"/>Bloquer</button>
      </div>
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-muted text-xl">‹</button>
        <h3 className="text-lg font-semibold">{MONTHS_FR[month]} {year}</h3>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-muted text-xl">›</button>
      </div>
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 bg-muted/40 border-b border-border">
          {DAYS_FR.map(d=><div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({length:startOffset}).map((_,i)=><div key={`e${i}`} className="border-b border-r border-border/30 min-h-[60px] bg-muted/5"/>)}
          {Array.from({length:daysInMonth}).map((_,i)=>{
            const day=i+1;
            const {cs,bs}=getEventsForDay(day);
            const isToday=today.getDate()===day&&today.getMonth()===month&&today.getFullYear()===year;
            const isSelected=selected&&selected.getDate()===day&&selected.getMonth()===month&&selected.getFullYear()===year;
            return (
              <div key={day} onClick={()=>setSelected(new Date(year,month,day))} className={`border-b border-r border-border/30 min-h-[60px] p-1 cursor-pointer transition-colors ${isSelected?'bg-primary/10':bs.length?'bg-gray-50 dark:bg-gray-900/20':'hover:bg-muted/20'}`}>
                <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday?'bg-primary text-primary-foreground':''}`}>{day}</div>
                {bs.length>0&&<div className="text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded px-1 mb-0.5 truncate">🔒 {bs.length}</div>}
                {cs.slice(0,2).map((c:any)=><div key={c.id} className={`text-[10px] rounded px-1 mb-0.5 truncate ${vehColorMap[c.vehicule_id]||COLORS[0]}`}>{c.vehicule_label?.split('—')[0]}</div>)}
                {cs.length>2&&<div className="text-[10px] text-muted-foreground">+{cs.length-2}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {selected&&(
        <div className="rounded-2xl border border-border bg-card shadow-sm p-4">
          <h3 className="font-semibold mb-3">{selected.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</h3>
          {selCs.length===0&&selBs.length===0&&<p className="text-sm text-muted-foreground">Aucune réservation</p>}
          <div className="space-y-2">
            {selCs.map((c:any)=>(
              <div key={c.id} className={`rounded-xl p-3 ${vehColorMap[c.vehicule_id]||COLORS[0]}`}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{c.vehicule_label}</span><span className="font-mono text-xs">{c.id_contrat}</span>
                </div>
                <div className="text-xs mt-1">{c.nom_client} — {c.date_debut} → {c.date_fin}</div>
              </div>
            ))}
            {selBs.map((b:any)=>(
              <div key={b.id} className="rounded-xl p-3 bg-gray-100 dark:bg-gray-800">
                <div className="flex justify-between">
                  <div><span className="text-sm font-medium">🔒 {b.vehicule_label}</span><div className="text-xs text-muted-foreground">{b.motif} — {b.date_debut} → {b.date_fin}</div>{b.notes&&<div className="text-xs text-muted-foreground">{b.notes}</div>}</div>
                  <button onClick={()=>delBlock(b.id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {openBlock&&(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={()=>setOpenBlock(false)}>
          <div className="bg-card rounded-2xl border border-border w-full max-w-md p-6" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">Bloquer un Véhicule</h3><button onClick={()=>setOpenBlock(false)} className="text-xl text-muted-foreground">✕</button></div>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium mb-1">Véhicule *</label>
                <select value={formB.vehicule_id} onChange={e=>{const v=vehs.find(x=>x.id===e.target.value);setFormB((p:any)=>({...p,vehicule_id:e.target.value,vehicule_label:v?v.immatriculation+' — '+v.marque+' '+v.modele:''}));}} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
                  <option value="">-- Choisir --</option>{vehs.map(v=><option key={v.id} value={v.id}>{v.immatriculation} — {v.marque} {v.modele}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium mb-1">Date Début *</label><input type="date" value={formB.date_debut} onChange={e=>setFormB((p:any)=>({...p,date_debut:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"/></div>
              <div><label className="block text-xs font-medium mb-1">Date Fin *</label><input type="date" value={formB.date_fin} onChange={e=>setFormB((p:any)=>({...p,date_fin:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"/></div>
              <div><label className="block text-xs font-medium mb-1">Motif *</label>
                <select value={formB.motif} onChange={e=>setFormB((p:any)=>({...p,motif:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
                  <option value="maintenance">Maintenance</option><option value="externe">Réservation externe</option><option value="sinistre">Sinistre</option><option value="autre">Autre</option>
                </select>
              </div>
              <div><label className="block text-xs font-medium mb-1">Notes</label><input value={formB.notes} onChange={e=>setFormB((p:any)=>({...p,notes:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"/></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={()=>setOpenBlock(false)} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted">Annuler</button>
              <button onClick={saveBlock} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">Bloquer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
