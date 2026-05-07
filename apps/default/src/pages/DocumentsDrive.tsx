import React from 'react';
import { FolderOpen } from 'lucide-react';

export function DocumentsDrive() {
  return (
    <div className="p-4 lg:p-6">
      <h2 className="text-2xl font-bold">Documents Drive</h2>
      <p className="text-muted-foreground text-sm mt-1">Gestion des documents Google Drive liés à l'application</p>
      <div className="mt-6 rounded-2xl border border-border bg-card shadow-sm p-8 text-center">
        <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3"/>
        <p className="text-muted-foreground">Synchronisez vos documents Drive pour les retrouver ici.</p>
        <button className="mt-4 bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-medium hover:opacity-90">Synchroniser Drive</button>
      </div>
    </div>
  );
}
