export interface DrivingLicence {
    id: string
    file: File | null
    rawImages: { front: string | null; back: string | null }
    croppedImages: { front: string | null; back: string | null }
    status: 'idle' | 'processing' | 'ready' | 'error'
}
