/**
 * Scans an <img> or data URL on a canvas and returns the tightest
 * bounding box that excludes near-white border pixels.
 * "Near-white" = all RGB channels ≥ 240.
 * @param yStartBias - Number between 0 and 1 indicating the vertical starting point (e.g. 0.6 for 60% down)
 * @returns { x, y, width, height } in pixels, or null if blank
 */
export function findContentBoundingBox(
    imageDataUrl: string,
    yStartBias: number = 0
): Promise<{ x: number; y: number; width: number; height: number } | null> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            
            if (!ctx) {
                return reject(new Error('Could not get canvas context'))
            }

            ctx.drawImage(img, 0, 0)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const data = imageData.data

            let minX = canvas.width
            let minY = canvas.height
            let maxX = -1
            let maxY = -1

            let hasContent = false

            const startY = Math.floor(canvas.height * yStartBias)

            for (let y = startY; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    const i = (y * canvas.width + x) * 4
                    const r = data[i]
                    const g = data[i + 1]
                    const b = data[i + 2]
                    
                    // Alpha = 0 is treated as white/background essentially (for our purposes, or we could check alpha)
                    // If it's NOT near white (all channels >= 240), then it's content
                    if (!(r >= 240 && g >= 240 && b >= 240) && data[i + 3] > 10) {
                        hasContent = true
                        if (x < minX) minX = x
                        if (x > maxX) maxX = x
                        if (y < minY) minY = y
                        if (y > maxY) maxY = y
                    }
                }
            }

            if (!hasContent) {
                resolve(null)
            } else {
                resolve({
                    x: minX,
                    y: minY,
                    width: maxX - minX + 1,
                    height: maxY - minY + 1,
                })
            }
        }
        img.onerror = () => reject(new Error('Failed to load image for cropping'))
        img.src = imageDataUrl
    })
}
