# 🚀 Complete Setup Guide for CRM System

This guide will walk you through setting up the CRM application from scratch.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Database Configuration](#database-configuration)
4. [Authentication Setup](#authentication-setup)
5. [Local Development](#local-development)
6. [Creating First Manager](#creating-first-manager)
7. [Testing the Application](#testing-the-application)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js 18+** installed ([Download](https://nodejs.org/))
- ✅ **npm** (comes with Node.js)
- ✅ A **Supabase account** (free tier works) - [Sign up](https://supabase.com)
- ✅ A **code editor** (VS Code recommended)
- ✅ **Git** (optional, for version control)

---

## 2. Supabase Setup

### Step 2.1: Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in the details:
   - **Name**: `crm-system` (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Free tier is sufficient
4. Click **"Create new project"**
5. Wait 2-3 minutes for database provisioning

### Step 2.2: Get Your API Credentials

1. Once the project is ready, go to **Settings** (gear icon in sidebar)
2. Navigate to **API** section
3. Copy the following values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

⚠️ **Important**: Keep these credentials secure! Never commit them to Git.

---

## 3. Database Configuration

### Step 3.1: Run Database Setup SQL

1. In your Supabase project, go to **SQL Editor** (in the sidebar)
2. Click **"New Query"**
3. Open the `database-setup.sql` file from this project
4. Copy the entire SQL content
5. Paste it into the Supabase SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. Wait for the query to complete (should take a few seconds)

### Step 3.2: Verify Database Setup

Run this verification query in the SQL Editor:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'tokens', 'form_entries');
```

You should see 3 rows returned (users, tokens, form_entries).

### Step 3.3: Verify RLS Policies

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'tokens', 'form_entries');
```

All three tables should show `rowsecurity = true`.

---

## 4. Authentication Setup

### Step 4.1: Enable Email Authentication

1. Go to **Authentication** in the Supabase sidebar
2. Click **Providers**
3. Find **Email** and ensure it's **enabled**
4. Scroll down to **Email Auth** settings
5. Enable **"Enable email confirmations"** (optional, recommended for production)

### Step 4.2: Configure Magic Links

1. In the same **Providers** page, scroll to **Email** settings
2. Ensure **"Enable Magic Link"** is checked
3. Set **"Minimum password length"** (not used for magic links, but required)

### Step 4.3: Set Redirect URLs

1. Go to **Authentication** > **URL Configuration**
2. Set **Site URL** to:
   - Development: `http://localhost:5173`
   - Production: Your deployed URL (e.g., `https://yourapp.vercel.app`)
3. Add **Redirect URLs**:
   - `http://localhost:5173`
   - Your production URL (when deploying)

### Step 4.4: Customize Email Templates (Optional)

1. Go to **Authentication** > **Email Templates**
2. Customize the **Magic Link** email template
3. You can add your branding and messaging

---

## 5. Local Development

### Step 5.1: Configure Environment Variables

1. In the project root (`d:\CCRM`), locate `.env.local`
2. Open it and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Save the file

### Step 5.2: Install Dependencies (Already Done)

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### Step 5.3: Start Development Server

```bash
npm run dev
```

The application should now be running at `http://localhost:5173`

---

## 6. Creating First Manager

You need to create the first manager account manually. There are two methods:

### Method 1: Via Application + SQL (Recommended)

1. **Sign up via the app**:
   - Open `http://localhost:5173`
   - Enter your email (e.g., `manager@example.com`)
   - Click "Send Magic Link"
   - Check your email and click the link

2. **Get your user ID**:
   - Go to Supabase Dashboard > **Authentication** > **Users**
   - Find your email and copy the **User ID** (UUID)

3. **Add to users table**:
   - Go to **SQL Editor**
   - Run this query (replace with your values):

```sql
INSERT INTO users (id, email, role, is_active)
VALUES (
  'paste-your-user-id-here',
  'manager@example.com',
  'manager',
  true
);
```

4. **Refresh the app** - you should now see the Manager Dashboard!

### Method 2: Direct Database Insert (Advanced)

If you want to skip the magic link:

```sql
-- Create auth user (replace email and password)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'manager@example.com',
  crypt('temporary-password', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
)
RETURNING id;

-- Then add to users table with the returned ID
INSERT INTO users (id, email, role, is_active)
VALUES (
  'id-from-above-query',
  'manager@example.com',
  'manager',
  true
);
```

---

## 7. Testing the Application

### Test as Manager

1. **Login** with your manager email
2. **Add an employee**:
   - Go to "Employees" tab
   - Enter employee email (e.g., `employee@example.com`)
   - Click "Add Employee"

3. **Generate a token**:
   - Go to "Tokens" tab
   - Fill in customer name and phone
   - Click "Generate Token"
   - Copy the token ID

4. **Submit a form entry**:
   - Go to "Form Entry" tab
   - Paste the token ID and click "Validate"
   - Customer details should auto-fill
   - Complete the form and submit

5. **View all data**:
   - Go to "All Data" tab
   - You should see the entry you just created
   - Test filters and search

### Test as Employee

1. **Have the employee sign up**:
   - They should receive a magic link at the email you added
   - They click the link to sign in

2. **Employee should see**:
   - Employee Dashboard (not Manager Dashboard)
   - Only their own tokens
   - Only their entries from TODAY
   - Cannot access employee management

3. **Test data restrictions**:
   - Employee submits an entry today
   - They can see it in "Today's Entries"
   - Tomorrow, that entry should NOT be visible to them
   - Manager can still see all entries

---

## 8. Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Configure:
     - **Framework Preset**: Vite
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   - Add environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Click "Deploy"

3. **Update Supabase URLs**:
   - Go to Supabase > Authentication > URL Configuration
   - Add your Vercel URL to redirect URLs
   - Update Site URL to your Vercel URL

### Deploy to Netlify

1. **Push to GitHub** (same as above)

2. **Deploy on Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" > "Import an existing project"
   - Select your repository
   - Configure:
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`
   - Add environment variables in Site settings
   - Deploy

3. **Update Supabase URLs** (same as Vercel)

---

## 9. Troubleshooting

### Issue: Magic Link Not Received

**Solutions**:
- Check spam/junk folder
- Verify email provider settings in Supabase
- Check Supabase email rate limits (free tier: 3 emails/hour)
- Try a different email address
- Check Supabase logs: Authentication > Logs

### Issue: "Not authorized" or RLS Errors

**Solutions**:
- Ensure user exists in `users` table with correct role
- Verify RLS is enabled: Run verification query from Step 3.3
- Check user is logged in: Supabase Dashboard > Authentication > Users
- Clear browser cache and cookies
- Check browser console for errors

### Issue: Token Validation Fails

**Solutions**:
- Ensure token exists in database
- Check token status is 'active' (not 'used' or 'cancelled')
- Verify token format: `TKN-YYYYMMDD-XXXX`
- Check browser console for API errors

### Issue: Employee Sees All Data

**Solutions**:
- Verify RLS policies are correctly set up
- Check user role in `users` table is 'employee' (not 'manager')
- Ensure `auth.uid()` matches the user's ID
- Re-run database setup SQL

### Issue: Build Errors

**Solutions**:
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node.js version: `node --version` (should be 18+)
- Clear npm cache: `npm cache clean --force`

### Issue: Environment Variables Not Working

**Solutions**:
- Ensure `.env.local` exists in project root
- Variable names must start with `VITE_`
- Restart dev server after changing `.env.local`
- In production, set variables in hosting platform settings

### Issue: Database Connection Errors

**Solutions**:
- Verify Supabase URL and anon key are correct
- Check Supabase project is not paused (free tier pauses after inactivity)
- Check network/firewall settings
- Try accessing Supabase Dashboard directly

---

## 📞 Getting Help

If you encounter issues not covered here:

1. **Check browser console** for error messages
2. **Check Supabase logs**: Dashboard > Logs
3. **Review Supabase documentation**: [docs.supabase.com](https://supabase.com/docs)
4. **Check network tab** in browser DevTools for failed requests

---

## ✅ Setup Checklist

- [ ] Supabase project created
- [ ] Database schema set up (ran `database-setup.sql`)
- [ ] RLS policies verified
- [ ] Email authentication enabled
- [ ] Magic links configured
- [ ] Redirect URLs set
- [ ] `.env.local` configured with credentials
- [ ] Dependencies installed (`npm install`)
- [ ] First manager account created
- [ ] Application running (`npm run dev`)
- [ ] Tested manager login
- [ ] Tested employee creation
- [ ] Tested token generation
- [ ] Tested form submission
- [ ] Tested data visibility (manager vs employee)

---

**Congratulations! 🎉** Your CRM system is now fully set up and ready to use!
