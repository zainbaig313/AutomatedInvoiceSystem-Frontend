'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Bank } from '@/types';
import { ArrowRight, AlertCircle, Info } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bank, setBank] = useState<Bank>('HBL');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [digitalWallet, setDigitalWallet] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Name, email, and password are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        name,
        email,
        password,
        bank,
        bankAccountNumber: bankAccountNumber.trim() || null,
        digitalWallet: digitalWallet.trim() || null,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create account.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
        <div className="mb-6">
          <div className="w-10 h-10 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-base mb-3">
            IF
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Create an Accountant Account
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Set up your organization and configure default bank & wallet payout details.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Zain Baig"
                required
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="zain@example.com"
                required
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-3">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Payment instructions for clients are built from these details:</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Primary Bank
                </label>
                <select
                  value={bank}
                  onChange={(e) => setBank(e.target.value as Bank)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
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
                  Bank Account / IBAN
                </label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="PK36HABB0000001234567801"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Digital Wallet (EasyPaisa / JazzCash)
                </label>
                <input
                  type="text"
                  value={digitalWallet}
                  onChange={(e) => setDigitalWallet(e.target.value)}
                  placeholder="EasyPaisa: 0300-1234567"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 flex items-center justify-center py-2.5 px-4 text-sm font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Registering...' : 'Create Account'}
            {!isSubmitting && <ArrowRight className="w-4 h-4 ml-1.5" />}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-slate-900 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

