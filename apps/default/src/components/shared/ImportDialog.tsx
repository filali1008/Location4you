import React, { useRef, useState, useCallback } from 'react';
import { Upload, X, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    const cols: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; continue; }
      if (c === ',' && !inQ) { cols.push(cur.trim()); cur = ''; continue; }
      cur += c;
    }
    cols.push(cur.trim());
    rows.push(cols);
  }
  return rows;
}

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

type ColMap = Record<string, string>;

const VEHICLE_MAP: ColMap = {
  immatriculation:'immatriculation',matriculation:'immatriculation',mat:'immatriculation',
  marque:'marque',modele:'modele',kmactuel:'km_actuel',statut:'statut',
  client:'client',conducteur:'conducteur',telephone:'tel',tel:'tel',
  datemiseenparc:'date_mise_en_parc',datemiseparc:'date_mise_en_parc',
  valeurachat:'valeur_achat',prixlocation:'prix_location',
  tarifreference:'tarif_reference',tarifref:'tarif_reference',
  prixrevente:'prix_revente',
  organismedefinancement:'organisme_financement',organisationfinancement:'organisme_financement',
  organisemefinancement:'organisme_financement',organismedefinancement2:'organisme_financement',
  mensualitecredit:'mensualite_credit',mensualite:'mensualite_credit',
  moisrestantcredit:'mois_restant_credit',moisrestants:'mois_restant_credit',
  resteapayer:'reste_a_payer',krdue:'kr_due',
  datedernierevidange:'date_derniere_vidange',
  prochainevisitetechnique:'date_prochaine_visite_technique',
  finassurance:'date_fin_assurance',datefinassurance:'date_fin_assurance',
  fincartesgrise:'date_fin_carte_grise',datefincartesgrise:'date_fin_carte_grise',
  liendossierdrive:'lien_dossier_drive',
};

const CONTRACT_MAP: ColMap = {
  noreservation:'id_contrat',reservation:'id_contrat',
  nomclient:'nom_client',client:'nom_client',
  telephoneclient:'telephone_client',telephone:'telephone_client',
  emailclient:'email_client',email:'email_client',
  cin:'cin_passeport',passeport:'cin_passeport',
  permis:'permis_numero',permisnumero:'permis_numero',
  datedebut:'date_debut',datefin:'date_fin',
  vehicule:'vehicule_label',tarifjour:'tarif_jour',totaldu:'total_du',
  avance:'montant_avance',modepaiement:'mode_paiement',
  statutpaiement:'statut_paiement',statutcontrat:'statut_contrat',
  kmdepart:'km_depart',carburant:'carburant',lavage:'lavage',
};

const CHARGE_VEH_MAP: ColMap = {
  date:'date',vehicule:'vehicule_label',immatriculation:'vehicule_label',
  typecharge:'type_charge',type:'type_charge',montant:'montant',description:'description',
};

const CHARGE_GEN_MAP: ColMap = {
  date:'date',categorie:'categorie',montant:'montant',description:'description',
};

const INVOICE_MAP: ColMap = {
  nofacture:'numero_facture',facture:'numero_facture',
  client:'nom_client',nomclient:'nom_client',email:'email_client',
  telephone:'telephone_client',vehicule:'vehicule_label',
  datefacture:'date_facture',date:'date_facture',montant:'montant',statut:'statut',
};

export const ENTITY_CONFIG: Record<string, {
  label: string; map: ColMap; required: string[]; template: string[];
}> = {
  vehicule:{ label:'Flotte Véhicules', map:VEHICLE_MAP, required:['immatriculation','modele'],
    template:['Immatriculation','Marque','Modèle','KM Actuel','Statut','Client','Conducteur','Téléphone','Date Mise en Parc','Valeur Achat','Prix Location','Tarif Référence','Prix Revente','Organisme Financement','Mensualité Crédit','Mois Restant Crédit','Reste à Payer','Date Dernière Vidange','Prochaine Visite Technique','Date Fin Assurance','Date Fin Carte Grise','Lien Dossier Drive'],
  },
  contrat:{ label:'Contrats', map:CONTRACT_MAP, required:['nom_client','date_debut','date_fin'],
    template:['N° Réservation','Nom Client','Téléphone Client','Email Client','CIN/Passeport','Permis N°','Date Début','Date Fin','Véhicule','Tarif/Jour','Total Dû','Avance','Mode Paiement','Statut Paiement','Statut Contrat','KM Départ','Carburant','Lavage'],
  },
  charge_vehicule:{ label:'Charges Véhicule', map:CHARGE_VEH_MAP, required:['date','montant'],
    template:['Date','Véhicule (immatriculation)','Type Charge','Montant','Description'],
  },
  charge_generale:{ label:'Charges Générales', map:CHARGE_GEN_MAP, required:['date','montant'],
    template:['Date','Catégorie','Montant','Description'],
  },
  facture:{ label:'Factures', map:INVOICE_MAP, required:['nom_client'],
    template:['N° Facture','Client','Email','Téléphone','Véhicule','Date Facture','Montant','Statut'],
  },
  sinistre:{ label:'Sinistres', map:{'date':'date_sinistre','vehicule':'vehicule_label','immatriculation':'vehicule_label','description':'description_dommages','lieu':'lieu_sinistre','conducteur':'conducteur_nom','telephone':'conducteur_tel','montant':'montant_reparation','assurance':'prise_en_charge_assurance','franchise':'franchise','garage':'garage_nom','statut':'statut','notes':'notes'}, required:['vehicule_label'],
    template:['Date','Véhicule','Description','Lieu','Conducteur','Téléphone','Montant Réparation','Assurance','Franchise','Garage','Statut','Notes'],
  },
};


export function ImportDialog({ entityType, onImport, onClose }: ImportDialogProps) {
  const cfg = ENTITY_CONFIG[entityType];
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [errors, setErrors] = useState<{ line: number; reason: string }[]>([]);
  const [imported, setImported] = useState<null | { inserted: number; errors: { line: number; reason: string }[] }>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  const processRows = useCallback((allRows: string[][]) => {
    if (allRows.length < 2) { toast.error('Fichier vide ou sans données'); return; }
    const rawH = allRows[0];
    const dataRows = allRows.slice(1);
    const parsed: Record<string, string>[] = [];
    const errs: { line: number; reason: string }[] = [];
    dataRows.forEach((vals, idx) => {
      if (vals.every(v => !v.trim())) return;
      const obj = mapRow(rawH, vals, cfg.map);
      const missing = cfg.required.filter(r => !obj[r]);
      if (missing.length) { errs.push({ line: idx + 2, reason: `Champs manquants: ${missing.join(', ')}` }); }
      else { parsed.push(obj); }
    });
    setRows(parsed); setErrors(errs);
  }, [cfg]);

  const readFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => { processRows(parseCSV(e.target?.result as string)); };
    reader.readAsText(file, 'UTF-8');
  }, [processRows]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0]; if (file) readFile(file);
  };

  const downloadTemplate = () => {
    const blob = new Blob([cfg.template.join(',') + '\n'], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `modele_${entityType}.csv`; a.click();
  };

  const doImport = async () => {
    if (!rows.length) { toast.error('Aucune ligne valide'); return; }
    setLoading(true);
    try { const result = await onImport(rows); setImported(result); if (result.inserted > 0) toast.success(`${result.inserted} enregistrement(s) importé(s)`); }
    catch { toast.error("Erreur lors de l'import"); }
    finally { setLoading(false); }
  };

  const previewRows = rows.slice(0, 5);
  const previewFields = Object.keys(previewRows[0] || {}).slice(0, 6);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div><h3 className="text-lg font-bold">Import depuis fichier</h3><p className="text-sm text-muted-foreground">{cfg.label}</p></div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          {!rows.length && !imported && (
            <div
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors cursor-pointer ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)} onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">Glisser-déposer un fichier CSV</p>
              <p className="text-sm text-muted-foreground mt-1">ou cliquer pour choisir</p>
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={e => e.target.files?.[0] && readFile(e.target.files[0])} />
            </div>
          )}
          {!imported && (
            <button onClick={downloadTemplate} className="flex items-center gap-2 text-sm text-primary hover:underline">
              <Download className="w-4 h-4" />Télécharger le modèle CSV
            </button>
          )}
          {rows.length > 0 && !imported && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Aperçu — <span className="text-green-600">{rows.length} ligne(s) valide(s)</span>
                  {errors.length > 0 && <span className="text-red-500 ml-2">{errors.length} erreur(s)</span>}
                </p>
                <p className="text-xs text-muted-foreground">{fileName}</p>
              </div>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40"><tr>{previewFields.map(f => <th key={f} className="text-left py-2 px-3 font-semibold text-muted-foreground">{f}</th>)}</tr></thead>
                  <tbody>{previewRows.map((r, i) => (<tr key={i} className="border-t border-border">{previewFields.map(f => <td key={f} className="py-2 px-3 truncate max-w-[140px]">{r[f] || '—'}</td>)}</tr>))}</tbody>
                </table>
              </div>
              {rows.length > 5 && <p className="text-xs text-muted-foreground">... et {rows.length - 5} ligne(s) supplémentaire(s)</p>}
              {errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 space-y-1">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Lignes ignorées ({errors.length})</p>
                  {errors.slice(0, 5).map(e => <p key={e.line} className="text-xs text-red-600 dark:text-red-400">Ligne {e.line}: {e.reason}</p>)}
                  {errors.length > 5 && <p className="text-xs text-red-500">... et {errors.length - 5} autre(s)</p>}
                </div>
              )}
              <button onClick={() => { setRows([]); setErrors([]); setFileName(''); }} className="text-xs text-muted-foreground hover:text-foreground underline">Changer de fichier</button>
            </div>
          )}
          {imported && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 shrink-0" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">{imported.inserted} enregistrement(s) importé(s)</p>
                {imported.errors.length > 0 && <p className="text-sm text-red-500 mt-0.5">{imported.errors.length} ligne(s) ignorée(s)</p>}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted">{imported ? 'Fermer' : 'Annuler'}</button>
          {!imported && rows.length > 0 && (
            <button onClick={doImport} disabled={loading} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Valider l'import ({rows.length} lignes)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function mapRow(headers: string[], values: string[], map: ColMap): Record<string, string> {
  const obj: Record<string, string> = {};
  headers.forEach((h, i) => {
    const field = map[normalize(h)];
    if (field && values[i] !== undefined) obj[field] = values[i];
  });
  return obj;
}

interface ImportDialogProps {
  entityType: keyof typeof ENTITY_CONFIG;
  onImport: (rows: Record<string, string>[]) => Promise<{ inserted: number; errors: { line: number; reason: string }[] }>;
  onClose: () => void;
}
