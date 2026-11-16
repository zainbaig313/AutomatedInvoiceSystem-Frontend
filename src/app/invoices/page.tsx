'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Invoice, Client, CreateInvoiceDto, PaymentProof, InvoiceStatus } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import {
  Plus,
  Search,
  Download,
  CheckCircle,
  Trash2,
  Eye,
  Copy,
  Check,
  FileText,
  AlertCircle,
  FileCheck,
  XCircle,
  Calendar,
} from 'lucide-react';

export default function InvoicesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | InvoiceStatus>('All');

  // Create Invoice Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateInvoiceDto>({
    clientId: 0,
    description: '',
    amount: 0,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    isRecurring: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // View Details Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceProofs, setInvoiceProofs] = useState<PaymentProof[]>([]);
  const [loadingProofs, setLoadingProofs] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Proof Review Modal State
  const [rejectModalProof, setRejectModalProof] = useState<PaymentProof | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reviewingProof, setReviewingProof] = useState(false);

  const [, startTransition] = useTransition();

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [invList, clientList] = await Promise.all([
        api.invoices.getAll(),
        api.clients.getAll(),
      ]);
      setInvoices(invList);
      setClients(clientList);
      if (clientList.length > 0 && createForm.clientId === 0) {
        setCreateForm((prev) => ({ ...prev, clientId: clientList[0].id }));
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.replace('/login');
      else loadData();
    }
  }, [user, isLoading, router]);

  // Load proofs when selectedInvoice changes
  const handleSelectInvoice = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    try {
      setLoadingProofs(true);
      const proofs = await api.proofs.getByInvoice(invoice.id);
      setInvoiceProofs(proofs);
    } catch (err) {
      console.error('Failed to load proofs for invoice', err);
      setInvoiceProofs([]);
    } finally {
      setLoadingProofs(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!createForm.clientId) {
      setCreateError('Please select a client.');
      return;
    }
    if (!createForm.description.trim()) {
      setCreateError('Description is required.');
      return;
    }
    if (createForm.amount <= 0) {
      setCreateError('Amount must be greater than zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.invoices.create(createForm);
      setIsCreateModalOpen(false);
      setCreateForm({
        clientId: clients[0]?.id || 0,
        description: '',
        amount: 0,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        isRecurring: false,
      });
      loadData();
    } catch (err: unknown) {
      if (err instanceof Error) setCreateError(err.message);
      else setCreateError('Failed to create invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = async (id: number, number: string) => {
    try {
      await api.invoices.downloadPdf(id, number);
    } catch {
      alert('Failed to download invoice PDF.');
    }
  };

  const handleMarkPaid = async (id: number) => {
    if (!confirm('Are you sure you want to mark this invoice as Paid?')) return;
    try {
      await api.invoices.markAsPaid(id);
      loadData();
      if (selectedInvoice && selectedInvoice.id === id) {
        setSelectedInvoice((prev) => (prev ? { ...prev, status: 'Paid' } : null));
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error marking invoice as paid.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this invoice?')) return;
    try {
      await api.invoices.delete(id);
      if (selectedInvoice?.id === id) {
        setSelectedInvoice(null);
      }
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting invoice.');
    }
  };

  const handleApproveProof = async (proof: PaymentProof) => {
    if (!confirm('Approve this payment proof? This will mark the invoice as Paid.')) return;
    try {
      setReviewingProof(true);
      await api.proofs.review(proof.id, { approved: true });
      if (selectedInvoice) {
        handleSelectInvoice(selectedInvoice);
      }
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to approve proof.');
    } finally {
      setReviewingProof(false);
    }
  };

  const handleRejectProofSubmit = async () => {
    if (!rejectModalProof) return;
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    try {
      setReviewingProof(true);
      await api.proofs.review(rejectModalProof.id, {
        approved: false,
        rejectReason: rejectReason.trim(),
      });
      setRejectModalProof(null);
      setRejectReason('');
      if (selectedInvoice) {
        handleSelectInvoice(selectedInvoice);
      }
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to reject proof.');
    } finally {
      setReviewingProof(false);
    }
  };

  const handleDownloadProofFile = async (proofId: number, filename: string) => {
    try {
      await api.proofs.downloadFile(proofId, filename);
    } catch {
      alert('Could not download proof file.');
    }
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' ? true : inv.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Invoices
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create, track, and manage client invoices and payment verification proofs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Invoice
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-lg">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by invoice #, client name, or description..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto text-xs font-medium">
          {(['All', 'Pending', 'ProofSubmitted', 'Paid', 'Rejected'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {status === 'ProofSubmitted' ? 'Proof Submitted' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading invoices...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-base font-medium text-slate-900">No invoices found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'All'
                ? 'Try adjusting your search query or status filter.'
                : 'Click "Create Invoice" above to generate your first invoice.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{inv.invoiceNumber}</div>
                      <div className="text-xs text-slate-500 truncate max-w-xs">
                        {inv.description}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{inv.clientName}</div>
                      <div className="text-xs text-slate-500">{inv.clientEmail}</div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-600">
                      {inv.issueDate}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-600 font-medium">
                      {inv.dueDate}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-semibold text-slate-900">
                      Rs {inv.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => handleSelectInvoice(inv)}
                        title="View Details"
                        className="p-1.5 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors inline-flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1 text-slate-400" />
                        <span className="text-xs">Details</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                        title="Download PDF"
                        className="p-1.5 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors inline-flex items-center"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {inv.status !== 'Paid' && (
                        <button
                          type="button"
                          onClick={() => handleMarkPaid(inv.id)}
                          title="Mark as Paid"
                          className="px-2 py-1 text-xs font-medium rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                        >
                          Mark Paid
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(inv.id)}
                        title="Delete Invoice"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors inline-flex items-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CREATE INVOICE MODAL ────────────────────────────────────────── */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Invoice"
        maxWidth="lg"
      >
        {createError && (
          <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {createError}
          </div>
        )}

        {clients.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-slate-700 mb-3">
              You need to add at least one client before creating an invoice.
            </p>
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                router.push('/clients');
              }}
              className="px-4 py-2 text-xs font-semibold rounded bg-slate-900 text-white"
            >
              Go to Clients Directory
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Select Client *
              </label>
              <select
                value={createForm.clientId}
                onChange={(e) =>
                  setCreateForm({ ...createForm, clientId: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email}) {c.company ? `- ${c.company}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Description / Line Items *
              </label>
              <textarea
                rows={3}
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm({ ...createForm, description: e.target.value })
                }
                placeholder="Monthly retainer services for software engineering, design, and hosting..."
                required
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Amount (PKR / Rs) *
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={createForm.amount || ''}
                onChange={(e) =>
                  setCreateForm({ ...createForm, amount: parseFloat(e.target.value) || 0 })
                }
                placeholder="50000"
                required
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Issue Date *
                </label>
                <input
                  type="date"
                  value={createForm.issueDate}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, issueDate: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={createForm.dueDate}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, dueDate: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={createForm.isRecurring}
                onChange={(e) =>
                  setCreateForm({ ...createForm, isRecurring: e.target.checked })
                }
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <label htmlFor="isRecurring" className="text-sm text-slate-700 cursor-pointer">
                Mark as Recurring Invoice
              </label>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
              <strong>Note:</strong> Creating this invoice will automatically generate the invoice PDF, assign a secure customer payment link, and dispatch an email directly to the client.
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 disabled:opacity-50"
              >
                {isSubmitting ? 'Generating & Sending...' : 'Generate & Send Invoice'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── VIEW INVOICE & PROOFS DRAWER / MODAL ────────────────────────── */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Invoice ${selectedInvoice.invoiceNumber}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
              <div>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                  Amount Due
                </span>
                <p className="text-2xl font-bold text-slate-900">
                  Rs {selectedInvoice.amount.toLocaleString()}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <StatusBadge status={selectedInvoice.status} />
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadPdf(selectedInvoice.id, selectedInvoice.invoiceNumber)
                  }
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium border border-slate-300 rounded hover:bg-slate-50 text-slate-700"
                >
                  <Download className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  PDF
                </button>
                {selectedInvoice.status !== 'Paid' && (
                  <button
                    type="button"
                    onClick={() => handleMarkPaid(selectedInvoice.id)}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    Mark Paid
                  </button>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Client Snapshot
                </span>
                <p className="font-medium text-slate-900 text-sm">{selectedInvoice.clientName}</p>
                <p className="text-slate-600">{selectedInvoice.clientEmail}</p>
                <p className="text-slate-600">{selectedInvoice.clientPhone}</p>
                {selectedInvoice.clientCompany && (
                  <p className="text-slate-600 font-medium mt-1">{selectedInvoice.clientCompany}</p>
                )}
                {selectedInvoice.clientCity && (
                  <p className="text-slate-500">{selectedInvoice.clientCity}</p>
                )}
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
                <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Timeline & Terms
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Issue Date:</span>
                  <span className="font-medium text-slate-900">{selectedInvoice.issueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Due Date:</span>
                  <span className="font-medium text-slate-900">{selectedInvoice.dueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Recurring:</span>
                  <span className="font-medium text-slate-900">
                    {selectedInvoice.isRecurring ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Token Expires:</span>
                  <span className="text-slate-600">
                    {new Date(selectedInvoice.tokenExpiresAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Description
              </span>
              <div className="p-3 bg-white border border-slate-200 rounded text-sm text-slate-800 whitespace-pre-wrap">
                {selectedInvoice.description}
              </div>
            </div>

            {/* Payment Proofs Verification Section */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileCheck className="w-4 h-4 text-slate-600" />
                  <h4 className="text-sm font-semibold text-slate-900">
                    Client Payment Proofs ({invoiceProofs.length})
                  </h4>
                </div>
                {loadingProofs && (
                  <span className="text-xs text-slate-400">Loading proofs...</span>
                )}
              </div>

              {invoiceProofs.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded text-center text-xs text-slate-500">
                  No payment proof uploaded by the client yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {invoiceProofs.map((proof) => (
                    <div
                      key={proof.id}
                      className="p-3 bg-white border border-slate-200 rounded-md shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-slate-900">
                            {proof.storedFileName}
                          </span>
                          <span className="text-slate-400">
                            ({proof.fileType.toUpperCase()}, {(proof.fileSize / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <StatusBadge status={proof.reviewStatus} />
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>
                          Uploaded: {new Date(proof.uploadedAt).toLocaleString()}
                        </span>
                        {proof.reviewedAt && (
                          <span>
                            Reviewed: {new Date(proof.reviewedAt).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {proof.rejectReason && (
                        <div className="p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
                          <strong>Rejection reason:</strong> {proof.rejectReason}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadProofFile(proof.id, proof.storedFileName)
                          }
                          className="inline-flex items-center text-xs text-slate-700 hover:text-slate-900 font-medium"
                        >
                          <Download className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          View / Download Receipt
                        </button>

                        {proof.reviewStatus === 'Pending' && (
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              disabled={reviewingProof}
                              onClick={() => handleApproveProof(proof)}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={reviewingProof}
                              onClick={() => setRejectModalProof(proof)}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ── REJECT PROOF REASON MODAL ────────────────────────────────────── */}
      {rejectModalProof && (
        <Modal
          isOpen={!!rejectModalProof}
          onClose={() => setRejectModalProof(null)}
          title="Reject Payment Proof"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Please enter the reason for rejecting this payment proof. The invoice status will be updated to Rejected.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Reason for Rejection *
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Unreadable screenshot, transfer amount mismatch, or wrong bank reference."
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setRejectModalProof(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reviewingProof || !rejectReason.trim()}
                onClick={handleRejectProofSubmit}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded hover:bg-rose-700 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

