'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Bank } from '@/types';
import {
  Settings,
  Building,
  CreditCard,
  Smartphone,
  Save,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, isLoading, updateProfile } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [bank, setBank] = useState<Bank>('HBL');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [digitalWallet, setDigitalWallet] = useState('');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else {
        setName(user.name || '');
        setBank((user.bank as Bank) || 'HBL');
        setBankAccountNumber(user.bankAccountNumber || '');
        setDigitalWallet(user.digitalWallet || '');
      }
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Full name cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      await updateProfile({
        name: name.trim(),
        bank,
        bankAccountNumber: bankAccountNumber.trim() || null,
        digitalWallet: digitalWallet.trim() || null,
      });
      setSuccessMsg('Profile and payout settings updated successfully.');
    } catch (err: unknown) {
      if (err instanceof Error) setErrorMsg(err.message);
      else setErrorMsg('Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Account & Payout Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure your payment instructions that appear on client invoice PDFs and emails.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start space-x-2">
          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">
            Accountant Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address (Read-only)
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Payout Banking Information Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Payout Bank & Digital Wallet
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              These details are automatically embedded into generated PDF invoices and public payment portals.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Designated Bank
              </label>
              <select
                value={bank}
                onChange={(e) => setBank(e.target.value as Bank)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="HBL">Habib Bank Limited (HBL)</option>
                <option value="ASKARI">Askari Bank (ASKARI)</option>
                <option value="ALFALAH">Bank Alfalah (ALFALAH)</option>
                <option value="UBL">United Bank Limited (UBL)</option>
                <option value="MCB">MCB Bank (MCB)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Bank Account Number / IBAN
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="PK36HABB0000001234567801"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number / Digital Wallet (EasyPaisa / JazzCash / Mobile)
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={digitalWallet}
                  onChange={(e) => setDigitalWallet(e.target.value)}
                  placeholder="e.g. 0300-1234567 or EasyPaisa: 0300-1234567"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {saving ? 'Saving changes...' : 'Save Payout Details'}
            </button>
          </div>
        </div>

        {/* Automation Job Info Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Automated Payment Reminders (Hangfire)
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                The backend runs a scheduled daily job at 8:00 AM UTC (1:00 PM PKT) that checks all pending invoices with enabled reminders and sends polite payment reminder emails.
              </p>
            </div>
          </div>

          <a
            href="http://localhost:5012/hangfire"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 self-start sm:self-center transition-colors whitespace-nowrap"
          >
            Hangfire Dashboard <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </a>
        </div>
      </form>
    </div>
  );
}

