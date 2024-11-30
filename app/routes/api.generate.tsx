import type { ActionFunction } from 'react-router'
import { env } from '~/lib/env'
import { json } from '~/lib/utils'

import { z } from 'zod'

const GenerateRequest = z.object({
    template_id: z.string().optional(),
    title: z.string().optional(),
    script: z.string(),
    keywords: z.array(z.string()).optional(),
})

type GenerateRequest = z.infer<typeof GenerateRequest>

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

export const loader = async () => {
    return json({ error: 'Method not allowed - use POST' }, { status: 405 })
}

export const action: ActionFunction = async ({ request }) => {
    if (request.method !== 'POST') {
        return json({ error: 'Method not allowed' }, { status: 405 })
    }

    try {
        const rawBody = await request.json()
        const parseResult = GenerateRequest.safeParse(rawBody)

        if (!parseResult.success) {
            return json(
                {
                    error: 'Invalid request body',
                    details: parseResult.error.errors,
                },
                { status: 400 },
            )
        }
        console.log(parseResult.data)

        const body = parseResult.data
        const template_id = '3d88fbeeccd84c1193d4009bf11eb5f1'
        const script = body.script
        const variables: Variables = {
            // title: {
            //     name: 'title',
            //     type: 'text',
            //     properties: {
            //         content: body.title || 'New Video',
            //     },
            // },
            script_it: {
                name: 'script_it',
                type: 'text',
                properties: {
                    content: script,
                },
            },
        }
        // console.log('HEYGEN_API_KEY',env.HEYGEN_API_KEY)
        const response = await fetch(
            `https://api.heygen.com/v2/template/${template_id}/generate`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': env.HEYGEN_API_KEY || '',
                },
                body: JSON.stringify({
                    // caption: true,
                    // test: true,
                    template_id,
                    title: body.title || 'New Video Title',
                    // dimension: { width: 405, height: 720 },
                    // aspect_ratio: null,
                    variables,
                }),
            },
        )

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`)
        }

        const data = await response.json()
        console.log(data)
        return json({
            ...data?.data,
            id: data.video_id,
            url: data.video_url,
        })
    } catch (error) {
        console.error('Generation error:', error)
        return json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'An unknown error occurred',
            },
            { status: 500 },
        )
    }
}
