import { describe, it, expect } from 'vitest'
import { defaultLawText, generateVideo, generateVideosHandler } from './llm'
import { generateTikTokScripts } from '~/lib/script'
import { uploadVideoFile } from '~/lib/utils'

import fs from 'fs'

describe('uploadFile', () => {
    it('uploads a file and returns URL', async () => {
        // Create a simple test buffer
        const testContent = await fs.promises.readFile(
            'downloaded-videos/cars-video.mp4',
        )
        const filename = `test-${Date.now()}.mp4`

        const url = await uploadVideoFile({
            content: testContent,
            filename: filename,
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
            title: 'Limiti di Velocità in Autostrada: Cosa Devi Sapere',
            script: `Quali sono i veri rischi del superamento dei limiti in autostrada?

Un'analisi delle conseguenze più serie:
- Aumento esponenziale dello spazio di frenata
- Riduzione del tempo di reazione disponibile
- Maggiore consumo di carburante

La legge stabilisce regole precise:
- 130 km/h il limite massimo in condizioni ottimali
- 110 km/h con pioggia o neve
- 90 km/h per i neopatentati

Ricorda: i limiti esistono per proteggere tutti gli utenti della strada.`,

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
                numVideos: 1,
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
    'generateTikTokScripts',
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
                  "createdAt": 1733059052.277,
                  "keywords": [
                    "residential area",
                    "speed limit",
                    "children playing",
                    "safe driving",
                    "weather conditions",
                    "neighborhood",
                    "traffic signs",
                    "road safety",
                  ],
                  "language": "italian",
                  "script": "Qual è la velocità giusta in una zona residenziale?

              Immagina di guidare in un quartiere tranquillo. Qual è la velocità giusta? La legge dice venticinque miglia all'ora, ma c'è di più!

              La velocità deve essere ragionevole e prudente. Se ci sono bambini che giocano o condizioni meteo avverse, rallenta ancora di più. La sicurezza prima di tutto!",
                  "title": "Qual è la velocità giusta in una zona residenziale?",
                },
                {
                  "createdAt": 1733059052.277,
                  "keywords": [
                    "intersection",
                    "curve",
                    "speed reduction",
                    "hazardous conditions",
                    "driving safety",
                    "traffic rules",
                    "cautious driving",
                    "accident prevention",
                  ],
                  "language": "italian",
                  "script": "Come adattare la velocità in situazioni pericolose?

              Stai guidando e ti avvicini a un incrocio o una curva. Cosa fai? La legge dice di ridurre la velocità. Ma perché?

              È una questione di sicurezza. Le condizioni pericolose richiedono attenzione extra. Ridurre la velocità ti dà più tempo per reagire e prevenire incidenti. Guida con prudenza!",
                  "title": "Come adattare la velocità in situazioni pericolose?",
                },
              ]
            `)
        })
    },
    1000 * 100,
)
