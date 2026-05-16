export interface UhidCard {
    id: string
    file: File | null
    image: string | null
    status: 'idle' | 'processing' | 'ready' | 'error'
}
