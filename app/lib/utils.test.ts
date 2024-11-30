import { describe, it, expect } from 'vitest'
import {
    combineVideos,
    getUnsplashVideo,
    getVideosForKeywords,
    uploadFile,
} from './utils'
import { generateVideosHandler } from '~/lib/llm'

describe('getVideosForKeywords and combineVideos', () => {
    it(
        'gets videos and combines them',
        async () => {
            // Get videos for multiple keywords
            const result = await getVideosForKeywords({
                keywords: [
                    // 'transport',
                    'cars',
                    'law',
                    'study',
                    'safety',
                    'semaphore',
                ],
            })

            expect(result.videos.length).toBeGreaterThan(0)

            // Combine the videos
            const { outputPath } = await combineVideos({
                videoPaths: result.videos.map((video) => video.filePath!),
                segmentDurationSeconds: 2,
            })

            console.log('Combined video output path:', outputPath)
        },
        1000 * 60,
    ) // 1 minute timeout
})

describe(
    'uploadImage',
    () => {
        it('uploads video from unsplash url', async () => {
            // First get a video from unsplash
            const unsplashResult = await getUnsplashVideo('nature')
            expect(unsplashResult).not.toBeNull()
            expect(unsplashResult?.bestResultUrl).toBeTruthy()

            // Fetch the video content
            const videoResponse = await fetch(unsplashResult!.bestResultUrl)
            expect(videoResponse.ok).toBe(true)

            const videoBuffer = Buffer.from(await videoResponse.arrayBuffer())

            // Upload the video
            const uploadResult = await uploadFile(videoBuffer, 'test-video.mp4')
            expect(uploadResult).toMatch(/^https:\/\/.*\?download=1$/)
            console.log('Upload URL:', uploadResult)
        })
    },
    1000 * 20,
)

describe('getUnsplashVideo', () => {
    it('gets video keyword', async () => {
        const result = await getUnsplashVideo('transport')
        expect(result?.bestResultUrl).toMatchInlineSnapshot(`"https://videos.pexels.com/video-files/4550475/4550475-hd_720_1280_50fps.mp4"`)
    })
})
