import { describe, it, expect } from 'vitest'
import { defaultLawText, generateVideo, generateVideosHandler } from './llm'
import { generateTikTokScripts } from '~/lib/script'
import { uploadVideoFile } from '~/lib/utils'

import fs from 'fs'

describe('uploadFile', () => {
    it('uploads a file and returns URL', async () => {
        // Create a simple test buffer
        const testContent = await fs.promises.readFile('downloaded-videos/cars-video.mp4')
        const filename = `test-${Date.now()}.mp4`

        const url = await uploadVideoFile({
            content: testContent,
            filename: filename
        })

        expect(url).toBeTruthy()
        expect(typeof url).toBe('string')
        expect(url).toMatch(/^https:\/\//)
        
        console.log('Upload URL:', url)
    })
})


describe('generateVideo heygen', () => {
    it('generates a video with the provided script and background', async () => {
        const result = await generateVideo({
            title: 'Speed Limit Laws: Keeping Our Roads Safe',
            script: 'Sai qual è il limite di alcol nel sangue per guidare in Italia? È 0,5 grammi per litro. Superarlo è un reato grave con multe e sospensione della patente. Se bevi, non guidare - chiama un taxi.',

            bgUrl: 'https://bh6ssk0uvzevsisn.public.blob.vercel-storage.com/combined-1733009490338-LvLjPy0cLkzr36Sf2T0ODJTyJLskl7.mp4',
        })
        console.log('result:', result)

        expect(result).toHaveProperty('video_id')
        // expect(result).toHaveProperty('status')
        expect(typeof result.video_id).toBe('string')
        // expect(typeof result.status).toBe('string')
    })

})


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
            let lastData
            for await (const data of result) {
                console.log('Generated scripts:', data)
                expect(data).toBeInstanceOf(Array)
                lastData = data
            }
            expect(lastData).toMatchInlineSnapshot(`
              [
                {
                  "keywords": [
                    "neighborhood drive",
                    "speed limit sign",
                    "pedestrian safety",
                    "child crossing street",
                    "cyclist on road",
                    "community safety",
                    "responsible driving",
                    "residential area",
                    "safe driving tips",
                    "neighborhood watch",
                  ],
                  "script": "Imagine cruising through a quiet neighborhood, feeling the breeze. Suddenly, a speed limit sign reads 25 mph.

              This isn't just a suggestion; it's a legal requirement to keep everyone safe.

              Here's how to adapt:
              - Business and residential areas have more pedestrians
              - Lower speeds give you more reaction time
              - It's about protecting kids, pets, and cyclists

              Key takeaways:
              - Slower speeds reduce accident severity
              - They enhance community safety
              - They ensure you're a responsible driver

              By respecting these limits, you contribute to a safer, more pleasant neighborhood for everyone.",
                  "title": "Neighborhood Speed Limits: Safety First!",
                },
                {
                  "keywords": [
                    "highway driving",
                    "speedometer close-up",
                    "traffic flow",
                    "stopping distance demonstration",
                    "accident prevention",
                    "highway safety",
                    "smooth traffic",
                    "responsible driving",
                    "road safety tips",
                    "community impact",
                  ],
                  "script": "Picture yourself on a wide-open highway, the speedometer creeping up to 55 mph.

              The law sets this limit for a reason, even when the road seems clear.

              Here's why it matters:
              - Faster speeds increase stopping distance
              - They reduce reaction time
              - They can lead to severe accidents

              Remember these benefits:
              - Following limits prevents fines and accidents
              - It ensures smoother traffic flow
              - It keeps everyone on the road safer

              By sticking to these limits, you help create a safer driving environment for all.",
                  "title": "Highway Speed Limits: Safety in Motion",
                },
              ]
            `)
        })
    },
    1000 * 100,
)
