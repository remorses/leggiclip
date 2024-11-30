import { spawn } from 'child_process'
import fs from 'fs'

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
export async function getUnsplashVideo(keyword: string) {
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
        let thumbnailUrl = ''
        if (data.videos?.[0]?.video_files) {
            thumbnailUrl = data.videos[0].image
            const hdVideos = data.videos[0].video_files.filter(
                (file) => file.quality === 'hd' && file.fps >= 10,
            )
            if (hdVideos.length > 0) {
                bestResultUrl = hdVideos[0].link
            }
        }

        return {
            ...data,
            thumbnailUrl,
            bestResultUrl,
        }
    } catch (error) {
        console.error('Error fetching Pexels photo:', error)
        return null
    }
}

export async function combineVideos({
    videoPaths,
    segmentDurationSeconds = 3,
}: {
    videoPaths: string[]
    segmentDurationSeconds?: number
}): Promise<{ outputPath: string }> {
    return new Promise((resolve, reject) => {
        const outputDir = 'output-videos'
        fs.mkdirSync(outputDir, { recursive: true })
        const outputPath = `${outputDir}/output-${Date.now()}.mp4`

        // Create a temporary file list
        const fileList = videoPaths
            .map((path, index) => {
                // For each input, specify inpoint and outpoint for duration
                return `file '${path}'\ninpoint 0\noutpoint ${segmentDurationSeconds}`
            })
            .join('\n')
        const listPath = `list-${Date.now()}.txt`
        fs.writeFileSync(listPath, fileList)

        // Use concat demuxer with segment duration limits and reencode
        const command = `ffmpeg -f concat -safe 0 -i "${listPath}" -c:v libx264 -c:a aac "${outputPath}"`

        const ffmpeg = spawn(command, { shell: true, stdio: 'inherit' })

        ffmpeg.on('close', (code) => {
            // Clean up the temporary file list
            fs.unlinkSync(listPath)

            if (code === 0) {
                resolve({ outputPath })
            } else {
                reject(new Error(`ffmpeg process exited with code ${code}`))
            }
        })

        ffmpeg.on('error', (error) => {
            // Clean up the temporary file list on error too
            fs.unlinkSync(listPath)
            reject(error)
        })
    })
}

export async function getVideosForKeywords({
    keywords,
}: {
    keywords: string[]
}) {
    const results = await Promise.all(
        keywords.map(async (keyword) => {
            try {
                // Get video from Pexels
                const pexelsResult = await getUnsplashVideo(keyword)
                if (!pexelsResult?.bestResultUrl) {
                    console.warn(`No video found for keyword: ${keyword}`)
                    return {
                        keyword,
                        filePath: null,
                    }
                }

                // Download the video
                const videoResponse = await fetch(pexelsResult.bestResultUrl)
                if (!videoResponse.ok) {
                    console.warn(
                        `Failed to download video for keyword: ${keyword}`,
                    )
                    return {
                        keyword,
                        filePath: null,
                    }
                }

                // Get video content as buffer
                const videoBuffer = Buffer.from(
                    await videoResponse.arrayBuffer(),
                )
                // Write video to disk
                const folderPath = 'downloaded-videos'
                await fs.promises.mkdir(folderPath, { recursive: true })
                const filePath = path.join(folderPath, `${keyword}-video.mp4`)
                await fs.promises.writeFile(filePath, videoBuffer)
                return {
                    keyword,
                    filePath,
                    url: pexelsResult.bestResultUrl,
                    thumbnailUrl: pexelsResult.thumbnailUrl,
                }
            } catch (error) {
                console.error(
                    `Error processing video for keyword "${keyword}":`,
                    error,
                )
                return
            }
        }),
    )

    return {
        videos: results.filter(isTruthy).filter((result) => result?.filePath !== null),
    }
}

export function isTruthy<T>(value: T | null | undefined | false): value is T {
    return Boolean(value)
}


// bashupload.com is a free service to upload files temporarily, they are deleted after 3 days
export async function uploadImage(
    fileContent: ArrayBuffer,
    fileName = 'file.pm4',
) {
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

export async function* fakeStreaming(text: string) {
    const words = text.split(/\s+/)
    let output = ''
    for (const word of words) {
        output += (output ? ' ' : '') + word
        yield output
        await new Promise((resolve) => setTimeout(resolve, 80))
    }
}


export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
