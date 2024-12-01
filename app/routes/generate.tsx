import { Form } from 'react-router'
import { useSearchParams } from 'react-router'
import { useEffect, useState } from 'react'
import { client } from '~/lib/client'
import { VideoItem } from '~/lib/llm'
import Masonry from 'react-layout-masonry'

function PlayButton() {
    return (
        <div className='absolute pointer-events-none inset-0 flex items-center justify-center'>
            <svg
                className='w-20 h-20 text-white'
                fill='currentColor'
                viewBox='0 0 24 24'
            >
                <path d='M8 5v14l11-7z' />
            </svg>
        </div>
    )
}

let testMode = false

export default function Generate() {
    const [searchParams] = useSearchParams()
    const [videos, setVideos] = useState<VideoItem[]>(testVideos)
    const [playingVideos, setPlayingVideos] = useState<{
        [key: number]: boolean
    }>({})
    const description = searchParams.get('description') || ''
    const avatar = searchParams.get('avatar') || ''
    const pdfText = searchParams.get('pdfText') || ''

    useEffect(() => {
        if (testMode) {
            // setVideos(testVideos)
            return
        }
        if (!description || !pdfText) {
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
                    setVideos([...data.videos, ...testVideos])
                }
            } catch (error) {
                alert('Error generating videos: ' + error)
            }
        }

        fetchVideos()
    }, [])
    return (
        <div className='p-4'>
            <Masonry columns={{ 640: 1, 768: 2, 1024: 3 }} gap={24}>
                <div className='relative rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 p-8 min-h-[400px] flex flex-col items-center justify-center text-center'>
                    <h2 className='text-2xl font-bold text-gray-800 mb-4'>
                        Your Videos Will Appear Here
                    </h2>
                    <p className='text-gray-600 mb-6'>
                        We're processing your request and generating
                        personalized videos based on your input. This may take a
                        few moments.
                    </p>
                </div>
                {videos.length === 0
                    ? // Show initial message card

                      [...Array(6)].map((_, i) => <VideoSkeleton key={i} />)
                    : // Show actual videos
                      videos.map((video, i) => (
                          <div
                              key={i}
                              className='relative aspect-[9/16] rounded-xl overflow-hidden'
                          >
                              {video.url ? (
                                  <>
                                      <video
                                          src={video.url}
                                          controls
                                          className='absolute inset-0 w-full h-full object-cover'
                                          onPlay={() =>
                                              setPlayingVideos((prev) => ({
                                                  ...prev,
                                                  [i]: true,
                                              }))
                                          }
                                          onPause={() =>
                                              setPlayingVideos((prev) => ({
                                                  ...prev,
                                                  [i]: false,
                                              }))
                                          }
                                          onEnded={() =>
                                              setPlayingVideos((prev) => ({
                                                  ...prev,
                                                  [i]: false,
                                              }))
                                          }
                                      />
                                      {!playingVideos[i] && <PlayButton />}
                                  </>
                              ) : (
                                  <VideoSkeleton>
                                      Processing video...
                                  </VideoSkeleton>
                              )}

                              <div
                                  className={`absolute pointer-events-none bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-4 space-y-3 shadow-lg transition-opacity duration-300 ${playingVideos[i] ? 'opacity-0' : 'opacity-100'}`}
                              >
                                  <h3 className='font-medium truncate'>
                                      {video.title}
                                  </h3>

                                  {video.status && (
                                      <p className='text-sm text-gray-500'>
                                          Status:{' '}
                                          {video.status || 'Processing...'}
                                      </p>
                                  )}

                                  {video.keywords &&
                                      video.keywords.length > 0 && (
                                          <div className='flex flex-wrap gap-2'>
                                              {video.keywords.map(
                                                  (keyword, j) => {
                                                      const colors = [
                                                          'bg-blue-100 text-blue-800',
                                                          'bg-green-100 text-green-800',
                                                          'bg-purple-100 text-purple-800',
                                                          'bg-yellow-100 text-yellow-800',
                                                          'bg-pink-100 text-pink-800',
                                                      ]
                                                      const colorIndex =
                                                          keyword.length %
                                                          colors.length
                                                      return (
                                                          <span
                                                              key={j}
                                                              className={`text-xs px-2 py-1 rounded-full ${colors[colorIndex]}`}
                                                          >
                                                              {keyword}
                                                          </span>
                                                      )
                                                  },
                                              )}
                                          </div>
                                      )}

                                  {video.url && (
                                      <a
                                          href={video.url}
                                          download
                                          className='pointer-events-auto block w-full text-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors'
                                          onClick={(e) => e.stopPropagation()}
                                      >
                                          Download Video
                                      </a>
                                  )}
                              </div>
                          </div>
                      ))}
                <div className='relative rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 p-8 min-h-[400px] flex flex-col items-center justify-center text-center'>
                    <div className='animate-pulse space-y-4 w-full max-w-sm'>
                        <div className='h-2 bg-blue-200 rounded w-3/4 mx-auto'></div>
                        <div className='h-2 bg-blue-200 rounded w-1/2 mx-auto'></div>
                        <div className='h-2 bg-blue-200 rounded w-2/3 mx-auto'></div>
                    </div>
                </div>
                {[...Array(6)].map((_, i) => (
                    <VideoSkeleton key={i} />
                ))}
            </Masonry>
        </div>
    )
}

function VideoSkeleton({ children }: { children?: React.ReactNode }) {
    return (
        <div className='relative rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 aspect-[9/16]'>
            <div className='absolute inset-0 animate-pulse flex flex-col space-y-4 h-full p-4'>
                <div className='w-full bg-blue-200 grow rounded-lg'></div>
                <div className='w-full h-20 bg-blue-100 rounded-lg'></div>
                <div className='flex flex-col space-y-2'>
                    <div className='h-3 bg-blue-200 rounded w-3/4'></div>
                    <div className='h-3 bg-blue-100 rounded w-1/2'></div>
                </div>
            </div>
            {children && (
                <div className='absolute inset-0 flex items-center justify-center'>
                    {children}
                </div>
            )}
        </div>
    )
}

export const testVideos: VideoItem[] = [
    {
        url: 'https://videos.pexels.com/video-files/4550475/4550475-hd_720_1280_50fps.mp4',
        title: 'City Traffic Time Lapse',
        status: 'Complete',
        keywords: [
            'transport',
            'transport',
            'transport',
            'city',
            'city',
            'city',
            'traffic',
            'traffic',
            'traffic',
            'cars',
            'cars',
            'cars',
        ],
        script: 'A timelapse of busy city traffic showing cars moving through intersections',
    },
    {
        url: undefined,
        title: 'Legal Consultation',
        status: 'Processing',
        keywords: ['law', 'business', 'office'],
        script: 'A scene showing a legal consultation between a lawyer and client',
    },
    {
        url: 'https://videos.pexels.com/video-files/3327273/pexels-artem-podrez-7233789.mp4',
        title: 'Students in Library',
        status: 'Complete',
        keywords: ['study', 'education', 'library', 'learning'],
        script: 'Students studying and reading books in a quiet library setting',
    },
    {
        url: 'https://videos.pexels.com/video-files/1726955/pexels-kelly-lacy-5473767.mp4',
        title: 'Traffic Safety',
        status: 'Complete',
        keywords: ['safety', 'traffic', 'semaphore', 'street'],
        script: 'Traffic safety demonstration showing proper use of traffic signals',
    },
]
