import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, Plus, Trash2, Printer, Loader2, Maximize } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { KathirId } from './types'
import { pdfPageToDataUrl } from '../../utils/pdfToImage'
import { placeIdCardRow } from '../../utils/printLayout'

interface KathirIdResizerProps {
    onNavigate: (route: string) => void
}

export function KathirIdResizer({ onNavigate }: KathirIdResizerProps) {
    const [cards, setCards] = useState<KathirId[]>([])
    const [printing, setPrinting] = useState(false)

    const addCard = () => {
        if (cards.length >= 4) return
        setCards([...cards, {
            id: Math.random().toString(36).substring(7),
            file: null,
            images: { front: null, back: null },
            status: 'idle'
        }])
    }

    const removeCard = (id: string) => {
        setCards(cards.filter(c => c.id !== id))
    }

    const updateCard = (id: string, updates: Partial<KathirId>) => {
        setCards(cards.map(c => c.id === id ? { ...c, ...updates } : c))
    }

    const processPdf = async (file: File, id: string) => {
        updateCard(id, { status: 'processing', file })
        try {
            const { dataUrl: page1, totalPages } = await pdfPageToDataUrl(file, 1)
            if (totalPages < 2) {
                alert('File must be a 2-page PDF.')
                updateCard(id, { status: 'error' })
                return
            }
            const { dataUrl: page2 } = await pdfPageToDataUrl(file, 2)

            updateCard(id, {
                images: { front: page1, back: page2 },
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
            let currentY = 10

            readyCards.forEach((card) => {
                if (currentY + 54 > 280) {
                    doc.addPage()
                    currentY = 10
                }

                currentY = placeIdCardRow(
                    doc,
                    card.images.front,
                    card.images.back,
                    currentY,
                    { widthMm: 86, heightMm: 54 },
                    true, // Always show border for Kathir ID to help with cutting
                    'horizontal'
                )

                currentY += 5 // gap
            })

            doc.save('kathir-ids.pdf')
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
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
            >
                <input {...getInputProps()} />
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="font-medium text-gray-900 mb-1">Upload 2-Page PDF</p>
                <p className="text-sm text-gray-500">Page 1 = Front, Page 2 = Back</p>
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
                            <Maximize className="w-6 h-6 text-indigo-600" />
                            Kathir ID Resizer
                        </h1>
                    </div>
                </div>
                <button
                    onClick={generatePdf}
                    disabled={printing || cards.filter(c => c.status === 'ready').length === 0}
                    className="btn-primary flex items-center gap-2"
                >
                    {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                    Generate Print PDF
                </button>
            </div>

            {cards.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Maximize className="w-8 h-8 text-indigo-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No Kathir IDs added</h2>
                    <p className="text-gray-500 mb-6">Start by adding a new ID slot.</p>
                    <button onClick={addCard} className="btn-primary flex items-center gap-2 mx-auto">
                        <Plus className="w-4 h-4" /> Add ID Slot
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {cards.map((card, index) => (
                        <div key={card.id} className="card relative p-0 overflow-hidden flex flex-col">
                            <div className="bg-gray-50 p-4 border-b flex items-center justify-between">
                                <span className="font-bold text-gray-700">Kathir ID #{index + 1}</span>
                                <button onClick={() => removeCard(card.id)} className="text-red-500 hover:text-red-700 p-1">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-6 flex-1 flex flex-col justify-center">
                                {card.status === 'idle' && <DropzoneArea id={card.id} />}
                                
                                {card.status === 'processing' && (
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
                                        <p className="text-gray-500 font-medium">Processing PDF...</p>
                                    </div>
                                )}
                                
                                {card.status === 'ready' && (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex gap-4">
                                            <div className="flex-1 space-y-1">
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Front</p>
                                                <img src={card.images.front!} alt="Front" className="w-full object-contain bg-gray-100 border rounded-lg h-32" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Back</p>
                                                <img src={card.images.back!} alt="Back" className="w-full object-contain bg-gray-100 border rounded-lg h-32" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {card.status === 'error' && (
                                    <div className="text-center py-8">
                                        <p className="text-red-500 font-medium mb-4">Error processing PDF</p>
                                        <button onClick={() => updateCard(card.id, { status: 'idle' })} className="btn-secondary text-sm">Try Again</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {cards.length < 4 && (
                        <button onClick={addCard} className="card border-2 border-dashed border-gray-300 text-gray-500 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 transition-colors font-medium flex flex-col items-center justify-center gap-3 min-h-[300px]">
                            <Plus className="w-8 h-8" /> Add Another ID
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
