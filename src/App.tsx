import { TokensProvider } from './context/TokensContext'

// ... imports

function App() {
    // ... existing logic

    return (
        <TokensProvider>
            <Layout>
                {user.role === 'manager' ? <ManagerDashboard /> : <EmployeeDashboard />}
            </Layout>
        </TokensProvider>
    )
}

export default App
