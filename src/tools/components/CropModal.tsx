import { useState, useRef } from 'react'
import ReactCrop, { type Crop, type PercentCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { X, Crop as CropIcon, Maximize } from 'lucide-react'
import { findContentBoundingBox } from '../utils/autoCrop'

interface CropModalProps {
    imageSrc: string
    yStartBias?: number
    onClose: () => void
    onCropComplete: (croppedDataUrl: string) => void
}

export function CropModal({ imageSrc, yStartBias = 0, onClose, onCropComplete }: CropModalProps) {
    const [crop, setCrop] = useState<Crop>()
    const [completedCropPercent, setCompletedCropPercent] = useState<PercentCrop | null>(null)
    const [processing, setProcessing] = useState(false)
    const imgRef = useRef<HTMLImageElement>(null)

    const handleSave = async () => {
        if (!completedCropPercent || !imgRef.current) return
        setProcessing(true)
        try {
            const img = imgRef.current
            // Calculate absolute pixels from percentage
            const pixelCrop = {
                x: (completedCropPercent.x / 100) * img.naturalWidth,
                y: (completedCropPercent.y / 100) * img.naturalHeight,
                width: (completedCropPercent.width / 100) * img.naturalWidth,
                height: (completedCropPercent.height / 100) * img.naturalHeight,
            }

            const result = await getCroppedImg(imageSrc, pixelCrop)
            onCropComplete(result)
        } catch (e) {
            console.error(e)
            alert('Failed to crop image')
        } finally {
            setProcessing(false)
        }
    }

    const handleAutoCrop = async () => {
        setProcessing(true)
        try {
            const bbox = await findContentBoundingBox(imageSrc, yStartBias)
            if (bbox) {
                // Bypass visual cropper to ensure perfect accuracy
                const result = await getCroppedImg(imageSrc, bbox)
                onCropComplete(result)
            } else {
                alert("Could not detect content for auto-crop. Ensure image has near-white background borders.")
            }
        } catch (e) {
            console.error(e)
            alert('Failed to auto-crop')
        } finally {
            setProcessing(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl flex flex-col h-[80vh] overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <CropIcon className="w-5 h-5" /> Adjust Crop
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="relative flex-1 bg-gray-900 overflow-auto flex items-center justify-center p-4">
                    <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(_, percentCrop) => setCompletedCropPercent(percentCrop)}
                        className="max-h-full"
                    >
                        <img
                            ref={imgRef}
                            src={imageSrc}
                            alt="Crop preview"
                            className="max-h-[60vh] w-auto object-contain"
                            crossOrigin="anonymous"
                        />
                    </ReactCrop>
                </div>
                
                <div className="p-4 border-t bg-gray-50 flex items-center justify-end gap-4">
                    <button onClick={handleAutoCrop} disabled={processing} className="btn-secondary flex items-center gap-2 bg-white px-4 py-2 rounded-lg font-medium border text-gray-700 hover:bg-gray-50 transition-colors">
                        <Maximize className="w-4 h-4" /> Auto Crop
                    </button>
                    
                    <button onClick={handleSave} disabled={processing || !completedCropPercent?.width || !completedCropPercent?.height} className="btn-primary px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {processing ? 'Processing...' : 'Apply Crop'}
                    </button>
                </div>
            </div>
        </div>
    )
}

async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<string> {
    const image = new Image()
    image.src = imageSrc
    await new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = reject
    })

    const canvas = document.createElement('canvas')
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height
    const ctx = canvas.getContext('2d')

    if (!ctx) {
        throw new Error('No 2d context')
    }

    // Fill white
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    )

    return canvas.toDataURL('image/png')
}
