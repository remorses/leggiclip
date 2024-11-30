import { Form } from 'react-router'
import { useSearchParams } from 'react-router'
import { useState } from 'react'
import { client } from '~/lib/client'

export default function Generate() {
    const [searchParams] = useSearchParams()
    const title = searchParams.get('title') || ''
    const description = searchParams.get('description') || ''
    const script = searchParams.get('script') || ''
    const keywords = searchParams.get('keywords')?.split(',') || []
    const [videos, setVideos] = useState<{ url: string; script: string }[]>([])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        try {
            const title = formData.get('title')
            const script = formData.get('script')
            const keywords = formData.get('keywords')?.toString().split(',')
            const res = await client.api.generate.post({})

            if (res.error) {
                throw res.error
            }
            const data = res.data
            // Wait for video generation to complete
            for await (const update of data) {
                
            }
            setVideos(data.videos)
        } catch (error) {
            console.error('Error generating video:', error)
        }
    }

    return (
        <div className='min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
            <div className='text-center'>
                <h1 className='text-3xl font-bold text-gray-900 mb-8'>
                    Generate Video
                </h1>
            </div>

            <Form method='post' className='space-y-6' onSubmit={handleSubmit}>
                <div className='flex justify-center'>
                    <div className='w-md flex-col flex gap-3'>
                        <div>
                            <label
                                htmlFor='title'
                                className='block text-sm font-medium text-gray-700'
                            >
                                Title
                            </label>
                            <input
                                type='text'
                                id='title'
                                name='title'
                                className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm'
                                defaultValue={title}
                            />
                        </div>

                        {/* <div>
                            <label
                                htmlFor='description'
                                className='block text-sm font-medium text-gray-700'
                            >
                                Description
                            </label>
                            <textarea
                                id='description'
                                name='description'
                                rows={4}
                                className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm'
                                defaultValue={description}
                            />
                        </div> */}

                        <div>
                            <label
                                htmlFor='script'
                                className='block text-sm font-medium text-gray-700'
                            >
                                Script
                            </label>
                            <textarea
                                id='script'
                                name='script'
                                rows={6}
                                className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm'
                                defaultValue={script}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor='keywords'
                                className='block text-sm font-medium text-gray-700'
                            >
                                Keywords
                            </label>
                            <input
                                type='text'
                                id='keywords'
                                name='keywords'
                                className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm'
                                defaultValue={keywords.join(',')}
                                placeholder='Enter keywords separated by commas'
                            />
                        </div>

                        <button
                            type='submit'
                            className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                        >
                            Generate Video
                        </button>

                        {videos.length > 0 && (
                            <div className='mt-8'>
                                <h2 className='text-xl font-semibold mb-4'>
                                    Generated Videos
                                </h2>
                                {videos.map((video, index) => (
                                    <div
                                        key={index}
                                        className='mb-4 p-4 border rounded'
                                    >
                                        <video
                                            src={video.url}
                                            controls
                                            className='w-full mb-2'
                                        />
                                        <p className='text-sm text-gray-600'>
                                            {video.script}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Form>
        </div>
    )
}
