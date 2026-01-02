# 📚 CRM System - Feature Documentation

Complete feature overview and user guide for the CRM System.

---

## 🎯 System Overview

The CRM System is a role-based application designed for managing customer interactions through a token-based workflow. It supports two user roles with distinct capabilities:

- **Managers**: Full system access with employee management and complete data visibility
- **Employees**: Restricted access with token generation and form submission capabilities

---

## 🔐 Authentication System

### Magic Link Authentication

**How it works:**
1. User enters their email address
2. System sends a magic link to their email
3. User clicks the link to authenticate
4. System automatically routes to appropriate dashboard based on role

**Benefits:**
- ✅ No passwords to remember
- ✅ Secure authentication via Supabase
- ✅ Automatic session management
- ✅ Mobile-friendly

**Security Features:**
- Email verification
- Secure token-based sessions
- Automatic session refresh
- Role-based access control (RBAC)

---

## 👨‍💼 Manager Features

### 1. Employee Management

**Capabilities:**
- Add new employees by email address
- View list of all active employees
- Remove employees from the system
- Track when employees were added

**Workflow:**
1. Navigate to "Employees" tab
2. Enter employee email address
3. Click "Add Employee"
4. Employee receives magic link to sign up
5. Employee can now access the system

**Business Rules:**
- Only managers can add/remove employees
- Employees are soft-deleted (marked as inactive)
- Each employee is linked to the manager who added them

### 2. Token Generation & Management

**Token System:**
- Unique token IDs in format: `TKN-YYYYMMDD-XXXX`
- Each token stores customer name and phone number
- Tokens have three states: Active, Used, Cancelled

**Token Generation:**
1. Navigate to "Tokens" tab
2. Fill in customer information:
   - Customer Name (required)
   - Customer Phone (required)
   - Notes (optional)
3. Click "Generate Token"
4. Token is created and displayed
5. Copy token to share with employee

**Token Management:**
- View all tokens (from all users)
- Search by token ID, customer name, or phone
- Filter by status (Active/Used/Cancelled)
- Cancel active tokens if needed
- View token history with timestamps

**Use Cases:**
- Generate tokens for walk-in customers
- Pre-create tokens for scheduled appointments
- Search for customer by phone number
- Track token usage across the team

### 3. Form Entry Submission

**Capabilities:**
- Managers can submit form entries just like employees
- Use tokens to auto-fill customer information
- Complete service records

**Form Fields:**
- Token ID (validates and auto-fills customer data)
- Customer Name (auto-filled)
- Customer Phone (auto-filled)
- Service Type (dropdown)
- Status (Pending/In Progress/Completed/Cancelled)
- Priority (Low/Medium/High/Urgent)
- Description (optional)
- Contact Number (optional)
- Estimated Cost (optional)

### 4. Complete Data Access

**All Data View Features:**
- View ALL entries from ALL employees
- View data from ALL time periods (no date restrictions)
- Advanced filtering:
  - Search by customer name, service type, or token
  - Filter by specific employee
  - Filter by date range (Today/Last 7 Days/Last 30 Days/All Time)
- Export filtered data to CSV
- Comprehensive table view with:
  - Date/Time of submission
  - Employee who submitted
  - Token used
  - Customer information
  - Service details
  - Status and priority badges
  - Estimated cost

**Analytics Dashboard:**
- Active tokens count
- Total entries (all time)
- Active employees count
- Monthly submissions count
- Visual statistics with gradient cards

**Export Functionality:**
- Export to CSV format
- Includes all visible columns
- Respects current filters
- Filename includes export date

---

## 👨‍💻 Employee Features

### 1. Token Generation

**Capabilities:**
- Generate tokens for customers
- View own token history
- Search own tokens

**Restrictions:**
- Cannot cancel tokens (manager-only feature)
- Can only see tokens they generated

### 2. Form Entry Submission

**Workflow:**
1. Navigate to "Submit Entry" tab
2. Enter token ID
3. Click "Validate Token"
4. If valid:
   - Customer name and phone auto-fill
   - Complete remaining form fields
   - Submit entry
5. If invalid:
   - Error message displayed
   - Cannot proceed with submission

**Token Validation:**
- Checks if token exists
- Verifies token is "active" (not used or cancelled)
- Auto-fills customer information from token
- Marks token as "used" after successful submission

### 3. Today's Data View

**Capabilities:**
- View ONLY own entries
- View ONLY entries from CURRENT DAY
- Simple table view with key information

**Restrictions:**
- ❌ Cannot see other employees' data
- ❌ Cannot see data from previous days
- ❌ Cannot export data
- ❌ Cannot filter by employee (only sees own data)

**Data Visibility Rules:**
- Entries from today: ✅ Visible
- Entries from yesterday: ❌ Not visible
- Entries from other employees: ❌ Not visible
- Manager can see all: ✅ Always visible to managers

**Business Rationale:**
- Protects historical data
- Prevents data manipulation
- Maintains data integrity
- Encourages real-time data entry

### 4. Personal Statistics

**Dashboard Metrics:**
- Total submissions (all time)
- Today's entries count
- Tokens generated count

---

## 🎫 Token System Deep Dive

### Token Lifecycle

1. **Generation**
   - Manager or employee creates token
   - Customer information stored
   - Status: Active
   - Unique ID generated

2. **Validation**
   - Employee enters token in form
   - System checks if token exists and is active
   - Customer data auto-fills if valid

3. **Usage**
   - Form submitted successfully
   - Token marked as "Used"
   - Timestamp recorded
   - Token cannot be reused

4. **Cancellation** (Manager only)
   - Manager cancels active token
   - Status changed to "Cancelled"
   - Token cannot be used

### Token Search & Filtering

**Search Capabilities:**
- Search by token ID (exact or partial match)
- Search by customer name (case-insensitive)
- Search by phone number (partial match)

**Filter Options:**
- All Status
- Active only
- Used only
- Cancelled only

**Use Cases:**
- Find customer's previous tokens by phone
- Check if token has been used
- Verify token status before sharing
- Track token usage patterns

---

## 📊 Data Management

### Row Level Security (RLS)

**How it works:**
- Database-level security policies
- Automatic filtering based on user role
- No manual filtering needed in application code

**Manager RLS Rules:**
```
✅ Can see: ALL data from ALL users, ALL time
✅ Can insert: Any data
✅ Can update: Any data
```

**Employee RLS Rules:**
```
✅ Can see: Own data from TODAY only
✅ Can insert: Own data only
❌ Cannot see: Other users' data
❌ Cannot see: Own data from previous days
```

### Data Export

**CSV Export Features:**
- Available to managers only
- Exports currently filtered data
- Includes all table columns
- Filename format: `crm-data-YYYY-MM-DD.csv`

**Export Columns:**
- Date/Time
- Employee Email
- Token ID
- Customer Name
- Service Type
- Status
- Priority
- Contact Number
- Estimated Cost

---

## 🎨 User Interface

### Design System

**Color Palette:**
- Primary: Blue to Indigo gradient
- Success: Green to Emerald
- Warning: Yellow to Orange
- Danger: Red to Pink
- Info: Blue to Cyan

**Components:**
- Gradient cards with glassmorphism
- Smooth animations and transitions
- Responsive layout (mobile-first)
- Accessible color contrasts
- Icon-based navigation

### Responsive Breakpoints

- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

### Accessibility Features

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus indicators
- Color contrast compliance

---

## 🔔 Notifications & Feedback

### Success Messages

- ✅ Token generated successfully
- ✅ Entry submitted successfully
- ✅ Employee added successfully
- ✅ Token cancelled successfully

### Error Messages

- ❌ Invalid token
- ❌ Token already used
- ❌ Token not found
- ❌ Required field missing
- ❌ Network error

### Loading States

- Spinner animations
- Disabled buttons during submission
- Loading text indicators
- Skeleton screens (where applicable)

---

## 📱 Mobile Experience

### Mobile Optimizations

- Touch-friendly buttons (min 44px)
- Responsive tables (horizontal scroll)
- Collapsible navigation
- Optimized form layouts
- Fast loading times

### Mobile-Specific Features

- Tap to copy token
- Mobile-optimized date pickers
- Touch gestures support
- Reduced motion option

---

## 🚀 Performance

### Optimization Techniques

- Lazy loading components
- Efficient database queries
- Indexed database columns
- Optimized bundle size
- CDN for static assets

### Performance Metrics

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Score: 90+

---

## 🔒 Security Best Practices

### Application Security

- ✅ Environment variables for secrets
- ✅ HTTPS only in production
- ✅ CORS configuration
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (via Supabase)
- ✅ XSS protection

### Database Security

- ✅ Row Level Security (RLS) enabled
- ✅ Prepared statements
- ✅ Encrypted connections
- ✅ Regular backups (Supabase)
- ✅ Audit logs

### Authentication Security

- ✅ Magic link expiration
- ✅ Rate limiting on auth endpoints
- ✅ Secure session management
- ✅ Automatic token refresh

---

## 📈 Future Enhancements

### Planned Features

- [ ] Real-time updates (Supabase subscriptions)
- [ ] Push notifications
- [ ] Advanced analytics dashboard
- [ ] File upload support
- [ ] Email notifications
- [ ] SMS integration
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Mobile app (React Native)
- [ ] Customer portal
- [ ] Reporting module
- [ ] API for third-party integrations

### Community Requests

- Custom fields for form entries
- Bulk token generation
- Advanced search with filters
- Calendar view for entries
- Team collaboration features

---

## 📞 Support & Resources

### Documentation

- [README.md](README.md) - Project overview
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Complete setup instructions
- [database-setup.sql](database-setup.sql) - Database schema

### External Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev)

---

**Last Updated**: December 2024  
**Version**: 1.0.0
