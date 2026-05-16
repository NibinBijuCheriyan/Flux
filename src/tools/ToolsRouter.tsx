
import { ToolsHub } from './index'

// We will import the modules here once created
import { MiscIdLamination } from './modules/MiscIdLamination'
import { KathirIdResizer } from './modules/KathirIdResizer'
import { UhidCardResizer } from './modules/UhidCardResizer'
import { RcBookLamination } from './modules/RcBookLamination'
import { EaadhaarLamination } from './modules/EaadhaarLamination'
import { DrivingLicenceTool } from './modules/DrivingLicenceTool'

interface ToolsRouterProps {
    route: string
    onNavigate: (route: string) => void
}

export function ToolsRouter({ route, onNavigate }: ToolsRouterProps) {
    // For now we just route to hub. Modules will be added later.
    switch (route) {
        case 'tools/misc-id':
            return <MiscIdLamination onNavigate={onNavigate} />
        case 'tools/kathir-id':
            return <KathirIdResizer onNavigate={onNavigate} />
        case 'tools/uhid-card':
            return <UhidCardResizer onNavigate={onNavigate} />
        case 'tools/rc-book':
            return <RcBookLamination onNavigate={onNavigate} />
        case 'tools/eaadhaar':
            return <EaadhaarLamination onNavigate={onNavigate} />
        case 'tools/driving-licence':
            return <DrivingLicenceTool onNavigate={onNavigate} />
        case 'tools':
        default:
            return <ToolsHub onNavigate={onNavigate} />
    }
}
