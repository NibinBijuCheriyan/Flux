import * as pdfjsLib from 'pdfjs-dist'

// Singleton worker initialization
let workerInitialized = false

/**
 * Renders a single PDF page to a base64 data URL using pdfjs-dist.
 * @param file       - Raw File object (must be application/pdf)
 * @param pageNumber - 1-indexed page number to render
 * @param scale      - Render scale (default 3.0 → ~216 DPI at 72dpi base)
 * @param password   - Optional password for encrypted PDFs
 * @returns          { dataUrl: string, totalPages: number }
 */
export async function pdfPageToDataUrl(
    file: File,
    pageNumber: number,
    scale = 3.0,
    password?: string
): Promise<{ dataUrl: string; totalPages: number }> {
    if (!workerInitialized) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url
        ).toString()
        workerInitialized = true
    }

    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        password,
    })

    const pdf = await loadingTask.promise
    const totalPages = pdf.numPages

    if (pageNumber < 1 || pageNumber > totalPages) {
        throw new Error(`Requested page ${pageNumber} out of bounds (1-${totalPages})`)
    }

    const page = await pdf.getPage(pageNumber)
    const viewport = page.getViewport({ scale })

    let canvas: HTMLCanvasElement | OffscreenCanvas
    let context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null

    if (typeof OffscreenCanvas !== 'undefined') {
        canvas = new OffscreenCanvas(viewport.width, viewport.height)
        context = canvas.getContext('2d', { alpha: false })
    } else {
        canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        context = canvas.getContext('2d', { alpha: false })
    }

    if (!context) {
        throw new Error('Could not get canvas context')
    }

    // Fill background with white because PDF background can be transparent
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, viewport.width, viewport.height)

    const renderContext = {
        canvasContext: context as any,
        viewport,
    }

    // @ts-ignore - pdfjs-dist types can be inconsistent across versions
    await page.render(renderContext).promise

    let dataUrl: string

    if (canvas instanceof OffscreenCanvas) {
        const blob = await canvas.convertToBlob({ type: 'image/png' })
        dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
        })
    } else {
        dataUrl = canvas.toDataURL('image/png')
    }

    // Free memory
    page.cleanup()

    return { dataUrl, totalPages }
}
