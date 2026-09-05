import { useState } from 'react'
import {
    Cloud, CloudOff, RefreshCw, CheckCircle2, XCircle,
    Clock, CalendarClock, LogOut, Wifi, WifiOff,
    FileSpreadsheet, Info, AlertTriangle, Shield,
} from 'lucide-react'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { useAuth } from '../../hooks/useAuth'
import { useGoogleDriveBackup, BackupSchedule } from '../../hooks/useGoogleDriveBackup'

// ─── Schedule labels ──────────────────────────────────────────────────────────
const SCHEDULE_OPTIONS: { value: BackupSchedule; label: string; desc: string }[] = [
    { value: 'manual', label: 'Manual Only', desc: 'Backup only when you click "Back Up Now"' },
    { value: '6h', label: 'Every 6 Hours', desc: 'Automatic backup every 6 hours (tab must be open)' },
    { value: '12h', label: 'Every 12 Hours', desc: 'Automatic backup every 12 hours (tab must be open)' },
    { value: 'daily', label: 'Daily', desc: 'Automatic backup once per day (tab must be open)' },
    { value: 'weekly', label: 'Weekly', desc: 'Automatic backup once per week (tab must be open)' },
]

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function TimeAgo({ iso }: { iso: string }) {
    return <span>{formatDistanceToNow(parseISO(iso), { addSuffix: true })}</span>
}

function fmtDt(iso: string) {
    return format(parseISO(iso), 'MMM dd, yyyy — HH:mm')
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CloudBackup() {
    const { user } = useAuth()
    const {
        isConnected, connectedEmail, schedule, setSchedule,
        lastBackupAt, nextBackupAt, isBackingUp, log,
        error, connect, disconnect, backupNow, isConfigured,
    } = useGoogleDriveBackup(user?.id ?? '')

    const [connecting, setConnecting] = useState(false)

    const handleConnect = async () => {
        setConnecting(true)
        await connect()
        setConnecting(false)
    }

    const scheduleOption = SCHEDULE_OPTIONS.find(o => o.value === schedule)!

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <Cloud className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Cloud Backup</h2>
                    <p className="text-sm text-gray-500">
                        Automatically sync your form entries to Google Drive as Excel files
                    </p>
                </div>
            </div>

            {/* Config warning if no client ID */}
            {!isConfigured && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-amber-800 text-sm">Google Client ID not configured</p>
                        <p className="text-amber-700 text-sm mt-0.5">
                            Add <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">VITE_GOOGLE_CLIENT_ID=your_client_id</code> to{' '}
                            <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">.env.local</code> and restart the dev server.
                        </p>
                    </div>
                </div>
            )}

            {/* Schedule info banner */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-blue-700 text-sm">
                    <strong>Scheduled backups run while this tab is open.</strong> This is a browser-based app — for fully automatic backups, keep this dashboard open or use the "Back Up Now" button when needed.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── Connection Card ─────────────────────────────────────── */}
                <div className="bg-white border border-gray-200/70 rounded-2xl shadow-sm overflow-hidden">
                    {/* Card header */}
                    <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-6 py-4 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
                            {isConnected
                                ? <Wifi className="w-4 h-4 text-green-600" />
                                : <WifiOff className="w-4 h-4 text-gray-400" />}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 text-sm">Google Account</h3>
                            <p className="text-xs text-gray-500">Connect to enable Drive uploads</p>
                        </div>
                        {/* Status pill */}
                        <div className="ml-auto">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isConnected
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-500'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                                {isConnected ? 'Connected' : 'Not connected'}
                            </span>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        {isConnected ? (
                            <div className="space-y-4">
                                {/* Account info */}
                                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow">
                                        {connectedEmail?.[0]?.toUpperCase() ?? 'G'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Signed in as</p>
                                        <p className="text-sm font-semibold text-gray-900 truncate">{connectedEmail}</p>
                                    </div>
                                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                </div>

                                {/* Security note */}
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Shield className="w-3.5 h-3.5 text-gray-400" />
                                    Flux only uploads files to your Drive — no data is read or modified.
                                </div>

                                {/* Disconnect button */}
                                <button
                                    onClick={disconnect}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-all text-sm font-medium"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Disconnect Google Account
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600">
                                    Connect your Google account to start backing up form entries directly to your Drive. Files are uploaded as timestamped Excel spreadsheets.
                                </p>
                                <button
                                    onClick={handleConnect}
                                    disabled={connecting || !isConfigured}
                                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-sm font-semibold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    {connecting ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                                            Connecting…
                                        </>
                                    ) : (
                                        <>
                                            {/* Google G logo */}
                                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                            </svg>
                                            Sign in with Google
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Error display */}
                        {error && (
                            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                                <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Schedule Card ───────────────────────────────────────── */}
                <div className="bg-white border border-gray-200/70 rounded-2xl shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-6 py-4 flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <CalendarClock className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 text-sm">Backup Schedule</h3>
                            <p className="text-xs text-gray-500">Choose how often to back up</p>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        {/* Schedule selector */}
                        <div className="space-y-2">
                            {SCHEDULE_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setSchedule(opt.value)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${schedule === opt.value
                                        ? 'border-indigo-400 bg-indigo-50'
                                        : 'border-gray-100 bg-gray-50 hover:border-indigo-200 hover:bg-indigo-50/50'
                                        }`}
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${schedule === opt.value ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
                                        {schedule === opt.value && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-sm font-semibold ${schedule === opt.value ? 'text-indigo-700' : 'text-gray-700'}`}>
                                            {opt.label}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Backup Status & Action ─────────────────────────────────────── */}
            <div className="bg-white border border-gray-200/70 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-6 py-4 flex items-center gap-3">
                    <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Cloud className="w-4 h-4 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">Backup Status</h3>

                    {/* Back up now button */}
                    <div className="ml-auto">
                        <button
                            onClick={backupNow}
                            disabled={!isConnected || isBackingUp}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 active:scale-95"
                        >
                            {isBackingUp ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Backing up…
                                </>
                            ) : (
                                <>
                                    <Cloud className="w-4 h-4" />
                                    Back Up Now
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Last backup */}
                        <div className="p-4 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Backup</p>
                            </div>
                            {lastBackupAt ? (
                                <>
                                    <p className="text-sm font-semibold text-gray-900">{fmtDt(lastBackupAt)}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        <TimeAgo iso={lastBackupAt} />
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-gray-400 italic">Never backed up</p>
                            )}
                        </div>

                        {/* Next backup */}
                        <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                            <div className="flex items-center gap-2 mb-2">
                                <CalendarClock className="w-4 h-4 text-indigo-400" />
                                <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Next Scheduled</p>
                            </div>
                            {nextBackupAt ? (
                                <>
                                    <p className="text-sm font-semibold text-indigo-900">{fmtDt(nextBackupAt)}</p>
                                    <p className="text-xs text-indigo-500 mt-0.5">
                                        <TimeAgo iso={nextBackupAt} />
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-indigo-400 italic">
                                    {schedule === 'manual' ? 'Manual mode' : 'Not scheduled yet'}
                                </p>
                            )}
                        </div>

                        {/* Current schedule */}
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-2 mb-2">
                                <CalendarClock className="w-4 h-4 text-blue-400" />
                                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Schedule</p>
                            </div>
                            <p className="text-sm font-semibold text-blue-900">{scheduleOption.label}</p>
                            <p className="text-xs text-blue-500 mt-0.5">
                                {isConnected ? 'Active' : 'Connect to activate'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Backup Log ──────────────────────────────────────────────────── */}
            <div className="bg-white border border-gray-200/70 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-6 py-4 flex items-center gap-3">
                    <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center">
                        <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">Recent Backups</h3>
                    <span className="ml-auto text-xs text-gray-400">Last {log.length} backups</span>
                </div>

                <div className="divide-y divide-gray-50">
                    {log.length === 0 ? (
                        <div className="px-6 py-10 text-center">
                            <CloudOff className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-sm text-gray-400">No backups yet. Click "Back Up Now" to get started.</p>
                        </div>
                    ) : (
                        log.map((entry, i) => (
                            <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                                {/* Status icon */}
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${entry.status === 'success'
                                    ? 'bg-green-100'
                                    : 'bg-red-100'
                                    }`}>
                                    {entry.status === 'success'
                                        ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        : <XCircle className="w-4 h-4 text-red-500" />}
                                </div>

                                {/* File info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{entry.filename}</p>
                                    {entry.status === 'error' && entry.errorMsg && (
                                        <p className="text-xs text-red-500 mt-0.5 truncate">{entry.errorMsg}</p>
                                    )}
                                    {entry.status === 'success' && entry.fileId && (
                                        <a
                                            href={`https://drive.google.com/file/d/${entry.fileId}/view`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-indigo-500 hover:text-indigo-700 mt-0.5 inline-flex items-center gap-1"
                                        >
                                            View on Drive →
                                        </a>
                                    )}
                                </div>

                                {/* Time */}
                                <div className="text-right shrink-0">
                                    <p className="text-xs text-gray-500">{fmtDt(entry.timestamp)}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        <TimeAgo iso={entry.timestamp} />
                                    </p>
                                </div>

                                {/* Badge */}
                                <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${entry.status === 'success'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-600'
                                    }`}>
                                    {entry.status === 'success' ? 'Success' : 'Failed'}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ── What gets backed up note ──────────────────────────────────── */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <Shield className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-medium text-gray-700">What's included in each backup</p>
                    <p>Each backup creates an Excel file (<code className="bg-gray-100 px-1 rounded text-xs">.xlsx</code>) containing all form entries: date, time, employee, customer name, service type, charges, and payment method.</p>
                    <p className="text-gray-500">Tokens, passwords, and credentials are <strong>never</strong> included in backups.</p>
                </div>
            </div>
        </div>
    )
}
