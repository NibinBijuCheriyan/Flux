import { useState } from 'react'
import { Mail, Lock, Loader2, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export function Login() {
    const { signIn, signUp } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [verificationSent, setVerificationSent] = useState(false)

    const [role, setRole] = useState<'employee' | 'manager'>('employee')
    const [isRegistering, setIsRegistering] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (isRegistering) {
                const { error } = await signUp(email, password, role)
                if (error) throw error
                setVerificationSent(true)
            } else {
                const { error } = await signIn(email, password)
                if (error) throw error
            }
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (verificationSent) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="card max-w-md w-full text-center animate-slide-up">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email</h2>
                    <p className="text-gray-600 mb-6">
                        We've sent a confirmation link to <strong>{email}</strong>. Please click the link to verify your account and sign in.
                    </p>
                    <button
                        onClick={() => {
                            setVerificationSent(false)
                            setEmail('')
                            setPassword('')
                            setIsRegistering(false)
                        }}
                        className="btn-secondary w-full"
                    >
                        Return to Sign In
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="card max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <img
                            src="/logo.png"
                            alt="Flux Logo"
                            className="h-12 w-auto object-contain"
                        />
                    </div>

                    <p className="text-gray-600">
                        {isRegistering ? 'Create your account' : 'Sign in to access your dashboard'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Role Selection Toggle */}
                    {isRegistering && (
                        <div className="bg-gray-50 p-1 rounded-lg flex mb-6">
                            <button
                                type="button"
                                onClick={() => setRole('employee')}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${role === 'employee'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Employee
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('manager')}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${role === 'manager'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Manager
                            </button>
                        </div>
                    )}

                    <div>
                        <label className="label">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input pl-10"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input pl-10"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full">
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {isRegistering ? 'Creating Account...' : 'Signing In...'}
                            </>
                        ) : (
                            isRegistering ? 'Sign Up' : 'Sign In'
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-500 text-center">
                        {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button
                            onClick={() => {
                                setIsRegistering(!isRegistering)
                                setPassword('')
                            }}
                            className="text-blue-600 font-semibold hover:text-blue-700"
                        >
                            {isRegistering ? 'Sign In' : 'Create Account'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}
