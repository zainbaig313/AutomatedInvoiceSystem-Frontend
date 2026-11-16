# InvoiceFlow Frontend Codebase Guide

This document explains every source file with custom implementation code in `InvoiceFlowFrontend/`. It details what each file does, the components/functions it exports, the backend APIs it interacts with, and how they connect across the system.

---

## 1. Architecture & Directory Overview

```
InvoiceFlowFrontend/
├── next.config.ts                      # Next.js & Turbopack config + /api/* reverse proxy
├── postcss.config.mjs                  # PostCSS plugin registration for Tailwind CSS v4
├── src/
│   ├── types/
│   │   └── index.ts                    # TypeScript types & DTO definitions
│   ├── lib/
│   │   └── api.ts                      # Centralized API client & HTTP fetch wrapper
│   ├── context/
│   │   └── AuthContext.tsx             # React Context for JWT auth, session, and state
│   ├── components/
│   │   ├── Navbar.tsx                  # Global responsive header & navigation bar
│   │   ├── Modal.tsx                   # Accessible modal dialog wrapper
│   │   └── StatusBadge.tsx             # Flat, high-contrast status indicator badge
│   └── app/
│       ├── layout.tsx                  # Root HTML shell & global AuthProvider wrapper
│       ├── globals.css                 # Tailwind v4 import & base styling
│       ├── page.tsx                    # Root landing page (redirects to dashboard or login)
│       ├── login/page.tsx              # Accountant sign-in page
│       ├── register/page.tsx           # Accountant registration with payout details
│       ├── dashboard/page.tsx          # Key metrics, alerts & quick actions
│       ├── invoices/page.tsx           # Full invoices manager, PDF, & proof review
│       ├── clients/page.tsx            # Clients directory, CRUD & bulk CSV/Excel import
│       ├── reports/page.tsx            # Monthly Excel report generation & preview
│       ├── settings/page.tsx           # Accountant profile & payout bank/wallet settings
│       └── pay/[token]/page.tsx        # Public customer payment portal & proof uploader
```

---

## 2. Configuration & Styling

### `next.config.ts`
* **Purpose:** Configures Next.js routing, compiler options, and the API reverse proxy.
* **Key Implementation:**
  * Defines an `async rewrites()` rule that intercepts any client call matching `/api/:path*` and forwards it to the ASP.NET Core backend (`http://localhost:5012/api/:path*` or the `BACKEND_URL` environment variable).
  * **Why it matters:** Eliminates browser CORS issues in local development and production by treating backend endpoints as same-origin requests.
  * Registers `@tailwindcss/turbopack` loader rules for Turbopack builds.

### `postcss.config.mjs`
* **Purpose:** PostCSS configuration file.
* **Key Implementation:** Loads `@tailwindcss/postcss`.
* **Why it matters:** Ensures Tailwind CSS v4 utility classes (`w-full`, `rounded-md`, `bg-slate-900`, etc.) compile properly in both Turbopack and Webpack build environments.

### `src/app/globals.css`
* **Purpose:** Global application stylesheet.
* **Key Implementation:**
  * Uses `@import "tailwindcss";` for Tailwind v4.
  * Defines core CSS variables (`--background: #f8fafc`, `--foreground: #0f172a`).
  * Enforces utilitarian, clean typography across all pages with zero radiant gradients or AI-slop styles.

---

## 3. Data Contracts & API Client

### `src/types/index.ts`
* **Purpose:** Pure TypeScript type definitions matching the backend ASP.NET Core DTOs and Enums.
* **Key Types Defined:**
  * `Bank`: `'HBL' | 'ASKARI' | 'ALFALAH' | 'UBL' | 'MCB'`
  * `InvoiceStatus`: `'Pending' | 'ProofSubmitted' | 'Paid' | 'Rejected'`
  * `ReviewStatus`: `'Pending' | 'Approved' | 'Rejected'`
  * `User`: Accountant profile (`id`, `name`, `email`, `bank`, `bankAccountNumber`, `digitalWallet`).
  * `Client`, `CreateClientDto`, `UpdateClientDto`: Customer account information and reminder settings.
  * `Invoice`, `CreateInvoiceDto`: Full invoice snapshots, amounts, dates, status, and tokens.
  * `PaymentProof`, `ReviewProofDto`: Uploaded receipt metadata and approval/rejection actions.
  * `PublicInvoice`: Opaque, safe customer-facing invoice object (without internal database IDs).

### `src/lib/api.ts`
* **Purpose:** Centralized HTTP request client that wraps native `fetch`.
* **Key Functions & Modules:**
  * `getStoredToken()` / `setStoredToken()` / `clearStoredToken()`: Manages the JWT bearer token in the browser's `localStorage`.
  * `getAuthHeaders()`: Automatically attaches `Authorization: Bearer <token>` when a token is present.
  * `handleResponse<T>()`: Parses JSON responses and translates HTTP error bodies (`{ message: "..." }`) into readable JavaScript exceptions.
  * `api.auth`: Methods for `login`, `register`, `getMe`, and `update`.
  * `api.clients`: Methods for `getAll`, `getById`, `create`, `update`, `delete`, and `import` (FormData file upload).
  * `api.invoices`: Methods for `getAll`, `getById`, `create`, `markAsPaid`, `delete`, `downloadPdf` (triggers browser blob download), and `downloadMonthlyReport` (Excel `.xlsx` blob download).
  * `api.proofs`: Methods for `getByInvoice`, `review`, and `downloadFile` (streams uploaded receipts from backend).
  * `api.public`: Unauthenticated methods for `getInvoice(token)`, `downloadPdf(token)`, and `uploadProof(token, file)`.

---

## 4. State & Authentication Context

### `src/context/AuthContext.tsx`
* **Purpose:** Global React Context providing user identity, JWT token storage, and authentication actions.
* **Key Implementation:**
  * `user`: Current logged-in accountant profile object.
  * `token`: Active JWT token string.
  * `isLoading`: Boolean flag indicating if token initialization/verification is running.
  * `login(dto)`: Authenticates with backend, saves the token, loads profile via `/api/users/me`, and redirects to `/dashboard`.
  * `register(dto)`: Registers an account and immediately logs in.
  * `updateProfile(dto)`: Calls `api.auth.update`, updating local state with new bank details or wallet numbers.
  * `logout()`: Clears localStorage and redirects the user to `/login`.
  * `useAuth()`: Custom hook to consume authentication state anywhere in the application.

---

## 5. Shared Reusable UI Components

### `src/components/Navbar.tsx`
* **Purpose:** Main navigation header rendered on all authenticated dashboard pages.
* **Key Implementation:**
  * Automatically hides itself on `/login`, `/register`, and public customer portals (`/pay/*`).
  * Navigation links: **Dashboard**, **Invoices**, **Clients**, **Reports**, and **Settings**.
  * Shows active route indicators with subtle slate highlights.
  * Displays user name, bank badge, and a one-click Sign Out button.
  * Includes a mobile-responsive secondary nav bar.

### `src/components/Modal.tsx`
* **Purpose:** Generic, accessible modal dialog overlay.
* **Key Implementation:**
  * Closes on backdrop click or when pressing the `Escape` key.
  * Temporarily locks `document.body.style.overflow = 'hidden'` while open to prevent background scrolling.
  * Supports configurable sizes (`maxWidth`: `sm`, `md`, `lg`, `xl`, `2xl`).

### `src/components/StatusBadge.tsx`
* **Purpose:** Visual pill badge for invoice and proof review statuses.
* **Key Implementation:**
  * Renders flat, high-contrast, border-defined badges without radiant colors or glowing effects:
    * `Pending`: Subtle amber (`bg-amber-50 text-amber-800 border-amber-200`)
    * `Proof Submitted`: Subtle sky-blue (`bg-sky-50 text-sky-800 border-sky-200`)
    * `Paid` / `Approved`: Subtle emerald-green (`bg-emerald-50 text-emerald-800 border-emerald-200`)
    * `Rejected`: Subtle rose-red (`bg-rose-50 text-rose-800 border-rose-200`)

---

## 6. App Routes & Pages

### `src/app/layout.tsx`
* **Purpose:** Next.js root layout shell.
* **Key Implementation:**
  * Wraps the entire component tree with `<AuthProvider>`.
  * Injects the persistent `<Navbar />`.
  * Applies base styling (`min-h-screen bg-slate-50 text-slate-900`) and standard typography.

### `src/app/page.tsx`
* **Purpose:** Root landing route (`/`).
* **Key Implementation:**
  * Checks authentication status on mount.
  * If authenticated, redirects to `/dashboard`.
  * If unauthenticated, redirects to `/login`.

### `src/app/login/page.tsx`
* **Purpose:** Sign-in screen for accountants (`/login`).
* **Key Implementation:**
  * Email and password form.
  * Invokes `login()` from `AuthContext`.
  * Displays inline error alert banner if authentication fails.
  * Provides a link to the registration page.

### `src/app/register/page.tsx`
* **Purpose:** Registration screen for new accountants (`/register`).
* **Key Implementation:**
  * Captures accountant identity: Full Name, Email, Password.
  * Captures payout configuration: Primary Bank (`HBL`, `ASKARI`, `ALFALAH`, `UBL`, `MCB`), IBAN / Bank Account Number, and Digital Wallet / Phone number.
  * Calls `register()`, which stores the accountant and defaults these coordinates for future invoice emails and PDFs.

### `src/app/dashboard/page.tsx`
* **Purpose:** Executive overview & KPI command center (`/dashboard`).
* **Key Implementation:**
  * Fetches all invoices and clients in parallel on load.
  * Computes financial summaries:
    * Total Invoiced Amount (PKR)
    * Collected / Paid Amount
    * Pending Invoiced Balance
    * Proofs Awaiting Verification Count
  * Renders an **Action Banner** if clients have submitted payment receipts that need review.
  * Shows a table of recent invoices with quick action buttons (PDF download, Mark Paid).
  * Quick links to create an invoice, view clients, and export monthly Excel spreadsheets.

### `src/app/invoices/page.tsx`
* **Purpose:** Core invoice management dashboard (`/invoices`).
* **Key Implementation:**
  * **Search & Filters:** Real-time search across invoice #, client name, and description, plus status filter tabs (`All`, `Pending`, `ProofSubmitted`, `Paid`, `Rejected`).
  * **Create Invoice Modal:** Form with client dropdown, description, amount, issue date, due date, and recurring toggle. Calls `POST /api/invoices`, which generates the PDF, hashes a secret token, and sends the customer an email.
  * **Invoice Details Modal:**
    * Full client snapshot & payment timeline.
    * **Public Customer Payment Link Box:** Includes a one-click copy button (`/pay/{hash}`) for manual sharing.
    * Direct download invoice PDF trigger.
    * One-click "Mark as Paid" action.
    * Delete invoice confirmation.
  * **Payment Proofs Review Console:**
    * Fetches and displays receipts uploaded by the customer for that invoice.
    * Allows the accountant to download and inspect the receipt file.
    * **Approve:** Marks invoice as `Paid`.
    * **Reject:** Prompts for mandatory rejection reason and updates invoice status to `Rejected`.

### `src/app/clients/page.tsx`
* **Purpose:** Customer directory and import manager (`/clients`).
* **Key Implementation:**
  * Searchable table listing client names, emails, phones, companies, and cities.
  * Displays automated daily reminder status (`Enabled` / `Disabled`).
  * **Add / Edit Client Modal:** Manages client details and reminder preferences.
  * **Delete Client Action:** Removes client with confirmation.
  * **Bulk Import Modal:**
    * File dropzone for `.csv` or `.xlsx` contact files.
    * Uploads directly to `POST /api/clients/import`.
    * Provides a one-click "Sample CSV" download with standard headers (`Name,Email,Phone,Company,City,IsReminderEnabled`).
    * Shows import counts and skips duplicate emails automatically.

### `src/app/reports/page.tsx`
* **Purpose:** Accounting reports and spreadsheet exporter (`/reports`).
* **Key Implementation:**
  * Year and month selector dropdowns.
  * Live preview table displaying invoices issued within the selected month.
  * Monthly KPI overview: Total Billed, Collected/Paid, and Outstanding.
  * **Download Excel (.xlsx) button:** Calls `GET /api/invoices/report?year={Y}&month={M}` and streams the ClosedXML spreadsheet directly to the browser.

### `src/app/settings/page.tsx`
* **Purpose:** Accountant profile and payout destination settings (`/settings`).
* **Key Implementation:**
  * Displays editable Full Name, Bank selection, Bank Account Number / IBAN, and Phone Number / Digital Wallet (EasyPaisa / JazzCash).
  * Form submissions trigger `PUT /api/users/me`.
  * Details entered here automatically populate customer PDF invoices and payment instructions.
  * Includes a direct link to the Hangfire background job dashboard (`http://localhost:5012/hangfire`).

### `src/app/pay/[token]/page.tsx`
* **Purpose:** Public, unauthenticated payment portal for customers (`/pay/[token]`).
* **Key Implementation:**
  * Reached by clients via the secure link sent in their billing email.
  * Uses the route `token` parameter to call `GET /api/public/invoices/{token}`.
  * Displays:
    * Invoice summary, amount due, and due date.
    * Bank name, account number, and digital wallet instructions.
    * Download official invoice PDF button.
  * **Payment Proof Upload:**
    * Form accepting JPG, PNG, or PDF receipts (max 5 MB).
    * Submits file to `POST /api/public/invoices/{token}/proof`.
    * Updates state immediately to `ProofSubmitted`, pausing automated reminder emails and alerting the accountant for review.
