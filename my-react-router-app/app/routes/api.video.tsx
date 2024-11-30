import type { LoaderFunction } from 'react-router'
import { env } from '~/lib/env'
import { json } from '~/lib/utils'

export const loader: LoaderFunction = async ({ request }) => {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
        return json({ error: 'Video ID is required' }, { status: 400 })
    }

    try {
        const response = await fetch(
            `https://api.heygen.com/v1/video_status.get?video_id=${id}`,
            {
                headers: {
                    accept: 'application/json',
                    'X-Api-Key': env.HEYGEN_API_KEY || '',
                },
            },
        )

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`)
        }

        const data = await response.json()
        return json({
            id: data.video_id,
            url: data.video_url,
            status: data.status,
        })
    } catch (error) {
        console.error('Video status fetch error:', error)
        return json({ error: 'Failed to fetch video status' }, { status: 500 })
    }
}
