/**
 * Strips the .pdf extension from the filename and returns the base name
 * to be used as a password for encrypted PDFs.
 * e.g., "12345678.pdf" -> "12345678"
 */
export function getPasswordFromFilename(filename: string): string {
    return filename.replace(/\.pdf$/i, '')
}
