import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { X, Crop, Maximize } from 'lucide-react'
import { findContentBoundingBox } from '../utils/autoCrop'

interface CropModalProps {
    imageSrc: string
    yStartBias?: number
    onClose: () => void
    onCropComplete: (croppedDataUrl: string) => void
}

export function CropModal({ imageSrc, yStartBias = 0, onClose, onCropComplete }: CropModalProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
    const [processing, setProcessing] = useState(false)

    const onCropCompleteCb = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleSave = async () => {
        if (!croppedAreaPixels) return
        setProcessing(true)
        try {
            const result = await getCroppedImg(imageSrc, croppedAreaPixels)
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
                        <Crop className="w-5 h-5" /> Adjust Crop
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="relative flex-1 bg-gray-900">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        rotation={0}
                        aspect={undefined}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropCompleteCb}
                    />
                </div>
                
                <div className="p-4 border-t bg-gray-50 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <span className="text-sm font-medium text-gray-600">Zoom</span>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-48"
                        />
                    </div>
                    
                    <button onClick={handleAutoCrop} disabled={processing} className="btn-secondary flex items-center gap-2 bg-white">
                        <Maximize className="w-4 h-4" /> Auto Crop
                    </button>
                    
                    <button onClick={handleSave} disabled={processing} className="btn-primary">
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
