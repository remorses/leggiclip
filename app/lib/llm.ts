import { generateText, streamText } from 'ai'
import fs from 'fs'
import { z } from 'zod'
import { createOpenAI } from '@ai-sdk/openai'
import { extractTagsArrays } from './xml'

import { env, templateId } from '~/lib/env'
import {
    combineVideos,
    getVideosForKeywords,
    isTruthy,
    sleep,
    uploadVideoFile,
} from '~/lib/utils'
import { generateTikTokScripts } from '~/lib/script'

export const GenerateRequest = z.object({
    pdfText: z.string(),
    description: z.string(),
    avatar: z.string(),
    numItems: z.number().optional(),
})
export async function* generateVideosHandler(
    body: z.infer<typeof GenerateRequest>,
    signal?: AbortSignal,
) {
    const numVideos = 1
    
    if (signal?.aborted) return
    
    const scriptsStream = await generateTikTokScripts({
        lawText: body.pdfText || defaultLawText,
        description: body.description,
        numItems: numVideos,
    })

    let videos: VideoItem[] = []
    for await (const scripts of scriptsStream) {
        if (signal?.aborted) return
        videos = scripts
        yield { videos: videos }
    }

    // Get background videos for each item's keywords
    for (const item of videos) {
        if (signal?.aborted) return
        const result = await getVideosForKeywords({
            keywords: item.keywords,
        })

        // Store video paths
        item.bgVideos = result.videos
        yield { videos: videos }
    }

    // Get background videos for each item's keywords
    for (const item of videos) {
        if (signal?.aborted) return
        const res = await combineVideos({
            signal: signal,
            videoPaths: item
                .bgVideos!.map((video) => video!.filePath!)
                .filter(isTruthy),
            segmentDurationSeconds: 3,
        })
        // Upload the combined video
        const fileContent = await fs.promises.readFile(res.outputPath)
        const uploadUrl = await uploadVideoFile({
            content: fileContent,
            filename: `combined-${Date.now()}.mp4`,
        })
        if (!uploadUrl) {
            throw new Error('Failed to upload combined video')
        }
        item.bgUrl = uploadUrl!
        yield { videos: videos }
    }

    // Generate all videos in parallel
    for (const item of videos) {
        if (signal?.aborted) return
        const video = await generateVideo({
            title: item.title,
            script: item.script,
            bgUrl: item.bgUrl,
        })
        item.videoId = video.video_id
        item.status = video.status
    }

    while (videos.some((item) => !item.url)) {
        if (signal?.aborted) return
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
}

export async function getVideoStatus(videoId: string) {
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
        console.log('data:', data)

        return {
            videoStatus: data.status,
            url: data.video_url,
        }
    } catch (error) {
        console.error('Video status fetch error:', error)
        throw error
    }
}

export async function generateVideo({
    title,
    script,

    bgUrl,
}: {
    title?: string
    script: string
    // keywords?: string[]

    bgUrl?: string
}) {
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
            type: 'video',
            properties: {
                url: bgUrl,
                play_style: 'loop',
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
    if (!bgUrl) {
        delete variables.bg
    }

    const response = await fetch(
        `https://api.heygen.com/v2/template/${templateId}/generate`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': env.HEYGEN_API_KEY || '',
            },
            body: JSON.stringify({
                caption: true,
                template_id: templateId,
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
            play_style?: string

            content?: string
            asset_id?: string | null
            fit?: string
        }
    }
>

export type VideoItem = {
    createdAt: number
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
