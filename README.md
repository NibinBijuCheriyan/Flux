# CRM System - Role-Based Access Control

A complete, production-ready CRM web application built with React, TypeScript, and Supabase. Features role-based access control for managers and employees with token-based form submissions.

## Features

### Authentication
- **Magic Link Authentication**: Passwordless email-based login via Supabase Auth
- **Role-Based Access**: Automatic routing based on user role (Manager/Employee)
- **Secure Sessions**: Managed by Supabase with automatic token refresh

### Manager Capabilities
- **Employee Management**: Add/remove employee email addresses
- **Token Generation**: Create unique tokens for form submissions
- **Token Management**: View, search, and cancel tokens
- **Complete Data Access**: View ALL entries from ALL employees and ALL days
- **Advanced Filtering**: Filter by employee, date range, status
- **Data Export**: Export filtered data to CSV
- **Analytics Dashboard**: Real-time statistics and insights

### Employee Capabilities
- **Token Generation**: Create tokens for customers
- **Form Submission**: Submit entries with token validation
- **Restricted Data View**: View ONLY own entries from CURRENT DAY
- **Personal Statistics**: Track daily and total submissions

### Token System
- **Unique Token IDs**: Format `TKN-YYYYMMDD-XXXX`
- **Customer Information**: Store name and phone with each token
- **Token Validation**: Verify token status before form submission
- **Auto-fill Customer Data**: Customer details populate from valid tokens
- **Status Tracking**: Active, Used, Cancelled states
- **Search Functionality**: Search by token ID, phone, or customer name

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling with custom design system
- **React Hook Form** + **Zod** for form validation
- **date-fns** for date manipulation
- **Lucide React** for icons

### Backend & Database
- **Supabase** (PostgreSQL + Auth + Real-time)
- **Row Level Security (RLS)** for automatic data filtering
- **Magic Links** for passwordless authentication

## Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd d:\CCRM
npm install
```

### 2. Set Up Supabase

#### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for database provisioning
4. Note your **Project URL** and **Anon Key** from Settings > API

#### Configure Environment Variables
1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Set Up Database Schema
1. Go to Supabase Dashboard > SQL Editor
2. Run the SQL from `database-setup.sql` (see below)
3. This creates all tables, RLS policies, and indexes

### 3. Configure Authentication

1. Go to Supabase Dashboard > Authentication > Providers
2. Enable **Email** provider
3. Enable **Magic Links** (passwordless)
4. Configure email templates (optional)
5. Set **Site URL** to `http://localhost:5173` (for development)
6. Add redirect URL: `http://localhost:5173`

### 4. Create Initial Manager Account

After setting up the database, you need to create the first manager account manually:

1. Go to Supabase Dashboard > SQL Editor
2. Run this SQL (replace with your email):

```sql
-- First, sign up via the app to create the auth user
-- Then run this to set the role to manager:
INSERT INTO users (id, email, role, is_active)
VALUES (
  'auth-user-id-from-auth-users-table',
  'manager@example.com',
  'manager',
  true
);
```

Or use the Supabase Dashboard > Authentication to create a user, then add them to the `users` table.

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Database Schema

See `database-setup.sql` for the complete schema. Key tables:

- **users**: Stores user information and roles
- **tokens**: Token generation and tracking
- **form_entries**: Customer form submissions

All tables have Row Level Security (RLS) enabled for automatic data filtering based on user role.

## Usage Guide

### For Managers

1. **Login**: Enter your email and click the magic link sent to your inbox
2. **Add Employees**: Go to Employees tab and add employee email addresses
3. **Generate Tokens**: Create tokens with customer name and phone
4. **View All Data**: Access complete database with filtering and export
5. **Manage Tokens**: Search, view, and cancel tokens as needed

### For Employees

1. **Login**: Enter your email and click the magic link
2. **Generate Tokens**: Create tokens for customers
3. **Submit Entries**: 
   - Enter token ID and click "Validate"
   - Customer details auto-fill from token
   - Complete the form and submit
4. **View Today's Work**: See only your entries from today

## Security Features

- Row Level Security (RLS) on all tables
- Employees can only see their own data from today
- Managers can see all data from all time
- Token validation prevents unauthorized submissions
- Secure authentication via Supabase Auth
- Environment variables for sensitive data

## Responsive Design

The application is fully responsive and works on:
- Desktop (1920px+)
- Laptop (1024px+)
- Tablet (768px+)
- Mobile (320px+)

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Update Supabase redirect URLs to your production domain
5. Deploy

### Deploy to Netlify

1. Push code to GitHub
2. Import project in Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables
6. Update Supabase redirect URLs
7. Deploy

## Testing Scenarios

- Manager login and employee management
- Employee login and restricted access
- Token generation and validation
- Form submission with valid/invalid tokens
- Data filtering by role (RLS)
- Date boundary transitions (employee data visibility)
- Search and filter functionality
- CSV export

## Future Enhancements

- Real-time updates with Supabase subscriptions
- Advanced analytics and reporting
- File upload support
- Email notifications
- Mobile app (React Native)
- Multi-language support
- Dark mode

## Troubleshooting

### Magic Link Not Received
- Check spam folder
- Verify email provider settings in Supabase
- Check Supabase email rate limits

### RLS Policies Not Working
- Ensure you're logged in
- Check user exists in `users` table with correct role
- Verify RLS is enabled on all tables

### Token Validation Fails
- Ensure token exists and status is 'active'
- Check token hasn't been used already
- Verify token format matches `TKN-YYYYMMDD-XXXX`

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Supabase documentation
3. Check browser console for errors

---

Built with React, TypeScript, and Supabase
