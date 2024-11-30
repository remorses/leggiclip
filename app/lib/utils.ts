import path from 'path'
import { env } from '~/lib/env'

export function json(data: unknown, init?: ResponseInit) {
    return new Response(JSON.stringify(data), {
        ...init,
        headers: {
            ...init?.headers,
            'Content-Type': 'application/json',
        },
    })
}

type VideoFile = {
    file_type: string
    fps: number
    height: number
    id: number
    link: string
    quality: string
    size: number
    width: number
}

type VideoPicture = {
    id: number
    nr: number
    picture: string
}

type Video = {
    avg_color: string | null
    duration: number
    full_res: string | null
    height: number
    id: number
    image: string
    tags: string[]
    url: string
    user: {
        id: number
        name: string
        url: string
    }
    video_files: VideoFile[]
    video_pictures: VideoPicture[]
    width: number
}

type PexelsVideoResponse = {
    next_page: string
    page: number
    per_page: number
    total_results: number
    url: string
    videos: Video[]
}
export async function getUnsplashVideo(
    keyword: string,
): Promise<(PexelsVideoResponse & { bestResultUrl: string }) | null> {
    try {
        const response = await fetch(
            `https://api.pexels.com/v1/videos/search?query=${encodeURIComponent(keyword)}&orientation=portrait&per_page=1`,
            {
                headers: {
                    Authorization: env.PEXELS_API_KEY || '',
                },
            },
        )

        if (!response.ok) {
            throw new Error(`Pexels API request failed: ${response.statusText}`)
        }

        const data: PexelsVideoResponse = await response.json()

        // Find best quality HD video with good fps
        let bestResultUrl = ''
        if (data.videos?.[0]?.video_files) {
            const hdVideos = data.videos[0].video_files.filter(
                (file) => file.quality === 'hd' && file.fps >= 10,
            )
            if (hdVideos.length > 0) {
                bestResultUrl = hdVideos[0].link
            }
        }

        return {
            ...data,
            bestResultUrl,
        }
    } catch (error) {
        console.error('Error fetching Pexels photo:', error)
        return null
    }
}

// bashupload.com is a free service to upload files temporarily, they are deleted after 3 days
export async function uploadImage(fileContent: ArrayBuffer, fileName = 'file.pm4') {
    console.time('uploadImage')
    console.log('Uploading file to bashupload.com:', fileName)
    try {
        const formData = new FormData()
        formData.append('file', new Blob([fileContent]), fileName)

        const response = await fetch('https://bashupload.com', {
            method: 'POST',
            body: formData,
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const responseText = await response.text()
        const match = responseText.trim().match(/https:\/\/[^\s]+/)
        console.timeEnd('uploadImage')
        return match ? match[0] + '?download=1' : ''
    } catch (error) {
        console.error('Error uploading file:', error)
        console.timeEnd('uploadImage')
        return null
    }
}
