import React from 'react';
import { FileSearch } from 'lucide-react';

export function JournalAudit() {
  return (
    <div className="p-4 lg:p-6">
      <h2 className="text-2xl font-bold">Journal d'Audit</h2>
      <p className="text-muted-foreground text-sm mt-1">Historique de toutes les modifications — Accès administrateur</p>
      <div className="mt-6 rounded-2xl border border-border bg-card shadow-sm p-8 text-center">
        <FileSearch className="w-12 h-12 text-muted-foreground mx-auto mb-3"/>
        <p className="text-muted-foreground">Le journal d'audit enregistre automatiquement toutes les créations, modifications et suppressions.</p>
      </div>
    </div>
  );
}
