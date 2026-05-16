import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, Plus, Trash2, Printer, Loader2, Grid2X2 } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { UhidCard } from './types'
import { pdfPageToDataUrl } from '../../utils/pdfToImage'
import { A4_W_MM, A4_H_MM } from '../../utils/printLayout'

interface UhidCardResizerProps {
    onNavigate: (route: string) => void
}

export function UhidCardResizer({ onNavigate }: UhidCardResizerProps) {
    const [cards, setCards] = useState<UhidCard[]>([])
    const [printing, setPrinting] = useState(false)

    const addCard = () => {
        if (cards.length >= 10) return
        setCards([...cards, {
            id: Math.random().toString(36).substring(7),
            file: null,
            image: null,
            status: 'idle'
        }])
    }

    const removeCard = (id: string) => {
        setCards(cards.filter(c => c.id !== id))
    }

    const updateCard = (id: string, updates: Partial<UhidCard>) => {
        setCards(cards.map(c => c.id === id ? { ...c, ...updates } : c))
    }

    const processPdf = async (file: File, id: string) => {
        updateCard(id, { status: 'processing', file })
        try {
            const { dataUrl } = await pdfPageToDataUrl(file, 1)
            updateCard(id, {
                image: dataUrl,
                status: 'ready'
            })
        } catch (e) {
            console.error(e)
            alert('Failed to process PDF.')
            updateCard(id, { status: 'error' })
        }
    }

    const generatePdf = () => {
        const readyCards = cards.filter(c => c.status === 'ready')
        if (readyCards.length === 0) return

        setPrinting(true)
        try {
            const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
            
            const cardW = 85.6
            const cardH = 54
            const gapX = 5
            const gapY = 5

            // Compute center margins
            const leftMargin = (A4_W_MM - (2 * cardW) - gapX) / 2
            const topMargin = (A4_H_MM - (5 * cardH) - (4 * gapY)) / 2

            // Grid layout
            readyCards.forEach((card, index) => {
                // If more than 10, add a page
                if (index > 0 && index % 10 === 0) {
                    doc.addPage()
                }

                const pageIndex = index % 10
                const col = pageIndex % 2
                const row = Math.floor(pageIndex / 2)

                const x = leftMargin + col * (cardW + gapX)
                const y = topMargin + row * (cardH + gapY)

                doc.addImage(card.image!, 'PNG', x, y, cardW, cardH)
                
                // Draw a small border around each card to help with cutting
                doc.setLineWidth(0.1)
                doc.setDrawColor(200, 200, 200)
                doc.rect(x, y, cardW, cardH)
            })

            doc.save('uhid-cards.pdf')
        } catch (e) {
            console.error(e)
            alert('Failed to generate Print PDF.')
        } finally {
            setPrinting(false)
        }
    }

    const DropzoneArea = ({ id }: { id: string }) => {
        const onDrop = useCallback((acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                processPdf(acceptedFiles[0], id)
            }
        }, [id])

        const { getRootProps, getInputProps, isDragActive } = useDropzone({
            onDrop,
            accept: { 'application/pdf': ['.pdf'] },
            maxFiles: 1
        })

        return (
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-violet-500 bg-violet-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
            >
                <input {...getInputProps()} />
                <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Plus className="w-5 h-5 text-violet-600" />
                </div>
                <p className="font-medium text-gray-900 mb-1 text-sm">Upload 1-Page PDF</p>
                <p className="text-xs text-gray-500">Only Page 1 is extracted</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => onNavigate('tools')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Grid2X2 className="w-6 h-6 text-violet-600" />
                            UHID Card Resizer
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500">{cards.filter(c => c.status === 'ready').length}/10 Ready</span>
                    <button
                        onClick={generatePdf}
                        disabled={printing || cards.filter(c => c.status === 'ready').length === 0}
                        className="btn-primary flex items-center gap-2 bg-violet-600 hover:bg-violet-700 border-transparent text-white"
                    >
                        {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                        Generate Grid PDF
                    </button>
                </div>
            </div>

            {cards.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Grid2X2 className="w-8 h-8 text-violet-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No UHID Cards added</h2>
                    <p className="text-gray-500 mb-6">Start by adding slots (Max 10 per page).</p>
                    <button onClick={addCard} className="btn-primary flex items-center gap-2 mx-auto bg-violet-600 hover:bg-violet-700 border-transparent text-white">
                        <Plus className="w-4 h-4" /> Add Card Slot
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {cards.map((card, index) => (
                        <div key={card.id} className="card relative p-0 overflow-hidden flex flex-col">
                            <div className="bg-gray-50 p-3 border-b flex items-center justify-between">
                                <span className="font-bold text-gray-700 text-sm">Slot #{index + 1}</span>
                                <button onClick={() => removeCard(card.id)} className="text-red-500 hover:text-red-700 p-1">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-4 flex-1 flex flex-col justify-center">
                                {card.status === 'idle' && <DropzoneArea id={card.id} />}
                                
                                {card.status === 'processing' && (
                                    <div className="flex flex-col items-center justify-center py-6">
                                        <Loader2 className="w-6 h-6 animate-spin text-violet-600 mb-2" />
                                        <p className="text-gray-500 font-medium text-sm">Processing...</p>
                                    </div>
                                )}
                                
                                {card.status === 'ready' && (
                                    <div className="flex flex-col gap-2">
                                        <img src={card.image!} alt="Card" className="w-full object-contain bg-gray-100 border rounded border-gray-200" style={{aspectRatio: '85.6/54'}} />
                                    </div>
                                )}

                                {card.status === 'error' && (
                                    <div className="text-center py-4">
                                        <p className="text-red-500 font-medium mb-2 text-sm">Error</p>
                                        <button onClick={() => updateCard(card.id, { status: 'idle' })} className="btn-secondary text-xs py-1 px-2">Try Again</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {cards.length < 10 && (
                        <button onClick={addCard} className="card border-2 border-dashed border-gray-300 text-gray-500 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 transition-colors font-medium flex flex-col items-center justify-center gap-2 min-h-[200px]">
                            <Plus className="w-6 h-6" /> Add Slot
                        </button>
                    )}
                </div>
            )}

            <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500 text-sm">
                🔒 All processing runs entirely in your browser. No files are uploaded to any server.
            </div>
        </div>
    )
}
