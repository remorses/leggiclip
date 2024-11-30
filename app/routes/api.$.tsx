import { Spiceflow } from 'spiceflow'
import { z } from 'zod'
import { env } from '~/lib/env'
import { generateTikTokScripts } from '~/lib/llm'

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
            videos?: string[]
        }
        let items: Item[] = []
        for await (const scripts of scriptsStream) {
            items = scripts
            yield { videoScripts: items }
        }

        // Generate all videos in parallel
        const videos = await Promise.all(
            items.map((item) =>
                generateVideo({
                    title: item.title,
                    script: item.script,
                    bgUrl: item.bgUrl,
                }),
            ),
        )
        yield { videos }

        // Return final state with generated videos
        return { videoScripts: items, videos }
    },
    {
        body: GenerateRequest,
        // response: GenerateResponse,
    },
)

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
