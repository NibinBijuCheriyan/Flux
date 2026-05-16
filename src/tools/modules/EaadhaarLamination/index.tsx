import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, Plus, Trash2, Printer, Loader2, CreditCard, Settings2 } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { EaadhaarCard } from './types'
import { pdfPageToDataUrl } from '../../utils/pdfToImage'
import { findContentBoundingBox } from '../../utils/autoCrop'
import { getPasswordFromFilename } from '../../utils/passwordPdf'
import { CropModal } from '../../components/CropModal'
import { A4_W_MM } from '../../utils/printLayout'

interface EaadhaarLaminationProps {
    onNavigate: (route: string) => void
}

export function EaadhaarLamination({ onNavigate }: EaadhaarLaminationProps) {
    const [cards, setCards] = useState<EaadhaarCard[]>([])
    const [cropModal, setCropModal] = useState<{ id: string; imageSrc: string } | null>(null)
    const [printing, setPrinting] = useState(false)

    const addCard = () => {
        if (cards.length >= 5) return
        setCards([...cards, {
            id: Math.random().toString(36).substring(7),
            file: null,
            rawImage: null,
            croppedImage: null,
            status: 'idle'
        }])
    }

    const removeCard = (id: string) => {
        setCards(cards.filter(c => c.id !== id))
    }

    const updateCard = (id: string, updates: Partial<EaadhaarCard>) => {
        setCards(cards.map(c => c.id === id ? { ...c, ...updates } : c))
    }

    const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
        const image = new Image()
        image.src = imageSrc
        await new Promise((resolve) => (image.onload = resolve))

        const canvas = document.createElement('canvas')
        canvas.width = pixelCrop.width
        canvas.height = pixelCrop.height
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('No context')
        
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)
        
        return canvas.toDataURL('image/png')
    }

    const processFile = async (file: File, id: string) => {
        updateCard(id, { status: 'processing', file, errorMsg: undefined })
        try {
            let imageSrc: string
            if (file.type === 'application/pdf') {
                const password = getPasswordFromFilename(file.name)
                try {
                    const { dataUrl } = await pdfPageToDataUrl(file, 1, 3.0, password)
                    imageSrc = dataUrl
                } catch (e: any) {
                    throw new Error(e.message || 'Failed to read PDF. Ensure filename is the exact password (e.g., 12345678.pdf).')
                }
            } else {
                imageSrc = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result as string)
                    reader.onerror = reject
                    reader.readAsDataURL(file)
                })
            }

            // Auto crop with 60% y-start bias
            const bbox = await findContentBoundingBox(imageSrc, 0.6)
            let finalImage = imageSrc
            
            if (bbox) {
                finalImage = await getCroppedImg(imageSrc, bbox)
            }

            updateCard(id, {
                rawImage: imageSrc,
                croppedImage: finalImage,
                status: 'ready'
            })
        } catch (e: any) {
            console.error(e)
            updateCard(id, { status: 'error', errorMsg: e.message || 'Failed to process file' })
        }
    }

    const generatePdf = async () => {
        const readyCards = cards.filter(c => c.croppedImage)
        if (readyCards.length === 0) return

        setPrinting(true)
        try {
            const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
            let currentY = 10 // 1 cm from top

            const cardW = 180 // 18 cm
            const cardH = 56.3 // 5.63 cm
            const startX = (A4_W_MM - cardW) / 2 // Centered

            for (const card of readyCards) {
                if (currentY + cardH > 280) {
                    doc.addPage()
                    currentY = 10
                }

                // Add image
                doc.addImage(card.croppedImage!, 'PNG', startX, currentY, cardW, cardH)
                
                // Add border
                doc.setLineWidth(0.2 * 0.352778)
                doc.setDrawColor(0, 0, 0)
                doc.rect(startX, currentY, cardW, cardH)

                currentY += cardH // 0 mm gap
            }

            doc.save('eaadhaar-lamination.pdf')
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
                processFile(acceptedFiles[0], id)
            }
        }, [id])

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
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors h-full flex flex-col items-center justify-center min-h-[200px] ${
                    isDragActive ? 'border-fuchsia-500 bg-fuchsia-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
            >
                <input {...getInputProps()} />
                <div className="w-12 h-12 bg-fuchsia-100 rounded-full flex items-center justify-center mb-4">
                    <Plus className="w-6 h-6 text-fuchsia-600" />
                </div>
                <p className="font-medium text-gray-900 mb-1">Upload E-Aadhaar</p>
                <p className="text-sm text-gray-500">PDF, JPG, or PNG</p>
                <p className="text-xs text-gray-400 mt-2 max-w-xs">
                    If PDF is password protected, name the file exactly as the password (e.g., 12345678.pdf)
                </p>
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
                            <CreditCard className="w-6 h-6 text-fuchsia-600" />
                            E-Aadhaar Lamination
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500">{cards.filter(c => c.croppedImage).length}/5 Ready</span>
                    <button
                        onClick={generatePdf}
                        disabled={printing || cards.filter(c => c.croppedImage).length === 0}
                        className="btn-primary flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-700 border-transparent text-white"
                    >
                        {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                        Generate Print PDF
                    </button>
                </div>
            </div>

            {cards.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-fuchsia-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CreditCard className="w-8 h-8 text-fuchsia-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No E-Aadhaar added</h2>
                    <p className="text-gray-500 mb-6">Start by adding a new card slot.</p>
                    <button onClick={addCard} className="btn-primary flex items-center gap-2 mx-auto bg-fuchsia-600 hover:bg-fuchsia-700 border-transparent text-white">
                        <Plus className="w-4 h-4" /> Add Card Slot
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {cards.map((card, index) => (
                        <div key={card.id} className="card relative p-0 overflow-hidden flex flex-col">
                            <div className="bg-gray-50 p-4 border-b flex items-center justify-between">
                                <span className="font-bold text-gray-700">E-Aadhaar #{index + 1}</span>
                                <button onClick={() => removeCard(card.id)} className="text-red-500 hover:text-red-700 p-1">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-6">
                                {card.status === 'idle' && <DropzoneArea id={card.id} />}
                                
                                {card.status === 'processing' && (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-fuchsia-600 mb-4" />
                                        <p className="text-gray-500 font-medium">Processing file...</p>
                                    </div>
                                )}
                                
                                {card.status === 'ready' && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Final Crop Preview</span>
                                            {card.rawImage && (
                                                <button onClick={() => setCropModal({ id: card.id, imageSrc: card.rawImage! })} className="text-fuchsia-600 hover:text-fuchsia-800 text-xs font-medium flex items-center gap-1">
                                                    <Settings2 className="w-3 h-3" /> Adjust Crop
                                                </button>
                                            )}
                                        </div>
                                        <img src={card.croppedImage!} alt="Cropped preview" className="w-full max-w-3xl mx-auto object-contain bg-gray-100 border rounded-xl" style={{aspectRatio: '180/56.3'}} />
                                    </div>
                                )}

                                {card.status === 'error' && (
                                    <div className="text-center py-8">
                                        <p className="text-red-500 font-medium mb-2">Error Processing File</p>
                                        <p className="text-gray-500 text-sm mb-4">{card.errorMsg}</p>
                                        <button onClick={() => updateCard(card.id, { status: 'idle' })} className="btn-secondary text-sm">Try Again</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {cards.length < 5 && (
                        <button onClick={addCard} className="w-full py-6 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2">
                            <Plus className="w-5 h-5" /> Add Another E-Aadhaar
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
                    yStartBias={0.6}
                    onClose={() => setCropModal(null)}
                    onCropComplete={(cropped) => {
                        updateCard(cropModal.id, {
                            croppedImage: cropped
                        })
                        setCropModal(null)
                    }}
                />
            )}
        </div>
    )
}
