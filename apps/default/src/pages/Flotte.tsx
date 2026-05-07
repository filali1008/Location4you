import React, { useEffect, useState } from 'react';
import { Plus, Search, AlertTriangle, ExternalLink, Pencil, Trash2, Info, Upload } from 'lucide-react';
import { getVehicules, createVehicule, updateVehicule, deleteVehicule, getChargesVehicules, daysUntil, formatMAD } from '@/lib/api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DayBadge, alertLevel } from '@/components/shared/DayBadge';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { toast } from 'sonner';

const STATUT_LABELS: Record<string,string> = {disponible:'Disponible',enlocation:'En location',enmaintenance:'En maintenance',horsservice:'Hors service',vendu:'Vendu'};
function hasAlert(v: any) { return [v.date_prochaine_visite_technique,v.date_fin_assurance,v.date_fin_carte_grise].some(d=>{const days=daysUntil(d);return days!==Infinity&&days<=30;}); }
function hasCritical(v: any) { return [v.date_prochaine_visite_technique,v.date_fin_assurance,v.date_fin_carte_grise].some(d=>alertLevel(d)==='critical'); }

function VehicleDetailDialog({ v, charges, onEdit, onClose }: { v: any; charges: any[]; onEdit: () => void; onClose: () => void }) {
  const TYPE_LABELS: Record<string,string> = {carburant:'Carburant',lavage:'Lavage',vidange:'Vidange',visite:'Visite technique',assurance:'Assurance',fradmin:'Frais admin',infractions:'Infractions',peages:'Péages',parking:'Parking',adblue:'AdBlue',reparation:'Réparation',autres:'Autres'};
  const vCharges = charges.filter(c=>c.vehicule_id===v.id).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  const diff = (v.prix_location||0)-(v.tarif_reference||0); const diffPos = diff >= 0;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div><h3 className="text-lg font-bold">{v.immatriculation}</h3><p className="text-sm text-muted-foreground">{v.marque} {v.modele}</p></div>
          <div className="flex items-center gap-2"><StatusBadge status={v.statut}/><button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground">✕</button></div>
        </div>
        <div className="p-5 space-y-4 text-sm">
          <div><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Identification</h4>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-muted-foreground">KM:</span> <span className="font-medium">{(v.km_actuel||0).toLocaleString()} km</span></div>
              <div><span className="text-muted-foreground">Mise en parc:</span> <span className="font-medium">{v.date_mise_en_parc||'—'}</span></div>
            </div>
          </div>
          <div className="border-t border-border pt-4"><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Documents & Échéances</h4>
            <div className="grid grid-cols-2 gap-3">
              <DayBadge dateStr={v.date_prochaine_visite_technique} label="Visite Technique"/>
              <DayBadge dateStr={v.date_fin_assurance} label="Assurance"/>
              <DayBadge dateStr={v.date_fin_carte_grise} label="Carte Grise"/>
              <DayBadge dateStr={v.date_derniere_vidange} label="Dernière Vidange"/>
            </div>
          </div>
          <div className="border-t border-border pt-4"><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Informations Financières</h4>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-muted-foreground">Valeur achat:</span> <span className="font-medium">{formatMAD(v.valeur_achat)}</span></div>
              <div><span className="text-muted-foreground">Prix location:</span> <span className="font-medium">{formatMAD(v.prix_location)}</span></div>
              <div><span className="text-muted-foreground">Tarif référence:</span> <span className="font-medium">{formatMAD(v.tarif_reference)}</span></div>
              <div><span className="text-muted-foreground">Prix revente:</span> <span className="font-medium">{formatMAD(v.prix_revente)}</span></div>
              <div><span className="text-muted-foreground">KR Due:</span> <span className="font-medium">{v.kr_due||'—'}</span></div>
              <div><span className="text-muted-foreground">Différence:</span> <span className={`font-semibold ${diffPos?'text-green-600':'text-red-500'}`}>{diffPos?'+':''}{formatMAD(diff)}</span></div>
            </div>
          </div>
          {v.organisme_financement&&(<div className="border-t border-border pt-4"><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Crédit / Financement</h4>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-muted-foreground">Organisme:</span> <span className="font-medium">{v.organisme_financement}</span></div>
              <div><span className="text-muted-foreground">Mensualité:</span> <span className="font-medium">{formatMAD(v.mensualite_credit)}</span></div>
              <div><span className="text-muted-foreground">Mois restants:</span> <span className="font-medium">{v.mois_restant_credit||'—'}</span></div>
              <div><span className="text-muted-foreground">Reste à payer:</span> <span className="font-medium">{formatMAD(v.reste_a_payer)}</span></div>
            </div>
          </div>)}
          {v.client&&(<div className="border-t border-border pt-4"><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Affectation Actuelle</h4>
            <div className="space-y-1">
              <div><span className="text-muted-foreground">Client:</span> <span className="font-medium">{v.client}</span></div>
              <div><span className="text-muted-foreground">Conducteur:</span> <span className="font-medium">{v.conducteur||'—'}</span></div>
              {v.tel&&<div><span className="text-muted-foreground">Tél:</span> <a href={`tel:${v.tel}`} className="text-primary font-medium">{v.tel}</a></div>}
            </div>
          </div>)}
          <div className="border-t border-border pt-4"><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Dossier Drive</h4>
            {v.lien_dossier_drive?<a href={v.lien_dossier_drive} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-sm hover:bg-blue-700"><ExternalLink className="w-3.5 h-3.5"/>Ouvrir Dossier Drive</a>:<p className="text-muted-foreground text-sm">Aucun dossier Drive configuré</p>}
          </div>
          {vCharges.length>0&&(<div className="border-t border-border pt-4"><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">5 Dernières Charges</h4>
            <div className="space-y-1.5">{vCharges.map((c:any)=>(<div key={c.id} className="flex items-center justify-between text-xs bg-muted/40 rounded-lg px-3 py-1.5"><span className="text-muted-foreground">{c.date}</span><span>{TYPE_LABELS[c.type_charge]||c.type_charge}</span><span className="font-medium">{formatMAD(c.montant)}</span></div>))}</div>
          </div>)}
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted">Fermer</button>
          <button onClick={onEdit} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">Modifier</button>
        </div>
      </div>
    </div>
  );
}
const EMPTY = {immatriculation:'',marque:'',modele:'',km_actuel:'',statut:'disponible',tarif_reference:'',prix_location:'',valeur_achat:'',prix_revente:'',kr_due:'',organisme_financement:'',mensualite_credit:'',mois_restant_credit:'',reste_a_payer:'',client:'',conducteur:'',tel:'',lien_dossier_drive:'',date_mise_en_parc:'',date_derniere_vidange:'',date_prochaine_visite_technique:'',date_fin_assurance:'',date_fin_carte_grise:''};
const FIELDS: [string,string,string][] = [
  ['immatriculation','Immatriculation *','text'],['marque','Marque','text'],['modele','Modèle *','text'],
  ['km_actuel','KM Actuel','number'],['tarif_reference','Tarif Réf. (MAD)','number'],['prix_location','Prix Location (MAD)','number'],
  ['valeur_achat','Valeur Achat (MAD)','number'],['prix_revente','Prix Revente (MAD)','number'],['kr_due','KR Due','number'],
  ['organisme_financement','Organisme Financement','text'],['mensualite_credit','Mensualité (MAD)','number'],
  ['mois_restant_credit','Mois Restants','number'],['reste_a_payer','Reste à Payer (MAD)','number'],
  ['client','Client','text'],['conducteur','Conducteur','text'],['tel','Téléphone','text'],
  ['date_mise_en_parc','Mise en Parc','date'],['date_derniere_vidange','Dernière Vidange','date'],
  ['date_prochaine_visite_technique','Prochaine VT','date'],['date_fin_assurance','Fin Assurance','date'],['date_fin_carte_grise','Fin CG','date'],
];

export function Flotte() {
  const [vehicules,setVehicules] = useState<any[]>([]);
  const [charges,setCharges] = useState<any[]>([]);
  const [loading,setLoading] = useState(true);
  const [search,setSearch] = useState('');
  const [filterStatut,setFilterStatut] = useState('Tous');
  const [dialogOpen,setDialogOpen] = useState(false);
  const [detailVeh,setDetailVeh] = useState<any>(null);
  const [importOpen,setImportOpen] = useState(false);
  const [form,setForm] = useState<any>(EMPTY);
  const [editing,setEditing] = useState<any>(null);
  const [saving,setSaving] = useState(false);

  const load = async()=>{setLoading(true);try{const [v,c]=await Promise.all([getVehicules(),getChargesVehicules()]);setVehicules(v);setCharges(c);}finally{setLoading(false);}};
  useEffect(()=>{load();},[]);

  const filtered = vehicules.filter(v=>{
    const ms = !search||[v.immatriculation,v.marque,v.modele,v.client,v.conducteur].some(s=>(s||'').toLowerCase().includes(search.toLowerCase()));
    return ms&&(filterStatut==='Tous'||v.statut===filterStatut);
  });

  const openAdd=()=>{setForm(EMPTY);setEditing(null);setDialogOpen(true);};
  const openEdit=(v:any)=>{setForm({...v});setEditing(v);setDetailVeh(null);setDialogOpen(true);};

  const handleImport = async (rows: Record<string,string>[]) => {
    let inserted = 0; const errors: {line:number;reason:string}[] = [];
    const statusMap: Record<string,string> = {'en location':'enlocation','disponible':'disponible','en maintenance':'enmaintenance','hors service':'horsservice','vendu':'vendu'};
    for (let i=0;i<rows.length;i++) {
      const r=rows[i];
      try {
        const rawS=(r.statut||'disponible').toLowerCase().trim();
        const statut=statusMap[rawS]||rawS||'disponible';
        await createVehicule({...r,statut,km_actuel:Number(r.km_actuel)||0,valeur_achat:Number(r.valeur_achat)||0,prix_location:Number(r.prix_location)||0,tarif_reference:Number(r.tarif_reference)||0,prix_revente:Number(r.prix_revente)||0,mensualite_credit:Number(r.mensualite_credit)||0,mois_restant_credit:Number(r.mois_restant_credit)||0,reste_a_payer:Number(r.reste_a_payer)||0,kr_due:Number(r.kr_due)||0});
        inserted++;
      } catch { errors.push({line:i+2,reason:'Erreur serveur'}); }
    }
    await load(); return {inserted,errors};
  };

  const save=async()=>{
    if(!form.immatriculation||!form.modele){toast.error('Immatriculation et modèle requis');return;}
    setSaving(true);
    try{
      if(editing){await updateVehicule(editing.id,form);toast.success('Véhicule modifié');}
      else{await createVehicule(form);toast.success('Véhicule ajouté');}
      setDialogOpen(false);await load();
    }catch{toast.error('Erreur de sauvegarde');}finally{setSaving(false);}
  };

  const del=async(v:any)=>{
    if(!confirm(`Supprimer ${v.immatriculation} ?`))return;
    try{await deleteVehicule(v.id);toast.success('Supprimé');setVehicules(p=>p.filter(x=>x.id!==v.id));}
    catch{toast.error('Erreur');}
  };

  if(loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"/></div>;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Gestion de Flotte</h2><p className="text-muted-foreground text-sm">{vehicules.length} véhicule(s)</p></div>
        <div className="flex gap-2">
          <button onClick={()=>setImportOpen(true)} className="flex items-center gap-2 border border-border px-3 py-2 rounded-xl text-sm hover:bg-muted"><Upload className="w-4 h-4"/>Importer</button>
          <button onClick={openAdd} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90"><Plus className="w-4 h-4"/>Ajouter</button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..." className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"/>
        </div>
        <div className="flex gap-1 flex-wrap">
          {['Tous','disponible','enlocation','enmaintenance','horsservice','vendu'].map(s=>(
            <button key={s} onClick={()=>setFilterStatut(s)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${filterStatut===s?'bg-primary text-primary-foreground':'bg-muted text-muted-foreground hover:text-foreground'}`}>
              {s==='Tous'?'Tous':STATUT_LABELS[s]||s}
            </button>
          ))}
        </div>
      </div>

      <div className="lg:hidden space-y-3">
        {filtered.map(v=>(
          <div key={v.id} className={`rounded-2xl border bg-card p-4 shadow-sm ${hasAlert(v)?'border-l-4 border-l-orange-400':''}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-bold">{v.immatriculation}{hasAlert(v)&&<AlertTriangle className="w-4 h-4 text-orange-500"/>}</div>
              <StatusBadge status={v.statut}/>
            </div>
            <p className="text-sm text-muted-foreground">{v.marque} {v.modele}</p>
            {v.client&&<p className="text-sm mt-1">👤 {v.client}</p>}
            <div className="flex gap-3 mt-3">
              <button onClick={()=>setDetailVeh(v)} className="flex items-center gap-1 text-xs text-blue-600"><Info className="w-3 h-3"/>Détails</button>
              <button onClick={()=>openEdit(v)} className="flex items-center gap-1 text-xs text-muted-foreground"><Pencil className="w-3 h-3"/>Modifier</button>
              <button onClick={()=>del(v)} className="flex items-center gap-1 text-xs text-destructive"><Trash2 className="w-3 h-3"/>Supprimer</button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden lg:block rounded-2xl border border-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border">
            <tr>{['Mat.','Marque','Modèle','Statut','KM','Client','VT','Assurance','CG','Actions'].map(h=><th key={h} className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((v,i)=>(
              <tr key={v.id} className={`border-b border-border/50 hover:bg-muted/20 ${i%2===1?'bg-muted/10':''}`}>
                <td className="py-2 px-3 font-medium">
                  <div className="flex items-center gap-1.5">
                    {v.immatriculation}
                    {hasAlert(v)&&<AlertTriangle className={`w-3 h-3 ${hasCritical(v)?'text-red-500':'text-orange-500'}`}/>}
                    <button onClick={()=>setDetailVeh(v)} className="text-muted-foreground hover:text-primary" title="Voir détails"><Info className="w-3 h-3"/></button>
                  </div>
                </td>
                <td className="py-2 px-3">{v.marque}</td><td className="py-2 px-3">{v.modele}</td>
                <td className="py-2 px-3"><StatusBadge status={v.statut}/></td>
                <td className="py-2 px-3">{(v.km_actuel||0).toLocaleString()}</td>
                <td className="py-2 px-3">{v.client||'—'}</td>
                <td className="py-2 px-3"><DayBadge dateStr={v.date_prochaine_visite_technique} compact/></td>
                <td className="py-2 px-3"><DayBadge dateStr={v.date_fin_assurance} compact/></td>
                <td className="py-2 px-3"><DayBadge dateStr={v.date_fin_carte_grise} compact/></td>
                <td className="py-2 px-3">
                  <div className="flex gap-1">
                    <button onClick={()=>openEdit(v)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"><Pencil className="w-4 h-4"/></button>
                    <button onClick={()=>del(v)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length===0&&<tr><td colSpan={10} className="py-8 text-center text-muted-foreground">Aucun véhicule trouvé</td></tr>}
          </tbody>
        </table>
      </div>


      {detailVeh&&<VehicleDetailDialog v={detailVeh} charges={charges} onEdit={()=>openEdit(detailVeh)} onClose={()=>setDetailVeh(null)}/>}

      {dialogOpen&&(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={()=>setDialogOpen(false)}>
          <div className="bg-card rounded-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editing?'Modifier':'Ajouter'} un Véhicule</h3>
              <button onClick={()=>setDialogOpen(false)} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FIELDS.map(([key,label,type])=>(
                <div key={key}>
                  <label className="block text-xs font-medium mb-1">{label}</label>
                  <input type={type} value={form[key]||''} onChange={e=>setForm((p:any)=>({...p,[key]:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"/>
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1">Lien Dossier Drive</label>
                <input value={form.lien_dossier_drive||''} onChange={e=>setForm((p:any)=>({...p,lien_dossier_drive:e.target.value}))} placeholder="https://drive.google.com/..." className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"/>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Statut</label>
                <select value={form.statut||'disponible'} onChange={e=>setForm((p:any)=>({...p,statut:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none">
                  <option value="disponible">Disponible</option><option value="enlocation">En location</option>
                  <option value="enmaintenance">En maintenance</option><option value="horsservice">Hors service</option><option value="vendu">Vendu</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={()=>setDialogOpen(false)} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted">Annuler</button>
              <button onClick={save} disabled={saving} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">{saving?'Enregistrement...':'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}
      {importOpen&&<ImportDialog entityType="vehicule" onImport={handleImport} onClose={()=>setImportOpen(false)}/>}
    </div>
  );
}
