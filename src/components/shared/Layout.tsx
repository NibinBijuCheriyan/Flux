import { ReactNode } from 'react'
import { LogOut, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface LayoutProps {
    children: ReactNode
}

export function Layout({ children }: LayoutProps) {
    const { user, signOut } = useAuth()

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center">
                                <img
                                    src="/logo.png"
                                    alt="Flux Logo"
                                    className="h-8 w-auto object-contain"
                                />
                            </div>
                            <p className="text-xs text-gray-500">Role-Based Access Control</p>
                        </div>

                        {user && (
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                    <User className="w-4 h-4 text-blue-600" />
                                    <div className="text-sm">
                                        <div className="font-medium text-gray-900">{user.email}</div>
                                        <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={signOut}
                                    className="btn-secondary flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            {/* Footer */}
            <footer className="mt-auto py-6 text-center text-sm text-gray-500">
                <p>© 2024 Flux. All rights reserved.</p>
            </footer>
        </div>
    )
}
