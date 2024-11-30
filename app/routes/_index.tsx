import { Form } from 'react-router'
import { useActionData } from 'react-router'
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

export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData()
    const step = formData.get('step') as string

    if (step === '1') {
        const description = formData.get('description') as string
        const avatar = formData.get('avatar') as string
        const pdf = formData.get('pdf') as File

        if (!description || !avatar) {
            return { error: 'Description, avatar and PDF file are required' }
        }

        // Simulated response
        return {
            title: 'Speed Limits Explained',
            keywords: ['driving', 'safety', 'laws', 'speed limits'],
            script: fakeStreaming(`Hey there! 👋 Let's talk about speed limits in a way that actually makes sense!

Did you know that the basic speed law is pretty simple? It's all about driving at a speed that's "reasonable and prudent" for the conditions.

Here's the breakdown:
- 25 mph in business/residential areas 🏘️
- 55 mph everywhere else 🛣️

But here's the catch - you need to slow down for:
- Intersections 🚦
- Railroad crossings 🚂
- Curves in the road 🔄
- Any hazardous conditions ⚠️

Stay safe out there! Remember, these limits aren't just numbers - they're there to protect everyone on the road. 🚗✨`),
            description,
            avatar,
            pdf,
        }
    } else {
        // Handle step 2 submission
        const title = formData.get('title') as string
        const script = formData.get('script') as string
        const keywords = formData.get('keywords') as string

        return {
            title,
            script,
            keywords: keywords.split(',').map((k) => k.trim()),
            description: formData.get('description'),
            avatar: formData.get('avatar'),
        }
    }
}

export default function Home() {
    const actionData = useActionData()
    const hasResult = actionData && !actionData.error
    let script = actionData?.script
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
                <div
                    className={`flex gap-8 ${hasResult ? 'justify-between' : 'justify-center'}`}
                >
                    <motion.div className='w-md flex-col flex gap-3'>
                        <input
                            type='hidden'
                            name='step'
                            value={hasResult ? '2' : '1'}
                        />

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

                        {!hasResult && (
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
                        )}

                        <button
                            type='submit'
                            className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                        >
                            {hasResult ? 'Generate Video' : 'Generate Script'}
                        </button>
                    </motion.div>

                    <AnimatePresence>
                        {hasResult && (
                            <motion.div
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 100 }}
                                transition={{ duration: 0.3 }}
                                className='grow'
                            >
                                <div className='bg-white p-6 rounded-lg shadow space-y-4'>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Title
                                        </label>
                                        <input
                                            type='text'
                                            name='title'
                                            defaultValue={actionData.title}
                                            className='w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Keywords (comma-separated)
                                        </label>
                                        <input
                                            type='text'
                                            name='keywords'
                                            defaultValue={actionData.keywords.join(
                                                ', ',
                                            )}
                                            className='w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Script
                                        </label>
                                        <textarea
                                            name='script'
                                            rows={script.split('\n').length}
                                            defaultValue={actionData.script}
                                            className='w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm'
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Form>
        </div>
    )
}
