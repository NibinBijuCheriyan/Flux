# 🚀 Quick Reference Guide

Quick commands and common tasks for the CRM System.

---

## 📦 Installation & Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🔧 Environment Setup

Create `.env.local` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🗄️ Database Quick Commands

### Create First Manager

```sql
-- After user signs up via magic link, get their ID from auth.users
-- Then run:
INSERT INTO users (id, email, role, is_active)
VALUES (
  'user-id-from-auth-users',
  'manager@example.com',
  'manager',
  true
);
```

### Check User Role

```sql
SELECT id, email, role, is_active 
FROM users 
WHERE email = 'user@example.com';
```

### View All Tokens

```sql
SELECT token_id, customer_name, customer_phone, status, generated_at
FROM tokens
ORDER BY generated_at DESC
LIMIT 10;
```

### View Recent Entries

```sql
SELECT e.customer_name, e.service_type, e.status, u.email as employee
FROM form_entries e
JOIN users u ON e.employee_id = u.id
ORDER BY e.submitted_at DESC
LIMIT 10;
```

### Reset Token Status

```sql
-- Change token from 'used' back to 'active' (for testing)
UPDATE tokens
SET status = 'active', used_at = NULL
WHERE token_id = 'TKN-20241230-1234';
```

---

## 🎯 Common User Tasks

### As Manager

**Add Employee:**
1. Login → Employees tab
2. Enter email → Add Employee
3. Employee receives magic link

**Generate Token:**
1. Tokens tab → Fill customer info
2. Generate Token → Copy token ID
3. Share with employee

**View All Data:**
1. All Data tab
2. Use filters (employee, date, search)
3. Export CSV if needed

**Cancel Token:**
1. Tokens tab → Find token
2. Click Cancel (if active)

### As Employee

**Submit Entry:**
1. Submit Entry tab
2. Enter token → Validate
3. Fill form → Submit

**View Today's Work:**
1. Today's Entries tab
2. See your submissions

---

## 🐛 Troubleshooting Commands

### Clear Browser Data

```javascript
// Run in browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Check Supabase Connection

```javascript
// Run in browser console
import { supabase } from './src/lib/supabase'
const { data, error } = await supabase.from('users').select('count')
console.log(data, error)
```

### Verify RLS Policies

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- View all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

### Reset Database (DANGER!)

```sql
-- ⚠️ This will delete ALL data!
DROP TABLE IF EXISTS form_entries CASCADE;
DROP TABLE IF EXISTS tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Then re-run database-setup.sql
```

---

## 📊 Useful Queries

### Statistics

```sql
-- Total entries by employee
SELECT u.email, COUNT(e.id) as total_entries
FROM users u
LEFT JOIN form_entries e ON u.id = e.employee_id
WHERE u.role = 'employee'
GROUP BY u.email
ORDER BY total_entries DESC;

-- Tokens by status
SELECT status, COUNT(*) as count
FROM tokens
GROUP BY status;

-- Entries by service type
SELECT service_type, COUNT(*) as count
FROM form_entries
GROUP BY service_type
ORDER BY count DESC;

-- Today's entries
SELECT COUNT(*) as today_count
FROM form_entries
WHERE DATE(submitted_at) = CURRENT_DATE;
```

### Data Cleanup

```sql
-- Remove inactive employees
DELETE FROM users
WHERE role = 'employee' AND is_active = false;

-- Cancel old unused tokens (older than 30 days)
UPDATE tokens
SET status = 'cancelled'
WHERE status = 'active' 
AND generated_at < NOW() - INTERVAL '30 days';
```

---

## 🔐 Security Checks

### Verify User Permissions

```sql
-- Check what current user can see
SELECT * FROM users; -- Should respect RLS
SELECT * FROM tokens; -- Should respect RLS
SELECT * FROM form_entries; -- Should respect RLS
```

### Test RLS as Different Users

```sql
-- Set session to specific user (for testing)
SET request.jwt.claim.sub = 'user-id-here';

-- Then run queries to test RLS
SELECT * FROM form_entries;
```

---

## 🚀 Deployment Checklist

- [ ] Update `.env.local` with production Supabase URL
- [ ] Set redirect URLs in Supabase (production domain)
- [ ] Build project: `npm run build`
- [ ] Test production build: `npm run preview`
- [ ] Deploy to Vercel/Netlify
- [ ] Add environment variables in hosting platform
- [ ] Test magic link authentication
- [ ] Verify RLS policies work in production
- [ ] Test all user flows (manager + employee)

---

## 📱 Browser Console Helpers

```javascript
// Check current user
const { data: { user } } = await supabase.auth.getUser()
console.log(user)

// Check session
const { data: { session } } = await supabase.auth.getSession()
console.log(session)

// Manual logout
await supabase.auth.signOut()

// Test token validation
const { data, error } = await supabase
  .from('tokens')
  .select('*')
  .eq('token_id', 'TKN-20241230-1234')
  .eq('status', 'active')
  .single()
console.log(data, error)
```

---

## 🎨 Customization

### Change Primary Color

Edit `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Change these values
        500: '#your-color',
        600: '#your-darker-color',
      },
    },
  },
},
```

### Update Logo

Replace in `src/components/shared/Layout.tsx`:

```tsx
<div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
  <span className="text-white font-bold text-xl">C</span>
  {/* Replace with your logo */}
</div>
```

---

## 📞 Quick Links

- **Supabase Dashboard**: https://app.supabase.com
- **Local Dev**: http://localhost:5173
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Netlify Dashboard**: https://app.netlify.com

---

## 💡 Pro Tips

1. **Use browser DevTools** to debug RLS issues
2. **Check Supabase logs** for authentication errors
3. **Test with multiple browser profiles** for different roles
4. **Use incognito mode** to test fresh sessions
5. **Keep Supabase Dashboard open** while developing
6. **Export data regularly** as backup
7. **Document custom changes** in separate file
8. **Use git branches** for new features

---

**Need more help?** Check [SETUP_GUIDE.md](SETUP_GUIDE.md) or [FEATURES.md](FEATURES.md)
