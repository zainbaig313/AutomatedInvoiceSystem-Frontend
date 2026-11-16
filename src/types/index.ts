export type Bank = 'HBL' | 'ASKARI' | 'ALFALAH' | 'UBL' | 'MCB';

export type InvoiceStatus = 'Pending' | 'ProofSubmitted' | 'Paid' | 'Rejected';

export type ReviewStatus = 'Pending' | 'Approved' | 'Rejected';

export interface User {
  id: number;
  name: string;
  email: string;
  bank: Bank | string;
  bankAccountNumber?: string | null;
  digitalWallet?: string | null;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  name: string;
  email: string;
  token: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  bank: Bank;
  bankAccountNumber?: string | null;
  digitalWallet?: string | null;
}

export interface UpdateUserDto {
  name: string;
  bank: Bank;
  bankAccountNumber?: string | null;
  digitalWallet?: string | null;
}

export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  company?: string | null;
  city?: string | null;
  isReminderEnabled: boolean;
}

export interface CreateClientDto {
  name: string;
  email: string;
  phone: string;
  company?: string | null;
  city?: string | null;
  isReminderEnabled: boolean;
}

export interface UpdateClientDto {
  name: string;
  email: string;
  phone: string;
  company?: string | null;
  city?: string | null;
  isReminderEnabled: boolean;
}

export interface BulkImportResponse {
  message: string;
  clients: Client[];
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  clientId: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany?: string | null;
  clientCity?: string | null;
  description: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  isRecurring: boolean;
  tokenExpiresAt: string;
  paymentTokenHash?: string;
}

export interface CreateInvoiceDto {
  clientId: number;
  description: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  isRecurring: boolean;
}

export interface PaymentProof {
  id: number;
  invoiceId: number;
  storedFileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  reviewStatus: ReviewStatus;
  rejectReason?: string | null;
  reviewedAt?: string | null;
}

export interface ReviewProofDto {
  approved: boolean;
  rejectReason?: string | null;
}

export interface PublicInvoice {
  invoiceNumber: string;
  clientName: string;
  description: string;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
  paymentInstructions: string;
}

