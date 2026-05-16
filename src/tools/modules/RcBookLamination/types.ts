export interface RcBook {
    id: string
    files: { front: File | null; back: File | null }
    images: { front: string | null; back: string | null }
    croppedImages: { front: string | null; back: string | null }
    status: 'idle' | 'processing' | 'ready' | 'error'
}
