import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, Plus, Trash2, Printer, Loader2, Book, Settings2 } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { RcBook } from './types'
import { pdfPageToDataUrl } from '../../utils/pdfToImage'
import { placeIdCardRow } from '../../utils/printLayout'
import { CropModal } from '../../components/CropModal'

interface RcBookLaminationProps {
    onNavigate: (route: string) => void
}

export function RcBookLamination({ onNavigate }: RcBookLaminationProps) {
    const [books, setBooks] = useState<RcBook[]>([])
    const [cropModal, setCropModal] = useState<{ id: string; side: 'front' | 'back'; imageSrc: string } | null>(null)
    const [printing, setPrinting] = useState(false)

    const addBook = () => {
        if (books.length >= 5) return
        setBooks([...books, {
            id: Math.random().toString(36).substring(7),
            files: { front: null, back: null },
            images: { front: null, back: null },
            croppedImages: { front: null, back: null },
            status: 'idle'
        }])
    }

    const removeBook = (id: string) => {
        setBooks(books.filter(b => b.id !== id))
    }

    const updateBook = (id: string, updates: Partial<RcBook>) => {
        setBooks(books.map(b => b.id === id ? { ...b, ...updates } : b))
    }

    const processFile = async (file: File, id: string, side: 'front' | 'back') => {
        const book = books.find(b => b.id === id)
        if (!book) return

        updateBook(id, { status: 'processing' })
        try {
            let imageSrc: string
            if (file.type === 'application/pdf') {
                const { dataUrl } = await pdfPageToDataUrl(file, 1)
                imageSrc = dataUrl
            } else {
                imageSrc = URL.createObjectURL(file)
            }

            updateBook(id, {
                files: { ...book.files, [side]: file },
                images: { ...book.images, [side]: imageSrc },
                croppedImages: { ...book.croppedImages, [side]: imageSrc },
                status: book.files[side === 'front' ? 'back' : 'front'] ? 'ready' : 'idle'
            })
        } catch (e) {
            console.error(e)
            alert('Failed to process file.')
            updateBook(id, { status: 'error' })
        }
    }

    const getImageDataUrl = async (src: string): Promise<string> => {
        if (src.startsWith('data:')) return src
        // If it's an object URL, we need to convert to dataUrl for jsPDF
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                canvas.width = img.width
                canvas.height = img.height
                const ctx = canvas.getContext('2d')
                if (!ctx) return reject('No context')
                ctx.drawImage(img, 0, 0)
                resolve(canvas.toDataURL('image/jpeg', 0.9))
            }
            img.onerror = reject
            img.src = src
        })
    }

    const generatePdf = async () => {
        const readyBooks = books.filter(b => b.images.front && b.images.back)
        if (readyBooks.length === 0) return

        setPrinting(true)
        try {
            const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
            let currentY = 10

            for (const book of readyBooks) {
                if (currentY + 54 > 280) {
                    doc.addPage()
                    currentY = 10
                }

                // Convert Object URLs to Data URLs if needed
                const fData = await getImageDataUrl(book.croppedImages.front!)
                const bData = await getImageDataUrl(book.croppedImages.back!)

                currentY = placeIdCardRow(
                    doc,
                    fData,
                    bData,
                    currentY,
                    { widthMm: 86, heightMm: 54 },
                    true,
                    'horizontal'
                )

                currentY += 5
            }

            doc.save('rc-books.pdf')
        } catch (e) {
            console.error(e)
            alert('Failed to generate Print PDF.')
        } finally {
            setPrinting(false)
        }
    }

    const DropzoneArea = ({ id, side }: { id: string, side: 'front' | 'back' }) => {
        const onDrop = useCallback((acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                processFile(acceptedFiles[0], id, side)
            }
        }, [id, side])

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
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors h-full flex flex-col items-center justify-center ${
                    isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
            >
                <input {...getInputProps()} />
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Plus className="w-5 h-5 text-gray-500" />
                </div>
                <p className="font-medium text-gray-900 mb-1">{side === 'front' ? 'Front Zone' : 'Back Zone'}</p>
                <p className="text-xs text-gray-500">PDF, JPG, or PNG</p>
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
                            <Book className="w-6 h-6 text-purple-600" />
                            RC Book Lamination
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500">{books.filter(b => b.images.front && b.images.back).length}/5 Ready</span>
                    <button
                        onClick={generatePdf}
                        disabled={printing || books.filter(b => b.images.front && b.images.back).length === 0}
                        className="btn-primary flex items-center gap-2 bg-purple-600 hover:bg-purple-700 border-transparent text-white"
                    >
                        {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                        Generate Print PDF
                    </button>
                </div>
            </div>

            {books.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Book className="w-8 h-8 text-purple-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No RC Books added</h2>
                    <p className="text-gray-500 mb-6">Start by adding a new RC Book slot.</p>
                    <button onClick={addBook} className="btn-primary flex items-center gap-2 mx-auto bg-purple-600 hover:bg-purple-700 border-transparent text-white">
                        <Plus className="w-4 h-4" /> Add Book Slot
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {books.map((book, index) => (
                        <div key={book.id} className="card relative p-0 overflow-hidden flex flex-col">
                            <div className="bg-gray-50 p-4 border-b flex items-center justify-between">
                                <span className="font-bold text-gray-700">RC Book #{index + 1}</span>
                                <button onClick={() => removeBook(book.id)} className="text-red-500 hover:text-red-700 p-1">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-6">
                                {book.status === 'processing' ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-4" />
                                        <p className="text-gray-500 font-medium">Processing files...</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Front Zone */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Front Zone</span>
                                                {book.images.front && (
                                                    <button onClick={() => setCropModal({ id: book.id, side: 'front', imageSrc: book.images.front! })} className="text-purple-600 hover:text-purple-800 text-xs font-medium flex items-center gap-1">
                                                        <Settings2 className="w-3 h-3" /> Adjust Crop
                                                    </button>
                                                )}
                                            </div>
                                            {book.croppedImages.front ? (
                                                <img src={book.croppedImages.front} alt="Front" className="w-full object-contain bg-gray-100 border rounded-xl h-48" />
                                            ) : (
                                                <div className="h-48">
                                                    <DropzoneArea id={book.id} side="front" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Back Zone */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Back Zone</span>
                                                {book.images.back && (
                                                    <button onClick={() => setCropModal({ id: book.id, side: 'back', imageSrc: book.images.back! })} className="text-purple-600 hover:text-purple-800 text-xs font-medium flex items-center gap-1">
                                                        <Settings2 className="w-3 h-3" /> Adjust Crop
                                                    </button>
                                                )}
                                            </div>
                                            {book.croppedImages.back ? (
                                                <img src={book.croppedImages.back} alt="Back" className="w-full object-contain bg-gray-100 border rounded-xl h-48" />
                                            ) : (
                                                <div className="h-48">
                                                    <DropzoneArea id={book.id} side="back" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {books.length < 5 && (
                        <button onClick={addBook} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2">
                            <Plus className="w-5 h-5" /> Add Another Book
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
                        updateBook(cropModal.id, {
                            croppedImages: {
                                ...books.find(b => b.id === cropModal.id)!.croppedImages,
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
