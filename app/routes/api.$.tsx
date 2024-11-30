import { Spiceflow } from 'spiceflow'
import fs from 'fs'

import { z } from 'zod'
import { env } from '~/lib/env'
import { generateTikTokScripts } from '~/lib/llm'
import {
    combineVideos,
    getVideosForKeywords,
    isTruthy,
    sleep,
    uploadImage as uploadFile,
} from '~/lib/utils'

const GenerateRequest = z.object({
    pdfText: z.string(),
    description: z.string(),
    avatar: z.string(),
})

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

export const app = new Spiceflow({ basePath: '/api' }).post(
    '/generate',
    async function* ({ request }) {
        const body = await request.json()

        const numVideos = 1
        const scriptsStream = await generateTikTokScripts({
            lawText: body.pdfText,
            description: body.description,
            numItems: numVideos,
        })

        type Item = ArrayItem<ExtractGeneratorType<typeof scriptsStream>> & {
            bgUrl?: string
            videoId?: string
            status?: string
            url?: string
            videos?: Array<{
                url: string
                thumbnailUrl: string
                filePath: string | null
            }>
        }
        let videoScripts: Item[] = []
        for await (const scripts of scriptsStream) {
            videoScripts = scripts
            yield { videoScripts: videoScripts }
        }

        // Get background videos for each item's keywords
        for (const item of videoScripts) {
            const result = await getVideosForKeywords({
                keywords: item.keywords,
            })

            // Store video paths
            item.videos = result.videos
            yield { videoScripts: videoScripts }
        }

        // Get background videos for each item's keywords
        for (const item of videoScripts) {
            const res = await combineVideos({
                videoPaths: item
                    .videos!.map((video) => video!.filePath!)
                    .filter(isTruthy),
                segmentDurationSeconds: 2,
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
            yield { videoScripts: videoScripts }
        }

        // Generate all videos in parallel

        for (const item of videoScripts) {
            const video = await generateVideo({
                title: item.title,
                script: item.script,
                bgUrl: item.bgUrl,
            })
            item.videoId = video.video_id
            item.status = video.status
        }
        // Poll for video status updates until all are complete
        while (videoScripts.some((item) => !item.url)) {
            await sleep(1000 * 5)

            await Promise.all(
                videoScripts
                    .filter((item) => !item?.url && item?.videoId)
                    .map(async (item) => {
                        const result = await getVideoStatus(item.videoId!)
                        if (result?.url) {
                            item.url = result.url
                        }
                        return result
                    }),
            )

            yield { videoScripts }
        }
        yield { videoScripts }

        // Return final state with generated videos
    },
    {
        body: GenerateRequest,
        // response: GenerateResponse,
    },
)

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

export type App = typeof app

export const action = async ({ request }: { request: Request }) => {
    return app.handle(request)
}

export const loader = async ({ request }: { request: Request }) => {
    return app.handle(request)
}

type ExtractGeneratorType<T> = T extends AsyncGenerator<infer U> ? U : never

type ArrayItem<T> = T extends (infer U)[] ? U : never
