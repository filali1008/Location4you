import axios from 'axios';

const BASE = '/api/taskade';

export const PROJECT_IDS = {
  vehicules: '3LNZmw7ySXyqM82m',
  contrats: 'nAb7RCkG4GmCLX41',
  factures: 'X7YWNiUT1n9fQePQ',
  chargesVehicules: 'b9xrrH28J7oSkm4h',
  chargesGenerales: 'SXUpsjnsAa8cBK7r',
  sinistres: 'cqbUcMZbf9JETjgb',
  planning: 'Y27psoHyzg5QjnpS',
};

async function getNodes(projectId: string) {
  const r = await axios.get(`${BASE}/projects/${projectId}/nodes`);
  return r.data.payload.nodes as any[];
}

async function createNode(projectId: string, data: Record<string, any>) {
  const r = await axios.post(`${BASE}/projects/${projectId}/nodes`, data);
  return r.data;
}

async function updateNode(projectId: string, nodeId: string, data: Record<string, any>) {
  const r = await axios.patch(`${BASE}/projects/${projectId}/nodes/${nodeId}`, data);
  return r.data;
}

async function deleteNode(projectId: string, nodeId: string) {
  const r = await axios.delete(`${BASE}/projects/${projectId}/nodes/${nodeId}`);
  return r.data;
}

function fv(node: any, key: string) {
  return node?.fieldValues?.[key] ?? null;
}

function parseDate(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val.split('T')[0];
  return '';
}

export async function getVehicules() {
  const nodes = await getNodes(PROJECT_IDS.vehicules);
  return nodes.filter((n) => !n.parentId).map((n) => ({
    id: n.id,
    immatriculation: fv(n, '/attributes/@immat') || '',
    marque: fv(n, '/attributes/@marque') || '',
    modele: fv(n, '/attributes/@modele') || '',
    km_actuel: fv(n, '/attributes/@kmact') || 0,
    date_mise_en_parc: parseDate(fv(n, '/attributes/@datparc')),
    date_derniere_vidange: parseDate(fv(n, '/attributes/@datvidng')),
    date_prochaine_visite_technique: parseDate(fv(n, '/attributes/@datvt')),
    date_fin_assurance: parseDate(fv(n, '/attributes/@datassur')),
    date_fin_carte_grise: parseDate(fv(n, '/attributes/@datcg')),
    valeur_achat: fv(n, '/attributes/@valach') || 0,
    tarif_reference: fv(n, '/attributes/@tarref') || 0,
    prix_location: fv(n, '/attributes/@prxloc') || 0,
    prix_revente: fv(n, '/attributes/@prxrev') || 0,
    organisme_financement: fv(n, '/attributes/@orgfin') || '',
    mensualite_credit: fv(n, '/attributes/@mensual') || 0,
    mois_restant_credit: fv(n, '/attributes/@moisrest') || 0,
    reste_a_payer: fv(n, '/attributes/@restapy') || 0,
    kr_due: fv(n, '/attributes/@krdue') || 0,
    client: fv(n, '/attributes/@client') || '',
    conducteur: fv(n, '/attributes/@conduct') || '',
    tel: fv(n, '/attributes/@tel') || '',
    lien_dossier_drive: fv(n, '/attributes/@liendrv') || '',
    statut: fv(n, '/attributes/@statut') || 'disponible',
  }));
}

function vehiculePayload(data: any) {
  return {
    '/text': `${data.marque || ''} ${data.modele || ''} — ${data.immatriculation || ''}`,
    '/attributes/@immat': data.immatriculation,
    '/attributes/@marque': data.marque,
    '/attributes/@modele': data.modele,
    '/attributes/@kmact': Number(data.km_actuel) || 0,
    '/attributes/@datparc': data.date_mise_en_parc || null,
    '/attributes/@datvidng': data.date_derniere_vidange || null,
    '/attributes/@datvt': data.date_prochaine_visite_technique || null,
    '/attributes/@datassur': data.date_fin_assurance || null,
    '/attributes/@datcg': data.date_fin_carte_grise || null,
    '/attributes/@valach': Number(data.valeur_achat) || 0,
    '/attributes/@tarref': Number(data.tarif_reference) || 0,
    '/attributes/@prxloc': Number(data.prix_location) || 0,
    '/attributes/@prxrev': Number(data.prix_revente) || 0,
    '/attributes/@orgfin': data.organisme_financement || '',
    '/attributes/@mensual': Number(data.mensualite_credit) || 0,
    '/attributes/@moisrest': Number(data.mois_restant_credit) || 0,
    '/attributes/@restapy': Number(data.reste_a_payer) || 0,
    '/attributes/@krdue': Number(data.kr_due) || 0,
    '/attributes/@client': data.client || '',
    '/attributes/@conduct': data.conducteur || '',
    '/attributes/@tel': data.tel || '',
    '/attributes/@liendrv': data.lien_dossier_drive || '',
    '/attributes/@statut': data.statut || 'disponible',
  };
}

export async function getContrats() {
  const nodes = await getNodes(PROJECT_IDS.contrats);
  return nodes.filter((n) => !n.parentId).map((n) => ({
    id: n.id,
    id_contrat: fv(n, '/attributes/@idcont') || '',
    nom_client: fv(n, '/attributes/@nomcli') || '',
    email_client: fv(n, '/attributes/@emailcli') || '',
    telephone_client: fv(n, '/attributes/@telcli') || '',
    adresse_client: fv(n, '/attributes/@adrcli') || '',
    cin_passeport: fv(n, '/attributes/@cinpass') || '',
    permis_numero: fv(n, '/attributes/@permisn') || '',
    permis_validite: parseDate(fv(n, '/attributes/@permisval')),
    vehicule_id: fv(n, '/attributes/@vehid') || '',
    vehicule_label: fv(n, '/attributes/@vehlbl') || '',
    type_location: fv(n, '/attributes/@typeloc') || 'lcd',
    organisme: fv(n, '/attributes/@organisme') || '',
    nom_commercial: fv(n, '/attributes/@nomcom') || '',
    date_debut: parseDate(fv(n, '/attributes/@datdeb')),
    date_fin: parseDate(fv(n, '/attributes/@datfin')),
    prolongation_fin: parseDate(fv(n, '/attributes/@datprol')),
    km_depart: fv(n, '/attributes/@kmdep') || 0,
    km_retour: fv(n, '/attributes/@kmret') || 0,
    tarif_jour: fv(n, '/attributes/@tarjour') || 0,
    total_du: fv(n, '/attributes/@totaldu') || 0,
    montant_avance: fv(n, '/attributes/@avance') || 0,
    mode_paiement: fv(n, '/attributes/@modepay') || '',
    statut_paiement: fv(n, '/attributes/@statpay') || 'nonpaye',
    statut_contrat: fv(n, '/attributes/@statcont') || 'actif',
    // 2nd driver
    conducteur2_nom: fv(n, '/attributes/@cond2nom') || '',
    conducteur2_permis: fv(n, '/attributes/@cond2perm') || '',
    conducteur2_permis_validite: parseDate(fv(n, '/attributes/@cond2permval')),
    // Options
    limitation_km: fv(n, '/attributes/@limkm') === true || fv(n, '/attributes/@limkm') === 'true',
    carburant: fv(n, '/attributes/@carburant') || '',
    lavage: fv(n, '/attributes/@lavage') || '',
    // Signature
    signature_client: fv(n, '/attributes/@sigcli') || '',
    signature_date: fv(n, '/attributes/@sigdat') || '',
    statut_signature: fv(n, '/attributes/@statsig') || 'nonsigne',
  }));
}

function contratPayload(data: any) {
  return {
    '/text': `${data.id_contrat} — ${data.nom_client}`,
    '/attributes/@idcont': data.id_contrat,
    '/attributes/@nomcli': data.nom_client,
    '/attributes/@emailcli': data.email_client || '',
    '/attributes/@telcli': data.telephone_client || '',
    '/attributes/@adrcli': data.adresse_client || '',
    '/attributes/@cinpass': data.cin_passeport || '',
    '/attributes/@permisn': data.permis_numero || '',
    '/attributes/@permisval': data.permis_validite || null,
    '/attributes/@vehid': data.vehicule_id || '',
    '/attributes/@vehlbl': data.vehicule_label || '',
    '/attributes/@typeloc': data.type_location || 'lcd',
    '/attributes/@organisme': data.organisme || '',
    '/attributes/@nomcom': data.nom_commercial || '',
    '/attributes/@datdeb': data.date_debut || null,
    '/attributes/@datfin': data.date_fin || null,
    '/attributes/@datprol': data.prolongation_fin || null,
    '/attributes/@kmdep': Number(data.km_depart) || 0,
    '/attributes/@kmret': Number(data.km_retour) || 0,
    '/attributes/@tarjour': Number(data.tarif_jour) || 0,
    '/attributes/@totaldu': Number(data.total_du) || 0,
    '/attributes/@avance': Number(data.montant_avance) || 0,
    '/attributes/@modepay': data.mode_paiement || '',
    '/attributes/@statpay': data.statut_paiement || 'nonpaye',
    '/attributes/@statcont': data.statut_contrat || 'actif',
    '/attributes/@cond2nom': data.conducteur2_nom || '',
    '/attributes/@cond2perm': data.conducteur2_permis || '',
    '/attributes/@cond2permval': data.conducteur2_permis_validite || null,
    '/attributes/@limkm': data.limitation_km ? 'true' : 'false',
    '/attributes/@carburant': data.carburant || '',
    '/attributes/@lavage': data.lavage || '',
    '/attributes/@sigcli': data.signature_client || '',
    '/attributes/@sigdat': data.signature_date || '',
    '/attributes/@statsig': data.statut_signature || 'nonsigne',
  };
}

// Auto-sync vehicle when contract is saved
async function syncVehicleFromContrat(data: any) {
  if (!data.vehicule_id) return;
  const isActive = data.statut_contrat === 'actif';
  const isEnded = data.statut_contrat === 'termine' || data.statut_contrat === 'annule';
  if (isActive) {
    await updateVehicule(data.vehicule_id, {
      client: data.nom_client,
      conducteur: data.conducteur2_nom || data.nom_client,
      tel: data.telephone_client,
      statut: 'enlocation',
    });
  } else if (isEnded) {
    await updateVehicule(data.vehicule_id, { client: '', conducteur: '', tel: '', statut: 'disponible' });
  }
}

async function autoCreateInvoiceIfNeeded(contratId: string, data: any) {
  if (data.statut_contrat !== 'termine') return;
  try {
    const existing = await getFactures();
    const alreadyExists = existing.some(f => f.contrat_id === contratId);
    if (alreadyExists) return;
    const today = new Date().toISOString().split('T')[0];
    const numFact = `FACT-${Date.now().toString().slice(-6)}/${new Date().getFullYear()}`;
    await createNode(PROJECT_IDS.factures, facturePayload({
      numero_facture: numFact,
      contrat_id: contratId,
      nom_client: data.nom_client,
      email_client: data.email_client || '',
      telephone_client: data.telephone_client || '',
      vehicule_label: data.vehicule_label || '',
      date_facture: today,
      montant: data.total_du,
      statut: 'enattente',
      date_debut_location: data.date_debut,
      date_fin_location: data.prolongation_fin || data.date_fin,
    }));
  } catch {}
}

export async function createContrat(data: any) {
  const result = await createNode(PROJECT_IDS.contrats, contratPayload(data));
  const id = (result as any)?.payload?.id || (result as any)?.id || '';
  await syncVehicleFromContrat(data).catch(() => {});
  await autoCreateInvoiceIfNeeded(id, data).catch(() => {});
  return result;
}
export async function updateContrat(id: string, data: any) {
  const result = await updateNode(PROJECT_IDS.contrats, id, contratPayload(data));
  await syncVehicleFromContrat(data).catch(() => {});
  await autoCreateInvoiceIfNeeded(id, data).catch(() => {});
  return result;
}
export async function deleteContrat(id: string) {
  return deleteNode(PROJECT_IDS.contrats, id);
}

export async function getFactures() {
  const nodes = await getNodes(PROJECT_IDS.factures);
  return nodes.filter((n) => !n.parentId).map((n) => ({
    id: n.id,
    numero_facture: fv(n, '/attributes/@numfact') || '',
    contrat_id: fv(n, '/attributes/@contrid') || '',
    nom_client: fv(n, '/attributes/@nomcli') || '',
    email_client: fv(n, '/attributes/@emailcli') || '',
    telephone_client: fv(n, '/attributes/@telcli') || '',
    vehicule_label: fv(n, '/attributes/@vehlbl') || '',
    date_facture: parseDate(fv(n, '/attributes/@datfact')),
    montant: fv(n, '/attributes/@montant') || 0,
    statut: fv(n, '/attributes/@statfact') || 'enattente',
    date_debut_location: parseDate(fv(n, '/attributes/@datdeb')),
    date_fin_location: parseDate(fv(n, '/attributes/@datfin')),
  }));
}

function facturePayload(data: any) {
  return {
    '/text': `${data.numero_facture} — ${data.nom_client}`,
    '/attributes/@numfact': data.numero_facture,
    '/attributes/@contrid': data.contrat_id || '',
    '/attributes/@nomcli': data.nom_client,
    '/attributes/@emailcli': data.email_client || '',
    '/attributes/@telcli': data.telephone_client || '',
    '/attributes/@vehlbl': data.vehicule_label || '',
    '/attributes/@datfact': data.date_facture || null,
    '/attributes/@montant': Number(data.montant) || 0,
    '/attributes/@statfact': data.statut || 'enattente',
    '/attributes/@datdeb': data.date_debut_location || null,
    '/attributes/@datfin': data.date_fin_location || null,
  };
}

export async function createFacture(data: any) {
  return createNode(PROJECT_IDS.factures, facturePayload(data));
}
export async function updateFacture(id: string, data: any) {
  return updateNode(PROJECT_IDS.factures, id, facturePayload(data));
}
export async function deleteFacture(id: string) {
  return deleteNode(PROJECT_IDS.factures, id);
}

export async function getChargesVehicules() {
  const nodes = await getNodes(PROJECT_IDS.chargesVehicules);
  return nodes.filter((n) => !n.parentId).map((n) => ({
    id: n.id,
    date: parseDate(fv(n, '/attributes/@date')),
    vehicule_id: fv(n, '/attributes/@vehid') || '',
    vehicule_label: fv(n, '/attributes/@vehlbl') || '',
    type_charge: fv(n, '/attributes/@typchg') || '',
    montant: fv(n, '/attributes/@montant') || 0,
    description: fv(n, '/attributes/@descr') || '',
    justificatif_url: fv(n, '/attributes/@justif') || '',
    photos_urls: fv(n, '/attributes/@photos') || '',
    km_au_moment: fv(n, '/attributes/@kmchg') || 0,
    prochaine_vt: parseDate(fv(n, '/attributes/@prochvt')),
    nouvelle_fin_assurance: parseDate(fv(n, '/attributes/@nouvasur')),
    prochaine_vidange: parseDate(fv(n, '/attributes/@prochvid')),
  }));
}

const KM_CHARGE_TYPES = ['vidange', 'visite', 'reparation', 'entretien', 'adblue'];

export async function createChargeVehicule(data: any) {
  const result = await createNode(PROJECT_IDS.chargesVehicules, {
    '/text': `${data.type_charge} — ${data.vehicule_label}`,
    '/attributes/@date': data.date || null,
    '/attributes/@vehid': data.vehicule_id || '',
    '/attributes/@vehlbl': data.vehicule_label || '',
    '/attributes/@typchg': data.type_charge,
    '/attributes/@montant': Number(data.montant) || 0,
    '/attributes/@descr': data.description || '',
    '/attributes/@justif': data.justificatif_url || '',
    '/attributes/@photos': data.photos_urls || '',
    '/attributes/@kmchg': Number(data.km_au_moment) || 0,
    '/attributes/@prochvt': data.prochaine_vt || null,
    '/attributes/@nouvasur': data.nouvelle_fin_assurance || null,
    '/attributes/@prochvid': data.prochaine_vidange || null,
  });

  // Auto-update vehicle fields based on charge type
  if (data.vehicule_id) {
    const vehUpdates: any = {};
    const kmVal = Number(data.km_au_moment);
    if (kmVal > 0 && KM_CHARGE_TYPES.includes(data.type_charge)) {
      // We'll handle KM comparison in the UI, just pass through
      vehUpdates['km_auto'] = kmVal;
    }
    if (data.type_charge === 'visite' && data.prochaine_vt) {
      vehUpdates.date_prochaine_visite_technique = data.prochaine_vt;
    }
    if (data.type_charge === 'assurance' && data.nouvelle_fin_assurance) {
      vehUpdates.date_fin_assurance = data.nouvelle_fin_assurance;
    }
    if (data.type_charge === 'vidange') {
      vehUpdates.date_derniere_vidange = data.date;
    }
    if (Object.keys(vehUpdates).length > 0) {
      // Pass to caller to handle KM comparison
      (result as any)._vehUpdates = vehUpdates;
      (result as any)._vehicule_id = data.vehicule_id;
    }
  }
  return result;
}

export async function deleteChargeVehicule(id: string) {
  return deleteNode(PROJECT_IDS.chargesVehicules, id);
}

// Helper to update vehicle after a charge, with KM sanity check
export async function applyVehicleUpdatesFromCharge(vehiculeId: string, updates: any, kmAuMoment?: number) {
  if (!vehiculeId) return;
  const payload: any = {};
  if (updates.date_prochaine_visite_technique) payload.date_prochaine_visite_technique = updates.date_prochaine_visite_technique;
  if (updates.date_fin_assurance) payload.date_fin_assurance = updates.date_fin_assurance;
  if (updates.date_derniere_vidange) payload.date_derniere_vidange = updates.date_derniere_vidange;
  if (kmAuMoment && kmAuMoment > 0) {
    // Get current vehicle to compare
    const vehs = await getVehicules();
    const veh = vehs.find(v => v.id === vehiculeId);
    if (veh && kmAuMoment > (veh.km_actuel || 0)) {
      payload.km_actuel = kmAuMoment;
    }
  }
  if (Object.keys(payload).length > 0) {
    await updateVehicule(vehiculeId, payload);
  }
  return payload;
}

export async function getChargesGenerales() {
  const nodes = await getNodes(PROJECT_IDS.chargesGenerales);
  return nodes.filter((n) => !n.parentId).map((n) => ({
    id: n.id,
    date: parseDate(fv(n, '/attributes/@date')),
    categorie: fv(n, '/attributes/@categ') || '',
    montant: fv(n, '/attributes/@montant') || 0,
    description: fv(n, '/attributes/@descr') || '',
    justificatif_url: fv(n, '/attributes/@justif') || '',
  }));
}

export async function createChargeGenerale(data: any) {
  return createNode(PROJECT_IDS.chargesGenerales, {
    '/text': `${data.categorie} — ${data.date}`,
    '/attributes/@date': data.date || null,
    '/attributes/@categ': data.categorie,
    '/attributes/@montant': Number(data.montant) || 0,
    '/attributes/@descr': data.description || '',
    '/attributes/@justif': data.justificatif_url || '',
  });
}

export async function deleteChargeGenerale(id: string) {
  return deleteNode(PROJECT_IDS.chargesGenerales, id);
}

export async function getSinistres() {
  const nodes = await getNodes(PROJECT_IDS.sinistres);
  return nodes.filter((n) => !n.parentId).map((n) => ({
    id: n.id,
    numero_dossier: fv(n, '/attributes/@numdos') || '',
    date_sinistre: parseDate(fv(n, '/attributes/@datsin')),
    vehicule_id: fv(n, '/attributes/@vehid') || '',
    vehicule_label: fv(n, '/attributes/@vehlbl') || '',
    description_dommages: fv(n, '/attributes/@descdom') || '',
    lieu_sinistre: fv(n, '/attributes/@lieu') || '',
    conducteur_nom: fv(n, '/attributes/@condnom') || '',
    conducteur_tel: fv(n, '/attributes/@condtel') || '',
    statut: fv(n, '/attributes/@statsin') || 'declare',
    montant_reparation: fv(n, '/attributes/@mtrepair') || 0,
    prise_en_charge_assurance: fv(n, '/attributes/@mteassur') || 0,
    franchise: fv(n, '/attributes/@franchise') || 0,
    garage_nom: fv(n, '/attributes/@garnom') || '',
    date_cloture: parseDate(fv(n, '/attributes/@datclo')),
    notes: fv(n, '/attributes/@notes') || '',
  }));
}

function sinistrePayload(data: any) {
  return {
    '/text': `${data.numero_dossier} — ${data.vehicule_label}`,
    '/attributes/@numdos': data.numero_dossier,
    '/attributes/@datsin': data.date_sinistre || null,
    '/attributes/@vehid': data.vehicule_id || '',
    '/attributes/@vehlbl': data.vehicule_label || '',
    '/attributes/@descdom': data.description_dommages || '',
    '/attributes/@lieu': data.lieu_sinistre || '',
    '/attributes/@condnom': data.conducteur_nom || '',
    '/attributes/@condtel': data.conducteur_tel || '',
    '/attributes/@statsin': data.statut || 'declare',
    '/attributes/@mtrepair': Number(data.montant_reparation) || 0,
    '/attributes/@mteassur': Number(data.prise_en_charge_assurance) || 0,
    '/attributes/@franchise': Number(data.franchise) || 0,
    '/attributes/@garnom': data.garage_nom || '',
    '/attributes/@datclo': data.date_cloture || null,
    '/attributes/@notes': data.notes || '',
  };
}

export async function createSinistre(data: any) {
  return createNode(PROJECT_IDS.sinistres, sinistrePayload(data));
}
export async function updateSinistre(id: string, data: any) {
  return updateNode(PROJECT_IDS.sinistres, id, sinistrePayload(data));
}
export async function deleteSinistre(id: string) {
  return deleteNode(PROJECT_IDS.sinistres, id);
}

export async function getBlocages() {
  const nodes = await getNodes(PROJECT_IDS.planning);
  return nodes.filter((n) => !n.parentId).map((n) => ({
    id: n.id,
    vehicule_id: fv(n, '/attributes/@vehid') || '',
    vehicule_label: fv(n, '/attributes/@vehlbl') || '',
    date_debut: parseDate(fv(n, '/attributes/@datdeb')),
    date_fin: parseDate(fv(n, '/attributes/@datfin')),
    motif: fv(n, '/attributes/@motif') || 'autre',
    notes: fv(n, '/attributes/@notes') || '',
  }));
}

export async function createBlocage(data: any) {
  return createNode(PROJECT_IDS.planning, {
    '/text': `Blocage ${data.motif} — ${data.vehicule_label}`,
    '/attributes/@vehid': data.vehicule_id || '',
    '/attributes/@vehlbl': data.vehicule_label || '',
    '/attributes/@datdeb': data.date_debut || null,
    '/attributes/@datfin': data.date_fin || null,
    '/attributes/@motif': data.motif || 'autre',
    '/attributes/@notes': data.notes || '',
  });
}

export async function deleteBlocage(id: string) {
  return deleteNode(PROJECT_IDS.planning, id);
}

export function formatMAD(n: number) {
  return (n || 0).toLocaleString('fr-MA') + ' MAD';
}

export function daysBetween(a: string, b: string): number {
  if (!a || !b) return 0;
  const da = new Date(a);
  const db = new Date(b);
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

export function daysUntil(dateStr: string): number {
  if (!dateStr) return Infinity;
  return daysBetween(new Date().toISOString().split('T')[0], dateStr);
}

export function genContratId() {
  return `LOC-${Date.now().toString().slice(-6)}`;
}

export function genFactureId() {
  return `FACT-${Date.now().toString().slice(-6)}/${new Date().getFullYear()}`;
}

export function genSinistreId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `SIN-${dateStr}-${Math.floor(Math.random() * 900) + 100}`;
}


export async function createVehicule(data: any) {
  return createNode(PROJECT_IDS.vehicules, vehiculePayload(data));
}
export async function updateVehicule(id: string, data: any) {
  return updateNode(PROJECT_IDS.vehicules, id, vehiculePayload(data));
}
export async function deleteVehicule(id: string) {
  return deleteNode(PROJECT_IDS.vehicules, id);
}
