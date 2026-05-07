import React from 'react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  disponible: { label: 'Disponible', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  enlocation: { label: 'En location', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  enmaintenance: { label: 'En maintenance', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  horsservice: { label: 'Hors service', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  vendu: { label: 'Vendu', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
  actif: { label: 'Actif', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  termine: { label: 'Terminé', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
  annule: { label: 'Annulé', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  paye: { label: 'Payé', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  avance: { label: 'Avance', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  nonpaye: { label: 'Non payé', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  envoyee: { label: 'Envoyée', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  payee: { label: 'Payée', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  enattente: { label: 'En attente', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  annulee: { label: 'Annulée', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  declare: { label: 'Déclaré', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  expertise: { label: 'En expertise', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  reparation: { label: 'En réparation', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  pret: { label: 'Prêt', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  cloture: { label: 'Clôturé', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
  lcd: { label: 'Courte durée', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  lld: { label: 'Longue durée', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', config.className, className)}>
      {config.label}
    </span>
  );
}
