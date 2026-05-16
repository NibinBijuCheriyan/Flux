
import { FileBadge, Maximize, Grid2X2, Book, CreditCard, Car } from 'lucide-react'

interface ToolsHubProps {
    onNavigate: (route: string) => void
}

export function ToolsHub({ onNavigate }: ToolsHubProps) {
    const tools = [
        {
            id: 'tools/misc-id',
            name: 'Misc ID Lamination',
            description: 'Laminate general purpose ID cards. Supports horizontal, vertical, and split mode.',
            icon: FileBadge,
            color: 'bg-blue-500',
        },
        {
            id: 'tools/kathir-id',
            name: 'Kathir ID Resizer',
            description: 'Quickly resize and layout Kathir IDs for standard print size.',
            icon: Maximize,
            color: 'bg-indigo-500',
        },
        {
            id: 'tools/uhid-card',
            name: 'UHID Card Resizer',
            description: 'Process and layout UHID cards in a 2x5 grid on A4 for bulk printing.',
            icon: Grid2X2,
            color: 'bg-violet-500',
        },
        {
            id: 'tools/rc-book',
            name: 'RC Book Lamination',
            description: 'Laminate RC Books with dedicated front and back zones, and easy cropping.',
            icon: Book,
            color: 'bg-purple-500',
        },
        {
            id: 'tools/eaadhaar',
            name: 'E-Aadhaar Lamination',
            description: 'Extract and precisely crop the bottom section of an E-Aadhaar PDF.',
            icon: CreditCard,
            color: 'bg-fuchsia-500',
        },
        {
            id: 'tools/driving-licence',
            name: 'Driving Licence Tool',
            description: 'Process 2-page driving licence PDFs with auto-cropping and strict sizing.',
            icon: Car,
            color: 'bg-pink-500',
        },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Lamination & ID Tools</h1>
                <p className="text-gray-600">
                    All processing is client-side only — your files never leave this device.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool) => {
                    const Icon = tool.icon
                    return (
                        <div key={tool.id} className="card hover:shadow-lg transition-all duration-200 group flex flex-col h-full">
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${tool.color}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">{tool.name}</h2>
                            </div>
                            <p className="text-gray-600 mb-6 flex-1">{tool.description}</p>
                            <button
                                onClick={() => onNavigate(tool.id)}
                                className="w-full btn-secondary group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200 transition-colors"
                            >
                                Open Tool
                            </button>
                        </div>
                    )
                })}
            </div>

            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-amber-800">
                <span className="text-xl">🔒</span>
                <p className="text-sm font-medium">
                    Security Notice: All image and PDF processing runs entirely in your browser. No files are uploaded to any server.
                </p>
            </div>
        </div>
    )
}
