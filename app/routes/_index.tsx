import { Form, redirect } from 'react-router'
import { useActionData, useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'

export function meta() {
    return [
        { title: 'AI Video Generator' },
        {
            name: 'description',
            content: 'Generate AI videos from your content',
        },
    ]
}

import { ActionFunction } from 'react-router'
import { fakeStreaming } from '~/lib/utils'
import { useState, useEffect } from 'react'
export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData()
    const description = formData.get('description') as string
    const avatar = formData.get('avatar') as string
    const pdf = formData.get('pdf') as File

    if (!description || !avatar) {
        return { error: 'Description, avatar and PDF file are required' }
    }

    const searchParams = new URLSearchParams({
        description,
        avatar,
        title: 'Speed Limits Explained',
        keywords: ['driving', 'safety', 'laws', 'speed limits'].join(','),
    })

    const s = searchParams.toString()
    console.log('Redirecting to generate page:', s)
    return redirect(`/generate?${s}`)
}

export default function Home() {
    const actionData = useActionData()
    const navigate = useNavigate()
    const [script, setScript] = useState('')

    useEffect(() => {
        if (actionData && !actionData.error) {
            const params = new URLSearchParams({
                title: actionData.title,
                script: script || '',
                keywords: actionData.keywords.join(','),
                description: actionData.description,
                avatar: actionData.avatar,
            })
            navigate(`/generate?${params.toString()}`)
        }
    }, [actionData, script, navigate])

    useEffect(() => {
        if (actionData?.script) {
            const updateScript = async () => {
                for await (const text of actionData.script) {
                    setScript(text)
                }
            }
            updateScript()
        }
    }, [actionData?.script])

    return (
        <div className='min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
            <div className='text-center'>
                <h1 className='text-3xl font-bold text-gray-900 mb-8'>
                    Generate AI Videos
                </h1>
            </div>

            <Form
                method='post'
                className='space-y-6'
                encType='multipart/form-data'
            >
                <div className='flex justify-center'>
                    <motion.div className='w-md flex-col flex gap-3'>
                        <div>
                            <label
                                htmlFor='description'
                                className='block text-sm font-medium text-gray-700'
                            >
                                Video Description
                            </label>
                            <textarea
                                id='description'
                                name='description'
                                rows={4}
                                className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm'
                                placeholder='Describe what you want in your video...'
                                required
                                defaultValue={actionData?.description}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor='avatar'
                                className='block text-sm font-medium text-gray-700'
                            >
                                Avatar Gender
                            </label>
                            <select
                                id='avatar'
                                defaultValue={actionData?.avatar || 'male'}
                                name='avatar'
                                className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm'
                                required
                            >
                                <option value=''>Select gender</option>
                                <option value='male'>Male</option>
                                <option value='female'>Female</option>
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor='pdf'
                                className='block text-sm font-medium text-gray-700'
                            >
                                Upload PDF
                            </label>
                            <input
                                type='file'
                                id='pdf'
                                name='pdf'
                                accept='.pdf'
                                className='mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100'
                            />
                        </div>

                        <button
                            type='submit'
                            className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                        >
                            Generate Script
                        </button>
                    </motion.div>
                </div>
            </Form>
        </div>
    )
}
