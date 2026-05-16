import { jsPDF } from 'jspdf'

export const A4_W_MM = 210
export const A4_H_MM = 297

/**
 * Horizontal ID card sizing rule:
 * - Force width = 9 cm per side.
 * - Calculate natural-aspect height.
 * - If height <= 5.7 cm → keep it.
 * - If 5.7 cm < height <= 6.0 cm → clamp to exactly 5.7 cm.
 * - If height > 6.0 cm → throw an error (card too tall).
 */
export function calcHorizontalCardSize(
    naturalPxW: number,
    naturalPxH: number
): { widthMm: number; heightMm: number } {
    const targetWidthMm = 90
    const aspect = naturalPxH / naturalPxW
    const targetHeightMm = targetWidthMm * aspect

    if (targetHeightMm <= 57) {
        return { widthMm: targetWidthMm, heightMm: targetHeightMm }
    } else if (targetHeightMm > 57 && targetHeightMm <= 60) {
        return { widthMm: targetWidthMm, heightMm: 57 }
    } else {
        throw new Error(`Card height is too tall (${(targetHeightMm / 10).toFixed(2)} cm) for a 9 cm width. Please crop it further.`)
    }
}

/**
 * Same logic but for vertical orientation. Width/height
 * rules are the same; caller must rotate the jsPDF canvas ±90°.
 */
export function calcVerticalCardSize(
    naturalPxW: number,
    naturalPxH: number
): { widthMm: number; heightMm: number } {
    // For vertical, we treat the height as the width for calculation purposes
    // because the image will be rotated 90 degrees.
    return calcHorizontalCardSize(naturalPxH, naturalPxW)
}

/**
 * Places one processed ID card row (front + back side-by-side)
 * onto a jsPDF doc at the given Y offset.
 * Draws a 0.2pt black border if hasBorder = true.
 * Returns the new Y cursor (yOffset + rowHeightMm).
 */
export function placeIdCardRow(
    doc: jsPDF,
    frontDataUrl: string | null,
    backDataUrl: string | null,
    yOffsetMm: number,
    cardSizeMm: { widthMm: number; heightMm: number },
    hasBorder: boolean,
    orientation: 'horizontal' | 'vertical'
): number {
    const { widthMm, heightMm } = cardSizeMm
    const totalWidth = widthMm * 2
    const startX = (A4_W_MM - totalWidth) / 2

    const drawSide = (dataUrl: string, xPos: number) => {
        if (orientation === 'horizontal') {
            doc.addImage(dataUrl, 'PNG', xPos, yOffsetMm, widthMm, heightMm)
            if (hasBorder) {
                doc.setLineWidth(0.2 * 0.352778) // 0.2pt
                doc.setDrawColor(0, 0, 0)
                doc.rect(xPos, yOffsetMm, widthMm, heightMm)
            }
        } else {
            // Vertical orientation: The image's native orientation is vertical,
            // but we need to fit it into a horizontal slot of `widthMm` x `heightMm`
            // by rotating it -90 degrees (or +90). 
            // `widthMm` is 90, `heightMm` is ~57.
            // When drawing, the image natural size mapped to paper should be height=90, width=57.
            const drawW = heightMm
            const drawH = widthMm

            // To rotate around its center, we can use matrix transformations.
            const cx = xPos + widthMm / 2
            const cy = yOffsetMm + heightMm / 2

            doc.saveGraphicsState()
            
            // Move origin to center of where we want to draw
            // @ts-ignore
            doc.setCurrentTransformationMatrix({ a: 1, b: 0, c: 0, d: 1, e: cx, f: cy })
            // Rotate -90 degrees (-PI/2)
            const angle = -Math.PI / 2
            const cos = Math.cos(angle)
            const sin = Math.sin(angle)
            // @ts-ignore
            doc.setCurrentTransformationMatrix({ a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 })
            
            // Draw image centered at the new origin
            // Since it's rotated -90, its width matches `drawW` and height matches `drawH`.
            // Center is (-drawW/2, -drawH/2)
            doc.addImage(dataUrl, 'PNG', -drawW / 2, -drawH / 2, drawW, drawH)
            
            doc.restoreGraphicsState()

            if (hasBorder) {
                doc.setLineWidth(0.2 * 0.352778)
                doc.setDrawColor(0, 0, 0)
                doc.rect(xPos, yOffsetMm, widthMm, heightMm)
            }
        }
    }

    if (frontDataUrl) {
        drawSide(frontDataUrl, startX)
    }
    
    if (backDataUrl) {
        drawSide(backDataUrl, startX + widthMm)
    }

    return yOffsetMm + heightMm
}
