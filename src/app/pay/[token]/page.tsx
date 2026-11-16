'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { PublicInvoice } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import {
  FileText,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building,
} from 'lucide-react';

export default function PublicInvoicePage() {
  const params = useParams();
  const token = params?.token as string;

  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadInvoice = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.public.getInvoice(token);
      setInvoice(data);
    } catch {
      setError('This invoice payment link is invalid, expired, or has already been closed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
  }, [token]);

  const handleDownloadPdf = async () => {
    if (!token || !invoice) return;
    try {
      await api.public.downloadPdf(token, invoice.invoiceNumber);
    } catch {
      alert('Could not download invoice PDF. Please try again.');
    }
  };

  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !token) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File must be smaller than 5 MB.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Only JPG, PNG, and PDF files are accepted.');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      const res = await api.public.uploadProof(token, file);
      setUploadSuccess(res.message);
      setFile(null);
      // Update invoice status locally to ProofSubmitted
      setInvoice((prev) => (prev ? { ...prev, status: 'ProofSubmitted' } : null));
    } catch (err: unknown) {
      if (err instanceof Error) setUploadError(err.message);
      else setUploadError('Failed to upload proof of payment.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs mx-auto animate-pulse">
            IF
          </div>
          <p className="text-sm text-slate-500">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white border border-slate-200 rounded-lg p-8 text-center shadow-sm">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h1 className="text-lg font-bold text-slate-900">Payment Link Unavailable</h1>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          {error || 'This invoice could not be located. It may have expired or been completed.'}
        </p>
        <p className="text-xs text-slate-400 mt-4 border-t border-slate-100 pt-4">
          Please contact the sender if you believe this is an error.
        </p>
      </div>
    );
  }

  const isPaid = invoice.status === 'Paid';
  const isProofSubmitted = invoice.status === 'ProofSubmitted';
  const isRejected = invoice.status === 'Rejected';

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
            IF
          </div>
          <span className="font-semibold text-sm tracking-tight text-slate-900">
            InvoiceFlow
          </span>
        </div>
        <div className="flex items-center space-x-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Secure Payment Portal</span>
        </div>
      </div>

      {/* Main Invoice Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Invoice For
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              {invoice.clientName}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              Invoice #{invoice.invoiceNumber}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <StatusBadge status={invoice.status} />
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Amount & Due Date Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
          <div>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Total Amount Due
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              Rs {invoice.amount.toLocaleString()}
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Due Date
            </span>
            <div className="text-base font-semibold text-slate-800 mt-0.5 flex items-center">
              <Clock className="w-4 h-4 mr-1.5 text-slate-400" />
              {invoice.dueDate}
            </div>
          </div>
        </div>

        {/* Invoice Description / Scope */}
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Description of Services
          </span>
          <div className="p-3 bg-white border border-slate-200 rounded text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
            {invoice.description}
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5">
            <Building className="w-4 h-4 text-slate-600" />
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Payment Instructions & Bank Account
            </h3>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
            {invoice.paymentInstructions || 'Please consult the attached invoice PDF for bank instructions.'}
          </div>
        </div>

        {/* Payment Verification / Proof Upload Section */}
        <div className="pt-4 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Payment Verification
          </h3>

          {isPaid ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Payment Verified & Settled</p>
                <p className="text-xs mt-0.5 text-emerald-700">
                  Thank you! Your payment has been received and confirmed by the accountant.
                </p>
              </div>
            </div>
          ) : isProofSubmitted ? (
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-lg text-sky-900 flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Proof of Payment Received</p>
                <p className="text-xs mt-0.5 text-sky-800">
                  Your receipt is currently being reviewed by the accountant. Automated reminders are paused.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {isRejected && (
                <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  <strong>Previous proof was rejected:</strong> Please upload a legible receipt or bank transfer screenshot to confirm settlement.
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              {uploadError && (
                <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {uploadError}
                </div>
              )}

              <form onSubmit={handleUploadProof} className="space-y-3">
                <p className="text-xs text-slate-500">
                  Once you have completed the bank transfer, upload your payment receipt or screenshot (JPG, PNG, or PDF, max 5 MB):
                </p>

                <div className="border border-dashed border-slate-300 rounded-lg p-5 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                  <Upload className="w-6 h-6 mx-auto text-slate-400 mb-2" />
                  <input
                    type="file"
                    id="proofUpload"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => {
                      setFile(e.target.files?.[0] || null);
                      setUploadError(null);
                    }}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                  />
                  {file && (
                    <p className="text-xs text-slate-700 mt-2 font-medium">
                      Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!file || uploading}
                  className="w-full flex items-center justify-center py-2.5 px-4 text-xs font-semibold rounded-md text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {uploading ? 'Uploading Receipt...' : 'Submit Payment Proof'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

