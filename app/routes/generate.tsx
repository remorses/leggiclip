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

let testMode = true

import { useLoaderData } from 'react-router'
import { getVideoDetails, isTruthy, json, listVideos } from '~/lib/utils'
import { ClientOnly } from '~/components'
let cachedVideos: { videos: VideoItem[]; timestamp: number } | null = null

export async function loader() {
    if (testMode) {
        const now = Date.now()
        if (cachedVideos && now - cachedVideos.timestamp < 20000) {
            return json({ videos: cachedVideos.videos })
        }
    }

    const videos_ = await listVideos({ limit: 20 })
    const videos = await Promise.all(
        videos_.videos.map(async (video) => {
            const details = await getVideoDetails(video.video_id)
            if (details.error) {
                return null
            }
            
            return {
                createdAt: details.created_at,
                url: details.video_url!,
                title: video.video_title || 'No Title', // Assuming title might be available
                status: details.status,
                keywords: [], // These fields don't exist in video details
                script: '', // These fields don't exist in video details
                videoId: details.id,
            } satisfies VideoItem
        }),
    )

    cachedVideos = { videos: videos.filter(isTruthy), timestamp: Date.now() }

    return json({ videos })
}

function sortVideosByDate(a: VideoItem, b: VideoItem) {
    const aDate = a.createdAt ?? 0
    const bDate = b.createdAt ?? 0
    return bDate - aDate
}

export default function GeneratePage() {
    return (
        <ClientOnly>
            <Generate />
        </ClientOnly>
    )
}

export function Generate() {
    const loaderData = useLoaderData() as { videos: VideoItem[] }
    const [searchParams] = useSearchParams()
    const [videos, setVideos] = useState<VideoItem[]>(
        testVideos.concat(loaderData.videos).sort(sortVideosByDate),
    )
    const [playingVideos, setPlayingVideos] = useState<{
        [key: number]: boolean
    }>({})
    const description = searchParams.get('description') || ''
    const avatar = searchParams.get('avatar') || ''

    useEffect(() => {
        console.log('Starting video generation...')
        if (testMode) {
            return
        }
        const pdfText = localStorage.getItem('pdfText') || ''

        if (!description) {
            throw new Error('Missing description')
        }
        if (!pdfText) {
            throw new Error('Missing PDF text')
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
                    setVideos(
                        [...data.videos, ...testVideos].sort(sortVideosByDate),
                    )
                }
            } catch (error) {
                console.log('Error generating videos:', error)
            }
        }

        fetchVideos()
    }, [])
    return (
        <div className='p-4 flex flex-col gap-6'>
            <header className='flex justify-between items-center p-4 '>
                <a href='/' className='text-xl font-bold text-gray-800'>
                    JournalistAI
                </a>
                <nav>
                    <a href='/' className='text-gray-600 hover:text-gray-800'>
                        Home
                    </a>
                </nav>
            </header>
            <Masonry columns={{ 640: 3, 768: 2, 1024: 3 }} gap={24}>
                <IntroBox />
                {videos.length === 0
                    ? // Show initial message card
                      [...Array(6)].map((_, i) => <VideoSkeleton key={i} />)
                    : // Show actual videos
                      videos
                          .reduce<(VideoItem | null)[]>((acc, video, index) => {
                              if (index === 1) {
                                  acc.push(null)
                              }
                              acc.push(video)
                              return acc
                          }, [])
                          .map((video, i) => {
                              if (video === null) {
                                  return (
                                      <ProgressBox key={`progress-box-${i}`} />
                                  )
                              }
                              return (
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
                                                      setPlayingVideos(
                                                          (prev) => ({
                                                              ...prev,
                                                              [i]: true,
                                                          }),
                                                      )
                                                  }
                                                  onPause={() =>
                                                      setPlayingVideos(
                                                          (prev) => ({
                                                              ...prev,
                                                              [i]: false,
                                                          }),
                                                      )
                                                  }
                                                  onEnded={() =>
                                                      setPlayingVideos(
                                                          (prev) => ({
                                                              ...prev,
                                                              [i]: false,
                                                          }),
                                                      )
                                                  }
                                              />
                                              {!playingVideos[i] && (
                                                  <PlayButton />
                                              )}
                                          </>
                                      ) : (
                                          <VideoSkeleton>
                                              Processing video...
                                          </VideoSkeleton>
                                      )}

                                      <div
                                          className={`absolute pointer-events-none bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-4 space-y-3 transition-opacity duration-300 ${playingVideos[i] ? 'opacity-0' : 'opacity-100'}`}
                                      >
                                          <h3 className='font-medium truncate'>
                                              {video.title}
                                          </h3>

                                          {video.status && (
                                              <p className='text-sm text-gray-500'>
                                                  Status:{' '}
                                                  {video.status ||
                                                      'Processing...'}
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
                                                  onClick={(e) =>
                                                      e.stopPropagation()
                                                  }
                                              >
                                                  Download Video
                                              </a>
                                          )}
                                      </div>
                                  </div>
                              )
                          })}
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

function IntroBox() {
    return (
        <div className='relative rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 p-8 min-h-[320px] flex flex-col items-center justify-center text-center'>
            <h2 className='text-2xl font-bold text-gray-800 mb-4'>
                Your Videos Will Appear Here
            </h2>
            <p className='text-gray-600 mb-6'>
                We're processing your request and generating personalized videos
                based on your input. This may take a few moments.
            </p>
        </div>
    )
}

function ProgressBox() {
    return (
        <div className='p-6 mb-8 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50'>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>
                Video Generation in Progress
            </h2>
            <p className='text-gray-600'>
                Your videos are being generated. This process may take a few
                minutes. You'll see the videos appear below as they're
                completed.
            </p>
            <div className='mt-4 flex gap-2 flex-wrap'>
                <div className='inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800'>
                    <span className='mr-2'>●</span> Processing videos
                </div>
                <div className='inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800'>
                    <span className='mr-2'>✓</span> Generating scripts
                </div>
                <div className='inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800'>
                    <span className='mr-2'>⟳</span> Finding background footage
                </div>
            </div>
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
            'urban',
            'mobility',
            'city',
            'downtown',
            'metropolis',
            'traffic',
            'congestion',
            'commute',
            'cars',
            'vehicles',
            'automobiles',
        ],
        script: 'A timelapse of busy city traffic showing cars moving through intersections',
        createdAt: new Date('2023-11-29').getTime() / 1000,
    },
    {
        url: undefined,
        title: 'Legal Consultation',
        status: 'Processing',
        keywords: ['law', 'business', 'office'],
        script: 'A scene showing a legal consultation between a lawyer and client',
        createdAt: new Date('2023-11-29').getTime() / 1000,
    },
    {
        url: 'https://videos.pexels.com/video-files/3327273/pexels-artem-podrez-7233789.mp4',
        title: 'Students in Library',
        status: 'Complete',
        keywords: ['study', 'education', 'library', 'learning'],
        script: 'Students studying and reading books in a quiet library setting',
        createdAt: new Date('2023-11-29').getTime() / 1000,
    },
    {
        url: 'https://videos.pexels.com/video-files/1726955/pexels-kelly-lacy-5473767.mp4',
        title: 'Traffic Safety',
        status: 'Complete',
        keywords: ['safety', 'traffic', 'semaphore', 'street'],
        script: 'Traffic safety demonstration showing proper use of traffic signals',
        createdAt: new Date('2023-11-29').getTime() / 1000,
    },
]
