'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Invoice, Client } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import {
  FileText,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  ArrowRight,
  Download,
  FileSpreadsheet,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const loadData = async () => {
    try {
      setLoadingData(true);
      setError(null);
      const [invList, clientList] = await Promise.all([
        api.invoices.getAll(),
        api.clients.getAll(),
      ]);
      setInvoices(invList);
      setClients(clientList);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch dashboard data.');
      }
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else {
        loadData();
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || (loadingData && !invoices.length && !clients.length)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  // Calculate metrics
  const totalInvoiced = invoices.reduce((acc, inv) => acc + (inv.amount || 0), 0);
  const paidInvoices = invoices.filter((i) => i.status === 'Paid');
  const paidAmount = paidInvoices.reduce((acc, inv) => acc + (inv.amount || 0), 0);
  const pendingInvoices = invoices.filter((i) => i.status === 'Pending');
  const pendingAmount = pendingInvoices.reduce((acc, inv) => acc + (inv.amount || 0), 0);
  const proofSubmittedInvoices = invoices.filter((i) => i.status === 'ProofSubmitted');

  const recentInvoices = [...invoices].slice(0, 5);

  const handleDownloadPdf = async (id: number, number: string) => {
    try {
      await api.invoices.downloadPdf(id, number);
    } catch {
      alert('Could not download PDF.');
    }
  };

  const handleMarkPaid = async (id: number) => {
    if (!confirm('Mark this invoice as Paid?')) return;
    try {
      await api.invoices.markAsPaid(id);
      startTransition(() => {
        loadData();
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update invoice.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview of your invoices, incoming payment proofs, and client billing.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/invoices"
            className="inline-flex items-center px-3.5 py-2 rounded-md text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Invoice
          </Link>
          <Link
            href="/clients"
            className="inline-flex items-center px-3.5 py-2 rounded-md text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Users className="w-4 h-4 mr-1.5 text-slate-500" />
            Clients ({clients.length})
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Proofs Action Alert Banner */}
      {proofSubmittedInvoices.length > 0 && (
        <div className="p-4 rounded-lg bg-sky-50 border border-sky-200 text-sky-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-sky-700 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-semibold text-sm">
                {proofSubmittedInvoices.length} Payment {proofSubmittedInvoices.length === 1 ? 'Proof' : 'Proofs'} Awaiting Review
              </p>
              <p className="text-xs text-sky-800">
                Clients have uploaded payment receipts for review. Check and approve them to mark invoices as Paid.
              </p>
            </div>
          </div>
          <Link
            href="/invoices"
            className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold bg-white text-sky-900 border border-sky-300 hover:bg-sky-100 self-start sm:self-center transition-colors"
          >
            Review Proofs <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Invoiced
            </span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">
              Rs {totalInvoiced.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">{invoices.length} total</span>
          </div>
        </div>

        {/* Paid */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Collected / Paid
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-700">
              Rs {paidAmount.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-800 font-medium">
              {paidInvoices.length} paid
            </span>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Payments
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">
              Rs {pendingAmount.toLocaleString()}
            </span>
            <span className="text-xs text-amber-800 font-medium">
              {pendingInvoices.length} pending
            </span>
          </div>
        </div>

        {/* Needs Review */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Proofs Submitted
            </span>
            <AlertTriangle className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">
              {proofSubmittedInvoices.length}
            </span>
            <span className="text-xs text-sky-700 font-medium">
              Awaiting verification
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Invoices & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 spans): Recent Invoices */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Recent Invoices
            </h2>
            <Link
              href="/invoices"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center"
            >
              View all ({invoices.length}) <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            {recentInvoices.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-900">No invoices created yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Start by adding your first client and creating an invoice.
                </p>
                <Link
                  href="/invoices"
                  className="mt-4 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded bg-slate-900 text-white hover:bg-slate-800"
                >
                  Create Invoice
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Invoice</th>
                      <th className="px-4 py-3">Client</th>
                      <th className="px-4 py-3">Due Date</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {recentInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                          {inv.clientName}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                          {inv.dueDate}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                          Rs {inv.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                            title="Download PDF"
                            className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {inv.status !== 'Paid' && (
                            <button
                              type="button"
                              onClick={() => handleMarkPaid(inv.id)}
                              className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                            >
                              Mark Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 span): Quick Tools & Payout Info */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <h2 className="text-base font-semibold text-slate-900">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <Link
                href="/invoices"
                className="w-full flex items-center justify-between p-3 rounded-md border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-900"
              >
                <span className="flex items-center">
                  <FileText className="w-4 h-4 mr-2.5 text-slate-500" />
                  Create New Invoice
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/clients"
                className="w-full flex items-center justify-between p-3 rounded-md border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-900"
              >
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-2.5 text-slate-500" />
                  Manage Clients ({clients.length})
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/reports"
                className="w-full flex items-center justify-between p-3 rounded-md border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-900"
              >
                <span className="flex items-center">
                  <FileSpreadsheet className="w-4 h-4 mr-2.5 text-slate-500" />
                  Monthly Excel Report
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Current Bank & Profile Summary */}
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Payout Bank Details
              </h3>
              <Link
                href="/settings"
                className="text-xs text-slate-600 hover:text-slate-900 font-medium"
              >
                Edit
              </Link>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 text-xs">Primary Bank</span>
                <span className="font-medium text-slate-900">{user?.bank || 'Not set'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 text-xs">Account / IBAN</span>
                <span className="font-mono text-xs text-slate-900">
                  {user?.bankAccountNumber || 'Not set'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 text-xs">Digital Wallet</span>
                <span className="text-xs text-slate-900">
                  {user?.digitalWallet || 'Not set'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

