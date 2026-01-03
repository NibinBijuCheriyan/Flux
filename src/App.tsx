import { TokensProvider } from './context/TokensContext'
import { useAuth } from './hooks/useAuth'
import { Layout } from './components/shared/Layout'
import { LoadingSpinner } from './components/shared/LoadingSpinner'
import { Login } from './components/auth/Login'
import { ManagerDashboard } from './components/manager/ManagerDashboard'
import { EmployeeDashboard } from './components/employee/EmployeeDashboard'

function App() {
    const { user, session, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        )
    }

    // If we have a session but no user profile, it means:
    // 1. RLS is blocking access (even with our fix)
    // 2. User ID mismatch (and fallback failed)
    // 3. User record doesn't exist
    if (session && !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="card max-w-lg w-full">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">⚠️</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Profile Not Found</h2>
                        <p className="text-gray-600 mt-2">
                            You are signed in, but we couldn't find your employee profile.
                        </p>
                    </div>

                    <div className="bg-gray-100 p-4 rounded-lg text-sm font-mono overflow-auto mb-6">
                        <p><strong>Status:</strong> Authenticated (Session Valid)</p>
                        <p><strong>Email:</strong> {session.user.email}</p>
                        <p><strong>Auth ID:</strong> {session.user.id}</p>
                        <p className="mt-2 text-red-600">Error: No matching record in public.users table.</p>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            <strong>Potential Causes:</strong><br />
                            1. Your manager hasn't added this exact email address.<br />
                            2. There is a system ID mismatch (try running the SQL fix).<br />
                            3. Database policies are blocking access.
                        </p>

                        <button
                            onClick={() => window.location.reload()}
                            className="btn-primary w-full"
                        >
                            Retry Loading Profile
                        </button>

                        <button
                            onClick={async () => {
                                const { supabase } = await import('./lib/supabase')
                                await supabase.auth.signOut()
                                window.location.reload()
                            }}
                            className="btn-secondary w-full"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (!user) {
        return <Login />
    }

    return (
        <TokensProvider>
            <Layout>
                {user.role === 'manager' ? <ManagerDashboard /> : <EmployeeDashboard />}
            </Layout>
        </TokensProvider>
    )
}

export default App
