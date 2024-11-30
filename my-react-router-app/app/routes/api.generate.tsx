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
            text?: string
            asset_id?: string | null
            fit?: string
        }
    }
>

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

        const body = parseResult.data
        const template_id = body.template_id || '5910f0667387494fa248fb48e3625d25'
        const script = body.script
        const variables: Variables = {
            script: {
                name: 'script',
                type: 'text',
                properties: {
                    text: script,
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
                    title: body.title || 'New Video',
                    variables,
                }),
            },
        )

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`)
        }

        const data = await response.json()
        return json({
            id: data.video_id,
            url: data.video_url,
        })
    } catch (error) {
        console.error('Generation error:', error)
        return json({ error: 'Failed to generate video' }, { status: 500 })
    }
}
