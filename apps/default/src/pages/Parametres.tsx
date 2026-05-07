import React, { useState } from 'react';
import { toast } from 'sonner';

export function Parametres() {
  const [settings, setSettings] = useState({
    nom_agence: 'Location4You', adresse: '', telephone: '', email: '', site_web: '',
    rc: '', iban: '', devise: 'MAD', langue: 'Français'
  });
  const upd = (k: string, v: string) => setSettings(p=>({...p,[k]:v}));
  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold">Paramètres</h2>
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Informations de l'Agence</h3>
        {[['nom_agence','Nom de l\'Agence'],['adresse','Adresse'],['telephone','Téléphone'],['email','Email'],['site_web','Site Web'],['rc','N° Registre Commerce (RC)'],['iban','IBAN']].map(([k,l])=>(
          <div key={k}><label className="block text-xs font-medium mb-1">{l}</label>
            <input value={(settings as any)[k]||''} onChange={e=>upd(k,e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"/>
          </div>
        ))}
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium mb-1">Devise</label>
            <select value={settings.devise} onChange={e=>upd('devise',e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
              <option value="MAD">MAD (Dirham marocain)</option>
            </select>
          </div>
          <div><label className="block text-xs font-medium mb-1">Langue</label>
            <select value={settings.langue} onChange={e=>upd('langue',e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
              <option value="Français">Français</option>
            </select>
          </div>
        </div>
        <button onClick={()=>toast.success('Paramètres enregistrés')} className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-medium hover:opacity-90">Enregistrer</button>
      </div>
    </div>
  );
}
