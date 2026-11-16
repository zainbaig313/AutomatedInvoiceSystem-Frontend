'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Modal } from '@/components/Modal';
import {
  Users,
  Plus,
  Search,
  Upload,
  Edit2,
  Trash2,
  Bell,
  BellOff,
  Building2,
  Mail,
  Phone,
  MapPin,
  Download,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export default function ClientsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Add / Edit Client Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    city: '',
    isReminderEnabled: true,
  });
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState(null);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.clients.getAll();
      setClients(data);
    } catch (err) {
      setError(err?.message || 'Failed to load clients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.replace('/login');
      else loadClients();
    }
  }, [user, isLoading, router]);

  const handleOpenAdd = () => {
    setEditingClient(null);
    setClientForm({
      name: '',
      email: '',
      phone: '',
      company: '',
      city: '',
      isReminderEnabled: true,
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (client) => {
    setEditingClient(client);
    setClientForm({
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company || '',
      city: client.city || '',
      isReminderEnabled: client.isReminderEnabled,
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!clientForm.name.trim() || !clientForm.email.trim() || !clientForm.phone.trim()) {
      setFormError('Name, email, and phone number are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingClient) {
        await api.clients.update(editingClient.id, {
          name: clientForm.name.trim(),
          email: clientForm.email.trim(),
          phone: clientForm.phone.trim(),
          company: clientForm.company?.trim() || null,
          city: clientForm.city?.trim() || null,
          isReminderEnabled: clientForm.isReminderEnabled,
        });
      } else {
        await api.clients.create({
          name: clientForm.name.trim(),
          email: clientForm.email.trim(),
          phone: clientForm.phone.trim(),
          company: clientForm.company?.trim() || null,
          city: clientForm.city?.trim() || null,
          isReminderEnabled: clientForm.isReminderEnabled,
        });
      }

      setIsAddModalOpen(false);
      loadClients();
    } catch (err) {
      setFormError(err?.message || 'Error saving client.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (id, name) => {
    if (!confirm(`Are you sure you want to delete client "${name}"?`)) return;
    try {
      await api.clients.delete(id);
      loadClients();
    } catch (err) {
      alert(err?.message || 'Failed to delete client.');
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    setImportError(null);
    setImportResult(null);

    if (!importFile) {
      setImportError('Please select a CSV or Excel file.');
      return;
    }

    try {
      setIsImporting(true);
      const res = await api.clients.import(importFile);
      setImportResult(res.message);
      setImportFile(null);
      loadClients();
    } catch (err) {
      setImportError(err?.message || 'Import failed.');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent =
      'Name,Email,Phone,Company,City,IsReminderEnabled\n' +
      'Ali Khan,ali@example.com,03001234567,Apex Solutions,Lahore,true\n' +
      'Sara Ahmed,sara@example.com,03129876543,Zenith Media,Karachi,true\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'clients_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter clients by search
  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.phone.toLowerCase().includes(term) ||
      (c.company || '').toLowerCase().includes(term) ||
      (c.city || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Clients Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your clients, auto-reminder rules, and import contacts in bulk.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setImportResult(null);
              setImportError(null);
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center px-3.5 py-2 rounded-md text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4 mr-1.5 text-slate-500" />
            Bulk Import
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Client
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, phone, company, or city..."
          className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
      </div>

      {/* Clients Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading clients...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-base font-medium text-slate-900">No clients found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm
                ? 'No client matches your search filter.'
                : 'Click "Add Client" or "Bulk Import" to populate your client list.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Reminders</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredClients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-400">ID #{c.id}</div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center text-slate-700 text-xs mb-0.5">
                        <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {c.email}
                      </div>
                      <div className="flex items-center text-slate-500 text-xs">
                        <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {c.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-700 text-xs">
                      {c.company ? (
                        <span className="inline-flex items-center">
                          <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {c.company}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-700 text-xs">
                      {c.city ? (
                        <span className="inline-flex items-center">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {c.city}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {c.isReminderEnabled ? (
                        <span className="inline-flex items-center text-xs font-medium text-emerald-700">
                          <Bell className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs text-slate-400">
                          <BellOff className="w-3.5 h-3.5 mr-1" />
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(c)}
                        title="Edit Client"
                        className="p-1.5 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors inline-flex items-center"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteClient(c.id, c.name)}
                        title="Delete Client"
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

      {/* ── ADD / EDIT CLIENT MODAL ─────────────────────────────────────── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingClient ? `Edit Client: ${editingClient.name}` : 'Add New Client'}
        maxWidth="md"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {formError}
          </div>
        )}

        <form onSubmit={handleSaveClient} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Client Name *
            </label>
            <input
              type="text"
              value={clientForm.name}
              onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
              placeholder="Ali Khan"
              required
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={clientForm.email}
                onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                placeholder="ali@example.com"
                required
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                value={clientForm.phone}
                onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                placeholder="0300-1234567"
                required
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Company (Optional)
              </label>
              <input
                type="text"
                value={clientForm.company || ''}
                onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
                placeholder="Apex Technologies"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                City (Optional)
              </label>
              <input
                type="text"
                value={clientForm.city || ''}
                onChange={(e) => setClientForm({ ...clientForm, city: e.target.value })}
                placeholder="Lahore"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="reminderEnabled"
              checked={clientForm.isReminderEnabled}
              onChange={(e) =>
                setClientForm({ ...clientForm, isReminderEnabled: e.target.checked })
              }
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <label htmlFor="reminderEnabled" className="text-xs text-slate-700 cursor-pointer">
              Enable automated daily invoice payment reminders for this client
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingClient ? 'Update Client' : 'Add Client'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── BULK IMPORT MODAL ────────────────────────────────────────────── */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Bulk Import Clients"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Upload a CSV or Excel (.xlsx) file containing client contacts. Existing client emails will be automatically skipped to prevent duplicates.
          </p>

          {importError && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {importResult && (
            <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{importResult}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Expected Column Format:</span>
              <button
                type="button"
                onClick={downloadSampleCsv}
                className="text-xs font-medium text-slate-900 hover:underline inline-flex items-center"
              >
                <Download className="w-3 h-3 mr-1" />
                Sample CSV
              </button>
            </div>
            <p className="font-mono text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200">
              Name,Email,Phone,Company,City,IsReminderEnabled
            </p>
          </div>

          <form onSubmit={handleImportSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Select File (.csv or .xlsx)
              </label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isImporting || !importFile}
                className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 disabled:opacity-50"
              >
                {isImporting ? 'Importing...' : 'Upload & Import'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
