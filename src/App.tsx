import { TokensProvider } from './context/TokensContext'
import { useAuth } from './hooks/useAuth'
import { Layout } from './components/shared/Layout'
import { LoadingSpinner } from './components/shared/LoadingSpinner'
import { Login } from './components/auth/Login'
import { ManagerDashboard } from './components/manager/ManagerDashboard'
import { EmployeeDashboard } from './components/employee/EmployeeDashboard'
import { UI_STRINGS } from './lib/uiStrings'

const SNF = UI_STRINGS.app.profileNotFound

function App() {
    const { user, session, loading, signOut } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        )
    }

    // Session exists but no public.users row — profile was never created.
    if (session && !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="card max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🔒</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{SNF.heading}</h2>
                    <p className="text-gray-600 mb-2">{SNF.body}</p>
                    <p className="text-sm text-gray-400 mb-6">{SNF.contactHint}</p>
                    <button
                        onClick={async () => {
                            await signOut()
                            window.location.reload()
                        }}
                        className="btn-secondary w-full"
                    >
                        {SNF.signOutButton}
                    </button>
                </div>
            </div>
        )
    }

    // No session — show login screen.
    if (!user) {
        return <Login />
    }

    // Fully active user — route by role.
    // Supports both 'owner' (post-013 migration) and legacy 'manager'.
    const isManager = user.role === 'owner' || user.role === 'manager'

    return (
        <TokensProvider>
            <Layout>
                {isManager ? <ManagerDashboard /> : <EmployeeDashboard />}
            </Layout>
        </TokensProvider>
    )
}

export default App
