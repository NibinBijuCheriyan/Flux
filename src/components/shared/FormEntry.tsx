import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FileText, Loader2, CheckCircle2, Banknote, DollarSign } from 'lucide-react'
import { useTokens } from '../../hooks/useTokens'
import { useFormEntries } from '../../hooks/useFormEntries'
import { useAuth } from '../../hooks/useAuth'

// Simple schema based on user request
const formEntrySchema = z.object({
    tokenId: z.string().min(1, 'Token ID is required'),
    customerName: z.string().min(1, 'Customer name is required'),
    serviceType: z.string().min(1, 'Service type is required'),
    serviceCharge: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
        message: 'Must be a valid positive number',
    }),
    bankCharge: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
        message: 'Must be a valid positive number',
    }),
    paymentMethod: z.string().min(1, 'Payment method is required'),
})

type FormEntryData = z.infer<typeof formEntrySchema>

export function FormEntry() {
    const { user } = useAuth()
    const { validateToken, markTokenAsUsed } = useTokens()
    const { addEntry } = useFormEntries()
    const [isValidating, setIsValidating] = useState(false)
    const [tokenValid, setTokenValid] = useState<boolean | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitSuccess, setSubmitSuccess] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset,
    } = useForm<FormEntryData>({
        resolver: zodResolver(formEntrySchema),
    })

    const tokenId = watch('tokenId')

    const handleTokenValidation = async () => {
        if (!tokenId) return

        setIsValidating(true)
        const result = await validateToken(tokenId)

        if (result.valid) {
            setTokenValid(true)
            setValue('customerName', result.customerName)
        } else {
            setTokenValid(false)
            setValue('customerName', '')
            alert(result.error || 'Invalid token')
        }
        setIsValidating(false)
    }

    const onSubmit = async (data: FormEntryData) => {
        if (!user || tokenValid !== true) return

        setIsSubmitting(true)

        // Add entry with new simplified structure
        // Note: status is hardcoded to 'Completed' as it's a point-of-sale entry now
        const { error: entryError } = await addEntry({
            employee_id: user.id,
            token_used: data.tokenId,
            customer_name: data.customerName,
            service_type: data.serviceType,
            service_charge: parseFloat(data.serviceCharge),
            bank_charge: parseFloat(data.bankCharge),
            payment_method: data.paymentMethod,
            status: 'Completed', // Default for simplified flow
            priority: 'Medium',  // Default/Legacy
        })

        if (entryError) {
            alert('Error submitting entry: ' + entryError.message)
            setIsSubmitting(false)
            return
        }

        // Mark token as used
        await markTokenAsUsed(data.tokenId)

        setSubmitSuccess(true)
        reset()
        setTokenValid(null)

        setTimeout(() => {
            setSubmitSuccess(false)
        }, 3000)

        setIsSubmitting(false)
    }

    return (
        <div className="card">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Submit New Entry</h2>
                    <p className="text-sm text-gray-500">Record customer service and payment</p>
                </div>
            </div>

            {submitSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-slide-up">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <p className="text-green-800 font-medium">Entry recorded successfully!</p>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* 1. Token (Required for Validity) */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <label className="label">
                        Access Token <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            {...register('tokenId')}
                            className="input flex-1"
                            placeholder="Scan or enter token ID"
                            onChange={() => setTokenValid(null)}
                        />
                        <button
                            type="button"
                            onClick={handleTokenValidation}
                            disabled={!tokenId || isValidating}
                            className="btn-secondary"
                        >
                            {isValidating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Checking...
                                </>
                            ) : (
                                'Validate'
                            )}
                        </button>
                    </div>
                    {errors.tokenId && (
                        <p className="text-red-500 text-xs mt-1">{errors.tokenId.message}</p>
                    )}

                    {/* Customer Name Display (Auto-filled) */}
                    <div className="mt-4">
                        <label className="label text-xs uppercase tracking-wide text-gray-500">Customer Name</label>
                        <input
                            type="text"
                            {...register('customerName')}
                            className="w-full bg-transparent border-b border-blue-200 py-1 text-gray-900 font-medium focus:outline-none"
                            readOnly
                            placeholder="Waiting for token..."
                        />
                        {errors.customerName && (
                            <p className="text-red-500 text-xs mt-1">Token must be validated</p>
                        )}
                    </div>
                </div>

                {/* 2. Service Details */}
                <div>
                    <label className="label">
                        Service Provided <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        {...register('serviceType')}
                        className="input"
                        placeholder="Enter service details"
                    />
                    {errors.serviceType && (
                        <p className="text-red-500 text-xs mt-1">{errors.serviceType.message}</p>
                    )}
                </div>

                {/* 3. Financials */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label">
                            Service Charge <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="number"
                                step="0.01"
                                {...register('serviceCharge')}
                                className="input pl-10"
                                placeholder="0.00"
                            />
                        </div>
                        {errors.serviceCharge && (
                            <p className="text-red-500 text-xs mt-1">{errors.serviceCharge.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="label">
                            Bank Charge <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="number"
                                step="0.01"
                                {...register('bankCharge')}
                                className="input pl-10"
                                placeholder="0.00"
                            />
                        </div>
                        {errors.bankCharge && (
                            <p className="text-red-500 text-xs mt-1">{errors.bankCharge.message}</p>
                        )}
                    </div>
                </div>

                {/* 4. Payment Method */}
                <div>
                    <label className="label">
                        Payment Method <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {['Cash', 'Card', 'UPI/Online'].map((method) => (
                            <label
                                key={method}
                                className={`
                                    flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all
                                    ${watch('paymentMethod') === method
                                        ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500'
                                        : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'}
                                `}
                            >
                                <input
                                    type="radio"
                                    value={method}
                                    {...register('paymentMethod')}
                                    className="sr-only"
                                />
                                <span className="text-sm font-medium">{method}</span>
                            </label>
                        ))}
                    </div>
                    {errors.paymentMethod && (
                        <p className="text-red-500 text-xs mt-1">{errors.paymentMethod.message}</p>
                    )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-4 text-center">
                        Timestamp will be automatically recorded upon submission.
                    </p>

                    <button
                        type="submit"
                        disabled={isSubmitting || tokenValid !== true}
                        className="btn-primary w-full"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Recording...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                Submit Final Entry
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
