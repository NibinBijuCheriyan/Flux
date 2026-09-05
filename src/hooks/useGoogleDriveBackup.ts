import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { FormEntry, User } from '../lib/types'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'

// ─── Types ───────────────────────────────────────────────────────────────────

export type BackupSchedule = 'manual' | '6h' | '12h' | 'daily' | 'weekly'

export interface BackupLogEntry {
    filename: string
    timestamp: string  // ISO
    status: 'success' | 'error'
    errorMsg?: string
    fileId?: string    // Google Drive file ID
}

export interface DriveBackupState {
    isConnected: boolean
    connectedEmail: string | null
    schedule: BackupSchedule
    lastBackupAt: string | null   // ISO
    nextBackupAt: string | null   // ISO
    isBackingUp: boolean
    log: BackupLogEntry[]
    error: string | null
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LS_PREFIX = 'flux_drive_backup'
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart'
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files'
const SCOPES = 'https://www.googleapis.com/auth/drive.file email profile'
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const SCHEDULE_MS: Record<BackupSchedule, number | null> = {
    manual: null,
    '6h':   6 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
}

function lsKey(userId: string, suffix: string) {
    return `${LS_PREFIX}_${userId}_${suffix}`
}

// ─── GIS helpers ─────────────────────────────────────────────────────────────

declare global {
    interface Window {
        google?: any
    }
}

async function getGISToken(userId: string): Promise<string | null> {
    return new Promise((resolve) => {
        if (!window.google?.accounts?.oauth2) {
            resolve(null)
            return
        }
        const client = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (response: any) => {
                if (response.access_token) {
                    // Store token + expiry
                    const expiry = Date.now() + (response.expires_in - 60) * 1000
                    localStorage.setItem(lsKey(userId, 'token'), response.access_token)
                    localStorage.setItem(lsKey(userId, 'token_expiry'), String(expiry))
                    resolve(response.access_token)
                } else {
                    resolve(null)
                }
            },
            error_callback: () => resolve(null),
        })
        client.requestAccessToken()
    })
}

async function getStoredToken(userId: string): Promise<string | null> {
    const token = localStorage.getItem(lsKey(userId, 'token'))
    const expiry = Number(localStorage.getItem(lsKey(userId, 'token_expiry')) || '0')
    if (token && Date.now() < expiry) return token
    return null
}

async function getUserEmail(token: string): Promise<string | null> {
    try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return null
        const data = await res.json()
        return data.email ?? null
    } catch {
        return null
    }
}

// ─── Build XLSX buffer ────────────────────────────────────────────────────────

function buildXlsx(entries: FormEntry[], users: User[]): ArrayBuffer {
    const rows = entries.map(entry => {
        const emp = users.find(u => u.id === entry.employee_id)
        return {
            'Date': format(new Date(entry.submitted_at), 'yyyy-MM-dd'),
            'Time': format(new Date(entry.submitted_at), 'HH:mm:ss'),
            'Employee': emp?.email ?? 'Unknown',
            'Customer Name': entry.customer_name,
            'Service Type': entry.service_type,
            'Status': entry.status,
            'Payment Method': entry.payment_method || '-',
            'Service Charge': entry.service_charge ?? 0,
            'Bank Charge': entry.bank_charge ?? 0,
            'Total': (entry.service_charge ?? 0) + (entry.bank_charge ?? 0),
            'Contact Number': entry.contact_number || '-',
            'Description': entry.description || '-',
        }
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Entries')

    // Column widths
    ws['!cols'] = [
        { wch: 12 }, { wch: 10 }, { wch: 28 }, { wch: 22 }, { wch: 22 },
        { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 12 },
        { wch: 16 }, { wch: 30 },
    ]

    return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
}

// ─── Upload to Drive ──────────────────────────────────────────────────────────

async function uploadToDrive(
    token: string,
    filename: string,
    xlsxBuffer: ArrayBuffer,
    folderId?: string | null
): Promise<{ fileId: string; webViewLink: string } | null> {
    const metadata: Record<string, any> = {
        name: filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }
    if (folderId) metadata.parents = [folderId]

    const form = new FormData()
    form.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    )
    form.append(
        'file',
        new Blob([xlsxBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
    )

    const res = await fetch(DRIVE_UPLOAD_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message ?? `Drive upload failed (${res.status})`)
    }

    const file = await res.json()

    // Make file accessible so we can store the link
    await fetch(`${DRIVE_FILES_URL}/${file.id}/permissions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    }).catch(() => { /* non-critical */ })

    return { fileId: file.id, webViewLink: `https://drive.google.com/file/d/${file.id}/view` }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useGoogleDriveBackup(userId: string) {
    // ── Persisted state (localStorage) ──────────────────────────────────────
    const readLS = <T>(suffix: string, fallback: T): T => {
        if (!userId) return fallback
        const raw = localStorage.getItem(lsKey(userId, suffix))
        if (raw === null) return fallback
        try { return JSON.parse(raw) } catch { return raw as unknown as T }
    }
    const writeLS = (suffix: string, value: any) => {
        if (!userId) return
        localStorage.setItem(lsKey(userId, suffix), JSON.stringify(value))
    }

    const [isConnected, setIsConnected] = useState<boolean>(false)
    const [connectedEmail, setConnectedEmail] = useState<string | null>(null)
    const [schedule, setScheduleState] = useState<BackupSchedule>(
        () => readLS<BackupSchedule>('schedule', 'daily')
    )
    const [lastBackupAt, setLastBackupAt] = useState<string | null>(
        () => readLS<string | null>('last_backup_at', null)
    )
    const [isBackingUp, setIsBackingUp] = useState(false)
    const [log, setLog] = useState<BackupLogEntry[]>(
        () => readLS<BackupLogEntry[]>('log', [])
    )
    const [error, setError] = useState<string | null>(null)

    // Interval ref for scheduler
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // ── Check stored token on mount ──────────────────────────────────────────
    useEffect(() => {
        if (!userId) return
        getStoredToken(userId).then(async (token) => {
            if (token) {
                const email = await getUserEmail(token)
                setIsConnected(true)
                setConnectedEmail(email)
            }
        })
    }, [userId])

    // ── Computed: next backup time ───────────────────────────────────────────
    const nextBackupAt: string | null = (() => {
        if (!isConnected) return null
        const ms = SCHEDULE_MS[schedule]
        if (!ms || !lastBackupAt) return null
        const next = new Date(new Date(lastBackupAt).getTime() + ms)
        return next.toISOString()
    })()

    // ── Push log entry ────────────────────────────────────────────────────────
    const pushLog = useCallback((entry: BackupLogEntry) => {
        setLog(prev => {
            const updated = [entry, ...prev].slice(0, 10)
            writeLS('log', updated)
            return updated
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId])

    // ── Core backup function ──────────────────────────────────────────────────
    const backupNow = useCallback(async (): Promise<boolean> => {
        if (!userId) return false
        setIsBackingUp(true)
        setError(null)

        const now = new Date()
        const filename = `Flux_Backup_${format(now, 'yyyy-MM-dd_HH-mm')}.xlsx`

        try {
            // 1. Get a valid token (try stored first, then prompt)
            let token = await getStoredToken(userId)
            if (!token) {
                token = await getGISToken(userId)
            }
            if (!token) throw new Error('Could not obtain Google access token. Please reconnect.')

            // 2. Fetch entries + users from Supabase
            const [entriesRes, usersRes] = await Promise.all([
                supabase.from('form_entries').select('*').order('submitted_at', { ascending: false }),
                supabase.from('users').select('*'),
            ])
            if (entriesRes.error) throw new Error(`Supabase entries error: ${entriesRes.error.message}`)
            if (usersRes.error) throw new Error(`Supabase users error: ${usersRes.error.message}`)

            const entries: FormEntry[] = entriesRes.data ?? []
            const users: User[] = usersRes.data ?? []

            // 3. Build XLSX
            const xlsxBuffer = buildXlsx(entries, users)

            // 4. Upload
            const result = await uploadToDrive(token, filename, xlsxBuffer, null)
            if (!result) throw new Error('Upload returned no result')

            // 5. Update state & localStorage
            const ts = now.toISOString()
            setLastBackupAt(ts)
            writeLS('last_backup_at', ts)

            pushLog({ filename, timestamp: ts, status: 'success', fileId: result.fileId })
            return true
        } catch (err: any) {
            const msg = err?.message ?? 'Unknown backup error'
            setError(msg)
            pushLog({ filename, timestamp: now.toISOString(), status: 'error', errorMsg: msg })
            return false
        } finally {
            setIsBackingUp(false)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, pushLog])

    // ── Scheduler ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        if (!isConnected || schedule === 'manual') return

        const intervalMs = SCHEDULE_MS[schedule]
        if (!intervalMs) return

        // Check every minute if it's time
        intervalRef.current = setInterval(() => {
            const ms = SCHEDULE_MS[schedule]
            if (!ms) return
            const last = lastBackupAt ? new Date(lastBackupAt).getTime() : 0
            if (Date.now() - last >= ms) {
                backupNow()
            }
        }, 60_000)

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [isConnected, schedule, lastBackupAt, backupNow])

    // ── Connect ───────────────────────────────────────────────────────────────
    const connect = useCallback(async (): Promise<boolean> => {
        if (!CLIENT_ID) {
            setError('Google Client ID is not configured. Add VITE_GOOGLE_CLIENT_ID to your .env.local file.')
            return false
        }
        setError(null)
        const token = await getGISToken(userId)
        if (!token) {
            setError('Google sign-in was cancelled or failed.')
            return false
        }
        const email = await getUserEmail(token)
        setIsConnected(true)
        setConnectedEmail(email)
        writeLS('email', email)
        return true
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId])

    // ── Disconnect ────────────────────────────────────────────────────────────
    const disconnect = useCallback(() => {
        localStorage.removeItem(lsKey(userId, 'token'))
        localStorage.removeItem(lsKey(userId, 'token_expiry'))
        localStorage.removeItem(lsKey(userId, 'email'))
        setIsConnected(false)
        setConnectedEmail(null)
        setError(null)
        if (window.google?.accounts?.oauth2) {
            window.google.accounts.oauth2.revoke(
                localStorage.getItem(lsKey(userId, 'token')) ?? ''
            )
        }
    }, [userId])

    // ── Set schedule ──────────────────────────────────────────────────────────
    const setSchedule = useCallback((s: BackupSchedule) => {
        setScheduleState(s)
        writeLS('schedule', s)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId])

    return {
        isConnected,
        connectedEmail,
        schedule,
        setSchedule,
        lastBackupAt,
        nextBackupAt,
        isBackingUp,
        log,
        error,
        connect,
        disconnect,
        backupNow,
        isConfigured: !!CLIENT_ID,
    }
}
