import React, { useEffect, useState } from 'react';
import { Plus, Trash2, CheckCircle, MessageCircle, Receipt, Upload } from 'lucide-react';
import { getFactures, createFacture, updateFacture, deleteFacture, getContrats, genFactureId, formatMAD } from '@/lib/api';
import { StatsCard } from '@/components/shared/StatsCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { toast } from 'sonner';

export function Factures() {
  const [list, setList] = useState<any[]>([]);
  const [contrats, setContrats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fst, setFst] = useState('Tous');
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [form, setForm] = useState<any>({numero_facture:'',contrat_id:'',nom_client:'',email_client:'',telephone_client:'',vehicule_label:'',date_facture:'',montant:'',statut:'enattente'});
  const [saving, setSaving] = useState(false);

  const load = async () => { setLoading(true); const [a,b] = await Promise.all([getFactures(),getContrats()]); setList(a);setContrats(b);setLoading(false); };
  useEffect(()=>{load();},[]);

  const shown = list.filter(f => fst==='Tous'||f.statut===fst);
  const caEnc = list.filter(f=>f.statut==='payee').reduce((s,f)=>s+(f.montant||0),0);
  const attente = list.filter(f=>['enattente','envoyee'].includes(f.statut)).reduce((s,f)=>s+(f.montant||0),0);

  const selectContrat = (id: string) => {
    const c = contrats.find(x=>x.id===id);
    if(c) setForm((p:any)=>({...p,contrat_id:id,nom_client:c.nom_client,email_client:c.email_client||'',telephone_client:c.telephone_client||'',vehicule_label:c.vehicule_label||'',montant:c.total_du,date_debut_location:c.date_debut,date_fin_location:c.date_fin}));
  };

  const save = async () => {
    if(!form.nom_client||!form.montant){toast.error('Champs requis');return;}
    setSaving(true);
    try{await createFacture({...form,numero_facture:genFactureId(),date_facture:form.date_facture||new Date().toISOString().split('T')[0]});toast.success('Facture créée');setOpen(false);await load();}
    catch{toast.error('Erreur');}finally{setSaving(false);}
  };

  const pay = async (f: any) => {
    try{await updateFacture(f.id,{...f,statut:'payee'});toast.success('Paiement validé');await load();}
    catch{toast.error('Erreur');}
  };

  const wa = (f: any) => {
    const tel=(f.telephone_client||'').replace(/[^\d+]/g,'');
    if(!tel){toast.error('Pas de numéro');return;}
    window.open(`https://wa.me/${tel.replace(/^\+/,'')}?text=${encodeURIComponent('Bonjour '+f.nom_client+', facture N° '+f.numero_facture+' : '+formatMAD(f.montant)+'. Merci — Location4You.')}`, '_blank');
  };

  const del = async (f: any) => {
    if(!confirm('Supprimer ?'))return;
    try{await deleteFacture(f.id);toast.success('Supprimée');setList(p=>p.filter(x=>x.id!==f.id));}catch{toast.error('Erreur');}
  };

  if(loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"/></div>;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Facturation</h2>
        <div className="flex gap-2">
          <button onClick={()=>setImportOpen(true)} className="flex items-center gap-2 border border-border px-3 py-2 rounded-xl text-sm hover:bg-muted"><Upload className="w-4 h-4"/>Importer</button>
          <button onClick={()=>{setForm({numero_facture:'',contrat_id:'',nom_client:'',email_client:'',telephone_client:'',vehicule_label:'',date_facture:'',montant:'',statut:'enattente'});setOpen(true);}} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90"><Plus className="w-4 h-4"/>Nouvelle Facture</button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatsCard title="CA Encaissé" value={formatMAD(caEnc)} icon={<CheckCircle className="w-5 h-5"/>} color="green" trend="up"/>
        <StatsCard title="En Attente" value={formatMAD(attente)} icon={<Receipt className="w-5 h-5"/>} color="amber"/>
        <StatsCard title="Total Factures" value={list.length} icon={<Receipt className="w-5 h-5"/>} color="blue"/>
      </div>
      <div className="flex gap-1">{['Tous','enattente','envoyee','payee','annulee'].map(s=><button key={s} onClick={()=>setFst(s)} className={`px-3 py-1.5 rounded-xl text-xs font-medium ${fst===s?'bg-primary text-primary-foreground':'bg-muted text-muted-foreground'}`}>{{Tous:'Tous',enattente:'En attente',envoyee:'Envoyée',payee:'Payée',annulee:'Annulée'}[s as string]}</button>)}</div>
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border">
            <tr>{['N° Facture','Client','Véhicule','Date','Montant','Statut','Actions'].map(h=><th key={h} className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr>
          </thead>
          <tbody>
            {shown.map((f,i)=>(
              <tr key={f.id} className={`border-b border-border/50 hover:bg-muted/20 ${i%2===1?'bg-muted/10':''}`}>
                <td className="py-2 px-3 font-mono text-xs">{f.numero_facture}</td>
                <td className="py-2 px-3">{f.nom_client}<div className="text-xs text-muted-foreground">{f.email_client}</div></td>
                <td className="py-2 px-3">{f.vehicule_label||'—'}</td>
                <td className="py-2 px-3">{f.date_facture}</td>
                <td className="py-2 px-3 font-medium">{formatMAD(f.montant)}</td>
                <td className="py-2 px-3"><StatusBadge status={f.statut}/></td>
                <td className="py-2 px-3"><div className="flex gap-1">
                  {f.statut!=='payee'&&<button onClick={()=>pay(f)} title="Valider paiement" className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"><CheckCircle className="w-4 h-4"/></button>}
                  <button onClick={()=>wa(f)} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50"><MessageCircle className="w-4 h-4"/></button>
                  <button onClick={()=>del(f)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4"/></button>
                </div></td>
              </tr>
            ))}
            {shown.length===0&&<tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Aucune facture</td></tr>}
          </tbody>
        </table>
      </div>

      {open&&(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={()=>setOpen(false)}>
          <div className="bg-card rounded-2xl border border-border w-full max-w-lg p-6" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">Nouvelle Facture</h3><button onClick={()=>setOpen(false)} className="text-xl text-muted-foreground">✕</button></div>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium mb-1">Lier à un contrat</label>
                <select value={form.contrat_id||''} onChange={e=>selectContrat(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
                  <option value="">-- Choisir un contrat --</option>
                  {contrats.map(c=><option key={c.id} value={c.id}>{c.id_contrat} — {c.nom_client}</option>)}
                </select>
              </div>
              {[['Nom Client *','nom_client'],['Email','email_client'],['Téléphone','telephone_client'],['Véhicule','vehicule_label']].map(([l,k])=>(
                <div key={k}><label className="block text-xs font-medium mb-1">{l}</label><input value={(form as any)[k]||''} onChange={e=>setForm((p:any)=>({...p,[k]:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"/></div>
              ))}
              <div><label className="block text-xs font-medium mb-1">Date Facture</label><input type="date" value={form.date_facture||''} onChange={e=>setForm((p:any)=>({...p,date_facture:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"/></div>
              <div><label className="block text-xs font-medium mb-1">Montant (MAD) *</label><input type="number" value={form.montant||''} onChange={e=>setForm((p:any)=>({...p,montant:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"/></div>
              <div><label className="block text-xs font-medium mb-1">Statut</label>
                <select value={form.statut||'enattente'} onChange={e=>setForm((p:any)=>({...p,statut:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
                  <option value="enattente">En attente</option><option value="envoyee">Envoyée</option><option value="payee">Payée</option><option value="annulee">Annulée</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={()=>setOpen(false)} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted">Annuler</button>
              <button onClick={save} disabled={saving} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">{saving?'...':'Créer'}</button>
            </div>
          </div>
        </div>
      )}
      {importOpen&&<ImportDialog entityType="facture" onImport={async(rows)=>{let ins=0;const errs:any[]=[];for(let i=0;i<rows.length;i++){const r=rows[i];try{await createFacture({...r,montant:Number(r.montant)||0,numero_facture:r.numero_facture||genFactureId()});ins++;}catch{errs.push({line:i+2,reason:'Erreur'});}}await load();return{inserted:ins,errors:errs};}} onClose={()=>setImportOpen(false)}/>}
    </div>
  );
}
