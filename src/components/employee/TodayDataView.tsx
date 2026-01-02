import { format, isToday } from 'date-fns'
import { Calendar, AlertCircle, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useFormEntries } from '../../hooks/useFormEntries'
import { useAuth } from '../../hooks/useAuth'
import { LoadingSpinner } from '../shared/LoadingSpinner'

export function TodayDataView() {
    const { user } = useAuth()
    const { entries, loading } = useFormEntries()

    if (loading) return <LoadingSpinner />

    // Filter entries for current user and today only
    const todayEntries = entries.filter(
        (entry) =>
            entry.employee_id === user?.id && isToday(new Date(entry.submitted_at))
    )

    const exportToExcel = () => {
        const dataToExport = todayEntries.map(entry => ({
            'Time': format(new Date(entry.submitted_at), 'HH:mm'),
            'Token ID': entry.token_used || '-',
            'Customer Name': entry.customer_name,
            'Service Type': entry.service_type,
            'Payment Method': entry.payment_method || '-',
            'Service Charge': entry.service_charge || 0,
            'Bank Charge': entry.bank_charge || 0,
            'Total Amount': (entry.service_charge || 0) + (entry.bank_charge || 0)
        }))

        const ws = XLSX.utils.json_to_sheet(dataToExport)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Today's Work")

        // Generate filename with date
        const fileName = `My_Work_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
        XLSX.writeFile(wb, fileName)
    }

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Today's Entries</h2>
                        <p className="text-sm text-gray-500">
                            {format(new Date(), 'EEEE, MMMM dd, yyyy')}
                        </p>
                    </div>
                </div>

                {todayEntries.length > 0 && (
                    <button
                        onClick={exportToExcel}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <FileSpreadsheet className="w-4 h-4 text-green-600" />
                        Export Excel
                    </button>
                )}
            </div>

            {todayEntries.length === 0 ? (
                <div className="text-center py-12">
                    <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No entries submitted today</p>
                    <p className="text-gray-400 text-sm mt-2">
                        Your submissions will appear here once you submit a form
                    </p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Time
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Service
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        S. Charge
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        B. Charge
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Payment
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {todayEntries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {format(new Date(entry.submitted_at), 'HH:mm')}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            <div className="font-medium">{entry.customer_name}</div>
                                            <div className="text-xs text-gray-500 font-mono">{entry.token_used}</div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {entry.service_type}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {entry.service_charge?.toFixed(2) || '0.00'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {entry.bank_charge?.toFixed(2) || '0.00'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {entry.payment_method || 'N/A'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                            Total submissions today: <strong>{todayEntries.length}</strong>
                        </p>
                    </div>
                </>
            )}
        </div>
    )
}
