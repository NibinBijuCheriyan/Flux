# ✅ CRM System - Setup Checklist

Use this checklist to ensure your CRM system is properly configured and ready for use.

---

## 📋 Pre-Setup Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Supabase account created
- [ ] Code editor installed (VS Code recommended)
- [ ] Email account for testing

---

## 🔧 Supabase Configuration

### Project Setup
- [ ] Created new Supabase project
- [ ] Project fully provisioned (no longer showing "Setting up project...")
- [ ] Copied Project URL from Settings > API
- [ ] Copied Anon Key from Settings > API
- [ ] Saved credentials securely

### Database Setup
- [ ] Opened SQL Editor in Supabase Dashboard
- [ ] Copied content from `database-setup.sql`
- [ ] Ran SQL in Supabase SQL Editor
- [ ] Verified tables created (users, tokens, form_entries)
- [ ] Verified RLS enabled on all tables
- [ ] Verified indexes created

### Authentication Setup
- [ ] Enabled Email provider in Authentication > Providers
- [ ] Enabled Magic Links
- [ ] Set Site URL to `http://localhost:5173`
- [ ] Added redirect URL: `http://localhost:5173`
- [ ] (Optional) Customized email templates

---

## 💻 Local Development Setup

### Environment Configuration
- [ ] Located `.env.local` file in project root
- [ ] Added `VITE_SUPABASE_URL` with your project URL
- [ ] Added `VITE_SUPABASE_ANON_KEY` with your anon key
- [ ] Saved `.env.local` file
- [ ] Verified no spaces or quotes around values

### Dependencies
- [ ] Ran `npm install` successfully
- [ ] No error messages during installation
- [ ] `node_modules` folder created

### Development Server
- [ ] Ran `npm run dev`
- [ ] Server started without errors
- [ ] Opened `http://localhost:5173` in browser
- [ ] Login page displays correctly

---

## 👤 First Manager Account

### Method 1: Via Application (Recommended)
- [ ] Entered email on login page
- [ ] Clicked "Send Magic Link"
- [ ] Received email (check spam if not in inbox)
- [ ] Clicked magic link in email
- [ ] Redirected to application
- [ ] Went to Supabase Dashboard > Authentication > Users
- [ ] Copied User ID (UUID)
- [ ] Went to SQL Editor
- [ ] Ran INSERT query to add user to `users` table with role 'manager'
- [ ] Refreshed application
- [ ] Manager Dashboard now visible

### Verification
- [ ] Can see "Manager Dashboard" heading
- [ ] Can see all tabs (Overview, Employees, Tokens, Form Entry, All Data)
- [ ] Statistics cards display correctly
- [ ] No console errors in browser DevTools

---

## 🧪 Functionality Testing

### Manager Tests
- [ ] **Add Employee**
  - [ ] Went to Employees tab
  - [ ] Entered employee email
  - [ ] Clicked "Add Employee"
  - [ ] Employee appears in list
  - [ ] No errors

- [ ] **Generate Token**
  - [ ] Went to Tokens tab
  - [ ] Filled customer name and phone
  - [ ] Clicked "Generate Token"
  - [ ] Token displayed with format `TKN-YYYYMMDD-XXXX`
  - [ ] Copied token successfully
  - [ ] Token appears in Token History

- [ ] **Submit Form Entry**
  - [ ] Went to Form Entry tab
  - [ ] Entered token ID
  - [ ] Clicked "Validate"
  - [ ] Customer name and phone auto-filled
  - [ ] Completed form fields
  - [ ] Submitted successfully
  - [ ] Success message displayed

- [ ] **View All Data**
  - [ ] Went to All Data tab
  - [ ] Entry appears in table
  - [ ] Search works
  - [ ] Filters work
  - [ ] Export CSV works

### Employee Tests
- [ ] **Employee Login**
  - [ ] Employee received magic link
  - [ ] Clicked link and logged in
  - [ ] Sees "Employee Dashboard" (not Manager)
  - [ ] Cannot see Employees tab

- [ ] **Generate Token as Employee**
  - [ ] Went to Tokens tab
  - [ ] Generated token successfully
  - [ ] Token appears in history

- [ ] **Submit Entry as Employee**
  - [ ] Went to Submit Entry tab
  - [ ] Validated token
  - [ ] Submitted form
  - [ ] Success message shown

- [ ] **View Today's Data**
  - [ ] Went to Today's Entries tab
  - [ ] Can see own entry from today
  - [ ] Cannot see manager's entries
  - [ ] Cannot see yesterday's entries

### Security Tests
- [ ] **RLS Verification**
  - [ ] Employee cannot see other employees' data
  - [ ] Employee cannot see data from previous days
  - [ ] Manager can see all data
  - [ ] Token validation prevents invalid submissions

---

## 🚀 Production Deployment (Optional)

### Pre-Deployment
- [ ] All tests passing
- [ ] No console errors
- [ ] Ran `npm run build` successfully
- [ ] Tested production build with `npm run preview`

### Vercel Deployment
- [ ] Pushed code to GitHub
- [ ] Created Vercel account
- [ ] Imported project from GitHub
- [ ] Added environment variables in Vercel
- [ ] Deployed successfully
- [ ] Updated Supabase redirect URLs with production domain
- [ ] Tested magic link on production

### Netlify Deployment
- [ ] Pushed code to GitHub
- [ ] Created Netlify account
- [ ] Imported project from GitHub
- [ ] Set build command: `npm run build`
- [ ] Set publish directory: `dist`
- [ ] Added environment variables in Netlify
- [ ] Deployed successfully
- [ ] Updated Supabase redirect URLs
- [ ] Tested on production

---

## 📚 Documentation Review

- [ ] Read README.md
- [ ] Read SETUP_GUIDE.md
- [ ] Reviewed FEATURES.md
- [ ] Bookmarked QUICK_REFERENCE.md
- [ ] Reviewed PROJECT_SUMMARY.md

---

## 🔍 Troubleshooting Checks

If something doesn't work, verify:

- [ ] Supabase credentials in `.env.local` are correct
- [ ] No typos in environment variable names
- [ ] Restarted dev server after changing `.env.local`
- [ ] Browser cache cleared
- [ ] Checked browser console for errors
- [ ] Checked Supabase logs
- [ ] RLS policies are enabled
- [ ] User exists in `users` table with correct role
- [ ] Network/firewall not blocking Supabase

---

## 🎯 Success Criteria

Your setup is complete when:

- ✅ Manager can login and see Manager Dashboard
- ✅ Manager can add employees
- ✅ Manager can generate tokens
- ✅ Manager can submit form entries
- ✅ Manager can view all data with filters
- ✅ Manager can delete data entries
- ✅ Manager can export data to CSV
- ✅ Employee can login and see Employee Dashboard
- ✅ Employee can generate tokens
- ✅ Employee can submit entries with token validation
- ✅ Employee can ONLY see own entries from TODAY
- ✅ Employee CANNOT see other employees' data
- ✅ Employee CANNOT see data from previous days
- ✅ Token validation works correctly
- ✅ Customer data auto-fills from valid tokens
- ✅ No console errors
- ✅ All features work as expected

---

## 📞 Next Steps

After completing this checklist:

1. **Customize the application** (optional)
   - Update branding/logo
   - Change color scheme
   - Add custom fields

2. **Train your team**
   - Share FEATURES.md with users
   - Demonstrate workflows
   - Answer questions

3. **Monitor usage**
   - Check Supabase dashboard regularly
   - Review logs for errors
   - Monitor database size

4. **Plan enhancements**
   - Review FEATURES.md for future ideas
   - Gather user feedback
   - Prioritize improvements

---

## 🎉 Congratulations!

If you've checked all the boxes above, your CRM system is fully operational and ready for production use!

**Need help?** Refer to:
- [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for common commands
- [FEATURES.md](FEATURES.md) for feature documentation

---

**Setup Date**: _______________  
**Completed By**: _______________  
**Production URL**: _______________  
**Notes**: _______________
