const API_BASE = '/api';

export function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('invoiceflow_token');
}

export function setStoredToken(token) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('invoiceflow_token', token);
}

export function clearStoredToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('invoiceflow_token');
  localStorage.removeItem('invoiceflow_user');
}

async function handleResponse(res) {
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
    return {};
  }

  return res.json();
}

function getAuthHeaders() {
  const token = getStoredToken();
  const headers = {
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
    async login(dto) {
      const res = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      const data = await handleResponse(res);
      setStoredToken(data.token);
      return data;
    },

    async register(dto) {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      return handleResponse(res);
    },

    async getMe() {
      const res = await fetch(`${API_BASE}/users/me`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },

    async update(id, dto) {
      const endpoint = id && id > 0 ? `${API_BASE}/users/${id}` : `${API_BASE}/users/me`;
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(dto),
      });
      return handleResponse(res);
    },
  },

  // ── Clients ────────────────────────────────────────────────────────────────
  clients: {
    async getAll() {
      const res = await fetch(`${API_BASE}/clients`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },

    async getById(id) {
      const res = await fetch(`${API_BASE}/clients/${id}`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },

    async create(dto) {
      const res = await fetch(`${API_BASE}/clients`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dto),
      });
      return handleResponse(res);
    },

    async update(id, dto) {
      const res = await fetch(`${API_BASE}/clients/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(dto),
      });
      return handleResponse(res);
    },

    async delete(id) {
      const res = await fetch(`${API_BASE}/clients/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      await handleResponse(res);
    },

    async import(file) {
      const token = getStoredToken();
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/clients/import`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      return handleResponse(res);
    },
  },

  // ── Invoices ───────────────────────────────────────────────────────────────
  invoices: {
    async getAll() {
      const res = await fetch(`${API_BASE}/invoices`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },

    async getById(id) {
      const res = await fetch(`${API_BASE}/invoices/${id}`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },

    async create(dto) {
      const res = await fetch(`${API_BASE}/invoices`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dto),
      });
      return handleResponse(res);
    },

    async markAsPaid(id) {
      const res = await fetch(`${API_BASE}/invoices/${id}/mark-paid`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },

    async delete(id) {
      const res = await fetch(`${API_BASE}/invoices/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      await handleResponse(res);
    },

    async downloadPdf(id, invoiceNumber) {
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

    async downloadMonthlyReport(year, month) {
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
    async getByInvoice(invoiceId) {
      const res = await fetch(`${API_BASE}/payment-proofs/invoice/${invoiceId}`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },

    async review(proofId, dto) {
      const res = await fetch(`${API_BASE}/payment-proofs/${proofId}/review`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(dto),
      });
      return handleResponse(res);
    },

    async downloadFile(proofId, fileName) {
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
    async getInvoice(token) {
      const res = await fetch(`${API_BASE}/public/invoices/${token}`);
      return handleResponse(res);
    },

    async downloadPdf(token, invoiceNumber) {
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

    async uploadProof(token, file) {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/public/invoices/${token}/proof`, {
        method: 'POST',
        body: formData,
      });
      return handleResponse(res);
    },
  },
};
