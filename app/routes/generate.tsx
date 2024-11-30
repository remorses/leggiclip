import { Form } from 'react-router'
import { useSearchParams } from 'react-router'
import { useEffect, useState } from 'react'
import { client } from '~/lib/client'
import { VideoItem } from '~/routes/api.$'

export default function Generate() {
    const [searchParams] = useSearchParams()
    const [videos, setVideos] = useState<VideoItem[]>([])
    const description = searchParams.get('description') || ''
    const avatar = searchParams.get('avatar') || ''
    const pdfText = searchParams.get('pdfText') || ''

    useEffect(() => {
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
    }, [description, avatar, pdfText])
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
                        ) : video.bgUrl ? (
                            <video 
                                src={video.bgUrl}
                                controls
                                className="w-full aspect-[9/16] object-cover rounded-md opacity-50"
                            />
                        ) : (
                            <div className="w-full aspect-[9/16] bg-gray-100 rounded-md flex items-center justify-center">
                                Processing video...
                            </div>
                        )}
                        
                        <h3 className="font-medium">{video.title}</h3>
                        
                        {video.status && (
                            <p className="text-sm text-gray-500">
                                Status: {video.status}
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
