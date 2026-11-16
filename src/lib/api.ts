import {
  Client,
  CreateClientDto,
  UpdateClientDto,
  BulkImportResponse,
  CreateInvoiceDto,
  CreateUserDto,
  Invoice,
  LoginRequestDto,
  LoginResponse,
  PaymentProof,
  PublicInvoice,
  ReviewProofDto,
  UpdateUserDto,
  User,
} from '@/types';

const API_BASE = '/api';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('invoiceflow_token');
}

export function setStoredToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('invoiceflow_token', token);
}

export function clearStoredToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('invoiceflow_token');
  localStorage.removeItem('invoiceflow_user');
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.message) {
        errorMsg = data.message;
      } else if (typeof data === 'string') {
        errorMsg = data;
      }
    } catch {
      // not json
    }
    throw new Error(errorMsg);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ── Auth & Users ─────────────────────────────────────────────────────────────
export const api = {
  auth: {
    async login(dto: LoginRequestDto): Promise<LoginResponse> {
      const res = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      const data = await handleResponse<LoginResponse>(res);
      setStoredToken(data.token);
      return data;
    },

    async register(dto: CreateUserDto): Promise<User> {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      return handleResponse<User>(res);
    },

    async getMe(): Promise<User> {
      const res = await fetch(`${API_BASE}/users/me`, {
        headers: getAuthHeaders(),
      });
      return handleResponse<User>(res);
    },

    async update(id: number, dto: UpdateUserDto): Promise<User> {
      const endpoint = id && id > 0 ? `${API_BASE}/users/${id}` : `${API_BASE}/users/me`;
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(dto),
      });
      return handleResponse<User>(res);
    },
  },

  // ── Clients ────────────────────────────────────────────────────────────────
  clients: {
    async getAll(): Promise<Client[]> {
      const res = await fetch(`${API_BASE}/clients`, {
        headers: getAuthHeaders(),
      });
      return handleResponse<Client[]>(res);
    },

    async getById(id: number): Promise<Client> {
      const res = await fetch(`${API_BASE}/clients/${id}`, {
        headers: getAuthHeaders(),
      });
      return handleResponse<Client>(res);
    },

    async create(dto: CreateClientDto): Promise<Client> {
      const res = await fetch(`${API_BASE}/clients`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dto),
      });
      return handleResponse<Client>(res);
    },

    async update(id: number, dto: UpdateClientDto): Promise<Client> {
      const res = await fetch(`${API_BASE}/clients/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(dto),
      });
      return handleResponse<Client>(res);
    },

    async delete(id: number): Promise<void> {
      const res = await fetch(`${API_BASE}/clients/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      await handleResponse<void>(res);
    },

    async import(file: File): Promise<BulkImportResponse> {
      const token = getStoredToken();
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/clients/import`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      return handleResponse<BulkImportResponse>(res);
    },
  },

  // ── Invoices ───────────────────────────────────────────────────────────────
  invoices: {
    async getAll(): Promise<Invoice[]> {
      const res = await fetch(`${API_BASE}/invoices`, {
        headers: getAuthHeaders(),
      });
      return handleResponse<Invoice[]>(res);
    },

    async getById(id: number): Promise<Invoice> {
      const res = await fetch(`${API_BASE}/invoices/${id}`, {
        headers: getAuthHeaders(),
      });
      return handleResponse<Invoice>(res);
    },

    async create(dto: CreateInvoiceDto): Promise<Invoice> {
      const res = await fetch(`${API_BASE}/invoices`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dto),
      });
      return handleResponse<Invoice>(res);
    },

    async markAsPaid(id: number): Promise<{ message: string }> {
      const res = await fetch(`${API_BASE}/invoices/${id}/mark-paid`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      return handleResponse<{ message: string }>(res);
    },

    async delete(id: number): Promise<void> {
      const res = await fetch(`${API_BASE}/invoices/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      await handleResponse<void>(res);
    },

    async downloadPdf(id: number, invoiceNumber: string): Promise<void> {
      const token = getStoredToken();
      const res = await fetch(`${API_BASE}/invoices/${id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        throw new Error('Failed to download invoice PDF');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber || `invoice-${id}`}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },

    async downloadMonthlyReport(year: number, month: number): Promise<void> {
      const token = getStoredToken();
      const res = await fetch(`${API_BASE}/invoices/report?year=${year}&month=${month}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        let msg = 'Failed to generate monthly report.';
        try {
          const err = await res.json();
          if (err.message) msg = err.message;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const formattedMonth = month.toString().padStart(2, '0');
      a.download = `InvoiceReport-${year}-${formattedMonth}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  },

  // ── Payment Proofs ─────────────────────────────────────────────────────────
  proofs: {
    async getByInvoice(invoiceId: number): Promise<PaymentProof[]> {
      const res = await fetch(`${API_BASE}/payment-proofs/invoice/${invoiceId}`, {
        headers: getAuthHeaders(),
      });
      return handleResponse<PaymentProof[]>(res);
    },

    async review(proofId: number, dto: ReviewProofDto): Promise<PaymentProof> {
      const res = await fetch(`${API_BASE}/payment-proofs/${proofId}/review`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(dto),
      });
      return handleResponse<PaymentProof>(res);
    },

    async downloadFile(proofId: number, fileName: string): Promise<void> {
      const token = getStoredToken();
      const res = await fetch(`${API_BASE}/payment-proofs/${proofId}/file`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        throw new Error('Failed to download proof file');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || `proof-${proofId}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  },

  // ── Public Customer Portal ────────────────────────────────────────────────
  public: {
    async getInvoice(token: string): Promise<PublicInvoice> {
      const res = await fetch(`${API_BASE}/public/invoices/${token}`);
      return handleResponse<PublicInvoice>(res);
    },

    async downloadPdf(token: string, invoiceNumber: string): Promise<void> {
      const res = await fetch(`${API_BASE}/public/invoices/${token}/pdf`);
      if (!res.ok) {
        throw new Error('Failed to download PDF');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber || 'invoice'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },

    async uploadProof(token: string, file: File): Promise<{ message: string; proof: PaymentProof }> {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/public/invoices/${token}/proof`, {
        method: 'POST',
        body: formData,
      });
      return handleResponse<{ message: string; proof: PaymentProof }>(res);
    },
  },
};

