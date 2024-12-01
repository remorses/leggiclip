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
import Cache from 'lru-cache-fs'
// Cache for video results with max 100 items and 1 hour TTL
const videoCache = new Cache<string, GetUnsplashVideoRes>({
    max: 100,

    cacheName: 'pexels-videos', // Cache directory
})

type GetUnsplashVideoRes = PexelsVideoResponse & {
    thumbnailUrl: string
    bestResultUrl: string
    filePath: string
}

export async function getUnsplashVideo(keyword: string) {
    try {
        // Check cache first
        const cached = await videoCache.get(keyword)
        if (cached && fs.existsSync(cached.filePath)) {
            return cached as GetUnsplashVideoRes
        }
        console.log('Fetching video from Pexels for keyword:', keyword)

        const response = await fetch(
            `https://api.pexels.com/v1/videos/search?query=${encodeURIComponent(keyword)}&orientation=portrait&per_page=20`,
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

        const isHdVideo = (file: VideoFile) =>
            file.width >= 720 &&
            file.width <= 1920 &&
            file.fps >= 10 &&
            file.fps <= 60 &&
            file.file_type === 'video/mp4'

        const bestVideo = data.videos.find(
            (video) =>
                video.duration >= 4 &&
                video.duration <= 30 &&
                video.video_files?.some(isHdVideo),
        )

        if (!bestVideo) {
            return null
        }
        let thumbnailUrl = bestVideo.image
        const hdVideo = bestVideo.video_files.find(isHdVideo)

        let bestResultUrl = hdVideo!.link
        console.log('Fetching video from URL:', bestResultUrl)

        // Download and save the video
        const videoResponse = await fetch(bestResultUrl)
        if (!videoResponse.ok) {
            throw new Error('Failed to download video')
        }

        const videoBuffer = Buffer.from(await videoResponse.arrayBuffer())
        const folderPath = 'downloaded-videos'
        await fs.promises.mkdir(folderPath, { recursive: true })
        const filePath = path.join(folderPath, `${keyword}-video.mp4`)
        await fs.promises.writeFile(filePath, videoBuffer)

        const result = {
            ...data,
            thumbnailUrl,
            bestResultUrl,
            filePath,
        }

        // Store in cache
        videoCache.set(keyword, result)
        videoCache.fsDump()

        return result
    } catch (error) {
        console.error('Error fetching Pexels photo:', error)
        return null
    }
}

export async function combineVideos({
    videoPaths,
    segmentDurationSeconds = 5,
}: {
    videoPaths: string[]
    segmentDurationSeconds?: number
}): Promise<{ outputPath: string }> {
    const outputDir = 'output-videos'
    const tempDir = `temp-videos-${Date.now()}`
    fs.mkdirSync(outputDir, { recursive: true })
    fs.mkdirSync(tempDir, { recursive: true })
    const outputPath = `${outputDir}/output-${Date.now()}.mp4`

    // First, trim each video and reencode
    const trimPromises = videoPaths.map((videoPath, index) => {
        return new Promise<string>((resolveTrim, rejectTrim) => {
            const trimmedPath = `${tempDir}/trimmed-${index}-${Date.now()}.mp4`
            // Reencode during trim to ensure consistent format
            const trimCommand = `ffmpeg -ss 0 -t ${segmentDurationSeconds} -i "${videoPath}" -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k "${trimmedPath}"`

            const ffmpeg = spawn(trimCommand, {
                shell: true,
                stdio: 'inherit',
            })
            ffmpeg.on('close', (code) => {
                if (code === 0) resolveTrim(trimmedPath)
                else
                    rejectTrim(
                        new Error(`Trim process exited with code ${code}`),
                    )
            })
            ffmpeg.on('error', rejectTrim)
        })
    })

    // After all trims are complete, concatenate the trimmed files
    const trimmedPaths = await Promise.all(trimPromises)
    const fileList = trimmedPaths.map((path) => `file '${path}'`).join('\n')
    const listPath = `list-${Date.now()}.txt`
    fs.writeFileSync(listPath, fileList)

    // Concatenate trimmed files using stream copy since they're already in the right format
    return new Promise<{ outputPath: string }>((resolve, reject) => {
        const concatCommand = `ffmpeg -f concat -safe 0 -i "${listPath}" -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -vsync 2 -async 1 "${outputPath}"`
        const ffmpeg = spawn(concatCommand, {
            shell: true,
            stdio: 'inherit',
        })

        ffmpeg.on('close', (code) => {
            // Clean up temporary files
            try {
                fs.unlinkSync(listPath)
            } catch (error) {
                console.error('Error deleting list file:', error)
            }
            trimmedPaths.forEach((path) => {
                try {
                    fs.unlinkSync(path)
                } catch (error) {
                    console.error('Error deleting trimmed file:', error)
                }
            })
            try {
                fs.rmdirSync(tempDir, { recursive: true })
            } catch (error) {
                console.error('Error deleting temp directory:', error)
            }

            if (code === 0) resolve({ outputPath })
            else reject(new Error(`Concat process exited with code ${code}`))
        })

        // ffmpeg.on('error', (error) => {
        //     // Clean up on error
        //     try {
        //         fs.unlinkSync(listPath)
        //     } catch (error) {
        //         console.error('Error deleting list file:', error)
        //     }
        //     trimmedPaths.forEach((path) => {
        //         try {
        //             fs.unlinkSync(path)
        //         } catch (error) {
        //             console.error('Error deleting trimmed file:', error) 
        //         }
        //     })
        //     fs.rmdirSync(tempDir, { recursive: true })
        //     reject(error)
        // })
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

                return {
                    keyword,
                    filePath: pexelsResult.filePath!,
                    url: pexelsResult.bestResultUrl!,
                    thumbnailUrl: pexelsResult.thumbnailUrl!,
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
        videos: results
            .filter(isTruthy)
            .filter((result) => result?.filePath !== null),
    }
}

export function isTruthy<T>(value: T | null | undefined | false): value is T {
    return Boolean(value)
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
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getTemplateInfo(templateId: string) {
    try {
        const response = await fetch(
            `https://api.heygen.com/v2/template/${templateId}`,
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
                `Template info request failed: ${response.statusText} - ${text}`,
            )
        }

        const data = await response.json()
        return data.data
    } catch (error) {
        console.error('Error getting template info:', error)
        throw error
    }
}
export async function getVideoDetails(videoId: string) {
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
                `Video status request failed: ${response.statusText} - ${text}`,
            )
        }

        const data = await response.json()
        return data.data
    } catch (error) {
        console.error('Error getting video status:', error)
        throw error
    }
}
import { put } from '@vercel/blob'

export async function uploadFileVercel({
    content,
    filename,
}: {
    content: string | Buffer
    filename: string
}) {
    try {
        const { url } = await put(filename, content, { access: 'public' })
        return url
    } catch (error) {
        console.error('Error uploading to Vercel Blob:', error)
        throw error
    }
}

export async function uploadVideoFile({
    content,
    filename,
}: {
    content: string | Buffer
    filename: string
}) {
    try {
        const response = await fetch('https://upload.heygen.com/v1/asset', {
            method: 'POST',
            headers: {
                'x-api-key': env.HEYGEN_API_KEY || '',
                'Content-Type': 'video/mp4',
            },
            body: content,
        })

        if (!response.ok) {
            const text = await response.text()
            throw new Error(
                `Upload failed with status ${response.status} - ${text}`,
            )
        }

        const data = (await response.json()) as {
            code: number
            data: {
                id: string
                name: string
                file_type: string
                folder_id: string
                meta: null
                created_ts: number
                url: string
            }
        }
        console.log(data)
        return data.data.url
    } catch (error) {
        console.error('Error uploading to Heygen:', error)
        throw error
    }
}

// bashupload.com is a free service to upload files temporarily, they are deleted after 3 days
export async function _uploadFile(
    fileContent: ArrayBuffer,
    fileName = 'file.pm4',
) {
    console.time('uploadImage')
    console.log('Uploading file to https://bashupload.com:', fileName)
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
