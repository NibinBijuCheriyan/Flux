export interface EaadhaarCard {
    id: string
    file: File | null
    rawImage: string | null
    croppedImage: string | null
    status: 'idle' | 'processing' | 'ready' | 'error'
    errorMsg?: string
}
