import { useState } from 'react'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { UI_STRINGS } from '../../lib/uiStrings'

const S = UI_STRINGS.login

export function Login() {
    const { signIn } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await signIn(email, password)
            if (error) throw error
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
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
                    <p className="text-gray-600">{S.signInSubtitle}</p>
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

                    <button type="submit" disabled={loading} className="btn-primary w-full">
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {S.signingInButton}
                            </>
                        ) : (
                            S.signInButton
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
