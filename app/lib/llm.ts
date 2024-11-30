import { generateText, streamText } from 'ai'
import fs from 'fs'
import { z } from 'zod'
import { createOpenAI } from '@ai-sdk/openai'
import { extractTagsArrays } from './xml'

import { env } from '~/lib/env'
import {
    combineVideos,
    getVideosForKeywords,
    isTruthy,
    sleep,
    uploadFile,
} from '~/lib/utils'

const openai = createOpenAI({
    apiKey: process.env.OPENAI_KEY,
})

export async function* generateTikTokScripts({
    lawText,
    description,
    numItems = 1,
}: {
    lawText: string
    description: string
    numItems?: number
}) {
    const prompt = `Analyze the law text and generate ${numItems} distinct TikTok video scripts. First, identify the key themes and aspects of: ${description}

Law text:
<law_text>
${lawText}
</law_text>

First, explain your reasoning about what distinct aspects of the law each video should cover and why they would make engaging content.

Then, provide exactly ${numItems} sets of responses in XML format, each set containing these tags in order:
<video_script>The actual TikTok script with intro and outro. This should be written in a friendly influencer style.</video_script>
<keywords>Provide at least 10 comma-separated search terms for background videos that match the timeline of your script. Each term will be used to find a video clip that plays during that part of the script. For example, if your script talks about "driving in rain" followed by "school zones", include those exact terms in that order.</keywords>
<title>An engaging video title</title>

Make each script friendly and use typical influencer style. Include a catchy intro like "Hey TikTok!" and an engaging outro like "Don't forget to follow for more legal tips!"

Do not output markdown, just XML. Separate each set with a newline.

Here is an example output for one set:
<video_script>Hey TikTok! Your favorite legal bestie here with some CRAZY speed limit facts you need to know! 🤯

Did you know that speed limits aren't just random numbers? They're actually based on safety studies and road conditions! Mind = blown, right?

Let me break it down for you:
- 25 mph in neighborhoods (protect those kiddos!)
- 55 mph on regular roads (keep it steady!)
- And ALWAYS slow down for curves and bad weather (duh!)

The tea is: you can actually get a ticket even if you're going the speed limit... if conditions are dangerous! 😱

Stay safe out there besties! Don't forget to follow for more legal tips that could literally save your life! ✨ #LegalTok #DrivingSafety #RoadRules</video_script>
<keywords>influencer talking to camera, traffic safety studies chart, residential street with houses, highway traffic flowing, dangerous curve road sign, stormy weather driving, police officer giving ticket, social media follow button</keywords>
<title>5 Speed Limit Facts That Could Save Your Life! 🚗💨</title>`

    let items: Array<{
        title: string
        keywords: string[]
        script: string
    }> = []

    const stream = streamText({
        model: openai('gpt-4o'),
        system: 'You are a charismatic TikTok influencer who explains laws in a fun and engaging way.',
        prompt,
    })
    let lastYieldTime = 0
    let allText = ''
    for await (const chunk of stream.textStream) {
        const now = Date.now()
        allText += chunk

        const result = extractTagsArrays({
            xml: allText,
            tags: ['title', 'keywords', 'video_script'],
        })

        // Update items with any new complete sets
        const newItems = result.title.map((title, i) => ({
            title,
            keywords: result.keywords[i]?.split(',').map((k) => k.trim()) || [],
            script: result.video_script[i] || '',
        }))

        items = newItems
        if (now - lastYieldTime < 1000) {
            continue
        }

        // Yield current state of items at most once per second

        yield items
        lastYieldTime = now
    }

    // Make sure to yield final state
    yield items

    // return items
}

export const GenerateRequest = z.object({
    pdfText: z.string(),
    description: z.string(),
    avatar: z.string(),
    numItems: z.number().optional(),
})

export async function* generateVideosHandler(
    body: z.infer<typeof GenerateRequest>,
) {
    const numVideos = 1
    const scriptsStream = await generateTikTokScripts({
        lawText: body.pdfText || defaultLawText,
        description: body.description,
        numItems: numVideos,
    })

    let videos: VideoItem[] = []
    for await (const scripts of scriptsStream) {
        videos = scripts
        yield { videos: videos }
    }

    // Get background videos for each item's keywords
    for (const item of videos) {
        const result = await getVideosForKeywords({
            keywords: item.keywords,
        })

        // Store video paths
        item.bgVideos = result.videos
        yield { videos: videos }
    }

    // Get background videos for each item's keywords
    for (const item of videos) {
        const res = await combineVideos({
            videoPaths: item
                .bgVideos!.map((video) => video!.filePath!)
                .filter(isTruthy),
            segmentDurationSeconds: 3,
        })
        // Upload the combined video
        const fileContent = await fs.promises.readFile(res.outputPath)
        const uploadUrl = await uploadFile(
            fileContent,
            `combined-${Date.now()}.mp4`,
        )
        if (!uploadUrl) {
            throw new Error('Failed to upload combined video')
        }
        item.bgUrl = uploadUrl!
        yield { videos: videos }
    }

    // Generate all videos in parallel
    return

    for (const item of videos) {
        const video = await generateVideo({
            title: item.title,
            script: item.script,
            bgUrl: item.bgUrl,
        })
        item.videoId = video.video_id
        item.status = video.status
    }

    while (videos.some((item) => !item.url)) {
        await sleep(1000 * 5)

        await Promise.all(
            videos
                .filter((item) => !item?.url && item?.videoId)
                .map(async (item) => {
                    const result = await getVideoStatus(item.videoId!)
                    if (result?.url) {
                        item.url = result.url
                    }
                    return result
                }),
        )

        yield { videos }
    }
    yield { videos }

    // Return final state with generated videos
}

async function getVideoStatus(videoId: string) {
    try {
        const response = await fetch(
            `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
            {
                headers: {
                    accept: 'application/json',
                    'X-Api-Key': env.HEYGEN_API_KEY || '',
                },
            },
        )

        if (!response.ok) {
            const text = await response.text()
            throw new Error(
                `API request failed: ${response.statusText} - ${text}`,
            )
        }

        const data_ = await response.json()
        const data = data_?.data

        return {
            videoStatus: data.status,
            url: data.video_url,
        }
    } catch (error) {
        console.error('Video status fetch error:', error)
        throw error
    }
}

async function generateVideo({
    title,
    script,

    bgUrl = 'https://files2.heygen.ai/prod/movio/preset/image/origin/28e0c75a51624ee89d3c4a1eb044ef2c.jpg',
}: {
    title?: string
    script: string
    // keywords?: string[]
    bgUrl?: string
}) {
    const template_id = '3d88fbeeccd84c1193d4009bf11eb5f1'
    const variables: Variables = {
        title: {
            name: 'title',
            type: 'text',
            properties: {
                content: title || 'New Video',
            },
        },
        bg: {
            name: 'bg',
            type: 'image',
            properties: {
                url: bgUrl,
                fit: 'cover',
            },
        },
        script_it: {
            name: 'script_it',
            type: 'text',
            properties: {
                content: script,
            },
        },
    }

    const response = await fetch(
        `https://api.heygen.com/v2/template/${template_id}/generate`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': env.HEYGEN_API_KEY || '',
            },
            body: JSON.stringify({
                caption: true,
                template_id,
                title: title || 'New Video Title',
                variables,
            }),
        },
    )

    if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`)
    }

    const data = await response.json()
    if (data.error) {
        throw new Error(data.error)
    }
    return data.data as {
        video_id: string
        status: string
    }
    // return data
}

type ExtractGeneratorType<T> = T extends AsyncGenerator<infer U> ? U : never

type ArrayItem<T> = T extends (infer U)[] ? U : never

type Variables = Record<
    string,
    {
        name: string
        type: string
        properties: {
            url?: string
            content?: string
            asset_id?: string | null
            fit?: string
        }
    }
>

export type VideoItem = {
    keywords: string[]
    title: string
    script: string
    bgUrl?: string
    videoId?: string
    status?: string
    url?: string
    bgVideos?: Array<{
        url: string
        thumbnailUrl: string
        filePath: string | null
    }>
}

export const defaultLawText = `Articolo 1 - Principi generali del Codice della Strada
1. La sicurezza delle persone, nella circolazione stradale, è un obiettivo primario dello Stato.
2. La circolazione dei veicoli, dei pedoni e degli animali sulle strade è regolata dalle norme del presente codice.

Articolo 2 - Definizione e classificazione delle strade
1. Ai fini dell'applicazione delle norme del presente codice si definisce "strada" l'area ad uso pubblico destinata alla circolazione dei pedoni, dei veicoli e degli animali.
2. Le strade sono classificate, riguardo alle loro caratteristiche costruttive, tecniche e funzionali, nei seguenti tipi:
A - Autostrade
B - Strade extraurbane principali
C - Strade extraurbane secondarie
D - Strade urbane di scorrimento
E - Strade urbane di quartiere
F - Strade locali

Articolo 3 - Regole generali di comportamento
1. Gli utenti della strada devono comportarsi in modo da non costituire pericolo o intralcio per la circolazione.
2. I conducenti devono essere in grado di compiere tutte le manovre necessarie in condizioni di sicurezza.

Articolo 4 - Limiti di velocità
1. Ai fini della sicurezza della circolazione e della tutela della vita umana, la velocità massima non può superare i 130 km/h per le autostrade.
2. Il limite di velocità massimo da non superare è di:
- 110 km/h per le strade extraurbane principali
- 90 km/h per le strade extraurbane secondarie
- 50 km/h per le strade urbane`
