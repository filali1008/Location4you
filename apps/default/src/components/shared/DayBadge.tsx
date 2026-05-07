import React from 'react';
import { daysUntil } from '@/lib/api';

interface DayBadgeProps {
  dateStr: string;
  label?: string;
  compact?: boolean;
}

export function DayBadge({ dateStr, label, compact }: DayBadgeProps) {
  if (!dateStr) return <span className="text-muted-foreground text-xs">—</span>;
  const days = daysUntil(dateStr);
  const isExpired = days < 0;
  const isCritical = days >= 0 && days <= 15;
  const isWarning = days > 15 && days <= 30;

  let cls = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  let text = `${days}j`;
  if (isExpired) {
    cls = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    text = 'EXPIRÉE';
  } else if (isCritical) {
    cls = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    text = `⚠️ ${days}j`;
  } else if (isWarning) {
    cls = 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    text = `${days}j`;
  }

  if (compact) {
    return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${cls}`}>{text}</span>;
  }

  return (
    <div className="flex flex-col">
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <span className="text-xs">{dateStr}</span>
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium mt-0.5 ${cls}`}>{text}</span>
    </div>
  );
}

export function alertLevel(dateStr: string): 'critical' | 'warning' | 'ok' | 'none' {
  if (!dateStr) return 'none';
  const days = daysUntil(dateStr);
  if (days === Infinity) return 'none';
  if (days <= 15) return 'critical';
  if (days <= 30) return 'warning';
  return 'ok';
}
