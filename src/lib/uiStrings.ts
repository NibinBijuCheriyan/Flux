/**
 * Central UI strings — the single source of truth for all user-visible text.
 * Replace values here to update labels across the entire app without touching components.
 */
export const UI_STRINGS = {
    login: {
        signInSubtitle: 'Sign in to access your dashboard',
        emailLabel: 'Email Address',
        emailPlaceholder: 'you@company.com',
        passwordLabel: 'Password',
        passwordPlaceholder: '••••••••',
        signInButton: 'Sign In',
        signingInButton: 'Signing In...',
    },

    app: {
        profileNotFound: {
            heading: 'Account Not Activated',
            body: 'You are signed in, but your employee profile has not been set up yet. Please contact your manager or IT support to have your account activated.',
            contactHint: 'If you believe this is an error, sign out and try again, or contact support.',
            signOutButton: 'Sign Out',
        },
        pendingActivation: {
            heading: 'Awaiting Center Assignment',
            body: 'Your account has been created, but you have not been assigned to a center yet. Please wait for your manager to approve your access.',
            contactHint: 'Once your manager approves you, sign out and sign back in to access your dashboard.',
            signOutButton: 'Sign Out',
        },
    },

    manager: {
        dashboard: {
            heading: 'Manager Dashboard',
            subtitle: 'Monitor your team and manage system tokens',
            tabs: {
                overview: 'Overview',
                employees: 'Employees',
                tokens: 'Tokens',
                form: 'Form Entry',
                data: 'All Data',
            },
            stats: {
                activeTokens: 'Active Tokens',
                activeTokensHint: 'Currently available',
                totalEntries: 'Total Entries',
                totalEntriesHint: 'All time submissions',
                activeEmployees: 'Active Employees',
                activeEmployeesHint: 'Currently working',
                thisMonth: 'This Month',
                thisMonthHint: 'Monthly submissions',
            },
            quickActions: {
                heading: 'Quick Actions',
                manageEmployees: 'Manage Employees',
                manageEmployeesDesc: 'Add or remove team members',
                generateTokens: 'Generate Tokens',
                generateTokensDesc: 'Create new access tokens',
                submitEntry: 'Submit Entry',
                submitEntryDesc: 'Create a new form entry',
                viewAllData: 'View All Data',
                viewAllDataDesc: 'Access complete database',
            },
        },
        employeeManagement: {
            pendingSectionHeading: 'Pending Approval',
            pendingSectionDesc: 'These users signed up but have not been linked to your center yet.',
            approveButton: 'Approve',
            approvingButton: 'Approving...',
            activeSectionHeading: 'Active Employees',
            noActive: 'No employees added yet. Add your first employee above.',
            noPending: 'No pending approvals.',
        },
    },
} as const
