import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, Plus, Trash2, Printer, Loader2, Car, Settings2 } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { DrivingLicence } from './types'
import { pdfPageToDataUrl } from '../../utils/pdfToImage'
import { findContentBoundingBox } from '../../utils/autoCrop'
import { CropModal } from '../../components/CropModal'
import { A4_W_MM } from '../../utils/printLayout'

interface DrivingLicenceToolProps {
    onNavigate: (route: string) => void
}

export function DrivingLicenceTool({ onNavigate }: DrivingLicenceToolProps) {
    const [licences, setLicences] = useState<DrivingLicence[]>([])
    const [cropModal, setCropModal] = useState<{ id: string; side: 'front' | 'back'; imageSrc: string } | null>(null)
    const [printing, setPrinting] = useState(false)

    const addLicence = () => {
        if (licences.length >= 5) return
        setLicences([...licences, {
            id: Math.random().toString(36).substring(7),
            file: null,
            rawImages: { front: null, back: null },
            croppedImages: { front: null, back: null },
            status: 'idle'
        }])
    }

    const removeLicence = (id: string) => {
        setLicences(licences.filter(l => l.id !== id))
    }

    const updateLicence = (id: string, updates: Partial<DrivingLicence>) => {
        setLicences(licences.map(l => l.id === id ? { ...l, ...updates } : l))
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

    const processPdf = async (file: File, id: string) => {
        updateLicence(id, { status: 'processing', file })
        try {
            const { dataUrl: page1, totalPages } = await pdfPageToDataUrl(file, 1)
            if (totalPages < 2) {
                alert('Driving Licence must be a 2-page PDF.')
                updateLicence(id, { status: 'error' })
                return
            }
            const { dataUrl: page2 } = await pdfPageToDataUrl(file, 2)

            // Auto crop both pages
            const bbox1 = await findContentBoundingBox(page1)
            const bbox2 = await findContentBoundingBox(page2)

            let crop1 = page1
            let crop2 = page2

            if (bbox1) crop1 = await getCroppedImg(page1, bbox1)
            if (bbox2) crop2 = await getCroppedImg(page2, bbox2)

            updateLicence(id, {
                rawImages: { front: page1, back: page2 },
                croppedImages: { front: crop1, back: crop2 },
                status: 'ready'
            })
        } catch (e) {
            console.error(e)
            alert('Failed to process PDF.')
            updateLicence(id, { status: 'error' })
        }
    }

    const generatePdf = () => {
        const readyLicences = licences.filter(l => l.status === 'ready')
        if (readyLicences.length === 0) return

        setPrinting(true)
        try {
            const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
            let currentY = 10 // Start 10mm from top

            const cardW = 90 // 9 cm
            const cardH = 57.1 // 5.71 cm
            const totalWidth = cardW * 2 // 18 cm
            const startX = (A4_W_MM - totalWidth) / 2 // Centered

            for (const licence of readyLicences) {
                if (currentY + cardH > 280) {
                    doc.addPage()
                    currentY = 10
                }

                // Front side
                doc.addImage(licence.croppedImages.front!, 'PNG', startX, currentY, cardW, cardH)
                
                // Back side
                doc.addImage(licence.croppedImages.back!, 'PNG', startX + cardW, currentY, cardW, cardH)
                
                // Borders
                doc.setLineWidth(0.2 * 0.352778)
                doc.setDrawColor(0, 0, 0)
                doc.rect(startX, currentY, cardW, cardH)
                doc.rect(startX + cardW, currentY, cardW, cardH)

                currentY += cardH // 0 mm gap
            }

            doc.save('driving-licences.pdf')
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
                    isDragActive ? 'border-pink-500 bg-pink-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
            >
                <input {...getInputProps()} />
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-6 h-6 text-pink-600" />
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
                            <Car className="w-6 h-6 text-pink-600" />
                            Driving Licence Tool
                        </h1>
                    </div>
                </div>
                <button
                    onClick={generatePdf}
                    disabled={printing || licences.filter(l => l.status === 'ready').length === 0}
                    className="btn-primary flex items-center gap-2 bg-pink-600 hover:bg-pink-700 border-transparent text-white"
                >
                    {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                    Generate Print PDF
                </button>
            </div>

            {licences.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Car className="w-8 h-8 text-pink-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No Driving Licences added</h2>
                    <p className="text-gray-500 mb-6">Start by adding a new licence slot.</p>
                    <button onClick={addLicence} className="btn-primary flex items-center gap-2 mx-auto bg-pink-600 hover:bg-pink-700 border-transparent text-white">
                        <Plus className="w-4 h-4" /> Add Licence Slot
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {licences.map((licence, index) => (
                        <div key={licence.id} className="card relative p-0 overflow-hidden flex flex-col">
                            <div className="bg-gray-50 p-4 border-b flex items-center justify-between">
                                <span className="font-bold text-gray-700">Driving Licence #{index + 1}</span>
                                <button onClick={() => removeLicence(licence.id)} className="text-red-500 hover:text-red-700 p-1">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-6">
                                {licence.status === 'idle' && <DropzoneArea id={licence.id} />}
                                
                                {licence.status === 'processing' && (
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-pink-600 mb-4" />
                                        <p className="text-gray-500 font-medium">Processing PDF and Auto-Cropping...</p>
                                    </div>
                                )}
                                
                                {licence.status === 'ready' && (
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Front Side</span>
                                                <button onClick={() => setCropModal({ id: licence.id, side: 'front', imageSrc: licence.rawImages.front! })} className="text-pink-600 hover:text-pink-800 text-xs font-medium flex items-center gap-1">
                                                    <Settings2 className="w-3 h-3" /> Adjust Crop
                                                </button>
                                            </div>
                                            <img src={licence.croppedImages.front!} alt="Front" className="w-full object-contain bg-gray-100 border rounded-xl h-48" />
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Back Side</span>
                                                <button onClick={() => setCropModal({ id: licence.id, side: 'back', imageSrc: licence.rawImages.back! })} className="text-pink-600 hover:text-pink-800 text-xs font-medium flex items-center gap-1">
                                                    <Settings2 className="w-3 h-3" /> Adjust Crop
                                                </button>
                                            </div>
                                            <img src={licence.croppedImages.back!} alt="Back" className="w-full object-contain bg-gray-100 border rounded-xl h-48" />
                                        </div>
                                    </div>
                                )}

                                {licence.status === 'error' && (
                                    <div className="text-center py-8">
                                        <p className="text-red-500 font-medium mb-4">Error processing PDF</p>
                                        <button onClick={() => updateLicence(licence.id, { status: 'idle' })} className="btn-secondary text-sm">Try Again</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {licences.length < 5 && (
                        <button onClick={addLicence} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2">
                            <Plus className="w-5 h-5" /> Add Another Licence
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
                        updateLicence(cropModal.id, {
                            croppedImages: {
                                ...licences.find(l => l.id === cropModal.id)!.croppedImages,
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
