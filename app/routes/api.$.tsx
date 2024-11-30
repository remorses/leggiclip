import { Spiceflow } from 'spiceflow'
import { z } from 'zod'
import { env } from '~/lib/env'

const GenerateRequest = z.object({
    template_id: z.string().optional(),
    title: z.string().optional(),
    script: z.string(),
    keywords: z.array(z.string()).optional(),
})

const GenerateResponse = z.object({
    id: z.string(),
    url: z.string(),
    data: z.record(z.any()).optional(),
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
        const template_id = '3d88fbeeccd84c1193d4009bf11eb5f1'
        const variables: Variables = {
            title: {
                name: 'title',
                type: 'text',
                properties: {
                    content: body.title || 'New Video',
                },
            },
            bg: {
                name: 'bg',
                type: 'image',
                properties: {
                    url: 'https://files2.heygen.ai/prod/movio/preset/image/origin/28e0c75a51624ee89d3c4a1eb044ef2c.jpg',
                    fit: 'cover',
                },
            },
            script_it: {
                name: 'script_it',
                type: 'text',
                properties: {
                    content: body.script,
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
                    title: body.title || 'New Video Title',
                    variables,
                }),
            },
        )

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`)
        }

        const data = await response.json()
        return {
            ...data?.data,
            id: data.video_id,
            url: data.video_url,
        }
    },
    {
        body: GenerateRequest,
        // response: GenerateResponse,
    },
)

export type App = typeof app

export const action = async ({ request }: { request: Request }) => {
    return app.handle(request)
}

export const loader = async ({ request }: { request: Request }) => {
    return app.handle(request)
}
