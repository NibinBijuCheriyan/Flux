export interface IdCard {
    id: string
    splitMode: boolean
    orientation: 'horizontal' | 'vertical'
    hasBorder: boolean
    files: { front: File | null; back: File | null }
    rawImages: { front: string | null; back: string | null }
    croppedImages: { front: string | null; back: string | null }
    status: 'idle' | 'processing' | 'ready' | 'error'
}
