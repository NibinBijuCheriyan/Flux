import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileBadge, ArrowLeft, Plus, Settings2, Trash2, Printer, Loader2 } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { IdCard } from './types'
import { pdfPageToDataUrl } from '../../utils/pdfToImage'
import { calcHorizontalCardSize, calcVerticalCardSize, placeIdCardRow } from '../../utils/printLayout'
import { CropModal } from '../../components/CropModal'

interface MiscIdLaminationProps {
    onNavigate: (route: string) => void
}

export function MiscIdLamination({ onNavigate }: MiscIdLaminationProps) {
    const [cards, setCards] = useState<IdCard[]>([])
    const [cropModal, setCropModal] = useState<{ cardId: string; side: 'front' | 'back'; imageSrc: string } | null>(null)
    const [printing, setPrinting] = useState(false)

    const addCard = () => {
        if (cards.length >= 4) return
        const newCard: IdCard = {
            id: Math.random().toString(36).substring(7),
            splitMode: false,
            orientation: 'horizontal',
            hasBorder: true,
            files: { front: null, back: null },
            rawImages: { front: null, back: null },
            croppedImages: { front: null, back: null },
            status: 'idle',
        }
        setCards([...cards, newCard])
    }

    const removeCard = (id: string) => {
        setCards(cards.filter(c => c.id !== id))
    }

    const updateCard = (id: string, updates: Partial<IdCard>) => {
        setCards(cards.map(c => c.id === id ? { ...c, ...updates } : c))
    }

    const processFile = async (file: File, isPdf: boolean, cardId: string, targetSide: 'front' | 'back' | 'both') => {
        const card = cards.find(c => c.id === cardId)
        if (!card) return

        updateCard(cardId, { status: 'processing' })

        try {
            if (isPdf) {
                const { dataUrl: page1, totalPages } = await pdfPageToDataUrl(file, 1)
                
                if (targetSide === 'both' && totalPages === 1) {
                    // 1-page PDF -> mirror
                    updateCard(cardId, {
                        files: { front: file, back: file },
                        rawImages: { front: page1, back: page1 },
                        croppedImages: { front: page1, back: page1 },
                        status: 'ready'
                    })
                } else if (targetSide === 'both' && totalPages >= 2) {
                    // 2-page PDF -> split
                    const { dataUrl: page2 } = await pdfPageToDataUrl(file, 2)
                    updateCard(cardId, {
                        files: { front: file, back: file },
                        rawImages: { front: page1, back: page2 },
                        croppedImages: { front: page1, back: page2 },
                        status: 'ready'
                    })
                } else {
                    // Specific side
                    updateCard(cardId, {
                        files: { ...card.files, [targetSide]: file },
                        rawImages: { ...card.rawImages, [targetSide]: page1 },
                        croppedImages: { ...card.croppedImages, [targetSide]: page1 },
                        status: card.files[targetSide === 'front' ? 'back' : 'front'] ? 'ready' : 'idle'
                    })
                }
            } else {
                // Image
                const dataUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result as string)
                    reader.onerror = reject
                    reader.readAsDataURL(file)
                })

                if (targetSide === 'both') {
                    // Mirror image
                    updateCard(cardId, {
                        files: { front: file, back: file },
                        rawImages: { front: dataUrl, back: dataUrl },
                        croppedImages: { front: dataUrl, back: dataUrl },
                        status: 'ready'
                    })
                } else {
                    updateCard(cardId, {
                        files: { ...card.files, [targetSide]: file },
                        rawImages: { ...card.rawImages, [targetSide]: dataUrl },
                        croppedImages: { ...card.croppedImages, [targetSide]: dataUrl },
                        status: card.files[targetSide === 'front' ? 'back' : 'front'] ? 'ready' : 'idle'
                    })
                }
            }
        } catch (e) {
            console.error(e)
            alert('Error processing file. Please ensure it is a valid PDF or Image.')
            updateCard(cardId, { status: 'error' })
        }
    }

    const DropzoneArea = ({ cardId, side, label, single }: { cardId: string, side: 'front' | 'back' | 'both', label: string, single?: boolean }) => {
        const onDrop = useCallback((acceptedFiles: File[]) => {
            if (acceptedFiles.length === 0) return
            const file = acceptedFiles[0]
            const isPdf = file.type === 'application/pdf'
            processFile(file, isPdf, cardId, side)
        }, [cardId, side])

        const { getRootProps, getInputProps, isDragActive } = useDropzone({
            onDrop,
            accept: {
                'application/pdf': ['.pdf'],
                'image/jpeg': ['.jpeg', '.jpg'],
                'image/png': ['.png']
            },
            maxFiles: 1
        })

        return (
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                } ${single ? 'h-full flex flex-col justify-center' : ''}`}
            >
                <input {...getInputProps()} />
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Plus className="w-5 h-5 text-gray-500" />
                </div>
                <p className="font-medium text-gray-900 mb-1">{label}</p>
                <p className="text-xs text-gray-500">Drop PDF or Image here</p>
            </div>
        )
    }

    const getImageDimensions = (dataUrl: string): Promise<{ w: number, h: number }> => {
        return new Promise((resolve) => {
            const img = new Image()
            img.onload = () => resolve({ w: img.width, h: img.height })
            img.src = dataUrl
        })
    }

    const generatePdf = async () => {
        const readyCards = cards.filter(c => c.rawImages.front && c.rawImages.back)
        if (readyCards.length === 0) return

        setPrinting(true)
        try {
            const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
            let currentY = 10 // Start 10mm from top

            for (const card of readyCards) {
                const fData = card.croppedImages.front!
                const bData = card.croppedImages.back!
                
                // Get dimensions of the first image to calculate sizing
                const dims = await getImageDimensions(fData)
                let cardSize;

                try {
                    if (card.orientation === 'horizontal') {
                        cardSize = calcHorizontalCardSize(dims.w, dims.h)
                    } else {
                        cardSize = calcVerticalCardSize(dims.w, dims.h)
                    }
                } catch (e: any) {
                    alert(`Skipping card due to size error: ${e.message}`)
                    continue
                }

                if (currentY + cardSize.heightMm > 280) {
                    doc.addPage()
                    currentY = 10
                }

                currentY = placeIdCardRow(
                    doc,
                    fData,
                    bData,
                    currentY,
                    cardSize,
                    card.hasBorder,
                    card.orientation
                )
                
                currentY += 5 // 5mm gap between rows
            }

            doc.save('misc-id-lamination.pdf')
        } catch (e) {
            console.error(e)
            alert('Failed to generate Print PDF.')
        } finally {
            setPrinting(false)
        }
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
                            <FileBadge className="w-6 h-6 text-blue-600" />
                            Misc ID Lamination
                        </h1>
                    </div>
                </div>
                <button
                    onClick={generatePdf}
                    disabled={printing || cards.filter(c => c.rawImages.front && c.rawImages.back).length === 0}
                    className="btn-primary flex items-center gap-2"
                >
                    {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                    Generate Print PDF
                </button>
            </div>

            {cards.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileBadge className="w-8 h-8 text-blue-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No ID Cards added</h2>
                    <p className="text-gray-500 mb-6">Start by adding a new card slot.</p>
                    <button onClick={addCard} className="btn-primary flex items-center gap-2 mx-auto">
                        <Plus className="w-4 h-4" /> Add Card Slot
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {cards.map((card, index) => (
                        <div key={card.id} className="card relative p-0 overflow-hidden">
                            <div className="bg-gray-50 p-4 border-b flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-gray-700">Card #{index + 1}</span>
                                    
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={card.splitMode}
                                            onChange={(e) => updateCard(card.id, { splitMode: e.target.checked, rawImages: { front: null, back: null } })}
                                            className="rounded text-blue-600"
                                        />
                                        Split Mode (2 Files)
                                    </label>

                                    <select
                                        value={card.orientation}
                                        onChange={(e) => updateCard(card.id, { orientation: e.target.value as any })}
                                        className="input py-1 text-sm h-auto w-32"
                                    >
                                        <option value="horizontal">Horizontal</option>
                                        <option value="vertical">Vertical</option>
                                    </select>

                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={card.hasBorder}
                                            onChange={(e) => updateCard(card.id, { hasBorder: e.target.checked })}
                                            className="rounded text-blue-600"
                                        />
                                        Print Border
                                    </label>
                                </div>
                                <button onClick={() => removeCard(card.id)} className="text-red-500 hover:text-red-700 p-1">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-6">
                                {card.status === 'processing' && (
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                                        <p className="text-gray-500 font-medium">Processing file...</p>
                                    </div>
                                )}
                                
                                {card.status !== 'processing' && !card.rawImages.front && !card.rawImages.back && (
                                    card.splitMode ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <DropzoneArea cardId={card.id} side="front" label="Front Side" />
                                            <DropzoneArea cardId={card.id} side="back" label="Back Side" />
                                        </div>
                                    ) : (
                                        <DropzoneArea cardId={card.id} side="both" label="Upload ID (PDF/Image)" single />
                                    )
                                )}

                                {card.status !== 'processing' && (card.rawImages.front || card.rawImages.back) && (
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-sm text-gray-700">Front Side</span>
                                                {card.rawImages.front && (
                                                    <button onClick={() => setCropModal({ cardId: card.id, side: 'front', imageSrc: card.rawImages.front! })} className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1">
                                                        <Settings2 className="w-3 h-3" /> Adjust Crop
                                                    </button>
                                                )}
                                            </div>
                                            {card.croppedImages.front ? (
                                                <img src={card.croppedImages.front} alt="Front Preview" className="w-full object-contain bg-gray-100 rounded-lg border h-48" />
                                            ) : (
                                                <DropzoneArea cardId={card.id} side="front" label="Front Side" single />
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-sm text-gray-700">Back Side</span>
                                                {card.rawImages.back && (
                                                    <button onClick={() => setCropModal({ cardId: card.id, side: 'back', imageSrc: card.rawImages.back! })} className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1">
                                                        <Settings2 className="w-3 h-3" /> Adjust Crop
                                                    </button>
                                                )}
                                            </div>
                                            {card.croppedImages.back ? (
                                                <img src={card.croppedImages.back} alt="Back Preview" className="w-full object-contain bg-gray-100 rounded-lg border h-48" />
                                            ) : (
                                                <DropzoneArea cardId={card.id} side="back" label="Back Side" single />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {cards.length > 0 && cards.length < 4 && (
                        <button onClick={addCard} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2">
                            <Plus className="w-5 h-5" /> Add Another Card
                        </button>
                    )}
                </div>
            )}

            <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500 text-sm">
                🔒 All processing runs entirely in your browser. No files are uploaded to any server.
            </div>

            {cropModal && (
                <CropModal
                    imageSrc={cropModal.imageSrc}
                    onClose={() => setCropModal(null)}
                    onCropComplete={(cropped) => {
                        updateCard(cropModal.cardId, {
                            croppedImages: {
                                ...cards.find(c => c.id === cropModal.cardId)!.croppedImages,
                                [cropModal.side]: cropped
                            }
                        })
                        setCropModal(null)
                    }}
                />
            )}
        </div>
    )
}
