import { useState } from 'react'
import { Mail, Lock, Loader2, UserPlus, LogIn } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { UI_STRINGS } from '../../lib/uiStrings'

const S = UI_STRINGS.login

export function Login() {
    const { signIn, signUp } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [isRegistering, setIsRegistering] = useState(false)
    const [role, setRole] = useState<'employee' | 'owner'>('employee')
    const [verificationSent, setVerificationSent] = useState(false)

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
                <div className="card max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Check Your Email</h2>
                    <p className="text-gray-600 mb-4">
                        We've sent a verification link to <strong>{email}</strong>. Click the link to activate your account.
                    </p>
                    <button
                        onClick={() => { setVerificationSent(false); setIsRegistering(false) }}
                        className="btn-secondary w-full"
                    >
                        Back to Sign In
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
                        {isRegistering ? 'Create your account' : S.signInSubtitle}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="label">{S.emailLabel}</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input pl-10"
                                placeholder={S.emailPlaceholder}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label">{S.passwordLabel}</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input pl-10"
                                placeholder={S.passwordPlaceholder}
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    {isRegistering && (
                        <div>
                            <label className="label">Role</label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRole('employee')}
                                    className={`flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-all ${role === 'employee'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                >
                                    Employee
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('owner')}
                                    className={`flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-all ${role === 'owner'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                >
                                    Owner
                                </button>
                            </div>
                        </div>
                    )}

                    <button type="submit" disabled={loading} className="btn-primary w-full">
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {isRegistering ? 'Creating Account...' : S.signingInButton}
                            </>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                {isRegistering ? (
                                    <><UserPlus className="w-5 h-5" /> Create Account</>
                                ) : (
                                    <><LogIn className="w-5 h-5" /> {S.signInButton}</>
                                )}
                            </span>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                        {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register"}
                    </button>
                </div>
            </div>
        </div>
    )
}
