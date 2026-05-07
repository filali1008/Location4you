import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Upload, Wallet } from 'lucide-react';
import { getChargesVehicules, createChargeVehicule, deleteChargeVehicule, getChargesGenerales, createChargeGenerale, deleteChargeGenerale, getVehicules, applyVehicleUpdatesFromCharge, formatMAD } from '@/lib/api';
import { StatsCard } from '@/components/shared/StatsCard';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { toast } from 'sonner';

const TYPE_LABELS: Record<string,string> = {carburant:'Carburant',lavage:'Lavage',vidange:'Vidange',visite:'Visite technique',assurance:'Assurance',fradmin:'Frais admin',infractions:'Infractions',peages:'Péages',parking:'Parking',adblue:'AdBlue',reparation:'Réparation',autres:'Autres'};
const CAT_LABELS: Record<string,string> = {loyer:'Loyer',salaires:'Salaires',marketing:'Marketing',frfixes:'Frais fixes',telecom:'Télécom',autre:'Autre'};
const KM_TYPES = ['vidange','visite','reparation','adblue'];

export function Charges() {
  const [tab, setTab] = useState(0);
  const [cv, setCv] = useState<any[]>([]);
  const [cg, setCg] = useState<any[]>([]);
  const [vehs, setVehs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openVeh, setOpenVeh] = useState(false);
  const [openGen, setOpenGen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [fv, setFv] = useState<any>({date:'',vehicule_id:'',vehicule_label:'',type_charge:'carburant',montant:'',description:'',km_au_moment:'',prochaine_vt:'',nouvelle_fin_assurance:'',prochaine_vidange:''});
  const [fg, setFg] = useState<any>({date:'',categorie:'loyer',montant:'',description:''});
  const [saving, setSaving] = useState(false);

  const load = async () => { setLoading(true); const [a,b,c] = await Promise.all([getChargesVehicules(),getChargesGenerales(),getVehicules()]); setCv(a);setCg(b);setVehs(c);setLoading(false); };
  useEffect(()=>{load();},[]);

  const totCV = cv.reduce((s,x)=>s+(x.montant||0),0);
  const totCG = cg.reduce((s,x)=>s+(x.montant||0),0);

  const saveVeh = async () => {
    if(!fv.vehicule_id||!fv.montant||!fv.date){toast.error('Champs requis');return;}
    setSaving(true);
    try {
      await createChargeVehicule(fv);
      // Apply vehicle updates from charge
      const vehUpdates: any = {};
      if(fv.type_charge==='visite'&&fv.prochaine_vt) vehUpdates.date_prochaine_visite_technique=fv.prochaine_vt;
      if(fv.type_charge==='assurance'&&fv.nouvelle_fin_assurance) vehUpdates.date_fin_assurance=fv.nouvelle_fin_assurance;
      if(fv.type_charge==='vidange') vehUpdates.date_derniere_vidange=fv.date;
      const km = Number(fv.km_au_moment);
      const applied = await applyVehicleUpdatesFromCharge(fv.vehicule_id, vehUpdates, KM_TYPES.includes(fv.type_charge)?km:0);
      if(applied?.km_actuel) toast.success(`KM mis à jour sur la fiche véhicule : ${applied.km_actuel.toLocaleString()} km`);
      if(applied?.date_prochaine_visite_technique) toast.success(`Prochaine VT mise à jour : ${applied.date_prochaine_visite_technique}`);
      if(applied?.date_fin_assurance) toast.success(`Date fin assurance mise à jour`);
      toast.success('Charge ajoutée');
      setOpenVeh(false);
      setFv({date:'',vehicule_id:'',vehicule_label:'',type_charge:'carburant',montant:'',description:'',km_au_moment:'',prochaine_vt:'',nouvelle_fin_assurance:'',prochaine_vidange:''});
      await load();
    } catch{toast.error('Erreur');}finally{setSaving(false);}
  };

  const handleImportCV = async (rows: Record<string,string>[]) => {
    let inserted=0; const errors: {line:number;reason:string}[] = [];
    for(let i=0;i<rows.length;i++){
      const r=rows[i];
      try{await createChargeVehicule({...r,montant:Number(r.montant)||0});inserted++;}
      catch{errors.push({line:i+2,reason:'Erreur serveur'});}
    }
    await load(); return {inserted,errors};
  };
  const saveGen = async () => {
    if(!fg.montant||!fg.date){toast.error('Champs requis');return;}
    setSaving(true);
    try{await createChargeGenerale(fg);toast.success('Charge ajoutée');setOpenGen(false);await load();}
    catch{toast.error('Erreur');}finally{setSaving(false);}
  };

  if(loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"/></div>;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <h2 className="text-2xl font-bold">Gestion des Charges</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatsCard title="Charges Flotte" value={formatMAD(totCV)} icon={<Wallet className="w-5 h-5"/>} color="orange"/>
        <StatsCard title="Charges Générales" value={formatMAD(totCG)} icon={<Wallet className="w-5 h-5"/>} color="red"/>
        <StatsCard title="Total" value={formatMAD(totCV+totCG)} icon={<Wallet className="w-5 h-5"/>} color="purple"/>
      </div>
      <div className="flex gap-2">
        {['Charges Flotte','Charges Générales'].map((t,i)=><button key={i} onClick={()=>setTab(i)} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab===i?'bg-primary text-primary-foreground':'bg-muted text-muted-foreground'}`}>{t}</button>)}
      </div>
      {tab===0&&(
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{cv.length} charge(s)</p>
            <div className="flex gap-2">
              <button onClick={()=>setImportOpen(true)} className="flex items-center gap-2 border border-border px-3 py-2 rounded-xl text-sm hover:bg-muted"><Upload className="w-4 h-4"/>Importer</button>
              <button onClick={()=>setOpenVeh(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-xl text-sm hover:opacity-90"><Plus className="w-4 h-4"/>Ajouter</button>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>{['Date','Véhicule','Type','Montant','Description','Action'].map(h=><th key={h} className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody>
                {cv.map((c,i)=>(
                  <tr key={c.id} className={`border-b border-border/50 hover:bg-muted/20 ${i%2===1?'bg-muted/10':''}`}>
                    <td className="py-2 px-3">{c.date}</td>
                    <td className="py-2 px-3">{c.vehicule_label}</td>
                    <td className="py-2 px-3">{TYPE_LABELS[c.type_charge]||c.type_charge}</td>
                    <td className="py-2 px-3 font-medium">{formatMAD(c.montant)}</td>
                    <td className="py-2 px-3 text-muted-foreground">{c.description||'—'}</td>
                    <td className="py-2 px-3"><button onClick={async()=>{try{await deleteChargeVehicule(c.id);toast.success('Supprimé');setCv(p=>p.filter(x=>x.id!==c.id));}catch{toast.error('Erreur');}}} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4"/></button></td>
                  </tr>
                ))}
                {cv.length===0&&<tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Aucune charge</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {tab===1&&(
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{cg.length} charge(s)</p>
            <button onClick={()=>setOpenGen(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-xl text-sm hover:opacity-90"><Plus className="w-4 h-4"/>Ajouter</button>
          </div>
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>{['Date','Catégorie','Montant','Description','Action'].map(h=><th key={h} className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody>
                {cg.map((c,i)=>(
                  <tr key={c.id} className={`border-b border-border/50 hover:bg-muted/20 ${i%2===1?'bg-muted/10':''}`}>
                    <td className="py-2 px-3">{c.date}</td>
                    <td className="py-2 px-3">{CAT_LABELS[c.categorie]||c.categorie}</td>
                    <td className="py-2 px-3 font-medium">{formatMAD(c.montant)}</td>
                    <td className="py-2 px-3 text-muted-foreground">{c.description||'—'}</td>
                    <td className="py-2 px-3"><button onClick={async()=>{try{await deleteChargeGenerale(c.id);toast.success('Supprimé');setCg(p=>p.filter(x=>x.id!==c.id));}catch{toast.error('Erreur');}}} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4"/></button></td>
                  </tr>
                ))}
                {cg.length===0&&<tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Aucune charge</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {openVeh&&(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={()=>setOpenVeh(false)}>
          <div className="bg-card rounded-2xl border border-border w-full max-w-md p-6" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">Nouvelle Charge Véhicule</h3><button onClick={()=>setOpenVeh(false)} className="text-xl text-muted-foreground">✕</button></div>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium mb-1">Date *</label><input type="date" value={fv.date} onChange={e=>setFv((p:any)=>({...p,date:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"/></div>
              <div><label className="block text-xs font-medium mb-1">Véhicule *</label>
                <select value={fv.vehicule_id} onChange={e=>{const v=vehs.find(x=>x.id===e.target.value);setFv((p:any)=>({...p,vehicule_id:e.target.value,vehicule_label:v?v.immatriculation:''}));}} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
                  <option value="">-- Choisir --</option>{vehs.map(v=><option key={v.id} value={v.id}>{v.immatriculation} — {v.marque} {v.modele}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium mb-1">Type *</label>
                <select value={fv.type_charge} onChange={e=>setFv((p:any)=>({...p,type_charge:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
                  {Object.entries(TYPE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium mb-1">Montant (MAD) *</label><input type="number" value={fv.montant} onChange={e=>setFv((p:any)=>({...p,montant:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"/></div>
              <div><label className="block text-xs font-medium mb-1">Description</label><input value={fv.description} onChange={e=>setFv((p:any)=>({...p,description:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"/></div>
              {KM_TYPES.includes(fv.type_charge)&&(
                <div className="col-span-1"><label className="block text-xs font-medium mb-1 text-blue-600">KM Actuel (optionnel — met à jour la fiche véhicule)</label><input type="number" placeholder="Ex: 45000" value={fv.km_au_moment} onChange={e=>setFv((p:any)=>({...p,km_au_moment:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-blue-300 bg-background text-sm focus:ring-2 focus:ring-blue-300"/></div>
              )}
              {fv.type_charge==='visite'&&(
                <div><label className="block text-xs font-medium mb-1 text-green-600">Prochaine VT (sera mise à jour sur la fiche véhicule)</label><input type="date" value={fv.prochaine_vt} onChange={e=>setFv((p:any)=>({...p,prochaine_vt:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-green-300 bg-background text-sm"/></div>
              )}
              {fv.type_charge==='assurance'&&(
                <div><label className="block text-xs font-medium mb-1 text-green-600">Nouvelle fin d'assurance (sera mise à jour sur la fiche véhicule)</label><input type="date" value={fv.nouvelle_fin_assurance} onChange={e=>setFv((p:any)=>({...p,nouvelle_fin_assurance:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-green-300 bg-background text-sm"/></div>
              )}
              {fv.type_charge==='vidange'&&(
                <div><label className="block text-xs font-medium mb-1 text-amber-600">Date prochaine vidange (suggestion : +6 mois)</label><input type="date" value={fv.prochaine_vidange} onChange={e=>setFv((p:any)=>({...p,prochaine_vidange:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-background text-sm"/></div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={()=>setOpenVeh(false)} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted">Annuler</button>
              <button onClick={saveVeh} disabled={saving} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">{saving?'...':'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}

      {importOpen&&<ImportDialog entityType="charge_vehicule" onImport={handleImportCV} onClose={()=>setImportOpen(false)}/>}
      {openGen&&(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={()=>setOpenGen(false)}>
          <div className="bg-card rounded-2xl border border-border w-full max-w-md p-6" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">Nouvelle Charge Générale</h3><button onClick={()=>setOpenGen(false)} className="text-xl text-muted-foreground">✕</button></div>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium mb-1">Date *</label><input type="date" value={fg.date} onChange={e=>setFg((p:any)=>({...p,date:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"/></div>
              <div><label className="block text-xs font-medium mb-1">Catégorie *</label>
                <select value={fg.categorie} onChange={e=>setFg((p:any)=>({...p,categorie:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
                  {Object.entries(CAT_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium mb-1">Montant (MAD) *</label><input type="number" value={fg.montant} onChange={e=>setFg((p:any)=>({...p,montant:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"/></div>
              <div><label className="block text-xs font-medium mb-1">Description</label><input value={fg.description} onChange={e=>setFg((p:any)=>({...p,description:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"/></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={()=>setOpenGen(false)} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted">Annuler</button>
              <button onClick={saveGen} disabled={saving} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">{saving?'...':'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
