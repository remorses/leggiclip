
export function truncateText(text: string, maxChars: number = 4000): string {
    if (text.length <= maxChars) {
        return text
    }

    // Take first maxChars characters, trying to break at a sentence
    let truncated = text.slice(0, maxChars)

    // Try to break at last sentence boundary
    const lastPeriod = truncated.lastIndexOf('.')
    if (lastPeriod > maxChars * 0.8) {
        // Only break at sentence if we don't lose too much text
        truncated = truncated.slice(0, lastPeriod + 1)
    }

    return truncated.trim()
}
