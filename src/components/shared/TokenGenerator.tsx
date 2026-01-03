import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Ticket, Copy, CheckCircle2, Loader2, FileText } from 'lucide-react'
import { useTokens } from '../../hooks/useTokens'
import { useAuth } from '../../hooks/useAuth'

const tokenSchema = z.object({
    customerName: z.string().min(2, 'Name must be at least 2 characters'),
    customerPhone: z.string().min(10, 'Phone must be at least 10 digits'),
    notes: z.string().optional(),
})

type TokenFormData = z.infer<typeof tokenSchema>

interface TokenGeneratorProps {
    onUseToken?: (tokenId: string) => void
}

export function TokenGenerator({ onUseToken }: TokenGeneratorProps) {
    const { user } = useAuth()
    const { generateToken } = useTokens()
    const [generatedToken, setGeneratedToken] = useState<{
        tokenId: string
        customerName: string
        customerPhone: string
    } | null>(null)
    const [copied, setCopied] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<TokenFormData>({
        resolver: zodResolver(tokenSchema),
    })

    const onSubmit = async (data: TokenFormData) => {
        if (!user) return

        setIsSubmitting(true)
        const { data: tokenData, error } = await generateToken(
            data.customerName,
            data.customerPhone,
            user.id,
            data.notes
        )

        if (error) {
            alert('Error generating token: ' + error.message)
        } else if (tokenData) {
            setGeneratedToken({
                tokenId: tokenData.token_id,
                customerName: data.customerName,
                customerPhone: data.customerPhone,
            })
            reset()
        }
        setIsSubmitting(false)
    }

    const copyToken = () => {
        if (generatedToken) {
            navigator.clipboard.writeText(generatedToken.tokenId)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div className="space-y-6">
            {/* Token Generation Form */}
            <div className="card">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Ticket className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Generate New Token</h2>
                        <p className="text-sm text-gray-500">Create a token for employees to submit form entries</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">
                                Customer Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                {...register('customerName')}
                                className="input"
                                placeholder="John Doe"
                            />
                            {errors.customerName && (
                                <p className="text-red-500 text-xs mt-1">{errors.customerName.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="label">
                                Customer Phone <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                {...register('customerPhone')}
                                className="input"
                                placeholder="+1234567890"
                            />
                            {errors.customerPhone && (
                                <p className="text-red-500 text-xs mt-1">{errors.customerPhone.message}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="label">Notes (Optional)</label>
                        <textarea
                            {...register('notes')}
                            className="input"
                            rows={3}
                            placeholder="Additional information..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary w-full md:w-auto"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Ticket className="w-4 h-4" />
                                Generate Token
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Generated Token Display */}
            {generatedToken && (
                <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 animate-slide-up">
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                        <h3 className="text-lg font-bold text-gray-900">Token Generated Successfully!</h3>
                    </div>

                    <div className="bg-white rounded-lg p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Token ID</p>
                                <p className="text-2xl font-mono font-bold text-gray-900">
                                    {generatedToken.tokenId}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={copyToken}
                                    className="btn-secondary flex items-center gap-2"
                                >
                                    {copied ? (
                                        <>
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            Copy
                                        </>
                                    )}
                                </button>
                                {onUseToken && (
                                    <button
                                        onClick={() => onUseToken(generatedToken.tokenId)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Use Now
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div>
                                <p className="text-sm text-gray-500">Customer Name</p>
                                <p className="font-medium text-gray-900">{generatedToken.customerName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Customer Phone</p>
                                <p className="font-medium text-gray-900">{generatedToken.customerPhone}</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setGeneratedToken(null)}
                        className="btn-secondary w-full mt-4"
                    >
                        Generate Another Token
                    </button>
                </div>
            )}
        </div>
    )
}
