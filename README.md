# Flux CRM

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)

A CRM and operations management system built for service centers. Flux handles customer token queuing, service entry tracking, expense logging, financial reporting, and employee management — all behind role-based access control backed by Supabase Row Level Security.

---

## What It Does

Flux is a single-page web application that replaces paper-based workflows in a service center with a structured digital system.

**For owners/managers**, it provides:
- A dashboard showing active tokens, total entries, employee counts, and monthly submissions at a glance
- Employee management — add employees by email, approve pending sign-ups, deactivate accounts
- Full access to all service entries across all employees and dates, with CSV export
- A financial P&L analytics view with daily revenue charts, monthly trend tables, revenue breakdowns by service type and employee, and categorized expense tracking
- Service directory management (store URLs, credentials, descriptions for third-party services the center uses)
- Center settings (name configuration that propagates to printed receipts)

**For employees**, it provides:
- Token generation and form submission for recording customer services
- A view of their own entries for the current day (historical data is manager-only by design)
- Expense logging against predefined categories
- Read-only access to the center's service directory

**For document processing** (manager-only), it includes a suite of client-side lamination and ID formatting tools:
- Misc ID Lamination — horizontal, vertical, and split modes
- Kathir ID Resizer — resize and layout for standard print
- UHID Card Resizer — 2×5 grid layout on A4
- RC Book Lamination — front/back zones with cropping
- E-Aadhaar Lamination — PDF extraction and crop
- Driving Licence Tool — 2-page PDF processing with auto-crop

All document tools run entirely in the browser. No files are uploaded to any server.

---

## Token System

Tokens use the format `FLX-[Base64]`, where the Base64 payload encodes the customer's name, phone number, and a random suffix. This means:

1. **Instant validation** — tokens can be decoded on the client without a database lookup
2. **Auto-fill** — when an employee enters a token ID into the form, customer details populate automatically
3. **State tracking** — tokens move through `active → used` or `active → cancelled` states, enforced server-side
4. **Daily numbering** — each token gets a sequential daily number for printable queue slips

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS 3 |
| Forms & Validation | React Hook Form + Zod |
| Data Tables | @tanstack/react-table |
| Icons | Lucide React |
| Backend & Auth | Supabase (PostgreSQL, Auth, Realtime) |
| PDF/Image Processing | jspdf, pdfjs-dist, react-image-crop |
| Data Export | xlsx |
| Deployment | Vercel |

---

## Architecture

```
src/
├── components/
│   ├── auth/           # Login screen
│   ├── employee/       # Employee dashboard, today's data view, service directory
│   ├── manager/        # Manager dashboard, employee mgmt, all-data view,
│   │                   # services, expenses, financial analytics
│   └── shared/         # Token generator, token history, form entry,
│                       # expense tracker, layout, loading spinner
├── context/            # TokensContext (real-time token state via Supabase Realtime)
├── hooks/              # useAuth, useTokens, useFormEntries, useExpenses,
│                       # useUsers, useServices, useCenterName
├── lib/                # Supabase client, TypeScript types, UI string constants
└── tools/              # Lamination & ID processing tools (fully client-side)
    ├── components/     # Shared tool UI (crop modal)
    ├── modules/        # Individual tool implementations
    └── utils/          # Auto-crop, PDF-to-image, print layout, password PDF
```

### Security Model

All data access is enforced at the database level through PostgreSQL Row Level Security (RLS). The frontend never bypasses these rules — Supabase's `anon` key can only access what the policies allow for the authenticated user.

Key policies:
- **Managers** see all users, tokens, and entries across the center
- **Employees** see all center tokens but only their own entries from the current day
- **Write access** is scoped — employees can only insert their own entries, managers can modify any record
- **Multi-center isolation** — the `center_id` column + RLS ensures centers cannot see each other's data

---

## Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later
- A **Supabase** project (free tier works)

---

## Setup

### 1. Clone and install

```bash
git clone <repository-url>
cd Flux
npm install
```

### 2. Configure environment

Copy the example env file and fill in your Supabase project credentials:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Both values are in your Supabase dashboard under **Settings → API**.

### 3. Set up the database

Run the migration files in order in the **Supabase SQL Editor**. They are located in `supabase/migrations/` and numbered `001` through `016`. Each file is idempotent and includes comments explaining what it does.

The migrations create:
- `users`, `tokens`, `form_entries`, `services`, `expenses` tables
- RLS policies for role-based data access
- A trigger that auto-links `auth.users` to `public.users` on sign-up
- A `roles` reference table and `center_id` multi-tenancy column
- Realtime subscriptions on tokens

### 4. Create the first owner account

1. Sign up through the app's login screen (email + password)
2. In the Supabase SQL Editor, promote that user to owner:

```sql
INSERT INTO users (id, email, role, center_id, is_active)
VALUES (
  '<auth-user-uuid>',
  'your@email.com',
  'owner',
  '<your-center-uuid>',
  true
);
```

After this, the owner can add employees directly from the Manager Dashboard.

### 5. Run the dev server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Deployment

The project includes a `vercel.json` with SPA rewrites configured. To deploy:

```bash
npm run build
```

Then deploy the `dist/` directory to Vercel, Netlify, or any static host. Set the two `VITE_SUPABASE_*` environment variables in your hosting provider's dashboard.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server (Vite HMR) |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint on all TS/TSX files |

---

## License

Private. All rights reserved.
