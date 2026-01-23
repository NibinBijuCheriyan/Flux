import { useState } from 'react'
import { format } from 'date-fns'
import { Database, Search, FileSpreadsheet, Trash2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useFormEntries } from '../../hooks/useFormEntries'
import { useUsers } from '../../hooks/useUsers'
import { LoadingSpinner } from '../shared/LoadingSpinner'

export function AllDataView() {
    const { entries, loading, deleteEntry } = useFormEntries()
    const { users } = useUsers()
    const [searchTerm, setSearchTerm] = useState('')
    const [employeeFilter, setEmployeeFilter] = useState('all')
    const [dateFilter, setDateFilter] = useState('all')

    const filteredEntries = entries.filter((entry) => {
        const matchesSearch =
            entry.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.service_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.token_used?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesEmployee =
            employeeFilter === 'all' || entry.employee_id === employeeFilter

        const matchesDate =
            dateFilter === 'all' ||
            (dateFilter === 'today' &&
                format(new Date(entry.submitted_at), 'yyyy-MM-dd') ===
                format(new Date(), 'yyyy-MM-dd')) ||
            (dateFilter === 'week' &&
                new Date(entry.submitted_at) >
                new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
            (dateFilter === 'month' &&
                new Date(entry.submitted_at) >
                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))

        return matchesSearch && matchesEmployee && matchesDate
    })

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
            const { error } = await deleteEntry(id)
            if (error) {
                alert('Error deleting entry')
                console.error(error)
            }
        }
    }

    const exportToExcel = () => {
        const dataToExport = filteredEntries.map(entry => ({
            'Date/Time': format(new Date(entry.submitted_at), 'yyyy-MM-dd HH:mm'),
            'Employee': users.find((u) => u.id === entry.employee_id)?.email || 'Unknown',
            'Token ID': entry.token_used || '-',
            'Customer Name': entry.customer_name,
            'Service Type': entry.service_type,
            'Status': entry.status,
            'Payment Method': entry.payment_method || '-',
            'Service Charge': entry.service_charge || 0,
            'Bank Charge': entry.bank_charge || 0,
            'Total Amount': (entry.service_charge || 0) + (entry.bank_charge || 0)
        }))

        const ws = XLSX.utils.json_to_sheet(dataToExport)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "All Entries")

        // Generate filename
        const fileName = `All_Data_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
        XLSX.writeFile(wb, fileName)
    }

    if (loading) return <LoadingSpinner />

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <Database className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">All Form Entries</h2>
                        <p className="text-sm text-gray-500">View and manage all customer submissions</p>
                    </div>
                </div>
                <button onClick={exportToExcel} className="btn-secondary flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                    Export Excel
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search entries..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-10"
                    />
                </div>

                <select
                    value={employeeFilter}
                    onChange={(e) => setEmployeeFilter(e.target.value)}
                    className="input"
                >
                    <option value="all">All Employees</option>
                    {users
                        .filter((u) => u.role === 'employee')
                        .map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.email}
                            </option>
                        ))}
                </select>

                <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="input"
                >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date/Time
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Employee
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Token
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
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredEntries.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                    No entries found
                                </td>
                            </tr>
                        ) : (
                            filteredEntries.map((entry) => (
                                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        {format(new Date(entry.submitted_at), 'MMM dd, HH:mm')}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        {users.find((u) => u.id === entry.employee_id)?.email || 'Unknown'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="font-mono text-xs text-gray-600">
                                            {entry.token_used || '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        {entry.customer_name}
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
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => handleDelete(entry.id)}
                                            className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50"
                                            title="Delete Entry"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                    Showing <strong>{filteredEntries.length}</strong> of{' '}
                    <strong>{entries.length}</strong> total entries
                </p>
            </div>
        </div >
    )
}
