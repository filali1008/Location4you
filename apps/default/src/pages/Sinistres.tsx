import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Shield, Upload } from 'lucide-react';
import { getSinistres, createSinistre, updateSinistre, deleteSinistre, getVehicules, genSinistreId, formatMAD } from '@/lib/api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { toast } from 'sonner';

const STATUTS = ['declare','expertise','reparation','pret','cloture'];
const STAT_LABELS: Record<string,string> = {declare:'Déclaré',expertise:'En expertise',reparation:'En réparation',pret:'Prêt',cloture:'Clôturé'};
const EMPTY: any = {numero_dossier:'',date_sinistre:'',vehicule_id:'',vehicule_label:'',description_dommages:'',lieu_sinistre:'',conducteur_nom:'',conducteur_tel:'',statut:'declare',montant_reparation:'',prise_en_charge_assurance:'',franchise:'',garage_nom:'',notes:''};

export function Sinistres() {
  const [list, setList] = useState<any[]>([]);
  const [vehs, setVehs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fst, setFst] = useState('Tous');
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [edit, setEdit] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => { setLoading(true); const [a,b] = await Promise.all([getSinistres(),getVehicules()]); setList(a);setVehs(b);setLoading(false); };
  useEffect(()=>{load();},[]);

  const shown = list.filter(s => fst==='Tous'||s.statut===fst);
  const countBy = (st: string) => list.filter(s=>s.statut===st).length;

  const openAdd = () => { setForm({...EMPTY, numero_dossier:genSinistreId()}); setEdit(null); setOpen(true); };
  const openEdit = (s: any) => { setForm({...s}); setEdit(s); setOpen(true); };

  const save = async () => {
    if(!form.vehicule_id||!form.description_dommages||!form.date_sinistre){toast.error('Champs requis');return;}
    setSaving(true);
    try{if(edit){await updateSinistre(edit.id,form);toast.success('Sinistre modifié');}else{await createSinistre(form);toast.success('Sinistre créé');}setOpen(false);await load();}
    catch{toast.error('Erreur');}finally{setSaving(false);}
  };

  const del = async (s: any) => {
    if(!confirm('Supprimer ?'))return;
    try{await deleteSinistre(s.id);toast.success('Supprimé');setList(p=>p.filter(x=>x.id!==s.id));}catch{toast.error('Erreur');}
  };

  const changeStatut = async (s: any, newSt: string) => {
    try{const upd={...s,statut:newSt};if(newSt==='cloture')upd.date_cloture=new Date().toISOString().split('T')[0];await updateSinistre(s.id,upd);toast.success('Statut mis à jour');await load();}
    catch{toast.error('Erreur');}
  };

  if(loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"/></div>;

  const inp = (label: string, key: string, type='text', multi=false) => (
    <div key={key}><label className="block text-xs font-medium mb-1">{label}</label>
      {multi ? <textarea value={form[key]||''} onChange={e=>setForm((p:any)=>({...p,[key]:e.target.value}))} rows={3} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none"/> :
        <input type={type} value={form[key]||''} onChange={e=>setForm((p:any)=>({...p,[key]:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none"/>}
    </div>
  );

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Gestion des Sinistres</h2><p className="text-muted-foreground text-sm">{list.length} dossier(s)</p></div>
        <div className="flex gap-2">
          <button onClick={()=>setImportOpen(true)} className="flex items-center gap-2 border border-border px-3 py-2 rounded-xl text-sm hover:bg-muted"><Upload className="w-4 h-4"/>Importer</button>
          <button onClick={openAdd} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90"><Plus className="w-4 h-4"/>Déclarer</button>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {STATUTS.map(s=><button key={s} onClick={()=>setFst(s==='Tous'?'Tous':s)} className={`rounded-xl border p-3 text-center text-xs transition-colors ${fst===s?'bg-primary text-primary-foreground border-primary':'border-border bg-card hover:bg-muted'}`}>
          <div className="font-bold text-lg">{countBy(s)}</div><div>{STAT_LABELS[s]}</div>
        </button>)}
      </div>

      <div className="flex gap-1"><button onClick={()=>setFst('Tous')} className={`px-3 py-1.5 rounded-xl text-xs font-medium ${fst==='Tous'?'bg-primary text-primary-foreground':'bg-muted text-muted-foreground'}`}>Tous</button>
        {STATUTS.map(s=><button key={s} onClick={()=>setFst(s)} className={`px-3 py-1.5 rounded-xl text-xs font-medium ${fst===s?'bg-primary text-primary-foreground':'bg-muted text-muted-foreground'}`}>{STAT_LABELS[s]}</button>)}
      </div>

      <div className="space-y-3">
        {shown.map(s=>(
          <div key={s.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-muted-foreground"/><span className="font-mono text-sm">{s.numero_dossier}</span><StatusBadge status={s.statut}/></div>
                <p className="font-medium mt-1">{s.vehicule_label}</p>
                <p className="text-sm text-muted-foreground line-clamp-1">{s.description_dommages}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.date_sinistre}{s.lieu_sinistre&&` — ${s.lieu_sinistre}`}</p>
              </div>
              <div className="flex gap-1 ml-2">
                <button onClick={()=>openEdit(s)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"><Pencil className="w-4 h-4"/></button>
                <button onClick={()=>del(s)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4"/></button>
              </div>
            </div>
            <div className="flex gap-1 flex-wrap mt-2">
              {STATUTS.map(st=><button key={st} onClick={()=>changeStatut(s,st)} className={`px-2 py-1 rounded-lg text-xs transition-colors ${s.statut===st?'bg-primary text-primary-foreground':'bg-muted text-muted-foreground hover:text-foreground'}`}>{STAT_LABELS[st]}</button>)}
            </div>
            {(s.montant_reparation||s.prise_en_charge_assurance)&&(
              <div className="mt-2 text-xs text-muted-foreground flex gap-4">
                <span>Réparation: {formatMAD(s.montant_reparation)}</span>
                <span>Assurance: {formatMAD(s.prise_en_charge_assurance)}</span>
                <span className="font-medium text-destructive">Net: {formatMAD((s.montant_reparation||0)-(s.prise_en_charge_assurance||0))}</span>
              </div>
            )}
          </div>
        ))}
        {shown.length===0&&<div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">Aucun sinistre</div>}
      </div>

      {open&&(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={()=>setOpen(false)}>
          <div className="bg-card rounded-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">{edit?'Modifier':'Déclarer'} Sinistre</h3><button onClick={()=>setOpen(false)} className="text-xl text-muted-foreground">✕</button></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium mb-1">N° Dossier</label><input value={form.numero_dossier} readOnly className="w-full px-3 py-2 rounded-xl border border-border bg-muted text-sm"/></div>
              {inp('Date Sinistre *','date_sinistre','date')}
              <div className="sm:col-span-2"><label className="block text-xs font-medium mb-1">Véhicule *</label>
                <select value={form.vehicule_id||''} onChange={e=>{const v=vehs.find(x=>x.id===e.target.value);setForm((p:any)=>({...p,vehicule_id:e.target.value,vehicule_label:v?v.immatriculation+' — '+v.marque+' '+v.modele:''}));}} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
                  <option value="">-- Choisir --</option>{vehs.map(v=><option key={v.id} value={v.id}>{v.immatriculation} — {v.marque} {v.modele}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">{inp('Description des Dommages *','description_dommages','text',true)}</div>
              {inp('Lieu','lieu_sinistre')}{inp('Conducteur Nom','conducteur_nom')}{inp('Conducteur Tél','conducteur_tel')}
              <div><label className="block text-xs font-medium mb-1">Statut</label>
                <select value={form.statut||'declare'} onChange={e=>setForm((p:any)=>({...p,statut:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
                  {STATUTS.map(s=><option key={s} value={s}>{STAT_LABELS[s]}</option>)}
                </select>
              </div>
              {inp('Garage Nom','garage_nom')}{inp('Montant Réparation (MAD)','montant_reparation','number')}
              {inp('Prise en Charge Assurance (MAD)','prise_en_charge_assurance','number')}{inp('Franchise (MAD)','franchise','number')}
              <div className="sm:col-span-2">{inp('Notes','notes','text',true)}</div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={()=>setOpen(false)} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted">Annuler</button>
              <button onClick={save} disabled={saving} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">{saving?'...':'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}
      {importOpen&&<ImportDialog entityType="sinistre" onImport={async(rows)=>{let ins=0;const errs:any[]=[];for(let i=0;i<rows.length;i++){const r=rows[i];try{await createSinistre({...r,montant_reparation:Number(r.montant)||0,numero_dossier:r.numero_dossier||genSinistreId()});ins++;}catch{errs.push({line:i+2,reason:'Erreur'});}}await load();return{inserted:ins,errors:errs};}} onClose={()=>setImportOpen(false)}/>}
    </div>
  );
}
