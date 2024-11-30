import { Form } from 'react-router'
import { useSearchParams } from 'react-router'
import { useEffect, useState } from 'react'
import { client } from '~/lib/client'
import { VideoItem } from '~/lib/llm'


let testMode = true

export default function Generate() {
    const [searchParams] = useSearchParams()
    const [videos, setVideos] = useState<VideoItem[]>([])
    const description = searchParams.get('description') || ''
    const avatar = searchParams.get('avatar') || ''
    const pdfText = searchParams.get('pdfText') || ''

    useEffect(() => {
        if (testMode) {
            setVideos(testVideos)
            return
        }
        async function fetchVideos() {
            try {
                const generator = await client.api.generate.post({
                    description,
                    avatar,
                    pdfText,
                })
                if (generator.error) {
                    throw generator.error
                }

                for await (const data of generator.data) {
                    console.log('Generated videos:', data)
                    setVideos(data.videos)
                }
            } catch (error) {
                alert('Error generating videos: ' + error)
            }
        }

        fetchVideos()
    }, [])
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {videos.length === 0 ? (
                // Show loading skeletons when no videos yet
                <>
                    {[1, 2, 3].map((i) => (
                        <div 
                            key={i}
                            className="animate-pulse bg-gray-200 rounded-lg p-4 flex flex-col gap-4"
                        >
                            <div className="bg-gray-300 rounded-md w-full aspect-[9/16]"></div>
                            <div className="bg-gray-300 h-4 w-3/4 rounded"></div>
                            <div className="bg-gray-300 h-4 w-1/2 rounded"></div>
                        </div>
                    ))}
                </>
            ) : (
                // Show actual videos
                videos.map((video, i) => (
                    <div key={i} className="border rounded-lg p-4 flex flex-col gap-4">
                        {video.url ? (
                            <video 
                                src={video.url}
                                controls
                                className="w-full aspect-[9/16] object-cover rounded-md"
                            />
                        ) :  (
                            <div className="w-full aspect-[9/16] bg-gray-100 rounded-md flex items-center justify-center">
                                Processing video...
                            </div>
                        )}
                        
                        <h3 className="font-medium truncate">{video.title}</h3>
                        
                        {video.status && (
                            <p className="text-sm text-gray-500">
                                Status: {video.status || 'Processing...'}
                            </p>
                        )}
                        
                        {video.keywords && video.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {video.keywords.slice(0,3).map((keyword, j) => (
                                    <span 
                                        key={j}
                                        className="text-xs bg-gray-100 px-2 py-1 rounded"
                                    >
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    )
}

export const testVideos: VideoItem[] = [
    {
        url: 'https://videos.pexels.com/video-files/4550475/4550475-hd_720_1280_50fps.mp4',
        title: 'City Traffic Time Lapse',
        status: 'Complete',
        keywords: ['transport', 'city', 'traffic', 'cars'],
        script: 'A timelapse of busy city traffic showing cars moving through intersections'
    },
    {
        url: undefined,
        title: 'Legal Consultation',
        status: 'Processing',
        keywords: ['law', 'business', 'office'],
        script: 'A scene showing a legal consultation between a lawyer and client'
    },
    {
        url: 'https://videos.pexels.com/video-files/3327273/pexels-artem-podrez-7233789.mp4',
        title: 'Students in Library',
        status: 'Complete',
        keywords: ['study', 'education', 'library', 'learning'],
        script: 'Students studying and reading books in a quiet library setting'
    },
    {
        url: 'https://videos.pexels.com/video-files/1726955/pexels-kelly-lacy-5473767.mp4',
        title: 'Traffic Safety',
        status: 'Complete',
        keywords: ['safety', 'traffic', 'semaphore', 'street'],
        script: 'Traffic safety demonstration showing proper use of traffic signals'
    }
]
