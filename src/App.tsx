import { TokensProvider } from './context/TokensContext'
import { useAuth } from './hooks/useAuth'
import { Layout } from './components/shared/Layout'
import { LoadingSpinner } from './components/shared/LoadingSpinner'
import { Login } from './components/auth/Login'
import { ManagerDashboard } from './components/manager/ManagerDashboard'
import { EmployeeDashboard } from './components/employee/EmployeeDashboard'
import { UI_STRINGS } from './lib/uiStrings'

const SNF = UI_STRINGS.app.profileNotFound
const SPA = UI_STRINGS.app.pendingActivation

function App() {
    const { user, session, loading, signOut } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        )
    }

    // ── State 1: Session exists but no public.users row at all.
    //    Profile was never created. Contact IT support.
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

    // ── State 2: Profile exists but center_id is null (limbo / pending activation).
    //    The auth trigger created the row; a manager must approve & assign them.
    if (session && user && user.center_id === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="card max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">⏳</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{SPA.heading}</h2>
                    <p className="text-gray-600 mb-2">{SPA.body}</p>
                    <p className="text-sm text-gray-400 mb-6">{SPA.contactHint}</p>
                    <button
                        onClick={async () => {
                            await signOut()
                            window.location.reload()
                        }}
                        className="btn-secondary w-full"
                    >
                        {SPA.signOutButton}
                    </button>
                </div>
            </div>
        )
    }

    // ── State 3: No session at all — show the login screen.
    if (!user) {
        return <Login />
    }

    // ── State 4: Fully active user — route by role.
    //    'center_manager' (post-013 migration) and legacy 'manager' both get ManagerDashboard.
    const isManager = user.role === 'center_manager' || user.role === 'manager'

    return (
        <TokensProvider>
            <Layout>
                {isManager ? <ManagerDashboard /> : <EmployeeDashboard />}
            </Layout>
        </TokensProvider>
    )
}

export default App
