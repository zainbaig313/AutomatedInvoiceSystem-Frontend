'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import {
  FileSpreadsheet,
  Download,
  AlertCircle,
} from 'lucide-react';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function ReportsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else {
        api.invoices
            .getAll()
            .then((res) => setInvoices(res))
            .catch((err) => setError(err?.message || 'Error loading invoices'))
            .finally(() => setLoading(false));
      }
    }
  }, [user, isLoading, router]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setError(null);
      await api.invoices.downloadMonthlyReport(selectedYear, selectedMonth);
    } catch (err) {
      setError(err?.message || 'Failed to export Excel report.');
    } finally {
      setDownloading(false);
    }
  };

  // Filter invoices for preview of the selected month
  const monthString = selectedMonth.toString().padStart(2, '0');
  const targetPrefix = `${selectedYear}-${monthString}`;

  const monthInvoices = invoices.filter((i) => i.issueDate?.startsWith(targetPrefix));
  const monthTotal = monthInvoices.reduce((acc, i) => acc + (i.amount || 0), 0);
  const monthPaid = monthInvoices
    .filter((i) => i.status === 'Paid')
    .reduce((acc, i) => acc + (i.amount || 0), 0);
  const monthPending = monthInvoices
    .filter((i) => i.status === 'Pending')
    .reduce((acc, i) => acc + (i.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Monthly Reports & Export
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Export standardized accounting spreadsheets (.xlsx) for any monthly billing period.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-4">
          Select Reporting Period
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              {[2024, 2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={downloading}
            onClick={handleDownload}
            className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            {downloading ? 'Generating Report...' : 'Download Excel (.xlsx)'}
          </button>
        </div>
      </div>

      {/* Monthly Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Billed ({MONTH_NAMES[selectedMonth - 1]} {selectedYear})
          </span>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            Rs {monthTotal.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {monthInvoices.length} invoices issued
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Collected / Paid
          </span>
          <div className="mt-2 text-2xl font-bold text-emerald-700">
            Rs {monthPaid.toLocaleString()}
          </div>
          <span className="text-xs text-emerald-700 mt-1 block font-medium">
            {monthInvoices.filter((i) => i.status === 'Paid').length} paid invoices
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Pending Collection
          </span>
          <div className="mt-2 text-2xl font-bold text-amber-700">
            Rs {monthPending.toLocaleString()}
          </div>
          <span className="text-xs text-amber-700 mt-1 block font-medium">
            {monthInvoices.filter((i) => i.status === 'Pending').length} pending invoices
          </span>
        </div>
      </div>

      {/* Preview Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 bg-white">
          <h3 className="text-sm font-semibold text-slate-900">
            Invoices in {MONTH_NAMES[selectedMonth - 1]} {selectedYear} ({monthInvoices.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading preview...</div>
        ) : monthInvoices.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No invoices were issued in {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {monthInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {inv.clientName}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {inv.issueDate}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {inv.dueDate}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                      Rs {inv.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
