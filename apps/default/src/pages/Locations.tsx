import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, MessageCircle, PenLine, Upload, CheckCircle, FileText } from 'lucide-react';
import { getContrats, createContrat, updateContrat, deleteContrat, getVehicules, updateVehicule, genContratId, formatMAD } from '@/lib/api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { toast } from 'sonner';

const EMPTY: any = { id_contrat:'',nom_client:'',email_client:'',telephone_client:'',adresse_client:'',cin_passeport:'',permis_numero:'',permis_validite:'',vehicule_id:'',vehicule_label:'',type_location:'lcd',organisme:'',nom_commercial:'',date_debut:'',date_fin:'',tarif_jour:'',total_du:'',montant_avance:'',mode_paiement:'especes',statut_paiement:'nonpaye',statut_contrat:'actif',km_depart:'',carburant:'',lavage:'non',limitation_km:false,conducteur2_nom:'',conducteur2_cin:'',conducteur2_permis:'',conducteur2_permis_validite:'',statut_signature:'nonsigne',signature_client:'',signature_date:'' };

// ─── Signature Pad Component ─────────────────────────────────────────────────
function SignaturePad({ onSave, onCancel, contractLabel }: { onSave:(sig:string)=>void; onCancel:()=>void; contractLabel:string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);

  const getPos = (e: React.MouseEvent|React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) { return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }; }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.MouseEvent|React.TouchEvent) => {
    e.preventDefault(); setDrawing(true); setHasStrokes(true);
    const canvas = canvasRef.current!; const ctx = canvas.getContext('2d')!;
    const pos = getPos(e, canvas); ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
  };
  const draw = (e: React.MouseEvent|React.TouchEvent) => {
    if (!drawing) return; e.preventDefault();
    const canvas = canvasRef.current!; const ctx = canvas.getContext('2d')!;
    const pos = getPos(e, canvas); ctx.lineTo(pos.x, pos.y); ctx.strokeStyle='#1d4ed8'; ctx.lineWidth=2; ctx.lineCap='round'; ctx.stroke();
  };
  const stop = () => setDrawing(false);
  const clear = () => { const c=canvasRef.current!; c.getContext('2d')!.clearRect(0,0,c.width,c.height); setHasStrokes(false); };
  const save = () => { if (!hasStrokes) return; onSave(canvasRef.current!.toDataURL('image/png')); };

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="p-5 border-b border-border">
          <h3 className="text-lg font-bold flex items-center gap-2"><PenLine className="w-5 h-5"/>Signature Électronique</h3>
          <p className="text-sm text-muted-foreground mt-1">{contractLabel}</p>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-muted-foreground">En signant ci-dessous, le client reconnaît avoir pris connaissance et accepté les conditions générales du contrat de location.</p>
          <div className="border-2 border-dashed border-border rounded-xl overflow-hidden bg-white">
            <canvas ref={canvasRef} width={380} height={180} className="w-full touch-none cursor-crosshair"
              onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop}
              onTouchStart={start} onTouchMove={draw} onTouchEnd={stop}/>
          </div>
          <p className="text-xs text-center text-muted-foreground">Signez dans le cadre ci-dessus avec votre doigt ou la souris</p>
          <button onClick={clear} className="text-xs text-muted-foreground hover:text-foreground underline">Effacer</button>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-border">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted">Annuler</button>
          <button onClick={save} disabled={!hasStrokes} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 flex items-center gap-2"><PenLine className="w-4 h-4"/>Confirmer la signature</button>
        </div>
      </div>
    </div>
  );
}

function calcTotal(f: any) {
  if (!f.date_debut || !f.date_fin || !f.tarif_jour) return 0;
  return Math.max(0, Math.round((new Date(f.date_fin).getTime() - new Date(f.date_debut).getTime()) / 86400000)) * Number(f.tarif_jour);
}

export function Locations() {
  const [sp] = useSearchParams();
  const [list, setList] = useState<any[]>([]);
  const [vlist, setVlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [fst, setFst] = useState('Tous');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [edit, setEdit] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [signatureFor, setSignatureFor] = useState<any>(null);

  const load = async () => { setLoading(true); const [a, b] = await Promise.all([getContrats(), getVehicules()]); setList(a); setVlist(b); setLoading(false); };
  useEffect(() => { load(); }, []);

  const tf = sp.get('type');
  const shown = list.filter(c => {
    const ms = !q || [c.nom_client, c.vehicule_label, c.id_contrat].some((s: string) => (s || '').toLowerCase().includes(q.toLowerCase()));
    const st = fst === 'Tous' || c.statut_contrat === fst;
    let tt = true;
    if (tf === 'lcd') tt = !c.date_debut || !c.date_fin ? false : Math.round((new Date(c.date_fin).getTime() - new Date(c.date_debut).getTime()) / 86400000) < 30;
    if (tf === 'lld') tt = !c.date_debut || !c.date_fin ? false : Math.round((new Date(c.date_fin).getTime() - new Date(c.date_debut).getTime()) / 86400000) >= 30;
    return ms && st && tt;
  });

  const upd = (k: string, v: string) => setForm((p: any) => { const n = { ...p, [k]: v }; if (['date_debut', 'date_fin', 'tarif_jour'].includes(k)) n.total_du = calcTotal(n); return n; });
  const openAdd = () => { setForm({ ...EMPTY, id_contrat: genContratId() }); setEdit(null); setOpen(true); };
  const openEdit = (c: any) => { setForm({ ...c }); setEdit(c); setOpen(true); };

  const save = async () => {
    if (!form.nom_client || !form.date_debut || !form.date_fin || !form.tarif_jour) { toast.error('Champs requis manquants'); return; }
    setSaving(true);
    try {
      if (edit) { await updateContrat(edit.id, form); toast.success('Contrat modifié'); }
      else { await createContrat(form); toast.success('Contrat créé'); }
      // Auto-sync vehicle
      if (form.vehicule_id) {
        if (form.statut_contrat === 'actif') {
          await updateVehicule(form.vehicule_id, { client: form.nom_client, conducteur: form.nom_client, tel: form.telephone_client, statut: 'enlocation' });
        } else if (form.statut_contrat === 'termine' || form.statut_contrat === 'annule') {
          await updateVehicule(form.vehicule_id, { client: '', conducteur: '', tel: '', statut: 'disponible' });
        }
      }
      setOpen(false); await load();
    }
    catch { toast.error('Erreur'); } finally { setSaving(false); }
  };

  const del = async (c: any) => {
    if (!confirm('Supprimer ?')) return;
    try { await deleteContrat(c.id); toast.success('Supprimé'); setList(p => p.filter(x => x.id !== c.id)); } catch { toast.error('Erreur'); }
  };

  // ── Signature save ────────────────────────────────────────────────────────
  const handleSignatureSave = async (sig: string) => {
    if (!signatureFor) return;
    try {
      const now = new Date().toISOString();
      await updateContrat(signatureFor.id, { ...signatureFor, signature_client: sig, signature_date: now, statut_signature: 'signe' });
      toast.success('Contrat signé et enregistré ✓');
      setSignatureFor(null);
      await load();
    } catch { toast.error('Erreur lors de la sauvegarde de la signature'); }
  };

  // ── Import CSV contrats ───────────────────────────────────────────────────
  const handleImportContrats = async (rows: Record<string, string>[]) => {
    let inserted = 0; const errors: { line: number; reason: string }[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        await createContrat({ ...r, id_contrat: r.id_contrat || genContratId(), tarif_jour: Number(r.tarif_jour) || 0, total_du: Number(r.total_du) || 0, montant_avance: Number(r.montant_avance) || 0, statut_contrat: r.statut_contrat || 'actif', statut_paiement: r.statut_paiement || 'nonpaye', type_location: r.type_location || 'lcd' });
        inserted++;
      } catch { errors.push({ line: i + 2, reason: 'Erreur serveur' }); }
    }
    await load(); return { inserted, errors };
  };

  // ── PDF Contract generation ───────────────────────────────────────────────
  const generatePDF = (c: any) => {
    const days = c.date_debut && c.date_fin ? Math.max(0, Math.round((new Date(c.date_fin).getTime() - new Date(c.date_debut).getTime()) / 86400000)) : 0;
    const modePay: Record<string, string> = { especes: 'Espèces', virement: 'Virement bancaire', visa: 'Carte Visa' };
    const sigHtml = c.signature_client ? `<div style="margin-top:8px"><img src="${c.signature_client}" style="height:60px;border:1px solid #ccc;border-radius:4px"/><br/><small style="color:#666">Signé électroniquement le ${c.signature_date ? new Date(c.signature_date).toLocaleString('fr-MA') : ''}</small></div>` : '<div style="border:1px solid #999;height:60px;width:200px;border-radius:4px;margin-top:8px"></div>';
    const limKmHtml = c.limitation_km ? `<div style="border:1px solid #dc2626;padding:10px;border-radius:6px;margin:12px 0;font-size:12px"><strong>⚠️ CLAUSE LIMITATION KILOMÉTRIQUE</strong><br/>Le présent véhicule est soumis à une limitation de 3 300 km par mois. Tout kilomètre supplémentaire sera facturé au tarif de 2 MAD (deux dirhams) par kilomètre. Le kilométrage de départ est de ${c.km_depart || 0} km.</div>` : '';
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Contrat ${c.id_contrat}</title>
<style>body{font-family:Arial,sans-serif;font-size:13px;color:#111;margin:0;padding:20px} .header{text-align:center;border-bottom:2px solid #1d4ed8;padding-bottom:12px;margin-bottom:16px} h1{color:#1d4ed8;margin:0;font-size:20px} h2{font-size:13px;font-weight:600;color:#1d4ed8;margin:12px 0 6px;border-bottom:1px solid #e5e7eb;padding-bottom:4px} .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 20px} .row{font-size:12px;padding:3px 0} .label{color:#666;font-size:11px} .total-box{background:#f0f9ff;border:1px solid #1d4ed8;padding:10px;border-radius:6px;text-align:center;margin:12px 0} .footer{margin-top:20px;display:grid;grid-template-columns:1fr 1fr;gap:20px;font-size:12px} @media print{body{padding:10px}}</style></head><body>
<div class="header"><h1>📄 CONTRAT DE LOCATION</h1><p style="margin:4px 0;color:#555">Location4You — Contrat N° <strong>${c.id_contrat}</strong></p></div>
<h2>INFORMATIONS CLIENT</h2><div class="grid">
<div class="row"><span class="label">Nom complet</span><br/><strong>${c.nom_client}</strong></div>
<div class="row"><span class="label">Téléphone</span><br/>${c.telephone_client || '—'}</div>
<div class="row"><span class="label">Email</span><br/>${c.email_client || '—'}</div>
<div class="row"><span class="label">CIN / Passeport</span><br/>${c.cin_passeport || '—'}</div>
<div class="row"><span class="label">Permis N°</span><br/>${c.permis_numero || '—'}</div>
<div class="row"><span class="label">Permis valable jusqu'au</span><br/>${c.permis_validite || '—'}</div>
</div>
${c.conducteur2_nom ? `<h2>2ÈME CONDUCTEUR</h2><div class="grid"><div class="row"><span class="label">Nom</span><br/><strong>${c.conducteur2_nom}</strong></div><div class="row"><span class="label">Permis N°</span><br/>${c.conducteur2_permis || '—'}</div></div>` : ''}
<h2>VÉHICULE & PÉRIODE</h2><div class="grid">
<div class="row"><span class="label">Véhicule</span><br/><strong>${c.vehicule_label}</strong></div>
<div class="row"><span class="label">KM Départ</span><br/>${c.km_depart || '—'}</div>
<div class="row"><span class="label">Date début</span><br/><strong>${c.date_debut}</strong></div>
<div class="row"><span class="label">Date fin</span><br/><strong>${c.date_fin}</strong></div>
<div class="row"><span class="label">Durée</span><br/>${days} jour(s)</div>
<div class="row"><span class="label">Carburant</span><br/>${c.carburant || '—'}</div>
</div>
<h2>CONDITIONS FINANCIÈRES</h2><div class="grid">
<div class="row"><span class="label">Tarif / jour</span><br/>${formatMAD(c.tarif_jour)}</div>
<div class="row"><span class="label">Mode de paiement</span><br/>${modePay[c.mode_paiement] || c.mode_paiement}</div>
<div class="row"><span class="label">Avance versée</span><br/>${formatMAD(c.montant_avance)}</div>
<div class="row"><span class="label">Statut paiement</span><br/>${c.statut_paiement === 'paye' ? '✅ Payé' : c.statut_paiement === 'avance' ? '⏳ Avance' : '❌ Non payé'}</div>
</div>
<div class="total-box"><strong style="font-size:18px;color:#1d4ed8">${formatMAD(c.total_du)}</strong><br/><span style="font-size:11px;color:#555">MONTANT TOTAL DÛ</span></div>
${limKmHtml}
<div style="font-size:11px;color:#555;border:1px solid #e5e7eb;padding:10px;border-radius:6px;margin:10px 0">Le soussigné reconnaît avoir pris connaissance de l'état du véhicule et des conditions générales de location. Il s'engage à restituer le véhicule dans l'état initial et à respecter les clauses du présent contrat.</div>
<div class="footer">
<div><span class="label">Signature du loueur</span>${sigHtml}</div>
<div><span class="label">Signature du locataire (${c.nom_client})</span><div style="border:1px solid #999;height:60px;width:200px;border-radius:4px;margin-top:8px"></div></div>
</div>
<p style="text-align:center;font-size:10px;color:#999;margin-top:20px">Location4You — Document généré le ${new Date().toLocaleDateString('fr-MA')} — Contrat N° ${c.id_contrat}</p>
</body></html>`;
    const w = window.open('', '_blank'); if (!w) { toast.error('Autorisez les popups'); return; }
    w.document.write(html); w.document.close(); w.focus(); setTimeout(() => { w.print(); }, 500);
  };

  const wa = (c: any) => {
    const tel = (c.telephone_client || '').replace(/[^\d+]/g, '');
    if (!tel) { toast.error('Pas de numéro'); return; }
    window.open(`https://wa.me/${tel.replace(/^\+/, '')}?text=${encodeURIComponent('Bonjour ' + c.nom_client + ', location confirmée. Total: ' + formatMAD(c.total_du) + '. Merci — Location4You.')}`, '_blank');
  };

  const I = (label: string, key: string, type = 'text') => (
    <div key={key}>
      <label className="block text-xs font-medium mb-1">{label}</label>
      <input type={type} value={form[key] || ''} onChange={e => upd(key, e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
    </div>
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Gestion des Locations</h2><p className="text-muted-foreground text-sm">{list.length} contrat(s)</p></div>
        <div className="flex gap-2">
          <button onClick={()=>setImportOpen(true)} className="flex items-center gap-2 border border-border px-3 py-2 rounded-xl text-sm hover:bg-muted"><Upload className="w-4 h-4"/>Importer</button>
          <button onClick={openAdd} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90"><Plus className="w-4 h-4" />Nouveau</button>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Client, véhicule, n° contrat..." className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex gap-1">{['Tous', 'actif', 'termine', 'annule'].map(s => <button key={s} onClick={() => setFst(s)} className={`px-3 py-1.5 rounded-xl text-xs font-medium ${fst === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{{ Tous: 'Tous', actif: 'Actif', termine: 'Terminé', annule: 'Annulé' }[s as string]}</button>)}</div>
      </div>
      <div className="lg:hidden space-y-3">
        {shown.map(c => (
          <div key={c.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1"><span className="font-bold">{c.nom_client}</span><StatusBadge status={c.statut_contrat} /></div>
            <p className="text-xs text-muted-foreground font-mono">{c.id_contrat}</p>
            <p className="text-sm">{c.vehicule_label}</p>
            <div className="flex items-center justify-between mt-1 text-xs">
              <span>{c.date_debut} → {c.date_fin}</span>
              <span className="font-medium">{formatMAD(c.total_du)}</span>
            </div>
            <div className="flex gap-3 mt-2">
              <button onClick={() => openEdit(c)} className="flex items-center gap-1 text-xs text-muted-foreground"><Pencil className="w-3 h-3" />Modifier</button>
              <button onClick={() => wa(c)} className="flex items-center gap-1 text-xs text-green-600"><MessageCircle className="w-3 h-3" />WA</button>
              <button onClick={() => del(c)} className="flex items-center gap-1 text-xs text-destructive"><Trash2 className="w-3 h-3" />Suppr.</button>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden lg:block rounded-2xl border border-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border">
            <tr>{['ID', 'Client', 'Véhicule', 'Commercial', 'Période', 'Total', 'Paiement', 'Statut', 'Signature', 'Actions'].map(h => <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr>
          </thead>
          <tbody>
            {shown.map((c, i) => (
              <tr key={c.id} className={`border-b border-border/50 hover:bg-muted/20 ${i % 2 === 1 ? 'bg-muted/10' : ''}`}>
                <td className="py-2 px-3 font-mono text-xs">{c.id_contrat}</td>
                <td className="py-2 px-3 font-medium">{c.nom_client}<div className="text-xs text-muted-foreground">{c.telephone_client}</div></td>
                <td className="py-2 px-3">{c.vehicule_label}</td>
                <td className="py-2 px-3 text-xs">{c.nom_commercial || '—'}</td>
                <td className="py-2 px-3 text-xs">{c.date_debut} → {c.date_fin}</td>
                <td className="py-2 px-3 font-medium">{formatMAD(c.total_du)}</td>
                <td className="py-2 px-3"><StatusBadge status={c.statut_paiement} /></td>
                <td className="py-2 px-3"><StatusBadge status={c.statut_contrat} /></td>
                <td className="py-2 px-3">
                  {c.statut_signature==='signe'
                    ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600"><CheckCircle className="w-3 h-3"/>Signé</span>
                    : <span className="text-xs text-muted-foreground">Non signé</span>}
                </td>
                <td className="py-2 px-3"><div className="flex gap-1">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted" title="Modifier"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => generatePDF(c)} className="p-1.5 rounded-lg text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20" title="Télécharger PDF"><FileText className="w-4 h-4"/></button>
                  {c.statut_contrat==='actif'&&<button onClick={()=>setSignatureFor(c)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Faire signer"><PenLine className="w-4 h-4"/></button>}
                  <button onClick={() => wa(c)} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50" title="WhatsApp"><MessageCircle className="w-4 h-4" /></button>
                  <button onClick={() => del(c)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                </div></td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">Aucun contrat trouvé</td></tr>}
          </tbody>
        </table>
      </div>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">{edit ? 'Modifier' : 'Nouveau'} Contrat</h3><button onClick={() => setOpen(false)} className="text-xl text-muted-foreground">✕</button></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium mb-1">N° Contrat</label><input value={form.id_contrat} readOnly className="w-full px-3 py-2 rounded-xl border border-border bg-muted text-sm" /></div>
              {I('Nom Client *', 'nom_client')}{I('Téléphone', 'telephone_client')}{I('Email', 'email_client')}
              {I('CIN/Passeport', 'cin_passeport')}{I('Permis N°', 'permis_numero')}{I('Permis valable jusqu\'au', 'permis_validite','date')}{I('Commercial', 'nom_commercial')}
              <div><label className="block text-xs font-medium mb-1">Véhicule</label>
                <select value={form.vehicule_id || ''} onChange={e => { const v = vlist.find(x => x.id === e.target.value); upd('vehicule_id', e.target.value); if (v) upd('vehicule_label', v.immatriculation + ' — ' + v.marque + ' ' + v.modele); }} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
                  <option value="">-- Choisir --</option>
                  {vlist.filter(v => v.statut !== 'vendu').map(v => <option key={v.id} value={v.id}>{v.immatriculation} — {v.marque} {v.modele}</option>)}
                </select>
              </div>
              {I('Date Début *', 'date_debut', 'date')}{I('Date Fin *', 'date_fin', 'date')}
              {I('Tarif/Jour (MAD) *', 'tarif_jour', 'number')}{I('Total TTC (MAD)', 'total_du', 'number')}{I('Avance (MAD)', 'montant_avance', 'number')}
              <div><label className="block text-xs font-medium mb-1">Mode Paiement</label>
                <select value={form.mode_paiement || 'especes'} onChange={e => upd('mode_paiement', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
                  <option value="especes">Espèces</option><option value="virement">Virement</option><option value="visa">Visa</option>
                </select>
              </div>
              <div><label className="block text-xs font-medium mb-1">Statut Paiement</label>
                <select value={form.statut_paiement || 'nonpaye'} onChange={e => upd('statut_paiement', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
                  <option value="paye">Payé</option><option value="avance">Avance</option><option value="nonpaye">Non payé</option>
                </select>
              </div>
              <div><label className="block text-xs font-medium mb-1">Statut Contrat</label>
                <select value={form.statut_contrat || 'actif'} onChange={e => upd('statut_contrat', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
                  <option value="actif">Actif</option><option value="termine">Terminé</option><option value="annule">Annulé</option>
                </select>
              </div>
              <div><label className="block text-xs font-medium mb-1">Type</label>
                <select value={form.type_location || 'lcd'} onChange={e => upd('type_location', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
                  <option value="lcd">Courte durée</option><option value="lld">Longue durée</option>
                </select>
              </div>
            </div>
            {form.date_debut && form.date_fin && form.tarif_jour && (
              <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                <div className="grid grid-cols-2 gap-1 text-xs text-amber-700 dark:text-amber-500">
                  <div>Jours: {Math.max(0, Math.round((new Date(form.date_fin).getTime() - new Date(form.date_debut).getTime()) / 86400000))}</div>
                  <div>Total: <strong>{formatMAD(calcTotal(form))}</strong></div>
                  <div>Avance: {formatMAD(Number(form.montant_avance))}</div>
                  <div>Reste: <strong>{formatMAD(calcTotal(form) - Number(form.montant_avance))}</strong></div>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted">Annuler</button>
              <button onClick={save} disabled={saving} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Pad Dialog */}
      {signatureFor && (
        <SignaturePad
          contractLabel={`Contrat ${signatureFor.id_contrat} — ${signatureFor.nom_client} — ${signatureFor.vehicule_label}`}
          onSave={handleSignatureSave}
          onCancel={() => setSignatureFor(null)}
        />
      )}

      {/* Import CSV Dialog */}
      {importOpen && (
        <ImportDialog entityType="contrat" onImport={handleImportContrats} onClose={() => setImportOpen(false)} />
      )}
    </div>
  );
}
