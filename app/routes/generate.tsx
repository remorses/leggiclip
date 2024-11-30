import { Form } from 'react-router'
import { useSearchParams } from 'react-router'
import { useEffect, useState } from 'react'
import { client } from '~/lib/client'
import { VideoItem } from '~/lib/llm'

function PlayButton() {
    return (
        <div className="absolute inset-0 flex items-center justify-center">
            <svg 
                className="w-20 h-20 text-white" 
                fill="currentColor" 
                viewBox="0 0 24 24"
            >
                <path d="M8 5v14l11-7z"/>
            </svg>
        </div>
    )
}

let testMode = true

export default function Generate() {
    const [searchParams] = useSearchParams()
    const [videos, setVideos] = useState<VideoItem[]>([])
    const [playingVideos, setPlayingVideos] = useState<{[key: number]: boolean}>({})
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
            {videos.length === 0 ? (
                // Show loading skeletons when no videos yet
                <>
                    {[1, 2, 3].map((i) => (
                        <div 
                            key={i}
                            className="animate-pulse relative aspect-[9/16] rounded-xl overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gray-300"></div>
                            {/* <PlayButton /> */}
                            <div className="absolute bottom-4 left-4 right-4 bg-gray-200 rounded-xl p-4 space-y-3">
                                <div className="bg-gray-300 h-4 w-3/4 rounded"></div>
                                <div className="bg-gray-300 h-4 w-1/2 rounded"></div>
                            </div>
                        </div>
                    ))}
                </>
            ) : (
                // Show actual videos
                videos.map((video, i) => (
                    <div key={i} className="relative aspect-[9/16] rounded-xl overflow-hidden">
                        {video.url ? (
                            <>
                                <video 
                                    src={video.url}
                                    controls
                                    className="absolute inset-0 w-full h-full object-cover"
                                    onPlay={() => setPlayingVideos(prev => ({...prev, [i]: true}))}
                                    onPause={() => setPlayingVideos(prev => ({...prev, [i]: false}))}
                                    onEnded={() => setPlayingVideos(prev => ({...prev, [i]: false}))}
                                />
                                {!playingVideos[i] && <PlayButton />}
                            </>
                        ) :  (
                            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                                Processing video...
                            </div>
                        )}
                        
                        {!playingVideos[i] && (
                            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-4 space-y-3 shadow-lg">
                                <h3 className="font-medium truncate">{video.title}</h3>
                                
                                {video.status && (
                                    <p className="text-sm text-gray-500">
                                        Status: {video.status || 'Processing...'}
                                    </p>
                                )}
                                
                                {video.keywords && video.keywords.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {video.keywords.map((keyword, j) => {
                                            const colors = [
                                                'bg-blue-100 text-blue-800',
                                                'bg-green-100 text-green-800',
                                                'bg-purple-100 text-purple-800',
                                                'bg-yellow-100 text-yellow-800',
                                                'bg-pink-100 text-pink-800'
                                            ];
                                            const colorIndex = keyword.length % colors.length;
                                            return (
                                                <span 
                                                    key={j}
                                                    className={`text-xs px-2 py-1 rounded-full ${colors[colorIndex]}`}
                                                >
                                                    {keyword}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
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
        keywords: ['transport', 'transport', 'transport', 'city', 'city', 'city', 'traffic', 'traffic', 'traffic', 'cars', 'cars', 'cars'],
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
