import React from 'react';
import { InvoiceStatus, ReviewStatus } from '@/types';

interface StatusBadgeProps {
  status: InvoiceStatus | ReviewStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const normalized = (status || '').toString().toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = status;

  if (normalized === 'pending') {
    styles = 'bg-amber-50 text-amber-800 border-amber-200';
    label = 'Pending';
  } else if (normalized === 'proofsubmitted') {
    styles = 'bg-sky-50 text-sky-800 border-sky-200';
    label = 'Proof Submitted';
  } else if (normalized === 'paid' || normalized === 'approved') {
    styles = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    label = normalized === 'approved' ? 'Approved' : 'Paid';
  } else if (normalized === 'rejected') {
    styles = 'bg-rose-50 text-rose-800 border-rose-200';
    label = 'Rejected';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${styles} ${className}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
};

