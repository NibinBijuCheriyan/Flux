export interface KathirId {
    id: string
    file: File | null
    images: { front: string | null; back: string | null }
    status: 'idle' | 'processing' | 'ready' | 'error'
}
