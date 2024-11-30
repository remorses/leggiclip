import { describe, it, expect } from 'vitest'
import { generateTikTokScript } from './llm'

describe('generateTikTokScript', () => {
    it('generates TikTok script from law text', async () => {
        const lawText = `
            Section 123 - Speed Limits
            (1) No person shall drive a vehicle on a highway at a speed greater than is reasonable and prudent under the conditions.
            (2) Where no special hazard exists the following speeds shall be lawful:
                (a) 25 miles per hour in any business or residential district
                (b) 55 miles per hour in other locations
            (3) The driver shall decrease speed when approaching intersections, railroad crossings, curves, or hazardous conditions.
        `

        const result = await generateTikTokScript({
            lawText,
            description: 'Explain speed limit laws in a fun way',
        })

        console.log('Generated TikTok script:', result)
        expect(result).toHaveProperty('title')
        expect(result).toHaveProperty('keywords')
        expect(result).toHaveProperty('script')

        expect(typeof result.title).toBe('string')
        expect(result.title.length).toBeGreaterThan(0)

        expect(Array.isArray(result.keywords)).toBe(true)
        expect(result.keywords.length).toBeGreaterThan(0)

        expect(typeof result.script).toBe('string')
        expect(result.script.length).toBeGreaterThan(0)

        // Copy script to clipboard
        const { execSync } = require('child_process')
        execSync('pbcopy', { input: result.script })
        console.log('Script copied to clipboard')
    })
})

