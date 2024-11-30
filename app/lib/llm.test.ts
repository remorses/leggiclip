import { describe, it, expect } from 'vitest'
import { defaultLawText, generateTikTokScripts, generateVideosHandler } from './llm'

describe('generateVideosHandler', () => {
    it(
        'generates videos from text',
        async () => {
            const generator = await generateVideosHandler({
                pdfText: defaultLawText,
                description: 'Speed limit laws and safety',
                avatar: 'male',
                numItems: 1,
            })

            for await (const result of generator) {
                expect(Array.isArray(result.videos)).toBe(true)
                console.log(
                    'Current videos state:',
                    JSON.stringify(result.videos, null, 2),
                )
            }
        },
        1000 * 60 * 5,
    ) // 5 minute timeout
})

describe(
    'generateTikTokScript',
    () => {
        it('generates TikTok script from law text', async () => {
            const lawText = `
            Section 123 - Speed Limits
            (1) No person shall drive a vehicle on a highway at a speed greater than is reasonable and prudent under the conditions.
            (2) Where no special hazard exists the following speeds shall be lawful:
                (a) 25 miles per hour in any business or residential district
                (b) 55 miles per hour in other locations
            (3) The driver shall decrease speed when approaching intersections, railroad crossings, curves, or hazardous conditions.
        `

            const result = await generateTikTokScripts({
                lawText,
                numItems: 2,
                description: 'Explain speed limit laws in a fun way',
            })
            for await (const data of result) {
                console.log('Generated scripts:', data)
                expect(data).toBeInstanceOf(Array)
                // expect(data[0]).toHaveProperty('title')
                // expect(data[0]).toHaveProperty('keywords')
                // expect(data[0]).toHaveProperty('script')
            }
        })
    },
    1000 * 100,
)
